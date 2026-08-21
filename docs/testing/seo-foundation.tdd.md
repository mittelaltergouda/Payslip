# SEO Foundation – TDD Evidence

SC Payslip erhält eine getestete technische SEO-Basis mit klarer Star-Citizen-Suchintention, öffentlichen Metadaten, Sitemap, Robots-Regeln und strukturierten Daten. Personen-, Crew-, Session- und Finanzwerte bleiben vollständig außerhalb aller indexierbaren SEO-Artefakte.

## Source and user journey

Kein separater Plan wurde verwendet. Die Anforderungen stammen aus dem Live-Audit vom 21.08.2026 und der Nutzerentscheidung, SC Payslip suchmaschinenfähig zu machen.

- Als Star-Citizen-Spieler möchte ich über eine passende Suche einen Crew-Auszahlungsrechner finden.
- Als Suchmaschine möchte ich eindeutige öffentliche Metadaten, Canonicals und eine Sitemap erhalten.
- Als Nutzer möchte ich sicher sein, dass lokale Crew- und Finanzdaten nicht in indexierbaren Artefakten landen.

## RED evidence

### Fehlende SEO-Routen und Metadaten

Command:

```text
npm test -- app/seo.test.tsx
```

Result: RED. Vitest konnte `app/robots.ts` nicht auflösen, weil die SEO-Routen und gemeinsamen Metadaten noch nicht existierten.

Checkpoint: `dbbba6c test: define SEO foundation requirements`

### Fehlende Canonicals auf Unterseiten

Command:

```text
npm test -- app/canonical.test.ts
```

Result: RED. `/tool-tipps` lieferte `undefined` statt eines eigenen Canonicals; dieselbe Lücke bestand bei Impressum und Datenschutz.

Checkpoint: `d39dbbe test: require canonical URLs for public pages`

### Doppeltes Branding durch Next.js-Title-Template

Das unabhängige Review fand im gebauten HTML Titel wie `Tool-Tipps · SC Payslip | SC Payslip`. Der neue Regressionstest prüft deshalb, dass Child-Metadaten nur den Seitennamen liefern und der Parent-Template den Brand genau einmal ergänzt.

Command:

```text
npm test -- app/canonical.test.ts
```

Result: RED. Erwartet wurde `Tool-Tipps`, tatsächlich geliefert wurde `Tool-Tipps · SC Payslip`.

Checkpoint: `3386baa test: prevent duplicate branding in page titles`

Fix checkpoint: `ebbe2fe fix: avoid duplicate brand in page titles`

Der erneute Produktions-Build und HTTP-Smoke bestätigten:

- `/`: `Crew-Abrechnung für Star Citizen | SC Payslip`
- `/tool-tipps`: `Tool-Tipps | SC Payslip`
- `/impressum`: `Impressum | SC Payslip`
- `/datenschutz`: `Datenschutz | SC Payslip`

## GREEN evidence

Implementation checkpoint: `13cad5a feat: add search-ready SEO foundation`

Targeted command:

```text
npm test -- app/seo.test.tsx app/canonical.test.ts
```

Result: 7/7 tests passed.

Full verification:

- `npm test`: 2,045/2,045 tests passed.
- `npm test -- --coverage`: 95.79% lines, 87.61% branches, 100% functions.
- `DATABASE_URL='file:./dev.db' npm run build`: passed with Next.js 16.3.1.
- Build output includes static `/robots.txt` and `/sitemap.xml` routes.
- Targeted ESLint for every changed TypeScript/TSX file: passed.
- `npm audit --omit=dev`: 0 vulnerabilities.
- `git diff --check 6d51793..HEAD`: passed.

## HTTP artifact verification

The production build was started locally on port 3101 and requested over HTTP. Verified:

- Title: `Crew-Abrechnung für Star Citizen | SC Payslip`
- one H1 with the same primary search intent
- description, canonical, Open Graph and Twitter metadata
- `WebApplication` JSON-LD
- robots sitemap directive and AI-training crawler exclusions
- sitemap URLs: `/`, `/tool-tipps`, `/impressum`, `/datenschutz`

## Test specification

| Guarantee | Test | Type | Result |
|---|---|---|---|
| Homepage metadata targets Star Citizen crew payouts | `app/seo.test.tsx` | unit/contract | PASS |
| Open Graph and Twitter metadata are consistent | `app/seo.test.tsx` | unit/contract | PASS |
| Search crawlers are allowed and selected AI-training crawlers blocked | `app/seo.test.tsx` | unit/contract | PASS |
| Sitemap contains only intended public routes | `app/seo.test.tsx` | unit/contract | PASS |
| Every public subpage has its own canonical | `app/canonical.test.ts` | regression | PASS |
| Intro contains exactly one H1 and indexable explanation | `app/seo.test.tsx` | component | PASS |
| JSON-LD describes the web app without user values | `app/seo.test.tsx` | schema contract | PASS |
| Real production artifact exposes all SEO signals | local HTTP smoke | integration | PASS |

## Known boundaries

- No Google Search Console or Bing Webmaster Tools account was changed.
- No sitemap was submitted externally.
- No production deployment was performed by this task.
- Cloudflare currently serves managed content signals in live `robots.txt`; after deployment the combined live response must be checked to ensure the sitemap directive remains visible.
- Ranking still depends on indexing, relevant external links and search demand; technical SEO alone does not guarantee placement.
