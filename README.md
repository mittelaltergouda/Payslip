# SC Payout Split

> Fair profit distribution and settlement transfers for Star Citizen crew operations

## Product Positioning

**SC Payout Split** is a calculator for crew-based revenue splitting in Star Citizen. It helps crews fairly distribute profits from shared operations, calculate individual payouts, and facilitate settlement transfers with accurate tax gross-up handling.

**What it does:**
- Calculates fair profit distribution across crew members
- Generates detailed payslip-style receipts with breakdown
- Computes settlement transfers with tax gross-up (fee adjustment)
- Manages multi-member revenue and expense tracking
- Creates shareable read-only session links for transparency

**What it doesn't do:**
- Doesn't integrate with Star Citizen game servers (calculations only)
- Doesn't persist data automatically (you control session storage)
- Isn't a real-time ledger system (designed for end-of-session settlements)

## Core Capabilities

✅ **Multi-Member Revenue Tracking** – Support for unlimited crew members with individual revenue and investment tracking

✅ **Three Distribution Modes** – EQUAL (split evenly), PERCENT (by percentage share), or ADJUSTABLE (fixed payouts + bonuses)

✅ **Expense Management** – Track both shared and individual expenses; shared costs are allocated fairly across participants

✅ **Tax Gross-Up Calculation** – Automatically calculates transfer amounts accounting for transaction fees, ensuring members receive their correct net payout

✅ **Payslip Generation** – Format results as detailed payslip receipts with profit breakdown, transfers, and settlement details

✅ **Share & Export** – Generate read-only shareable links for transparency, export calculations as JSON

✅ **Validation** – Schema validation ensures data integrity throughout calculations

## Quick Start

### Installation & Setup

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build
```

### Run Tests

```bash
# Unit tests (Vitest)
npm test

# E2E tests (Playwright)
npm run test:e2e

# Watch mode for development
npm run test:watch
```

### Live Demo

Visit the deployed application: [TBD – GitHub Pages link coming soon]

## Operational Info

### Development Process

- **Code Review**: Pull requests are reviewed with GitHub Copilot assistance ([copilot-instructions.md](./.github/copilot-instructions.md))
- **Security Checks**: Automated CodeQL scanning on all PRs
- **Linting**: TypeScript + ESLint validation before commits

### Deployment

- **Hosting**: GitHub Pages (deployment workflow pending)
- **Database**: PostgreSQL via Prisma ORM
- **Automatic Updates**: Dependabot monitors dependencies and proposes security updates

### Verify Your Setup

```bash
# Run the full verification suite
npm run check
```

## Community & Contributing

### Get Involved

- **Want to contribute?** See [CONTRIBUTING.md](./CONTRIBUTING.md) (coming soon) for guidelines
- **Found a security issue?** Please report it privately via [SECURITY.md](./SECURITY.md)
- **Have questions?** Check [ARCHITECTURE.md](./ARCHITECTURE.md) for technical deep-dive

### Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

### Support Channels

- **Issues & Bugs**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: GitHub Discussions for questions and ideas (coming soon)
- **Security**: See [SECURITY.md](./SECURITY.md) for vulnerability disclosure

## Trust Signals

✅ **Automated Security Scanning** – CodeQL runs on every pull request to catch vulnerabilities

✅ **Dependency Monitoring** – Dependabot tracks and updates dependencies, proposing security patches automatically

✅ **Push Protection** – Secret scanning enabled to prevent credentials in repository history

✅ **Type Safety** – Full TypeScript codebase with strict type checking

✅ **Comprehensive Testing** – Unit tests (Vitest) + E2E tests (Playwright) ensure reliability

✅ **Open Source** – MIT License, code transparency, community-driven

---

**Project Status**: Alpha (Active Development)
**License**: MIT
**Tech Stack**: Next.js 14 • React 18 • TypeScript • Prisma • Zod
