const MAILERLITE_ENDPOINT = "https://connect.mailerlite.com/api/subscribers";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_REQUEST_BYTES = 2048;

/* =========================================================
   RESPONSE HELPERS
   ========================================================= */

function json(body, status = 200, extraHeaders = {}) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

function genericSignupResponse() {
  /*
    Deliberately return the same public response for:
    - new subscribers
    - existing active subscribers
    - existing unconfirmed subscribers
    - other existing subscriber states

    This prevents email-address enumeration.

    "new" is kept as the public success status so the
    existing frontend signup UX does not need changing.
    It is NOT intended to reveal the real MailerLite status.
  */

  return json(
    {
      status: "new",
      message: "Signup received.",
    },
    200,
  );
}

function isValidEmail(value) {
  return (
    typeof value === "string" &&
    value.length <= 254 &&
    EMAIL_PATTERN.test(value)
  );
}

/* =========================================================
   NEWSLETTER SIGNUP
   ========================================================= */

export default async function subscribe(request) {
  const contentType = request.headers.get("content-type") || "";

  /* -------------------------------------------------------
     CONTENT TYPE
     ------------------------------------------------------- */

  if (!contentType.toLowerCase().includes("application/json")) {
    return json(
      {
        message: "Unsupported request format.",
      },
      415,
    );
  }

  /* -------------------------------------------------------
     EARLY DECLARED SIZE CHECK

     This is only an early rejection.

     We also check the real body size below because
     Content-Length can be missing or inaccurate.
     ------------------------------------------------------- */

  const declaredLength = Number(request.headers.get("content-length") || 0);

  if (declaredLength > MAX_REQUEST_BYTES) {
    return json(
      {
        message: "Request too large.",
      },
      413,
    );
  }

  /* -------------------------------------------------------
     READ ACTUAL BODY
     ------------------------------------------------------- */

  let rawBody;

  try {
    rawBody = await request.text();
  } catch {
    return json(
      {
        message: "Invalid request.",
      },
      400,
    );
  }

  /*
    Enforce the actual UTF-8 body size.
  */

  const actualLength = new TextEncoder().encode(rawBody).byteLength;

  if (actualLength > MAX_REQUEST_BYTES) {
    return json(
      {
        message: "Request too large.",
      },
      413,
    );
  }

  /* -------------------------------------------------------
     PARSE JSON
     ------------------------------------------------------- */

  let payload;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json(
      {
        message: "Invalid request.",
      },
      400,
    );
  }

  /* -------------------------------------------------------
     HONEYPOT

     Real users should never fill this field.

     Give bots the normal success response rather than
     revealing that the honeypot was triggered.
     ------------------------------------------------------- */

  if (typeof payload?.company === "string" && payload.company.trim()) {
    return genericSignupResponse();
  }

  /* -------------------------------------------------------
     EMAIL
     ------------------------------------------------------- */

  const email =
    typeof payload?.email === "string"
      ? payload.email.trim().toLowerCase()
      : "";

  if (!isValidEmail(email)) {
    return json(
      {
        message: "Please enter a valid email address.",
      },
      400,
    );
  }

  /* -------------------------------------------------------
     MAILERLITE CONFIG
     ------------------------------------------------------- */

  const apiKey = process.env.MAILERLITE_API_KEY;

  const groupId = process.env.MAILERLITE_GROUP_ID?.trim();

  if (!apiKey) {
    console.error(
      "Newsletter configuration error: MAILERLITE_API_KEY is missing.",
    );

    return json(
      {
        message: "Newsletter signup is temporarily unavailable.",
      },
      503,
    );
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,

    Accept: "application/json",

    "Content-Type": "application/json",
  };

  /* -------------------------------------------------------
     MAILERLITE
     ------------------------------------------------------- */

  try {
    /*
      First check whether MailerLite already knows
      this email address.

      We use the real status internally, but never
      expose it in the response sent to the browser.
    */

    const existingSubscriberResponse = await fetch(
      `${MAILERLITE_ENDPOINT}/${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers,

        signal: AbortSignal.timeout(8000),
      },
    );

    let shouldSubmitToMailerLite = false;

    /* -----------------------------------------------------
       EXISTING SUBSCRIBER
       ----------------------------------------------------- */

    if (existingSubscriberResponse.ok) {
      const existingSubscriber = await existingSubscriberResponse
        .json()
        .catch(() => ({}));

      const existingStatus = existingSubscriber?.data?.status;

      /*
        IMPORTANT:

        If the subscriber is still unconfirmed,
        submit the address again.

        With API double opt-in enabled, this gives
        MailerLite another opportunity to send the
        confirmation email.

        We still return the exact same generic public
        response, so the caller cannot discover that
        this email was already unconfirmed.
      */

      if (existingStatus === "unconfirmed") {
        shouldSubmitToMailerLite = true;
      } else {
        /*
          Active, unsubscribed, bounced, junk or any
          other existing state:

          Do not reveal it and do not unnecessarily
          submit the address again.
        */

        return genericSignupResponse();
      }
    } else if (existingSubscriberResponse.status === 404) {

    /* -----------------------------------------------------
       NEW SUBSCRIBER
       ----------------------------------------------------- */
      shouldSubmitToMailerLite = true;
    } else {

    /* -----------------------------------------------------
       LOOKUP FAILURE
       ----------------------------------------------------- */
      console.error("MailerLite subscriber lookup failed.", {
        status: existingSubscriberResponse.status,
      });

      return json(
        {
          message:
            "We could not process your signup right now. Please try again.",
        },
        502,
      );
    }

    /* -----------------------------------------------------
       SUBMIT / RESUBMIT TO MAILERLITE
       ----------------------------------------------------- */

    if (shouldSubmitToMailerLite) {
      const mailerLitePayload = {
        email,

        ...(groupId
          ? {
              groups: [groupId],
            }
          : {}),
      };

      const upstream = await fetch(MAILERLITE_ENDPOINT, {
        method: "POST",

        headers,

        body: JSON.stringify(mailerLitePayload),

        signal: AbortSignal.timeout(8000),
      });

      const result = await upstream.json().catch(() => ({}));

      if (!upstream.ok) {
        console.error("MailerLite signup failed.", {
          status: upstream.status,

          message: result?.message || "Unknown MailerLite error",
        });

        /*
          Preserve the existing validation response
          for genuinely invalid email addresses.
        */

        if (upstream.status === 422 && result?.errors?.email) {
          return json(
            {
              message: "Please enter a valid email address.",
            },
            400,
          );
        }

        return json(
          {
            message:
              "We could not process your signup right now. Please try again.",
          },
          502,
        );
      }
    }

    /* -----------------------------------------------------
       SUCCESS

       New and existing subscribers receive exactly
       the same public response.
       ----------------------------------------------------- */

    return genericSignupResponse();
  } catch (error) {
    const timedOut =
      error?.name === "TimeoutError" || error?.name === "AbortError";

    console.error("MailerLite request failed.", {
      type: timedOut ? "timeout" : "network_error",
    });

    return json(
      {
        message: timedOut
          ? "The signup service took too long to respond. Please try again."
          : "We could not process your signup right now. Please try again.",
      },
      502,
    );
  }
}

/* =========================================================
   NETLIFY FUNCTION CONFIG
   ========================================================= */

export const config = {
  path: "/api/subscribe",

  method: "POST",

  rateLimit: {
    action: "rate_limit",

    aggregateBy: "ip",

    windowSize: 60,

    windowLimit: 8,
  },
};
