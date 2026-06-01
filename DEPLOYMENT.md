# Deployment Guide

This document describes how to stand up a **reliable public deployment** of SC Payslip
and produce a **stable live demo URL**.

The app is a Next.js 16 (App Router) application with server-side API routes backed by
Prisma. It builds to a self-contained server (`output: "standalone"` in
`next.config.mjs`), so it can run on any Node host or as a container. Most of the
calculator is client-side; the database is only used to persist sessions and the
read-only share links.

> **Status:** The build/run path is verified (see "Verified locally" below). The actual
> public deploy is gated on host-operator access — see
> [Credentials required](#credentials-required).

---

## Chosen target (CEO decision, 2026-06-01): self-host at `payslip.cheesy.cloud`

The CEO chose to host Payslip on the **same infrastructure as Paperclip itself** —
behind the existing Cloudflare tunnel — at **`https://payslip.cheesy.cloud/`**, with
**Cloudflare Access (email OTP)** for access control.

On this host that means: run the app as a persistent service on a local port, then point
the existing token-based Cloudflare tunnel's public hostname `payslip.cheesy.cloud` at
that port, and attach a Cloudflare Access application/policy. The Vercel / container
options below are kept as alternatives but are **not** the chosen path.

Because this is a single always-on host (not serverless), **SQLite on a local file path is
a reliable, zero-provisioning database** — no Postgres needed (though the host's local
Postgres can be reused if preferred).

### Runbook (one-time, requires host-operator privileges)

Steps 1–2 are the only ones an agent could do unprivileged; steps 3–6 require `sudo`
and/or Cloudflare account access (see [Credentials required](#credentials-required)).

1. **Build the app** (verified working):
   ```bash
   cd /path/to/Payslip
   npm ci && npx prisma generate && npm run build
   ```
2. **Pick a port + DB path.** Suggested: app on `127.0.0.1:3200` (Paperclip uses 3100),
   SQLite at `/home/paperclip/payslip-data/payslip.db`. Make the datasource configurable:
   in `prisma/schema.prisma` set `url = env("DATABASE_URL")` (keep `provider = "sqlite"`),
   set a sqlite default in `.env`/`.env.example` for local dev (`file:./prisma/dev.db`),
   then on the host run `DATABASE_URL="file:/home/paperclip/payslip-data/payslip.db" npx prisma db push`.
3. **Install a systemd service** (needs `sudo`) — `/etc/systemd/system/payslip.service`:
   ```ini
   [Unit]
   Description=SC Payslip
   After=network.target

   [Service]
   Type=simple
   User=paperclip
   WorkingDirectory=/path/to/Payslip
   Environment=NODE_ENV=production
   Environment=PORT=3200
   Environment=HOSTNAME=127.0.0.1
   Environment=DATABASE_URL=file:/home/paperclip/payslip-data/payslip.db
   Environment=NEXTAUTH_SECRET=<openssl rand -base64 32>
   # standalone output: server.js lives in .next/standalone; copy static assets first:
   #   cp -r .next/static .next/standalone/.next/static
   ExecStart=/usr/bin/node .next/standalone/server.js
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```
   Then: `sudo systemctl daemon-reload && sudo systemctl enable --now payslip`.
4. **Add the tunnel public hostname** (Cloudflare Zero Trust dashboard → Networks →
   Tunnels → the running tunnel → Public Hostname): `payslip.cheesy.cloud` →
   `HTTP` → `localhost:3200`. (The tunnel here is **token-based / remotely managed**, so
   this is done in the dashboard or via the Cloudflare API — not a local config file. The
   DNS `CNAME` is created automatically.)
5. **Add Cloudflare Access** (Zero Trust → Access → Applications): self-hosted app for
   `payslip.cheesy.cloud`, policy = allow specific emails / one-time-PIN email auth — the
   same email-based gating the CEO requested.
6. **Verify end to end**: visit `https://payslip.cheesy.cloud/` (pass Access email gate),
   load the calculator, create a session, confirm payout math + a share link work. Record
   the live URL in this file and `README.md`.

> Reproducibility/CI: the build step (1) is already gated by
> `.github/workflows/build.yml`. The service runs the same `npm run build` artifact, so a
> deploy is "rebuild + `systemctl restart payslip`". A CI-driven push-to-deploy can be
> added once an agent/CI has SSH or a deploy hook to the host.

---

## Recommended target: Vercel (+ Neon Postgres)

Vercel is the canonical host for Next.js and is the lowest-friction path to a stable,
HTTPS, Git-driven demo:

- Native App Router / standalone support — zero server config.
- Free **Hobby** tier (no cost for a demo of this size).
- A stable production URL (`https://<project>.vercel.app`) **plus** an automatic preview
  URL for every PR — this gives us the "reproducible, CI-driven" deploy for free: every
  push to `master` redeploys production.

### One required code change (serverless persistence)

Vercel's serverless filesystem is **ephemeral**, so the current SQLite database
(`prisma/dev.db`) would not persist between requests/instances and share links would
break. Switch Prisma to a network database (Postgres):

1. In `prisma/schema.prisma`, change the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   (`Int` / `Decimal` / `String` columns used here are all Postgres-compatible — no model
   changes needed.)
2. Provision a free Postgres database (e.g. **Neon** free tier, or Vercel Postgres) and
   copy its connection string.
3. Set the env vars in the Vercel project (see [Environment variables](#environment-variables)).

### Deploy steps (Vercel dashboard, one-time)

1. Import the GitHub repo `mittelaltergouda/Payslip` into Vercel (Add New → Project).
2. Framework preset: **Next.js** (auto-detected). Build command `npm run build`,
   output handled automatically.
3. Add the environment variables below.
4. Add a build step to run migrations: set the **Install Command** to
   `npm ci && npx prisma generate` and add a `postinstall`/build hook, **or** run
   `npx prisma db push` once against the Postgres URL from a local shell.
5. Deploy. Vercel returns the stable production URL — that is the live demo link.

After the one-time import, every push to `master` auto-deploys (CI-driven), and each PR
gets a preview URL.

---

## Alternative target: Container host with a persistent volume (keep SQLite)

If we prefer to keep SQLite and avoid a separate database service, deploy the standalone
server as a container on a host that offers a **persistent volume** (Render, Railway,
Fly.io — all have free/cheap tiers). This keeps share links working with zero database
service to manage.

This path requires the same datasource change as above, but pointing at a file on the
mounted volume instead of Postgres:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")   // e.g. file:/data/payslip.db
}
```

Then build the standalone output (`npm run build` produces `.next/standalone`), copy
`.next/static` alongside `server.js`, mount a volume at `/data`, set
`DATABASE_URL="file:/data/payslip.db"`, run `npx prisma db push` on first boot, and start
`node server.js`. A `Dockerfile` for this path should be added and test-built **on the
chosen host** before relying on it (Prisma's query-engine binary must match the
container's OS/OpenSSL — use a Debian-based image such as `node:20-bookworm-slim` and
install `openssl`).

---

## Environment variables

| Variable                       | Required | Notes                                                                 |
|--------------------------------|----------|-----------------------------------------------------------------------|
| `DATABASE_URL`                 | yes      | `file:/home/paperclip/payslip-data/payslip.db` (cheesy.cloud self-host); Postgres URL (Vercel); or `file:/data/payslip.db` (container volume). |
| `NEXTAUTH_SECRET`              | yes      | Random 32-byte secret: `openssl rand -base64 32`. Used for session encryption. |
| `EXPORT_TOKEN_EXPIRATION_DAYS` | no       | Defaults to 30. Share-link expiry window.                             |

See `.env.example` for the canonical list. **Never commit real secrets** — set them in
the host's environment/secret store.

---

## Verified locally (build/run path)

Confirmed on Node 22 in this workspace:

- `npx prisma generate` — OK
- `npm run build` — OK (Next.js 16 standalone build; routes: `/`, `/sessions`,
  `/tool-tipps`, `/impressum`, `/datenschutz`, `/api/sessions*`)
- `npm start` (production server) — homepage returns **HTTP 200**
- API enforces CSRF on mutations (double-submit cookie) — returns 403 without a token, as designed
- `npm test` — **2085 unit tests pass** (incl. 95 core calculator tests)

CI mirrors this via `.github/workflows/build.yml` (build + unit tests on every PR/push)
and `.github/workflows/e2e-tests.yml` (Playwright).

---

## Credentials required

The chosen `payslip.cheesy.cloud` self-host path **cannot be completed from the agent
workspace**. Verified on this host: there is **no passwordless `sudo`** (the
`no-new-privileges` flag is set), **no Cloudflare account credential / `cert.pem` / API
token**, and the Cloudflare tunnel is **token-based (remotely managed)** so its ingress
and Access policies live in the Cloudflare dashboard/API, not a local file. An agent also
can't host a *reliable* long-running service from an ephemeral per-heartbeat sandbox.

To unblock, the host operator (CEO) must either **run the runbook** above, or grant an
agent the access to do it:

- **`sudo` (or a pre-installed `payslip.service`)** so the app runs as a persistent,
  reboot-surviving service — runbook steps 3.
- **Cloudflare access** — either the operator adds the public hostname
  `payslip.cheesy.cloud → localhost:3200` and the Access (email) policy in the dashboard
  (runbook steps 4–5), **or** provides a **Cloudflare API token** scoped to the account's
  Tunnel configuration + Access apps so an agent can do it via the API.

Once those are in place, the remaining work (build, `prisma db push`, start the service,
end-to-end smoke, and recording the live URL here + in `README.md`) is push-button.
