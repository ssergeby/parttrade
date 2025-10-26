# PART.TRADE SPA

Fully static single-page application designed for deployment at `https://part.trade`. The client integrates Auth0 (PKCE + Facebook login) and Facebook Pixel with user consent.

## Features

- Authentication via Auth0 SPA SDK with PKCE.
  - Custom domain support through `AUTH0_DOMAIN`.
  - Redirect flow completed on `/callback`, redirecting to `/profile`.
  - Logout clears the Auth0 session and returns to `/`.
- Facebook Pixel integration.
  - Pixel initialises **only** after explicit user consent.
  - `PageView` fires on every route change post-consent.
  - `CompleteRegistration` fires once immediately after successful login.
  - Optional `ViewContent` event on the profile route.
  - Advanced matching via SHA-256 email hashing in the browser.
- Consent banner storing `tracking_consent` inside `localStorage`.
- SPA router powered by the History API for the `/`, `/profile`, and `/callback` routes.
- Profile screen shows the authenticated user’s name, picture, and email directly from Auth0.

## Project Structure

```
spa/
├── public/
│   ├── index.html
│   ├── profile.html
│   ├── callback.html
│   └── styles.css
├── src/
│   ├── auth.js
│   ├── consent.js
│   ├── pixel.js
│   └── main.js
└── README.md
```

- Files inside `public/` are served directly. Ensure your static host exposes both `public/` and `src/` relative paths.
- JavaScript modules attach themselves to `window.PartTrade*` namespaces for reuse across entry points.

## Configuration

Set the following globals before the scripts execute. The HTML files ship with safe defaults that you can override via inline scripts or environment-specific templating.

```html
<script>
  window.AUTH0_DOMAIN = 'auth.part.trade';
  window.AUTH0_CLIENT_ID = 'YOUR_PRODUCTION_CLIENT_ID';
  window.META_PIXEL_ID = 'YOUR_PIXEL_ID';
</script>
```

### Auth0 Setup Checklist

| Setting | Value |
| --- | --- |
| Domain | `auth.part.trade` |
| Allowed Callback URLs | `https://part.trade/callback` |
| Allowed Logout URLs | `https://part.trade` |
| Allowed Web Origins | `https://part.trade` |
| Connection | Facebook only (disable other identity providers) |

### Facebook Pixel Checklist

- Add the Pixel ID to `window.META_PIXEL_ID`.
- Confirm `CompleteRegistration` is visible in Meta diagnostics after logging in.
- Confirm `PageView` fires on every route after accepting cookies.
- Ensure consent banner is accepted before any pixel requests are sent.

## Local Development

No build tooling is required. To preview locally:

```bash
cd spa
python3 -m http.server 8080
```

Open `http://localhost:8080/public/` in your browser.

> Note: Auth0 callbacks require HTTPS and matching origins; use Auth0’s development tools (such as localhost callback URLs) while testing.

## Consent & Privacy Flow

1. The banner shows the message “We use cookies to measure ads on Facebook.” with an “Accept” button.
2. Clicking “Accept” stores `tracking_consent = true` in `localStorage` and initialises Facebook Pixel.
3. Until consent is granted, no external analytics scripts are loaded and no events are fired.

## Routing Overview

- `/` → Home landing page with CTA to sign in.
- `/profile` → Profile details for authenticated users.
- `/callback` → Auth0 redirect handler page. Processes `handleRedirectCallback`, stores a one-time flag for the `CompleteRegistration` event, then redirects to `/profile`.

The History API keeps navigation in-page, while `profile.html` and `callback.html` act as static entry points for direct requests.

## Error Handling

- Authentication errors render in the header alert bar.
- Callback failures stay on `/callback` with a retry link back to `/`.
- Pixel failures degrade gracefully and do not block authentication flows.

## Deployment Tips

1. Upload both `public/` and `src/` folders to your static host.
2. Configure the host to serve `public/index.html` for `/`, `public/profile.html` for `/profile`, and `public/callback.html` for `/callback`.
3. Provide production Auth0 + Pixel configuration through templating or environment-specific build steps.
4. Test the full login → profile redirect loop and confirm pixel events in Meta diagnostics.
