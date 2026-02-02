# SC Payslip

## Overview
- **Stack**: Next.js (App Router) + TypeScript + TailwindCSS.
- **API**: Next.js Route Handlers (REST), Prisma ORM, PostgreSQL.
- **Calc Engine**: `/lib/calc/` modular calculation engine with pure functional computation (9 domain-specific modules).
- **Frontend**: Landing + Wizard + Result/Payslip in `app/page.tsx` with client component `SessionWizard`.
- **Persistence**: Prisma Schema in `prisma/schema.prisma`; share links via `ExportToken`.

## Domain Model
- `Session`: name, type (enum), currency, totalRevenue (aggregated from member revenues), taxEnabled, taxRate, distributionMode, timestamps.
- `Member`: handle, role, active, revenue, investment, percentShare, fixedBonus, fixedPayout.
- `SharedExpense` + `SharedExpenseParticipant`: optional (not used by default); entries with affected members.
- `IndividualExpense`: per member.
- `ExportToken`: shareable read-only token.

## API Endpoints (MVP)
- `POST /api/sessions`: creates Session including Members + Expenses.
- `GET /api/sessions/:id`: loads Session.
- `PUT /api/sessions/:id`: upserts Members/Expenses + Session data.
- `GET /api/sessions/:id/payslip`: calculates Payslip on-the-fly from DB.
- `POST /api/sessions/:id/share`: generates Token.
- `GET /api/share/:token`: returns Session + Payslip for read-only View.

## Berechnung (lib/calc/)

### Module Structure

The calculation engine is organized into domain-specific modules under `lib/calc/`:

| Module | Purpose | Lines | Exports |
|--------|---------|-------|---------|
| **types.ts** | Internal calculation types | ~30 | `NormalizedMember`, `NormalizedSessionInput` |
| **validation.ts** | Input validation & constraint checking | ~150 | `validateSessionInput`, `validateNormalizedSession` |
| **normalization.ts** | Data normalization & defaults | ~90 | `normalizeSessionInput`, `normalizeMember` |
| **distribution.ts** | Profit distribution algorithms | ~215 | `distributeProfit` (EQUAL/PERCENT/ADJUSTABLE) |
| **expenses.ts** | Shared & individual expense allocation | ~90 | `allocateSharedExpenses`, `allocateIndividualExpenses` |
| **settlement.ts** | Balance settlement & transfer generation | ~105 | `settleBalances` (greedy matching algorithm) |
| **tax.ts** | Tax gross-up calculations | ~100 | `applyTransferTaxes`, `calculateGrossAmount`, `calculateFeeAmount` |
| **statistics.ts** | Summary statistics (min/max/avg payouts) | ~60 | `calculateSummaryStatistics` |
| **index.ts** | Main orchestrator & public API | ~210 | `calculatePayslip` (main entry point) |

**Total:** ~1050 lines (previously monolithic `calc.ts`)

The original `lib/calc.ts` now acts as a **barrel export** for backward compatibility, re-exporting from `lib/calc/index.ts`.

### Calculation Flow

1. **Validation** (`validation.ts`): Checks active members, percent shares sum to 100%, valid tax rate, non-negative values.
2. **Normalization** (`normalization.ts`): Applies defaults to optional fields, generates member IDs, ensures consistent data structure.
3. **Totals Calculation** (`index.ts`):
   - `totalRevenue` = Sum of member revenues (or explicitly provided)
   - `totalInvestments` = Sum of all member investments
   - `saleRevenue` = totalRevenue - totalInvestments
4. **Expense Allocation** (`expenses.ts`):
   - Shared expenses distributed equally among participants
   - Individual expenses allocated directly to members
5. **Net Profit** (`index.ts`): saleRevenue - total expenses
6. **Profit Distribution** (`distribution.ts`):
   - **EQUAL**: Split equally among active members
   - **PERCENT**: Distributed proportionally by `percentShare`
   - **ADJUSTABLE**: `fixedPayout` + `fixedBonus` first, remainder split equally (or by percentShare if set)
7. **Member Breakdowns** (`index.ts`): `finalNet = investment + profitShare - expenses`
8. **Settlement** (`settlement.ts`): Greedy matching algorithm pairs largest debtors with largest creditors to minimize transfers
9. **Tax Gross-Up** (`tax.ts`): `gross = ceil(targetNet / (1 - taxRate))`; fee = gross × taxRate
10. **Summary Statistics** (`statistics.ts`): Calculates min/max/average payouts, transfer counts, highest/lowest earners

### Benefits of Modular Structure

**Maintainability:**
- Each module has a single, well-defined responsibility
- Easier to locate and modify specific calculation logic
- Reduced cognitive load when reading code (9 focused modules vs 1 monolithic file)

**Testability:**
- Modules can be tested independently with focused unit tests
- Easier to mock dependencies for integration testing
- Clear separation of concerns enables better test isolation

**Collaboration:**
- Reduced merge conflicts (changes isolated to specific modules)
- Easier code reviews (smaller, focused changesets)
- New contributors can understand domain logic incrementally

**Extensibility:**
- New distribution modes can be added to `distribution.ts` without touching other logic
- Tax calculations can be enhanced in `tax.ts` independently
- Clear extension points for future features (e.g., weighted expense allocation in `expenses.ts`)

### Which Module to Modify?

| Task | Module | Example |
|------|--------|---------|
| Add new validation rule | `validation.ts` | Validate custom member field |
| Change default values | `normalization.ts` | Set default role or investment |
| Add distribution mode | `distribution.ts` | Implement WEIGHTED mode |
| Change expense splitting logic | `expenses.ts` | Support weighted shared expenses |
| Modify transfer algorithm | `settlement.ts` | Implement priority-based settlement |
| Update tax calculation | `tax.ts` | Add tiered tax rates |
| Add new summary metrics | `statistics.ts` | Calculate median payout |
| Change calculation flow | `index.ts` | Add pre-distribution hooks |

## UI-Fluss
- Wizard sammelt Basisdaten, Members, Shared/Individual Expenses, Distribution Mode, Tax-Toggle.
- Berechnung läuft client-seitig über `calculatePayslip`.
- Result-Kacheln zeigen Breakdown + Suggested Transfers; Copy-Buttons für JSON/Transfers.
- Share-View unter `/share/:token` ist read-only mit gleicher Darstellung.

## Annahmen & Trade-offs
- Shared Expenses werden gleichmäßig auf Teilnehmer verteilt (V1: gewichtete Verteilung).
- fixedPayout entfernt Member aus dem Resttopf, fixedBonus addiert nur oben drauf.
- Tax wird pro Transfer berechnet (gross-up), Gebühren lasten auf Zahlerseite.
- Rounding: `Math.ceil` beim Gross-Up um Unterzahlung zu vermeiden; leichte Überschüsse möglich.
- Keine Auth (Phase 2: Magic Links). Share Tokens sind UUID-basiert.
- Validation per Zod, Rate-Limiting noch nicht implementiert (kann via Middleware ergänzt werden).

## Setup

### Prerequisites
- **Node.js**: Version 18.x or higher
- **Package Manager**: npm, pnpm, or yarn
- **Database**: PostgreSQL instance (local, Supabase, Neon, or other PostgreSQL provider)

### Environment Configuration

1. **Create `.env` file** in the project root:
```bash
# Database connection string
DATABASE_URL="postgresql://user:password@localhost:5432/payslip?schema=public"

# NextAuth secret (required for auth, if applicable)
NEXTAUTH_SECRET="your-secret-key-here"
```

**Note**: See `.env.example` for reference.

### Installation Steps

1. **Install dependencies**:
```bash
npm install
# or
pnpm install
# or
yarn install
```

2. **Generate Prisma client**:
```bash
npm run prisma:generate
```

3. **Push database schema** (creates tables in your PostgreSQL database):
```bash
npm run prisma:push
```

**Alternative**: Run migrations if you have them:
```bash
npx prisma migrate dev
```

4. **Start development server**:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Testing

### Test Suite Overview

The project uses **Vitest** for unit testing and **Playwright** for end-to-end testing. Test coverage focuses on the core calculation engine (`lib/calc/` modules) with 90%+ coverage achieved.

### Test Commands

#### Run All Unit Tests
```bash
npm run test
# or for watch mode
npm run test:watch
```

#### Run Tests with Coverage Report
```bash
npm run test -- --coverage
```

Coverage report will show:
- Line coverage
- Branch coverage
- Function coverage
- Uncovered lines

**Target**: `lib/calc/` modules should maintain **90%+ coverage**.

#### Run End-to-End Tests (Playwright)
```bash
npm run test:e2e
```

**Note**: E2E test suite is currently prepared but not fully implemented. See `playwright.config.ts` for configuration.

#### Type Checking
```bash
npx tsc --noEmit
```

Verifies TypeScript strict mode compliance with no type errors.

#### Linting
```bash
npm run lint
```

Runs ESLint to ensure code quality and consistency. Should pass with **0 warnings, 0 errors**.

#### Security Audit
```bash
npm audit
```

Checks for known vulnerabilities in dependencies.

### Test Coverage Details

The test suite (`lib/calc.test.ts`) includes **84+ tests** covering:

- **EQUAL Distribution Mode** (8 tests): Equal profit distribution among active members
- **PERCENT Distribution Mode** (9 tests): Proportional distribution based on percentShare
- **ADJUSTABLE Distribution Mode** (10 tests): fixedPayout, fixedBonus, and remainder distribution
- **Expense Allocation** (8 tests): Shared and individual expense handling
- **Tax Gross-Up Calculations** (15 tests): Fee calculation and gross amount formulas
- **Settlement/Transfer Generation** (8 tests): Greedy matching algorithm for minimal transfers
- **Edge Cases** (26+ tests): Zero members, high tax rates, floating point precision, negative balances, etc.

## Known Limitations

### Current Version (MVP)

1. **Shared Expense Distribution**
   - **Current**: Shared expenses are distributed equally among participants (or all active members if no participantIds specified)
   - **Future**: V1 will support weighted distribution based on custom allocation ratios

2. **Authentication**
   - **Current**: No authentication system (Phase 2 feature)
   - **Future**: Magic link authentication planned for Phase 2
   - **Security**: Share tokens are UUID-based and provide read-only access

3. **Rate Limiting**
   - **Current**: No rate limiting implemented
   - **Future**: Can be added via Next.js middleware for API routes

4. **Rounding Behavior**
   - **Tax Gross-Up**: Uses `Math.ceil()` to ensure sender covers full tax, which may result in slight overpayments (< 1 unit)
   - **Transfers**: Rounded to 2 decimal places
   - **Trade-off**: Prevents underpayment but may cause small discrepancies in settlement totals

5. **Distribution Mode Constraints**
   - **PERCENT Mode**: Requires percentShare values to sum to exactly 100% across all active members
   - **ADJUSTABLE Mode**:
     - `fixedPayout` removes member from the profit pool remainder
     - `fixedBonus` adds to member's profit share without affecting pool
     - Remainder distributed equally unless percentShare values provided

6. **Investment Handling**
   - Investments are returned **before** profit distribution in all modes
   - If investments exceed revenue, this creates negative `saleRevenue` and negative profit

7. **Tax Calculation**
   - Tax is calculated **per transfer** (not per member)
   - Fees are added to sender's gross amount
   - Formula: `grossAmount = ceil(netAmount / (1 - taxRate))`
   - Last transfer to each receiver may include remainder adjustment

8. **Validation Scope**
   - Input validation via Zod schemas at API boundary (`app/api/sessions/validation.ts`)
   - Client-side validation in SessionWizard component
   - No server-side rate limiting or CAPTCHA (suitable for internal tools, not public-facing apps)

9. **Inactive Members**
   - Excluded from profit distribution and shared expense allocation
   - Still appear in member list for record-keeping
   - Can have individual expenses assigned to them

10. **Browser Support**
    - Tested in Chrome, Firefox, Safari (latest versions)
    - Mobile responsive design implemented
    - Bilingual support (DE/EN) via client-side toggle

11. **Performance**
    - Calculation engine tested with 100 members: < 1 second
    - Client-side calculation only (no background jobs)
    - Large sessions (100+ members) may experience UI lag on slower devices

12. **Data Persistence**
    - Sessions stored in PostgreSQL via Prisma ORM
    - No automatic cleanup of old sessions
    - ExportToken has no expiration (read-only, UUID-based)

### Future Enhancements (Roadmap)

- **Weighted Shared Expenses**: Custom allocation ratios for shared expenses
- **Magic Link Authentication**: Secure user accounts and session ownership
- **Rate Limiting**: API protection via middleware
- **Audit Trail**: Track changes to sessions over time
- **Export Formats**: PDF payslips, CSV exports
- **Multi-Currency**: Support for currency conversion
- **Batch Sessions**: Handle multiple payout periods within one session

## Troubleshooting

### Common Issues

**Database Connection Errors**
```
Error: P1001: Can't reach database server
```
- Verify `DATABASE_URL` in `.env` is correct
- Ensure PostgreSQL instance is running
- Check network/firewall settings

**Prisma Client Not Generated**
```
Error: @prisma/client did not initialize yet
```
- Run: `npm run prisma:generate`

**Type Errors After Pulling Changes**
```
Error: Type 'X' is not assignable to type 'Y'
```
- Run: `npx tsc --noEmit` to check for errors
- Ensure all dependencies are installed: `npm install`

**Tests Failing**
```
Error: Cannot find module './calc'
```
- Ensure lib/calc/ modules are properly compiled
- Run: `npm run test` to see detailed error messages

For more help, see the inline JSDoc comments in `lib/calc/` modules for detailed algorithm explanations. The main orchestrator is in `lib/calc/index.ts`.
