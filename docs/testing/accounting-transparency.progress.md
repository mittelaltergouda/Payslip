# Accounting transparency implementation progress

## Status 2026-10-13 (Claude Code) — supersedes older sections below

- Commits: c966812 (WIP snapshot), 1e065cc + dbb31de (new core tests), fb695e8 (15 legacy expense tests realigned).
- Agreed rule (Marco): costs and investments are paid by the player they are entered for, deducted once from profit and fully reimbursed to that player; profit AND loss are then shared by the distribution mode (equal or proportional). Legacy shared expenses without payer: participants (default all active) count as equal funders.
- Task 1 (t_ab2856dc) DONE: `lib/calc.paid-transfers.test.ts` (13 tests, cash-conservation invariant, mutation-checked). Unit suite 1843/1843 green; lint 0 errors.
- Known open: `npx tsc --noEmit` fails in `lib/accounting.ts:43` (settlementDetails typing) -> fix in task 4; build and E2E not yet run.
- Note: creditor rounding residuals can add up across pairings (e.g. 1.25); debtor residual always < 1. Disclosed, not hidden.
- Build fix DONE (ce5e6d4): `next build` green (Turbopack) — verified in a throwaway copy with real node_modules, because the worktree's node_modules is a symlink to /root/sc-payslip/node_modules which Turbopack rejects ("points out of the filesystem root"). `next build --webpack` additionally fails on node:crypto in lib/id.ts (webpack-only; not the production path).
- DECIDED by Marco 2026-10-13:
  1. Rounding REVISED (supersedes the earlier "integer shares" decision, which was implemented, then reverted at Marco's request): shares, targets and balances stay EXACT so players can recompute them without rounding errors; only actual transfers are floored to whole aUEC (budget = floor, fee fit inside). The sub-1-aUEC rest is reported as unsettled, never dropped. This is the existing core behaviour; locked in by `lib/calc.integer-shares.test.ts` (a971303). P1/P2 fixture stays 1,047,534.5 / 3,869,534.5 / budget 3,869,534 / 0.5 residual.
  2. NOT YET IMPLEMENTED — ADJUSTABLE fixed payouts/bonuses only on profit: on a loss they are suspended and all active members share the loss equally (funders still reimbursed first), UI hint "Verlust-Session: Fixbeträge ausgesetzt". If profit < sum of fixed amounts, cut them proportionally to the available profit; pool members get 0, never negative.
- Next: task 2 (itemized revenue/investment: MoneyItemsEditor exists, verify wiring + tests), task 3 (PaidTransfersEditor exists, verify wiring + tests), task 4 (arithmetic UI/PDF page 2, fix TS error).

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
