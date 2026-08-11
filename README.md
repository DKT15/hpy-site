# Histopository Landing Page — v2

A React + Vite landing page for Histopository, designed for Netlify hosting and a server-side MailerLite signup integration.

This revision focuses on:

- stronger responsiveness across phone, tablet and desktop widths
- simpler, more stable hero artwork instead of multiple absolutely-positioned image files
- WCAG-minded keyboard and screen-reader behaviour
- safer form validation and error handling
- a Netlify Function exposed at `/api/subscribe`
- Netlify rate limiting and a form honeypot
- no MailerLite API secrets in browser code
- cleaner, pinned dependency versions
- baseline security headers
- working development privacy-policy placeholder

## 1. Requirements

Vite 8 requires Node.js 20.19+ or 22.12+.

## 2. Install

```bash
npm install
npm run dev
```

For the closest local simulation of your production Netlify environment, use Netlify Dev:

```bash
npx netlify-cli dev
```

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



## 6. Privacy policy

The form currently links to:

```text
/public/privacy.html
```

That page is intentionally labelled as a placeholder and has `noindex` set. Replace it with your real privacy policy before collecting real subscriber data publicly.

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

Included:

- semantic header, main, sections, footer and navigation landmarks
- skip-to-main-content link
- native keyboard-operable input, button and links
- visible `:focus-visible` states
- screen-reader-only labels and new-tab text
- `aria-describedby`, `aria-invalid` and `aria-errormessage` for the email field
- polite success announcements and assertive error announcements
- minimum 44px touch target on social links
- decorative imagery hidden from assistive technologies
- reduced-motion support
- responsive type and spacing

Before launch, run Lighthouse and axe, then manually test Tab, Shift+Tab, Enter, Space, zoom at 200%, and at least one screen reader.

## 11. Responsive layout

The page is designed around fluid `clamp()` sizing plus three main responsive changes:

- under 980px: the two-column hero becomes a single column
- under 760px: the three benefits become stacked cards and footer columns stack
- under 560px: the signup input/button stack vertically and phone spacing tightens

The hero visual is one responsive image instead of several absolute-positioned assets, reducing mobile overflow and layout fragility.

## 12. Image assets

```text
public/histopository-logo.png
public/hero-art.webp
```

`hero-art.webp` is the current approved visual placeholder. You can replace it later with another image using the same filename without changing the React code.

## 13. Security headers

`netlify.toml` adds baseline headers:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- a restrictive `Permissions-Policy`

A strict Content Security Policy is deliberately not enforced yet. Test one in Report-Only mode after the final analytics, fonts and third-party integrations are known.

## 14. Before production launch

- Replace the MailerLite API key and group ID placeholders in Netlify.
- Replace `privacy.html` with a real privacy policy.
- Confirm your domain points to the Netlify project.
- Test `/api/subscribe` end-to-end with a real test address.
- Decide and test your opt-in/confirmation flow.
- Run accessibility audits and test on real iOS/Android devices.
- Check the page at 320px, 375px, 768px, 1024px and large desktop widths.

## Icons

This version uses `lucide-react` for interface icons instead of maintaining custom inline SVG icon components. Decorative Lucide icons are kept out of the accessibility tree with `aria-hidden="true"` on the icon or its wrapper. Keyboard navigation, focus states, form labels and ARIA relationships are unchanged.