/**
 * Histopository newsletter signup.
 * Public route: POST /api/subscribe
 *
 * REQUIRED NETLIFY ENVIRONMENT VARIABLE:
 *   MAILERLITE_API_KEY=REPLACE_WITH_MAILERLITE_API_KEY
 *
 * RECOMMENDED NETLIFY ENVIRONMENT VARIABLE:
 *   MAILERLITE_GROUP_ID=REPLACE_WITH_MAILERLITE_GROUP_ID
 *
 * Never expose the MailerLite API key in React, Vite VITE_* variables,
 * a committed .env file, or any browser-side code.
 */

const MAILERLITE_ENDPOINT = 'https://connect.mailerlite.com/api/subscribers';
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
  return typeof value === 'string' && value.length <= 254 && EMAIL_PATTERN.test(value);
}

export default async function subscribe(request) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return json({ message: 'Unsupported request format.' }, 415);
  }

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > 2048) {
    return json({ message: 'Request too large.' }, 413);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ message: 'Invalid request.' }, 400);
  }

  // Honeypot: silently accept obvious bot submissions without calling MailerLite.
  if (typeof payload?.company === 'string' && payload.company.trim()) {
    return json({ message: 'Signup received.' }, 200);
  }

  const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (!isValidEmail(email)) {
    return json({ message: 'Please enter a valid email address.' }, 400);
  }

  // ======================== REQUIRED PLACEHOLDER ========================
  // Netlify -> Project configuration -> Environment variables
  // MAILERLITE_API_KEY=REPLACE_WITH_MAILERLITE_API_KEY
  const apiKey = process.env.MAILERLITE_API_KEY;

  // ====================== RECOMMENDED PLACEHOLDER =======================
  // MAILERLITE_GROUP_ID=REPLACE_WITH_MAILERLITE_GROUP_ID
  const groupId = process.env.MAILERLITE_GROUP_ID?.trim();

  if (!apiKey) {
    console.error('Newsletter configuration error: MAILERLITE_API_KEY is missing.');
    return json({ message: 'Newsletter signup is temporarily unavailable.' }, 503);
  }

  const mailerLitePayload = {
    email,
    ...(groupId ? { groups: [groupId] } : {})
  };

  try {
    const upstream = await fetch(MAILERLITE_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mailerLitePayload),
      signal: AbortSignal.timeout(8000)
    });

    const result = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      // Do not log the submitted email or the full upstream payload.
      console.error('MailerLite signup failed.', {
        status: upstream.status,
        message: result?.message || 'Unknown MailerLite error'
      });

      if (upstream.status === 422 && result?.errors?.email) {
        return json({ message: 'Please enter a valid email address.' }, 400);
      }

      return json({ message: 'We could not process your signup right now. Please try again.' }, 502);
    }

    // Deliberately return a generic success message so this endpoint does not
    // reveal whether an arbitrary email address already exists in the mailing list.
    return json({ message: 'Signup received.' }, 200);
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';

    console.error('MailerLite request failed.', {
      type: timedOut ? 'timeout' : 'network_error'
    });

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
