const MAILERLITE_ENDPOINT =
  'https://connect.mailerlite.com/api/subscribers';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body, status = 200, extraHeaders = {}) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders
    }
  });
}

function isValidEmail(value) {
  return (
    typeof value === 'string' &&
    value.length <= 254 &&
    EMAIL_PATTERN.test(value)
  );
}

export default async function subscribe(request) {
  const contentType =
    request.headers.get('content-type') || '';

  if (!contentType.toLowerCase().includes('application/json')) {
    return json(
      { message: 'Unsupported request format.' },
      415
    );
  }

  const declaredLength = Number(
    request.headers.get('content-length') || 0
  );

  if (declaredLength > 2048) {
    return json(
      { message: 'Request too large.' },
      413
    );
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return json(
      { message: 'Invalid request.' },
      400
    );
  }

  if (
    typeof payload?.company === 'string' &&
    payload.company.trim()
  ) {
    return json(
      { message: 'Signup received.' },
      200
    );
  }

  const email =
    typeof payload?.email === 'string'
      ? payload.email.trim().toLowerCase()
      : '';

  if (!isValidEmail(email)) {
    return json(
      { message: 'Please enter a valid email address.' },
      400
    );
  }

  const apiKey = process.env.MAILERLITE_API_KEY;

  const groupId =
    process.env.MAILERLITE_GROUP_ID?.trim();

  if (!apiKey) {
    console.error(
      'Newsletter configuration error: MAILERLITE_API_KEY is missing.'
    );

    return json(
      {
        message:
          'Newsletter signup is temporarily unavailable.'
      },
      503
    );
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };

  try {
    /*
     * Check MailerLite first to see whether
     * the subscriber already exists.
     */
    const existingSubscriberResponse = await fetch(
      `${MAILERLITE_ENDPOINT}/${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(8000)
      }
    );

    if (existingSubscriberResponse.ok) {
      const existingSubscriber =
        await existingSubscriberResponse
          .json()
          .catch(() => ({}));

      const existingStatus =
        existingSubscriber?.data?.status;

      if (existingStatus === 'active') {
        return json(
          {
            status: 'active',
            message:
              "You're already subscribed to Histopository."
          },
          200
        );
      }

      if (existingStatus === 'unconfirmed') {
        return json(
          {
            status: 'unconfirmed',
            message:
              "You've already signed up. Check your inbox to confirm your email address."
          },
          200
        );
      }

      if (existingStatus === 'unsubscribed') {
        return json(
          {
            status: 'unsubscribed',
            message:
              "This email was previously unsubscribed. Please contact us if you'd like to rejoin."
          },
          200
        );
      }

      if (
        existingStatus === 'bounced' ||
        existingStatus === 'junk'
      ) {
        return json(
          {
            status: existingStatus,
            message:
              'We could not subscribe this email address.'
          },
          400
        );
      }
    } else if (
      existingSubscriberResponse.status !== 404
    ) {
      console.error(
        'MailerLite subscriber lookup failed.',
        {
          status:
            existingSubscriberResponse.status
        }
      );

      return json(
        {
          message:
            'We could not process your signup right now. Please try again.'
        },
        502
      );
    }

    /*
     * Subscriber does not exist.
     * Create them in MailerLite.
     */
    const mailerLitePayload = {
      email,
      ...(groupId
        ? { groups: [groupId] }
        : {})
    };

    const upstream = await fetch(
      MAILERLITE_ENDPOINT,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(
          mailerLitePayload
        ),
        signal: AbortSignal.timeout(8000)
      }
    );

    const result = await upstream
      .json()
      .catch(() => ({}));

    if (!upstream.ok) {
      console.error(
        'MailerLite signup failed.',
        {
          status: upstream.status,
          message:
            result?.message ||
            'Unknown MailerLite error'
        }
      );

      if (
        upstream.status === 422 &&
        result?.errors?.email
      ) {
        return json(
          {
            message:
              'Please enter a valid email address.'
          },
          400
        );
      }

      return json(
        {
          message:
            'We could not process your signup right now. Please try again.'
        },
        502
      );
    }

    return json(
      {
        status: 'new',
        message: 'Signup received.'
      },
      200
    );
  } catch (error) {
    const timedOut =
      error?.name === 'TimeoutError' ||
      error?.name === 'AbortError';

    console.error(
      'MailerLite request failed.',
      {
        type: timedOut
          ? 'timeout'
          : 'network_error'
      }
    );

    return json(
      {
        message: timedOut
          ? 'The signup service took too long to respond. Please try again.'
          : 'We could not process your signup right now. Please try again.'
      },
      502
    );
  }
}

export const config = {
  path: '/api/subscribe',
  method: 'POST',
  rateLimit: {
    action: 'rate_limit',
    aggregateBy: 'ip',
    windowSize: 60,
    windowLimit: 8
  }
};