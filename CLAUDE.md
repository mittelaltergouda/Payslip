# CLAUDE.md

## Project Goal

**SC Payout Split** is a payout calculator for crew-based revenue splitting in Star Citizen. It calculates fair profit distribution, settlement transfers, and applies transfer taxes (fee gross-up). The app combines a client-side calculation engine with Prisma ORM persistence and read-only share links.

Key features:
- Multi-member revenue and expense tracking
- Three distribution modes: EQUAL, PERCENT, ADJUSTABLE
- Tax gross-up calculation for transfers
- Shareable read-only session links

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14 | App Router, API routes |
| React | 18 | UI components |
| TypeScript | 5.4+ | Type safety |
| Tailwind CSS | 3.4+ | Styling |
| Prisma | 5.18+ | ORM for PostgreSQL |
| Zod | 3.23+ | Schema validation |
| Vitest | 4.0+ | Unit testing |
| Playwright | 1.44+ | E2E testing |

## Working Rules for AI Agents

### Code Style
- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Keep calculation logic in `lib/` as pure functions
- Use Zod for input validation at API boundaries
- Use camelCase for TS/JS, snake_case for database columns

### Testing
- Every new logic needs tests
- Run `npm test` for unit tests (Vitest)
- Run `npm run test:e2e` for E2E tests (Playwright)
- Focus on edge cases: zero-member sessions, all-fixed-payout scenarios, high tax rates

### Development Workflow
1. Plan your changes
2. Implement the feature
3. Run `npm run check` to verify
4. Fix any issues
5. Run again until successful
6. End with a short summary and list of changed files

### Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run check        # Verify changes
npm test             # Run unit tests
npm run test:e2e     # Run E2E tests
npm run lint         # ESLint
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:push      # Push schema to database
```

### Architecture Guidelines
- Domain logic belongs in `lib/calc.ts` (pure, testable, shareable)
- Types and interfaces in `lib/types.ts`
- API validation in `app/api/sessions/validation.ts`
- Client components marked with `"use client"`
- Database schema in `prisma/schema.prisma`

### Do Not
- Edit AGENTS.md
- Add external dependencies without discussion
- Skip tests for new logic
- Use `console.log` for debugging in production code
