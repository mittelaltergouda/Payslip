# Copilot Instructions for SC Payout Split

## Project Overview
**SC Payout Split** is a Next.js 14 + TypeScript payout calculator for crew-based revenue splitting in Star Citizen. It calculates fair profit distribution, settlement transfers, and applies transfer taxes (fee gross-up). The app combines a client-side calculation engine with Prisma ORM persistence and read-only share links.

**Stack**: Next.js 14 (App Router), TypeScript, TailwindCSS, Prisma (PostgreSQL), Zod validation, Vitest.

## Critical Architecture Patterns

### 1. Pure Calculation Engine (lib/calc.ts)
- **Why separate**: All domain logic is intentionally decoupled from Next.jsdeterministic, testable, shareable between client/server.
- **Core flow**: normalize members  validate  calculate totals (revenue - investments = saleRevenue)  deduct expenses  distribute net profit by mode  settle balances  apply tax gross-up.
- **Key functions**:
  - calculatePayslip(SessionInput): PayslipResult  main entry point; returns breakdown + suggested transfers.
  - Three distribution modes via distributeProfit(): EQUAL (per-member split), PERCENT (weighted %), ADJUSTABLE (fixed payouts first, remainder split).
  - settleBalances() uses greedy matching (creditors vs debtors, sorted by amount) to minimize transfer count.
- **Tax handling** (applyTransferTaxes): Grosses-up each transfer so **receiver gets exact net amount**; fee = ceil(net * taxRate); sender pays gross = net + fee.

### 2. Type System (lib/types.ts)
- SessionInput is the validated request shape; calculation consumes this, returns PayslipResult.
- MemberInput allows id to be auto-generated; evenue, investment default to 0.
- percentShare, ixedBonus, ixedPayout are optional; schema enforces rules (e.g., PERCENT mode requires sum=100%).
- Shared expenses default to "all active participants" if participantIds omitted.

### 3. Database Schema (prisma/schema.prisma)
- Session: root aggregate; stores mode, tax settings, totalRevenue.
- Member: active flag, calculated fields (revenue/investment/percentShare/fixedBonus/fixedPayout).
- **Cascade deletes**: deleting a Session removes all Members, Expenses, ExportTokens.
- SharedExpenseParticipant is a join table (participants default to active members at calculation time, not stored).
- ExportToken: UUID-based; no auth layer yet (Phase 2).

### 4. Validation Layer (app/api/sessions/validation.ts)
- Zod schemas ensure input safety: Enum types (SessionType, DistributionMode), numeric bounds, min/max string lengths.
- Payloads are **validated at API boundary**, then passed to calculatePayslip().
- Share via SessionPayload = z.infer<typeof sessionSchema>.

## Developer Workflows

### Build & Run
`ash
npm run dev          # Next.js dev server on localhost:3000
npm run build        # Production build
npm run start        # Production start
`

### Testing
`ash
npm test             # Vitest run (lib/calc.test.ts only currently)
npm run test:watch   # Vitest watch mode
npm run test:e2e     # Playwright (config prepared; suites TBD)
`

### Database
`ash
npm run prisma:generate  # Regenerate Prisma client (after schema edits)
npm run prisma:push      # Push schema changes to PostgreSQL
`
**Prerequisites**: DATABASE_URL in .env (e.g., PostgreSQL/Supabase/Neon).

### Linting
`ash
npm run lint         # ESLint + Next.js rules
`

## Key Component Behaviors

### SessionWizard (components/SessionWizard.tsx)
- Client-side form component (marked "use client").
- Bilingual (de/en); gathers members, expenses, distribution mode, tax toggle.
- Calls calculatePayslip() **locally**no server round-trip for calc.
- Renders breakdown cards + suggested transfers; copy buttons for JSON/CSV export.

### API Routes (app/api/sessions/)
- **Unimplemented stubs** in payslip/ and share/ subdirectories (awaiting implementation).
- Validation logic is ready in alidation.ts.
- Future endpoints: POST /sessions, GET /sessions/[id], PUT /sessions/[id], GET /sessions/[id]/payslip, POST /sessions/[id]/share, GET /api/share/:token.

### Landing Page (app/page.tsx)
- Minimal entry point; renders SessionWizard directly.

## Common Patterns & Conventions

### Calculation Assumptions
1. **Rounding**: Math.ceil for tax gross-up to ensure no underpayment; small overages possible.
2. **EPSILON = 0.001**: Used to compare floats (e.g., percent sum validation, leftover balances).
3. **Expense allocation**: Shared expenses split **equally** among participants (future: weighted distribution).
4. **Investment offset**: Investment reduces saleRevenue upfront; not a profit expense.
5. **fixedPayout vs fixedBonus**: fixedPayout removes member from remainder pool; fixedBonus stacks on top.

### Error Handling
- calculatePayslip() throws on invalid state (e.g., no active members, percent shares  100, negative tax rate).
- API validation failures should return 400 with Zod error details (TBD in route handlers).
- Frontend: catch calc errors in try-catch, display user-friendly message.

### Naming Conventions
- Snake_case for database columns; camelCase for TS/JS.
- "Handle" = crew member ID (Star Citizen username).
- "Net" = after-tax amount; "Gross" = before-tax.
- "Profit Share" = member's slice of netProfit (before settlement).
- "Final Net" = settlement balance (positive = should receive, negative = should pay).

## Testing Guidelines
- Unit tests use Vitest (jsdom environment, globals enabled).
- Test file: [lib/calc.test.ts](lib/calc.test.ts#L1) covers EQUAL, PERCENT, ADJUSTABLE modes.
- Focus on edge cases: zero-member sessions, all-fixed-payout scenarios, high tax rates.
- E2E tests (Playwright) are prepared but empty; focus on wizard flow  result rendering.

## Integration Points & External Dependencies
- **Prisma**: ORM for PostgreSQL; schema changes require migration (push command).
- **Zod**: Lightweight validation; imported in validation.ts.
- **TailwindCSS**: Utility-first styling; config in [tailwind.config.ts](tailwind.config.ts).
- **Next.js 14 App Router**: server/client component boundaries (careful with "use client" imports).
- **No external auth**: Share tokens are UUIDs (Phase 2: magic links).

## Questions to Ask Before Adding Features
1. **Should this logic live in lib/calc.ts?** If it's domain logic, keep it pure.
2. **Is this an API route or client component?** Check the data source and who triggers it.
3. **Does this need DB persistence?** Schema changes must be reflected in Prisma.
4. **Does this change calculation behavior?** Update tests in calc.test.ts.
5. **Is this a new enum or mode?** Add it to types.ts and validation.ts.

