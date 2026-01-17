# SC Payout Split

## Überblick
- **Stack**: Next.js (App Router) + TypeScript + TailwindCSS.
- **API**: Next.js Route Handlers (REST), Prisma ORM, PostgreSQL.
- **Calc Engine**: `/lib/calc` mit rein funktionaler Berechnung.
- **Frontend**: Landing + Wizard + Result/Payslip in `app/page.tsx` mit Client-Komponente `SessionWizard`.
- **Persistenz**: Prisma Schema in `prisma/schema.prisma`; share links via `ExportToken`.

## Domänenmodell
- `Session`: name, type (enum), currency, totalRevenue (aus Member-Revenue aggregiert), taxEnabled, taxRate, distributionMode, timestamps.
- `Member`: handle, role, active, revenue, investment, percentShare, fixedBonus, fixedPayout.
- `SharedExpense` + `SharedExpenseParticipant`: optional (Default nicht genutzt); Posten mit betroffenen Membern.
- `IndividualExpense`: pro Member.
- `ExportToken`: shareable read-only Token.

## API Endpunkte (MVP)
- `POST /api/sessions`: erstellt Session inkl. Members + Expenses.
- `GET /api/sessions/:id`: lädt Session.
- `PUT /api/sessions/:id`: upsert Members/Expenses + Sessiondaten.
- `GET /api/sessions/:id/payslip`: berechnet Payslip on-the-fly aus DB.
- `POST /api/sessions/:id/share`: erzeugt Token.
- `GET /api/share/:token`: liefert Session + Payslip für read-only View.

## Berechnung (lib/calc)
1. Validierung (aktive Member, Percent=100 %).
2. Totals: totalRevenue = Summe Member-Revenue (oder gegeben), investmentsTotal, saleRevenue, Shared/Individual Expenses Allocation (shared gleichmäßig auf Teilnehmer, default keine).
3. Net Profit = saleRevenue - exp gesamt.
4. Profitverteilung:
   - **EQUAL**: gleich pro aktivem Member.
   - **PERCENT**: gemäß percentShare.
   - **ADJUSTABLE**: fixedPayout + fixedBonus zuerst, Rest equal; percentShares werden genutzt, falls gesetzt.
5. Final je Member: investment + profitShare - expenses.
6. Settlement: Greedy Matching Debtors/Creditors → Transfers; optional Tax-Gross-Up pro Transfer.
7. Tax: gross = ceil(targetNet/(1-taxRate)); Fee = gross*taxRate; letzte Transfers pro Empfänger decken Rest.

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

## Tests
- `lib/calc.test.ts` mit Vitest deckt Equal/Percent/Adjustable.
- Playwright-Config vorbereitet (`playwright.config.ts`), E2E-Suite folgt.

## Setup
- `.env.example` mit `DATABASE_URL`.
- `pnpm i` oder `npm install`, danach `npm run dev`.
- Prisma: `npm run prisma:generate` und `npm run prisma:push` gegen PostgreSQL/Supabase/Neon.
