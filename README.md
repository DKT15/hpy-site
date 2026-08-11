

## 3. Required MailerLite placeholder

In Netlify, go to your project environment variables and add:

```text
MAILERLITE_API_KEY=REPLACE_WITH_MAILERLITE_API_KEY
```

**Do not** put the real key inside React, `src/`, Git, or any environment variable beginning with `VITE_`.

## 4. Recommended MailerLite group placeholder

Create a MailerLite Group such as `Histopository Newsletter`, then add its ID in Netlify:

```text
MAILERLITE_GROUP_ID=REPLACE_WITH_MAILERLITE_GROUP_ID
```

MailerLite's subscriber endpoint accepts existing group IDs when creating/upserting a subscriber.


## 7. Email flow

```text
React signup form
    ↓
POST /api/subscribe
    ↓
Netlify Function
    ↓
MailerLite API
    ↓
MailerLite subscriber / optional newsletter group
```

The API key is read server-side using `process.env.MAILERLITE_API_KEY`.

## 8. Anti-abuse controls

The project includes two lightweight protections:

1. A hidden honeypot field catches basic form bots.
2. The Netlify Function is configured for a per-IP rate limit of 8 requests per 60 seconds.

Tune that rate limit later if legitimate traffic patterns require it.

## 9. Double opt-in

This project sends the subscriber to MailerLite's API. That alone should not be treated as a complete double-opt-in implementation.

If you want double opt-in, configure and test the appropriate MailerLite confirmation/form/automation flow before launch.

## 10. Accessibility


Before launch, run Lighthouse and axe, then manually test Tab, Shift+Tab, Enter, Space, zoom at 200%, and at least one screen reader.


## 13. Security headers

`netlify.toml` adds baseline headers:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- a restrictive `Permissions-Policy`

A strict Content Security Policy is deliberately not enforced yet. Test one in Report-Only mode after the final analytics, fonts and third-party integrations are known.

## 14. Before production launch

- Replace the MailerLite API key and group ID placeholders in Netlify.
- Confirm your domain points to the Netlify project.
- Test `/api/subscribe` end-to-end with a real test address.
- Decide and test your opt-in/confirmation flow.
- Run accessibility audits and test on real iOS/Android devices.
- Check the page at 320px, 375px, 768px, 1024px and large desktop widths.

