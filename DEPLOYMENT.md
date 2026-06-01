# Deployment Guide

This document describes how to stand up a **reliable public deployment** of SC Payslip
and produce a **stable live demo URL**.

The app is a Next.js 16 (App Router) application with server-side API routes backed by
Prisma. It builds to a self-contained server (`output: "standalone"` in
`next.config.mjs`), so it can run on any Node host or as a container. Most of the
calculator is client-side; the database is only used to persist sessions and the
read-only share links.

> **Status (2026-06-01):** Verified live end-to-end at **`https://payslip.cheesy.cloud/`**
> (behind Cloudflare Access email). The Cloudflare route + Access were configured by the
> CEO. For *reliable* (reboot-surviving) hosting the app is installed as a **systemd
> service** — the CEO opted to run the install (needs `sudo`); committed unit at
> `deploy/payslip.service`, sequence in [Persistence](#persistence--install-as-a-systemd-service-ceo-will-run-this-needs-sudo).

---

## Chosen target (CEO decision, 2026-06-01): self-host at `payslip.cheesy.cloud`

Live demo URL: **`https://payslip.cheesy.cloud/`** (Cloudflare Access — email login required).

The CEO chose to host Payslip on the **same infrastructure as Paperclip itself** — behind
the existing Cloudflare tunnel — and **configured Cloudflare**: the public hostname
`payslip.cheesy.cloud` is routed through the tunnel to **`http://localhost:58412`**, with a
**Cloudflare Access (email)** policy in front. Steps 4–5 below (the Cloudflare side) are
therefore **already done**; what remains is running the app on `127.0.0.1:58412` and
keeping it running.

Because this is a single always-on host (not serverless), **SQLite on a local file path is
reliable and zero-provisioning** — no Postgres needed. No schema change is required: the
default `prisma/schema.prisma` (`provider = "sqlite"`, `url = "file:./dev.db"`) works as-is;
the DB lives at `<app>/prisma/dev.db`.

### Verified end-to-end (2026-06-01)

- `npm run build` → standalone output; `node .next/standalone/server.js` with
  `PORT=58412 HOSTNAME=127.0.0.1` → **HTTP 200**, calculator UI + static chunks served.
- API CSRF roundtrip (`POST /api/sessions`) → session persisted to SQLite (verified read-back
  via Prisma count).
- `curl -I https://payslip.cheesy.cloud/` → `302` to `cheesycloud.cloudflareaccess.com`
  login — confirms the tunnel route + Access email gate are live and pointed at this origin.
- The origin binds to **127.0.0.1 only** (not `0.0.0.0`), so it is reachable *only* through
  the Cloudflare tunnel — Access cannot be bypassed via the host's public IP.

### Run it (the verified command)

```bash
# from the app dir (standalone build already produced by `npm run build`):
cp -r .next/static .next/standalone/.next/static          # standalone needs static assets
cd .next/standalone
NODE_ENV=production PORT=58412 HOSTNAME=127.0.0.1 \
  NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
  node server.js
```

> NOTE: use `node .next/standalone/server.js` (the `output: "standalone"` artifact), **not**
> `next start` — Next warns that `next start` is unsupported with standalone output.

### Persistence — install as a systemd service (CEO will run this; needs `sudo`)

A bare `node server.js` stops on reboot / when its parent shell exits. The committed unit
**`deploy/payslip.service`** (port 58412, binds 127.0.0.1, `Restart=on-failure`) makes it
reliable and reboot-surviving. **Canonical, reproducible install** — build from the repo
into a persistent directory (does not depend on the ephemeral `/tmp` build):

```bash
# on the host, as a user with sudo:
sudo -u paperclip git clone https://github.com/mittelaltergouda/Payslip /home/paperclip/payslip
cd /home/paperclip/payslip
sudo -u paperclip npm ci
sudo -u paperclip npx prisma generate
sudo -u paperclip npx prisma db push                       # creates prisma/dev.db (SQLite)
sudo -u paperclip npm run build
sudo -u paperclip cp -r .next/static .next/standalone/.next/static   # standalone needs static assets

# install + secret + start:
sudo cp deploy/payslip.service /etc/systemd/system/payslip.service
SECRET=$(openssl rand -base64 32)
sudo sed -i "s|CHANGE_ME_GENERATE_WITH_openssl_rand_base64_32|$SECRET|" /etc/systemd/system/payslip.service
sudo systemctl daemon-reload && sudo systemctl enable --now payslip
systemctl status payslip          # -> active (running); then payslip.cheesy.cloud stays up
```

> Shortcut (works only while it exists, pre-reboot): the build is already staged at
> `/tmp/payslip-app`; `sudo cp -r /tmp/payslip-app /home/paperclip/payslip && sudo chown -R
> paperclip:paperclip /home/paperclip/payslip` then install the unit as above.
>
> Redeploy later: `cd /home/paperclip/payslip && git pull && npm ci && npm run build &&
> cp -r .next/static .next/standalone/.next/static && sudo systemctl restart payslip`.

### Cloudflare side (already configured by the CEO — for reference)

4. Tunnel public hostname: `payslip.cheesy.cloud` → `HTTP` → `localhost:58412` (token-based
   tunnel, configured in the Cloudflare Zero Trust dashboard; DNS CNAME auto-created).
5. Access application for `payslip.cheesy.cloud` with an email / one-time-PIN policy.

> Reproducibility/CI: the build is gated by `.github/workflows/build.yml`. A redeploy is
> "rebuild the standalone output, copy it into the service dir, `sudo systemctl restart
> payslip`". A push-to-deploy hook can be added once CI has SSH/a deploy key to the host.

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

The Cloudflare side is **done** (route + Access, by the CEO) and the app is verified live.
The remaining gap is **persistent process supervision**, which the agent workspace cannot
provide: verified on this host there is **no passwordless `sudo`** (`no-new-privileges` is
set), **no user systemd** (`systemctl --user` unavailable, no lingering), and **no writable
crontab** (`/var/spool/cron` denied). So an agent can run the server only for the life of
its session — it cannot install a reboot-surviving supervisor.

To make it reliably always-on, the host operator (CEO) must do **one** of:

- **Install the systemd service** (run the 3 `sudo` commands in
  [Persistence](#persistence--the-one-remaining-step-needs-sudo)) — recommended, reboot-surviving.
- **Grant an agent `sudo`/SSH** (or pre-install `payslip.service`) so an agent installs +
  manages it.

Everything else (build, run command, DB, localhost binding, end-to-end verification through
Cloudflare Access) is already done.
