# Legal storage notice – TDD evidence

## Source

The user requested a transparent browser-storage notice, detailed Cloudflare/contact disclosures, and an explanation of any technically necessary cookie. After the public application moved fully to browser-only persistence and all mutation APIs were disabled, the obsolete CSRF cookie was removed rather than merely disclosed.

## User journeys

1. As a visitor, I can immediately see that SC Payslip stores session data locally and does not use application cookies or tracking.
2. As a visitor, I can open the detailed privacy notice directly from the storage notice.
3. As a visitor, I can dismiss the notice for the current browser tab only.
4. As a data subject, I can identify the purposes, legal bases, transfer safeguards, recipients, and deletion criteria relevant to Cloudflare and contact inquiries.

## RED evidence

The component and legal-page tests initially required a transparent storage notice. A later fail-closed review demonstrated that the CSRF cookie no longer had a technical purpose in local-only public mode, so regression tests were changed first to require no `Set-Cookie` or `x-csrf-token` response header and cookie-free public wording.

## GREEN evidence

Targeted commands:

```text
npm test -- components/CookieNotice.test.tsx tests/legal-pages.test.tsx middleware.test.ts
npm test -- lib/calc.settlement.regression.test.ts lib/export/payoutSummary.test.ts lib/csv/export.test.ts lib/pdf/generator.test.ts
```

Verified guarantees:

| # | Guarantee | Test | Type |
|---|---|---|---|
| 1 | The notice states that SC Payslip sets no cookies, explains local browser storage, and discloses the absence of tracking | `components/CookieNotice.test.tsx` | component |
| 2 | The notice links to `/datenschutz` | `components/CookieNotice.test.tsx` | component |
| 3 | “Verstanden” records acknowledgement only in `sessionStorage` for the current tab | `components/CookieNotice.test.tsx` | component |
| 4 | Middleware preserves security headers but emits neither an obsolete CSRF header nor a cookie | `middleware.test.ts` | unit |
| 5 | The privacy page consistently explains cookie-free `localStorage`/`sessionStorage` use | `tests/legal-pages.test.tsx` | render |
| 6 | The privacy page explains Cloudflare legal basis and transfer safeguards | `tests/legal-pages.test.tsx` | render |
| 7 | The privacy page explains contact inquiries and Alfahosting processing | `tests/legal-pages.test.tsx` | render |
| 8 | Non-transferable fee residuals are returned and disclosed in payout summaries, CSV, clipboard data, and PDF | settlement/export regression tests | integration |

## Quality gates

Final clean-worktree evidence:

- `npm test`: 2,037 tests passed
- `npm test -- --coverage`: 95.76% lines, 87.61% branches, 100% functions
- `npm run build`: passed with Next.js 16.3.1
- `npm audit --omit=dev`: 0 vulnerabilities
- `git diff --check origin/master..HEAD`: clean
- repository-wide lint: 8 existing errors and 238 warnings, improved from the `master` baseline of 10 errors and 301 warnings

A fail-closed independent review remains mandatory before merge.

## Known repository-wide lint debt

`npm run lint` has pre-existing repository errors on `master`. The merge gate compares the candidate with that baseline and does not treat unrelated existing warnings as newly introduced findings.
