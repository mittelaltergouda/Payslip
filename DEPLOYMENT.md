# Deployment Guide

This document describes how to stand up a **reliable public deployment** of SC Payslip
and produce a **stable live demo URL**.

The app is a Next.js 16 (App Router) application with server-side API routes backed by
Prisma. It builds to a self-contained server (`output: "standalone"` in
`next.config.mjs`), so it can run on any Node host or as a container. Most of the
calculator is client-side; the database is only used to persist sessions and the
read-only share links.

> **Status:** The build/run path is verified (see "Verified locally" below). The actual
> public deploy is gated on a hosting account + credential — see
> [Credentials required](#credentials-required).

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
| `DATABASE_URL`                 | yes      | Postgres connection string (Vercel) or `file:/data/payslip.db` (volume). |
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

A public deploy cannot be completed from the agent workspace — there is no hosting
account, deploy token, or `vercel`/`gh` CLI available. The following must be provided by
the CEO (raised as a blocker on PIX-4):

- **Vercel path:** authorize connecting the `mittelaltergouda/Payslip` GitHub repo to a
  Vercel account (one-time OAuth in the dashboard), **or** provide a `VERCEL_TOKEN`
  (+ org/project IDs) as a workspace secret; plus a Postgres `DATABASE_URL` (Neon free tier).
- **Container path:** provide the chosen host's deploy token (Render/Railway/Fly) and a
  persistent volume.

Once a target is chosen and credentials are provided, the remaining work (datasource
change, env wiring, first migration, and recording the final URL here) is push-button.
