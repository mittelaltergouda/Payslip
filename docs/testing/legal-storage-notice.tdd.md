# Legal storage notice – TDD evidence

## Source

The user requested an informational cookie popup for the technically necessary CSRF cookie and complete disclosures for the cookie, Cloudflare, and contact inquiries. No separate plan file was used.

## User journeys

1. As a visitor, I can immediately understand which necessary browser technologies SC Payslip uses and that no tracking takes place.
2. As a visitor, I can open the detailed privacy notice directly from the storage notice.
3. As a visitor, I can dismiss the notice and keep it dismissed for the current browser tab.
4. As a data subject, I can identify the purposes, legal bases, transfer safeguards, recipients, and deletion criteria relevant to the requested disclosures.

## RED evidence

Command:

```text
npm test -- components/CookieNotice.test.tsx tests/legal-pages.test.tsx
```

Result before implementation:

```text
components/CookieNotice.test.tsx: failed to resolve @/components/CookieNotice
tests/legal-pages.test.tsx: expected privacy text to contain csrf-token
Test Files: 2 failed
```

Checkpoint: `f19f042 test: define legal cookie notice requirements`

## GREEN evidence

Targeted command:

```text
npm test -- components/CookieNotice.test.tsx tests/legal-pages.test.tsx
```

Result:

```text
Test Files: 2 passed
Tests: 5 passed
```

Full command:

```text
npm test
```

Result:

```text
Test Files: 64 passed
Tests: 2048 passed
```

Implementation checkpoint: `4476cdf feat: add necessary storage notice and disclosures`

## Test specification

| # | Guarantee | Test | Type | Result |
|---|---|---|---|---|
| 1 | The notice names the necessary CSRF cookie, local-only browser storage, and absence of tracking | `components/CookieNotice.test.tsx` | component | PASS |
| 2 | The notice links to `/datenschutz` | `components/CookieNotice.test.tsx` | component | PASS |
| 3 | “Verstanden” dismisses the notice and records acknowledgement in `sessionStorage` | `components/CookieNotice.test.tsx` | component | PASS |
| 4 | Acknowledged tabs do not display the notice again | `components/CookieNotice.test.tsx` | component | PASS |
| 5 | The privacy page names the CSRF cookie and § 25 TDDDG basis | `tests/legal-pages.test.tsx` | integration/render | PASS |
| 6 | The privacy page explains Cloudflare legal basis and transfer safeguards | `tests/legal-pages.test.tsx` | integration/render | PASS |
| 7 | The privacy page explains contact inquiries and Alfahosting processing | `tests/legal-pages.test.tsx` | integration/render | PASS |

## Quality gates

- Production build: PASS (`npm run build`)
- Changed-file lint: PASS
- Full unit/integration suite: PASS, 2,048 tests
- Production dependency audit: PASS, 0 vulnerabilities
- Coverage: 95.26% statements, 86.94% branches, 100% functions, 95.13% lines
- Repository-required `npm run check`: PASS; the script currently only prints `Check completed`

## Known repository-wide lint debt

`npm run lint` still fails on ten pre-existing errors outside this change, including `hooks/useAutoSave.ts`, `lib/csrf.ts`, legacy middleware tests, and legacy E2E tests. The five changed files pass ESLint without findings.
