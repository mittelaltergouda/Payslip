# Host isolation and strict CSP – TDD evidence

SC Payslip now uses request-specific nonces for scripts and forces dynamic rendering so Next.js attaches the nonce to every framework and application script. The production process is additionally isolated at the host level; this report records the application-level RED/GREEN evidence only.

## User journey

As the server owner, Marco wants a public SC Payslip compromise to remain confined to the Payslip process so that Hermes, Syncthing and other server data remain unreachable.

## RED evidence

- Command: `npm test -- middleware.test.ts`
- Result: 5 of 16 tests failed because the CSP still contained `script-src 'self' 'unsafe-inline'` and had no nonce-based script policy.
- Checkpoint: `0e84605 test: require nonce-based script CSP`

A first standalone candidate with nonce CSP but static rendering also failed the runtime gate:

- 11 scripts were emitted.
- 0 of 11 scripts carried the required nonce.
- The candidate was not deployed.

## GREEN evidence

- `npm test -- middleware.test.ts`: 16/16 passed.
- `npm test`: 65 files and 2,038 tests passed.
- `./node_modules/.bin/eslint middleware.ts middleware.test.ts app/layout.tsx`: passed.
- `npm run build`: compiled successfully, TypeScript passed, and all application routes were reported as dynamically rendered.
- Standalone candidate HTML: 11/11 scripts carried the matching request nonce; no cookie was set; disabled session APIs returned 404.
- Chromium candidate smoke test: HTTP 200, no console/page errors, all scripts had nonces, and clicking `+ Mitglied` increased the input count from 28 to 40.
- Public Chromium smoke test after deployment: HTTP 200, no console/page errors, all 12 delivered scripts had nonces, and clicking `+ Mitglied` increased the input count from 28 to 40.
- Public disabled API checks: list/create/read/delete/export-token routes all returned 404.

GREEN checkpoints:

- `96d5338c6358a616d0140cdb1d2c46a5f19405de fix: enforce nonce-based script CSP`
- `e97917f7ea7cb86a057b941346c1da8c79ce3590 fix: render pages dynamically for CSP nonces`

## Known gaps

- Repository-wide ESLint still fails on two unrelated pre-existing errors in `hooks/useAutoSave.ts` and `lib/csrf.ts`; changed-file lint is clean.
- `npm audit --omit=dev` could not complete because npm reports an invalid package tree with two extraneous optional Sharp/WASM packages. No clean dependency-audit claim is made.
- The Next.js `middleware` convention is deprecated in favor of `proxy`; migration was not mixed into this security change.
