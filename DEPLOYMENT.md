# Deployment guide

SC Payslip runs as a manually deployed Next.js standalone artifact on the Hermes server. GitHub stores the source and runs CI, but merging or pushing does **not** automatically update the live website.

## Live topology

- Public URL: `https://payslip.cheesy.cloud/`
- Cloudflare Tunnel forwards the hostname to `http://127.0.0.1:58412`.
- systemd unit: `sc-payslip.service`
- runtime directory: `/opt/sc-payslip`
- service account: `sc-payslip`
- persistence: browser `localStorage` only
- application API/database: none

The Node process binds only to loopback. Cloudflared is the only intended ingress path, while systemd and UFW prevent the Payslip service account from initiating connections to Hermes, Syncthing, other local services or the internet.

## Release process

A release is intentionally explicit:

1. Start from the exact reviewed Git commit.
2. Run a frozen install with `npm ci` in a clean checkout.
3. Run the unit suite, production dependency audit and production build.
4. Assemble `.next/standalone`, `.next/static` and `public` into a root-owned candidate directory.
5. Start the candidate on a separate loopback port under the `sc-payslip` account.
6. Verify CSP nonces, browser hydration and 404 responses for removed API paths.
7. Preserve the previous `/opt/sc-payslip` artifact, swap the candidate into place and restart `sc-payslip.service`.
8. Verify the origin and public HTTPS URL independently.

Do not deploy a source checkout or development server. The runtime artifact must remain owned by root and read-only to the service account.

## CI versus deployment

GitHub Actions currently performs build, unit, E2E and security checks. No workflow has SSH credentials or a deployment step for this server, so a successful merge changes GitHub only.

This separation is deliberate: production changes require a local build, atomic artifact swap and live verification. If automatic deployment is added later, it must preserve the hardened systemd unit, UFW egress boundary, rollback artifact and public smoke tests.

## Required verification

- `sc-payslip.service` is active and enabled.
- Node listens only on `127.0.0.1:58412`.
- Home, legal pages and static assets return HTTP 200.
- `/api/sessions` and former mutation/share paths return HTTP 404.
- Every delivered script has the request's CSP nonce.
- No session cookie is set.
- A browser interaction proves hydration works without console or CSP errors.
- `https://payslip.cheesy.cloud/` returns the same release through Cloudflare.

## Rollback

Keep the previous root-owned runtime directory until the new release is publicly verified. Rollback means restoring that artifact, restarting `sc-payslip.service`, and repeating both origin and public checks; stopping the failed candidate alone is not sufficient.
