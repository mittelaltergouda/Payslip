# Accounting transparency implementation progress

## Resume location

- Worktree: `/root/sc-payslip-accounting`
- Branch: `feat/accounting-transparency`
- Base: `645d0981cc0a0b1c8a52d5282c53f6a51985369e`
- Source worktree `/root/sc-payslip` and its modified `AGENTS.md` were not changed.
- Full plan: `docs/plans/accounting-transparency.plan.md`

## Completed

- Loaded and followed `coding-standards`, `tdd-workflow`, `security-review`, `git-workflow`, and project `AGENTS.md`.
- Added RED regression coverage for:
  - the reported individual-expense reimbursement fixture;
  - itemized revenue/investment overriding legacy scalar fields;
  - already-paid transfer progress and fee semantics.
- Captured initial RED evidence: 3 intended failures / 3 existing passes.
- Implemented the first core-calculation pass:
  - itemized money input and paid-transfer types/schema;
  - itemized values override legacy scalar values;
  - individual/shared expense allocations are reimbursed once in target payout;
  - paid transfer gross amounts reduce both sides' remaining settlement balance;
  - settlement detail records preserve exact budget, integer floor, fee, and fractional remainder.
- Current focused result: 4 passes / 2 failures. The accounting values are now correct; both remaining failures are assertion-shape mismatches because budget/rounding data moved to `result.settlementDetails` rather than being added to legacy `suggestedTransfers` objects.
- `npm run check`: PASS (`Check completed`; note that this project script is only an echo).
- `git diff --check`: PASS.

## Current intentional/incomplete state

The implementation is paused on request. It is not complete and must not be presented as production-ready.

1. Update focused tests to assert `result.settlementDetails` for `budgetAmount` and `roundingRemainder`, preserving backward-compatible `suggestedTransfers` shapes; rerun GREEN.
2. Complete input validation for itemized amounts and paid transfers (safe finite range, non-negative, existing distinct member IDs).
3. Add storage/import/duplication compatibility tests and implementation for new arrays and paid transfers.
4. Build labelled add/update/remove UI for revenue and investment on desktop/mobile, plus paid-transfer UI including fee.
5. Add pure arithmetic explanation builder and expandable result UI.
6. Put complete profit/settlement arithmetic at the start of PDF page 2 and test page placement/content.
7. Document shared-expense funder semantics in user-facing copy.
8. Add component/E2E coverage, diagnose the existing browser failure, then run unit, lint, build, browser, and security/diff checks.
9. Write the final TDD evidence report and make GREEN/refactor checkpoint commits.

## Latest focused test evidence

Command: `npm test -- lib/calc.settlement.regression.test.ts`

Result: 1 file failed; 2 tests failed, 4 passed. In both failures, the received transfer net/gross/fee and member targets match expected accounting. Expected-only fields were `budgetAmount` and `roundingRemainder`; they are currently available in `result.settlementDetails`.
