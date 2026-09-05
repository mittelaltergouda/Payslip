# Remove server API and persistence – TDD evidence

SC Payslip no longer contains application API routes, Prisma, database files, CSRF helpers or server-persistence utilities. The exact committed production artifact was built and exercised: legacy session endpoints return framework-level `404`, while the browser-only app hydrates normally.

## Source and user journey

No separate plan file was used. The journey was derived from the explicit request: as the server owner, Marco wants the obsolete API code removed so that Payslip cannot expose or persist session data server-side.

## RED

Checkpoint: `9db3e8f test: require complete removal of server persistence`

Command:

```text
npm test -- tests/public-local-only.test.ts
```

Observed result before removal: the structural checks failed because all eight forbidden API, Prisma and server-helper paths still existed.

## GREEN

The following were removed:

- `app/api/`
- `prisma/`, including the tracked development database
- Prisma runtime/development dependencies and scripts
- API-only CSRF, error, validation and persistence helpers
- obsolete API-only tests and setup documentation

Runtime 404 regression tests remain in Playwright. `tests/public-local-only.test.ts` now also checks that the implementation and Prisma dependencies are absent.

## Final clean-HEAD evidence

Validated commit containing all executable changes: `dadbd12720103a3edb0be90f9ff6f7571f77b209`.

- Frozen install: `npm ci --no-audit` – PASS, 626 packages installed
- Full lint: `npm run lint` – PASS, 0 errors and 213 pre-existing warnings
- Full unit/component suite: `npm test` – PASS, 61 files and 1,800 tests
- Coverage: `npm test -- --coverage` – PASS; 96.21% statements, 87.29% branches, 100% functions and 96.12% lines
- Production build: `npm run build` – PASS, TypeScript PASS, no `/api` routes in the route manifest
- Standalone runtime: home `200`, all 11 scripts nonce-authorized, no cookie, browser hydration PASS
- Legacy runtime paths: GET/POST/DELETE/export-token probes all returned `404`

## Dependency security

The npm audit network request repeatedly hung in this environment, so no clean `npm audit` claim is made. Open GitHub Dependabot alerts were compared with the exact candidate lockfile; all listed high/critical and runtime versions are patched in the candidate. The two remaining candidate matches were updated to `fflate 0.8.3` and `postcss-selector-parser 6.1.4`, satisfying the first patched versions in their advisories.

## Known gaps

- The full serialized Playwright matrix was not run locally; focused Chromium runtime probes covered the removed API boundary, nonce CSP and hydration. GitHub CI remains the authoritative E2E merge gate.
- Existing lint warnings were not expanded into this security cleanup.
