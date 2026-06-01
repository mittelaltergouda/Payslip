# Deployment Guide

This document describes how to stand up a **reliable public deployment** of SC Payslip
and produce a **stable live demo URL**.

The app is a Next.js 16 (App Router) application with server-side API routes backed by
Prisma. It builds to a self-contained server (`output: "standalone"` in
`next.config.mjs`), so it can run on any Node host or as a container. Most of the
calculator is client-side; the database is only used to persist sessions and the
read-only share links.

> **Status (2026-06-01):** **DONE — live, durable, reboot-surviving.** Verified end-to-end
> at **`https://payslip.cheesy.cloud/`** (behind Cloudflare Access email). The Cloudflare
> route + Access were configured by the CEO. The app runs as a **linger-backed user systemd
> service** (`systemctl --user`), installed **without `sudo`** — it auto-restarts on crash
> and starts on boot. See [Persistence](#persistence--linger-backed-user-systemd-service-no-sudo).
> A root-level system unit (`deploy/payslip.service`) is also committed for hosts where an
> admin prefers a system service.

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
default `prisma/schema.prisma` (`provider = "sqlite"`, `url = "file:./dev.db"`) works as-is.

> **Standalone DB-path gotcha (important for reproducibility):** the schema's relative
> `file:./dev.db` is resolved by the Prisma query engine **relative to the bundled schema**
> inside the standalone output, i.e. the running server reads/writes
> `.next/standalone/node_modules/.prisma/client/dev.db` — **not** `<app>/prisma/dev.db`.
> So after `prisma db push` (which creates `prisma/dev.db`), copy that schema-loaded file
> into the standalone engine path before first start:
> ```bash
> cp prisma/dev.db .next/standalone/node_modules/.prisma/client/dev.db
> ```
> Without this the server starts fine and serves the homepage (HTTP 200), but every DB call
> (`GET /api/sessions`, saving/sharing sessions) fails with an empty, schema-less DB.

### Verified end-to-end (2026-06-01)

- `npm run build` → standalone output; `node .next/standalone/server.js` with
  `PORT=58412 HOSTNAME=127.0.0.1` → **HTTP 200**, calculator UI + static chunks served.
- API CSRF roundtrip (`POST /api/sessions`) → session persisted to SQLite (verified read-back
  via Prisma count).
- `curl -I https://payslip.cheesy.cloud/` → `302` to `cheesycloud.cloudflareaccess.com`
  login — confirms the tunnel route + Access email gate are live and pointed at this origin.
- The origin binds to **127.0.0.1 only** (not `0.0.0.0`), so it is reachable *only* through
  the Cloudflare tunnel — Access cannot be bypassed via the host's public IP.
- **Durable service (linger-backed user systemd):** `systemctl --user status payslip` →
  `active (running)`, `enabled`; `loginctl show-user` → `Linger=yes` (boot-persistent);
  `GET /api/sessions` → `[]` HTTP 200 (DB reachable); crash test (`kill -9` MainPID) →
  systemd auto-restarted, HTTP 200 again. Installed **without `sudo`**.

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

### Persistence — linger-backed user systemd service (no `sudo`)

A bare `node server.js` stops on reboot / when its parent shell exits. **This is how the
live deployment actually runs:** a *user* systemd service made boot-persistent with
**linger** — no root required. `loginctl enable-linger` makes the user's systemd manager
start at boot (independent of any login session), so a `--user` unit it manages is
reboot-surviving and crash-restarting just like a system unit, without touching
`/etc/systemd/system`.

Canonical, reproducible install (run as the `paperclip` user; the persistent app dir lives
under a writable, durable path — here `~/.config/payslip`):

```bash
# 1) Build into a persistent directory (NOT /tmp, which is cleared on reboot)
git clone https://github.com/mittelaltergouda/Payslip ~/.config/payslip-src
cd ~/.config/payslip-src
npm ci
npx prisma generate
npx prisma db push                                  # creates prisma/dev.db (SQLite)
npm run build
cp -r .next/static .next/standalone/.next/static    # standalone needs static assets
# place the schema-loaded DB where the standalone engine reads it (see gotcha above):
cp prisma/dev.db .next/standalone/node_modules/.prisma/client/dev.db

# 2) Assemble a lean runtime dir (standalone bundle is self-contained)
mkdir -p ~/.config/payslip
cp -a .next/standalone ~/.config/payslip/standalone

# 3) Enable linger (creates /run/user/$UID and starts the user manager at boot)
loginctl enable-linger "$USER"
export XDG_RUNTIME_DIR=/run/user/$(id -u)

# 4) Install + enable + start the user unit (committed template: deploy/payslip.user.service)
mkdir -p ~/.config/systemd/user
SECRET=$(openssl rand -base64 32)
sed "s|CHANGE_ME_GENERATE_WITH_openssl_rand_base64_32|$SECRET|;
     s|/home/paperclip/.config/payslip|$HOME/.config/payslip|g" \
     deploy/payslip.user.service > ~/.config/systemd/user/payslip.service
chmod 600 ~/.config/systemd/user/payslip.service
systemctl --user daemon-reload
systemctl --user enable --now payslip
systemctl --user status payslip       # -> active (running); payslip.cheesy.cloud stays up
```

Verify it survives crashes and is boot-persistent:

```bash
export XDG_RUNTIME_DIR=/run/user/$(id -u)
loginctl show-user "$USER" | grep Linger          # -> Linger=yes
kill -9 "$(systemctl --user show -p MainPID --value payslip)"   # simulate crash
sleep 4 && systemctl --user is-active payslip      # -> active (auto-restarted)
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:58412/   # -> 200
```

> Redeploy later: pull + rebuild in `~/.config/payslip-src`, recopy `standalone` (and the
> static/DB-path steps), then `systemctl --user restart payslip`.
>
> **Alternative — root system service:** on hosts where an admin prefers a system-wide
> service, the committed **`deploy/payslip.service`** installs to `/etc/systemd/system`
> (`sudo cp … && sudo systemctl enable --now payslip`). The user-service path above is
> preferred here because it needed no elevated privileges.

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
