# Core Math Test Coverage

Coverage and verification notes for SC Payslip's **core crew profit-distribution
and settlement-transfer calculations** (`lib/calc/*`). Scope is the pure
calculator only — no game integration.

## Runnable commands

```bash
# Unit tests for the core distribution / settlement / tax / validation math
npm test -- lib/calc.coverage.test.ts          # focused gap-closing suite
npm test                                        # full Vitest suite (2085 tests)
npm test -- --coverage                          # full suite with v8 coverage report

# E2E happy path for the main calculator flow
npm run test:e2e -- calculator-happy-path       # requires `npx playwright install`
```

## What is covered

### Unit (`lib/calc.coverage.test.ts`, 27 tests)

Complements the scenario suites (`calc.equal/percent/adjustable/transfers/
taxes/edge-cases.test.ts`) by exercising the domain functions directly and
pinning the defensive branches the high-level flow does not reach:

- **`distributeProfit`** — empty active-member guards for EQUAL/PERCENT/
  ADJUSTABLE, the unknown-mode exhaustiveness guard, and uneven-split / rounding
  / fixed-payout / fixed-bonus exactness (sum-of-shares invariants).
- **`settleBalances`** — already-settled (no transfers), sub-cent imbalance
  ignored within the 0.01 epsilon, plain transfer, 5% tax gross-up, and greedy
  minimization of transfer count (largest debtor ↔ largest creditor).
- **`validateSessionInput` / `validateNormalizedSession`** (via
  `calculatePayslip`) — negative revenue, negative investment, negative shared
  and individual expense amounts, out-of-range tax rate (>1 and <0), empty
  handle, no active members, and PERCENT shares not summing to 100%.
- **normalization** — applied member/session defaults and 1-based
  auto-generated member ids flowing through to the breakdown.

### Resulting coverage on `lib/calc` (v8)

| Module            | Stmts | Branch | Notes |
|-------------------|-------|--------|-------|
| distribution.ts   | 100%  | 90%    | remaining branches are `?? 0` nullish fallbacks |
| settlement.ts     | 100%  | 92%    | remaining branch is the unreachable sub-epsilon skip |
| tax.ts            | 100%  | 100%   | |
| validation.ts     | 100%  | 100%   | |
| normalization.ts  | 100%  | 100%   | |
| index.ts          | 100%  | 83%    | orchestrator optional-field branches |

`lib/calc` overall: **99.5% statements, 93.4% branch** (up from 94.1% / 82.5%).

### E2E (`tests/e2e/calculator-happy-path.spec.ts`)

A single tightly-asserted golden path: open the tool, enter 10,000 crew
revenue, and verify the rendered payout — net profit (10,000), the EQUAL split
(5,000 each), and the resulting settlement transfer. The flow is fully
client-side (localStorage), so it does not need the database.

> Note: Playwright browsers cannot be installed on every platform (e.g. Ubuntu
> 26.04 is currently unsupported by the Playwright browser builds). Run the E2E
> suite on a supported OS / in CI after `npx playwright install`.
