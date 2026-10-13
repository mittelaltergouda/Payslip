# Accounting correctness and transparency plan

## Goal

Make reimbursements and settlement conserve session cash, support itemized member inputs and already-paid transfers without double counting, and expose the full arithmetic in the UI and PDF.

## Accounting conventions

1. **Revenue** is session cash held by a member before any recorded intra-session transfer. Revenue line items replace the legacy scalar `revenue` when present; they are never added to it.
2. **Investments and expenses** are legitimate session costs paid/funded by members. They are deducted once to calculate profit and then reimbursed once to their funder in that member's target payout.
3. **Individual expenses** are reimbursed to their selected member.
4. **Shared expenses** use `participantIds` as the funders/reimbursement recipients. The expense amount is split equally among those members (or all active members when omitted), and those allocated amounts are reimbursed. This preserves the existing schema while making the previously ambiguous field auditable.
5. **Already-paid intra-session transfers** are settlement progress, not revenue, investment, or expense. Revenue remains the pre-transfer held-cash amount. A recorded transfer consumes its sender's gross amount (`net + fee`) and the same gross settlement entitlement of its receiver. The fee is disclosed but is not deducted from profit a second time.
6. Suggested transfer amounts are integer sender budgets. The displayed net plus fee equals the gross budget; fractional entitlement and minimum-fee residuals remain explicit.

## Non-goals

- No server, API, database, sharing, authentication, production deployment, Cloudflare, or service changes.
- No silent reinterpretation that adds legacy scalar and itemized values together.
- No changes to `/opt/sc-payslip` or the source worktree's modified `AGENTS.md`.

## Milestones and TDD evidence targets

| Task | Test target (RED before implementation) | Acceptance criteria |
|---|---|---|
| Reimburse costs | `lib/calc.settlement.regression.test.ts` | Given the reported two-member fixture, profit is 2,095,069; targets are 3,869,534.5 and 3,916,534.5; suggested gross is 3,869,534 with net 3,850,282 and fee 19,252; the 0.5 fractional remainder is disclosed. |
| Itemized revenue/investment | calculation + storage/component tests | Multiple labelled rows sum correctly; itemized arrays override, rather than add to, legacy scalar fields; legacy saved/imported sessions remain valid. |
| Paid transfers | calculation tests | Paid gross adjusts remaining settlement once; paid net/fee do not alter profit or get counted as income/cost; invalid member references/negative values fail validation. |
| Arithmetic UI | `components/ResultsDisplay.test.tsx` | Expandable section shows profit formula, per-person target/balance arithmetic, paid and suggested transfer fee/budget arithmetic, and rounding residuals. |
| Arithmetic PDF | `lib/pdf/generator.test.ts` | Arithmetic detail starts on page 2 and includes profit, per-person, paid transfer, suggested transfer, fee, and residual lines. |
| Input UI | member/session component tests | Revenue and investment use the same labelled add/update/remove pattern as expenses; paid transfers have add/update/remove controls including fee. |
| Compatibility/security | storage tests, lint/build | Local-only Zod schema accepts legacy and new fields, rejects malformed financial inputs, and no network/API/storage-service surface is added. |

## Validation

1. Run focused Vitest targets at each RED/GREEN cycle.
2. Run `npm run check` after each implementation phase as required by `AGENTS.md`.
3. Run full `npm test`, `npm run lint`, and `npm run build`.
4. Run the relevant Playwright browser flow (or record the exact environmental blocker).
5. Review the final diff for accounting conservation, input validation, local-only persistence, and accidental production/deployment changes.
