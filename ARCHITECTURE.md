# SC Payslip architecture

SC Payslip is a public Next.js application whose calculator, session history and exports run entirely in the visitor's browser. It has no application API, database, authentication system, server-side session persistence or share-token mechanism.

## Runtime boundary

- Next.js serves pages and static assets from a standalone Node.js artifact.
- Session drafts, saved sessions and crew presets use browser `localStorage` only.
- Calculations and PDF/CSV exports run locally in the browser.
- Requests below `/api/*` have no matching route and therefore return the framework's generic HTTP 404 response.
- No `DATABASE_URL`, Prisma client or writable application-data directory is required.

## Application structure

- `app/` — pages, layout, legal information and tool tips.
- `components/` — calculator UI, session management and exports.
- `lib/storage/` — browser-only persistence.
- `lib/calc/` — pure calculation engine.
- `lib/pdf/`, `lib/csv/`, `lib/export/` — local export generation.

## Calculation flow

1. Validate and normalize the session input.
2. Calculate member-held revenue, investments and costs.
3. Distribute the remaining profit according to the selected mode.
4. Settle balances between members.
5. Fit integer transfer amounts and the sender-side transfer fee into each sender's fixed transfer budget.
6. Render the result and generate optional PDF/CSV exports in the browser.

The main orchestration entry point is `calculatePayslip` in `lib/calc/index.ts`; `lib/calc.ts` remains a barrel export.

## Security properties

- User-entered text is rendered through React rather than injected as HTML.
- Script execution is restricted by a request-specific nonce CSP.
- No session or crew data is sent to an application backend.
- The production service runs as an unprivileged user, is bound to loopback and is prevented from initiating network connections.

## Development

```bash
npm ci
npm test
npm run build
npm run dev
```

`npm run test:e2e` runs the Playwright browser suite. The local-only boundary is covered both structurally and through real HTTP requests that assert the removed API paths return 404.
