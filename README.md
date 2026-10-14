# SC Payslip

> Fair profit distribution and settlement transfers for Star Citizen crew operations

## Product Positioning

**SC Payslip** is a calculator for crew-based revenue splitting in Star Citizen. It helps crews fairly distribute profits from shared operations, calculate individual payouts, and facilitate settlement transfers with accurate tax gross-up handling.

**What it does:**
- Calculates fair profit distribution across crew members
- Generates detailed payslip-style receipts with breakdown
- Computes settlement transfers with tax gross-up (fee adjustment)
- Manages multi-member revenue and expense tracking
- Saves and exports sessions locally in the visitor's browser

**What it doesn't do:**
- Doesn't integrate with Star Citizen game servers (calculations only)
- Doesn't send or persist session data on an application server
- Isn't a real-time ledger system (designed for end-of-session settlements)

## Core Capabilities

✅ Multi-member revenue & expense tracking
✅ Three distribution modes: EQUAL, PERCENT, ADJUSTABLE
✅ Tax gross-up calculations for transfers
✅ Payslip generation & detailed breakdown
✅ Local session history and file exports
✅ Schema validation for data integrity

## Quick Start

```bash
npm install && npm run dev
```

Build for production: `npm run build`

**Demo**: [payslip.cheesy.cloud](https://payslip.cheesy.cloud/) • deploy details in [DEPLOYMENT.md](./DEPLOYMENT.md)

## Operational Info

- **Code Review**: GitHub Copilot assistance
- **CI/CD**: GitHub Actions (build + unit tests, Playwright E2E) + CodeQL scanning
- **Deployment**: Next.js standalone build — see [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Data model**: browser `localStorage`; no application API or database
- **Dependency Monitoring**: Dependabot integration

Verify setup: `npm run check`

## Contributing

- **Security**: [SECURITY.md](./SECURITY.md) • [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Report Issues**: Use GitHub Issues for bugs and features

## Trust Signals

✅ CodeQL automated security scanning
✅ Dependabot dependency monitoring
✅ Secret push protection
✅ TypeScript with strict checking
✅ Vitest + Playwright testing
✅ MIT License

---

**Project Status**: Alpha (Active Development)
**License**: MIT
**Tech Stack**: Next.js 16 • React 18 • TypeScript • Zod
