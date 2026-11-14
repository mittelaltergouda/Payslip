# Contributing to SC Payslip

Thank you for your interest in contributing to **SC Payslip**! This guide will help you understand how to set up your development environment, follow our workflow, and submit pull requests that pass CI checks.

Whether you're fixing a bug, adding a feature, or improving documentation, we appreciate your help. Please read this guide to ensure a smooth contribution process.

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later) — [Download here](https://nodejs.org/)
- **npm** (v9 or later) — comes with Node.js
- **Git** — [Install Git](https://git-scm.com/)

### Fork & Clone the Repository

For external contributors, we use a **fork-based workflow**:

1. **Fork this repository** on GitHub (click "Fork" at the top-right)
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/payslip.git
   cd payslip
   ```
3. **Add upstream remote** to stay in sync:
   ```bash
   git remote add upstream https://github.com/original-owner/payslip.git
   ```

### Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

### Sync Your Fork with Upstream

Before making changes, sync your local `main` branch with upstream:

```bash
git fetch upstream
git checkout main
git rebase upstream/main
```

---

## Branching & Commits

### Branch Naming Conventions

Create branches with a clear prefix and descriptive name:

- **Features:** `feat/short-description`
  - Example: `feat/add-export-csv`
- **Bug fixes:** `fix/short-description`
  - Example: `fix/handle-zero-member-sessions`
- **Documentation:** `docs/short-description`
  - Example: `docs/api-endpoint-examples`
- **Refactoring:** `refactor/short-description`
  - Example: `refactor/simplify-tax-calculation`

### Commit Messages

Write clear, concise commit messages:

```
<type>: <subject>

<body (optional)>
```

**Examples:**
```
fix: prevent rounding errors in tax calculations

When calculating transfer taxes with high rates,
floating-point precision issues could result in
incorrect transfer amounts. Now using proper
fixed-point arithmetic.
```

```
feat: add CSV export for payout reports
```

**Guidelines:**
- Use the imperative mood ("add" not "adds" or "added")
- Keep the subject line under 50 characters
- Reference issue numbers when applicable (`fixes #42`)
- Do not include secrets, API keys, or passwords

### Commit Size & PR Scope

Keep changes focused and reviewable:

- **Aim for small PRs** (under 400 lines of code when possible)
- **One feature or fix per PR** — avoid mixing unrelated changes
- **Break large features** into smaller, logical PRs
- Reviewers should understand the purpose in under 5 minutes

### Important: No Secrets in Commits

**Never commit:**
- API keys, tokens, or credentials
- Database passwords or connection strings
- Private URLs or internal configurations
- `.env` files (use `.env.example` instead)

This repository has **push protection** enabled. If you accidentally commit secrets, they will be blocked. If this happens:

1. Remove the secret from your code
2. Amend your commit and force-push (carefully, only to your branch):
   ```bash
   git add .
   git commit --amend --no-edit
   git push --force-with-lease origin your-branch-name
   ```
3. Or, create a new commit that removes the secret

---

## PR Expectations

### Before You Open a PR

1. **Test your changes locally:**
   ```bash
   npm run dev         # Start dev server
   npm test            # Run unit tests
   npm run test:e2e    # Run E2E tests
   npm run lint        # Check code style
   npm run check       # Run full verification
   ```

2. **Sync with upstream** to avoid merge conflicts:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

3. **Push to your fork:**
   ```bash
   git push origin your-branch-name
   ```

### Opening the PR

1. Go to the original repository and click **New Pull Request**
2. Select **Compare across forks**
3. Set base to `main` (target branch) and compare to your fork's branch
4. Fill in the PR title and description (see template below)

### PR Checklist Template

Use this checklist in your PR description:

```markdown
## Description
<!-- Brief summary of what this PR does -->

## Type of Change
- [ ] 🐛 Bug fix (non-breaking)
- [ ] ✨ New feature (non-breaking)
- [ ] 📚 Documentation
- [ ] ♻️ Refactoring (no behavior change)
- [ ] 🔄 Breaking change

## Testing
- [ ] Unit tests added/updated (`npm test`)
- [ ] E2E tests added/updated (`npm run test:e2e`)
- [ ] Manual testing completed
- [ ] All tests pass locally

## Code Quality
- [ ] Code follows project style guide
- [ ] No `console.log` or debug statements remain
- [ ] No secrets or sensitive data included
- [ ] TypeScript types are complete
- [ ] No new external dependencies added

## Verification
- [ ] Ran `npm run check` and passed
- [ ] Ran `npm run lint` and passed
- [ ] PR is focused (not mixing multiple features)
- [ ] Commit messages are clear and concise

## Related Issues
Closes #(issue number) <!-- if applicable -->
```

### Automated Checks

Your PR will be checked by:

- **CodeQL** — Scans for common security vulnerabilities
- **Copilot Autofix** — Suggests fixes for CodeQL alerts (optional)
- **Linting** — Enforces code style (ESLint, TypeScript)
- **Tests** — Verifies all unit and E2E tests pass
- **Build** — Ensures the project builds successfully

All checks must pass before merging.

### Review & Merge Process

1. **Maintainers will review** your PR within a few days
2. **Address feedback** by pushing additional commits to your branch
3. **Avoid force-pushing** during review (makes feedback hard to follow)
4. **Squash merge** — Your commits will be squashed into one on `main`

We use **squash merge** to keep commit history clean. Your individual commits will be preserved in the PR, but merged as a single commit to `main`.

---

## Dependencies

### Adding Dependencies

Before adding a new package:

1. **Ask first** — Open an issue or discussion to propose the dependency
2. **Justify the need** — Explain why it's necessary (less bloat = better)
3. **Check alternatives** — Are there lighter options?
4. **Get approval** — Maintainers will decide

### Dependabot

This repository uses **Dependabot** to automatically:

- Detect outdated dependencies
- Create PRs for security updates
- Suggest version upgrades

**Dependency update PRs:**
- Are created automatically by Dependabot
- Should be tested before merging
- May be batched or scheduled

**If you update dependencies manually:**

1. Run tests to ensure compatibility:
   ```bash
   npm install
   npm run check
   ```

2. Keep the `package-lock.json` commit separate from code changes

3. Document any breaking changes or migration steps

SC Payslip deliberately has no application API or database. Changes that add server-side persistence require a separate security and privacy review.

---

## Testing

### What Needs Testing?

✅ **Always test:**
- New business logic (calculations, data transforms)
- API endpoints and validation
- User interactions (forms, buttons, navigation)
- Edge cases (zero members, max values, errors)

### Running Tests

**Unit tests** (Vitest):
```bash
npm test              # Run once
npm run test:watch    # Run in watch mode
```

**E2E tests** (Playwright):
```bash
npm run test:e2e      # Run all E2E tests
```

**Code quality checks:**
```bash
npm run lint          # ESLint
npm run check         # Full verification
```

### Writing Tests

- **Test files:** Place alongside source files (e.g., `lib/calc.test.ts`)
- **Use Vitest** for unit tests
- **Use Playwright** for browser/user interaction tests
- **Cover edge cases:** zero values, large numbers, error conditions
- **Keep tests focused** — one assertion per test when possible

### Test Coverage

While we don't enforce strict coverage percentages, aim for:

- **Core calculation logic:** >80% coverage
- **API endpoints:** >70% coverage
- **UI components:** >50% coverage

Focus on **meaningful tests**, not line coverage numbers.

---

## Questions or Need Help?

- **Issues:** Open a GitHub Issue for bugs or feature requests
- **Discussions:** Use GitHub Discussions for questions or ideas
- **Code of Conduct:** See [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
- **Security:** See [`SECURITY.md`](./SECURITY.md) for vulnerability reporting

---

## Summary of Development Workflow

Here's a quick checklist for your contribution:

1. ✅ Fork and clone the repository
2. ✅ Create a branch with a clear name (`feat/`, `fix/`, `docs/`)
3. ✅ Make focused, well-tested changes
4. ✅ Run `npm run check` locally and fix issues
5. ✅ Write clear commit messages (no secrets!)
6. ✅ Push to your fork
7. ✅ Open a PR with a filled-in checklist
8. ✅ Address review feedback
9. ✅ Maintainers will squash-merge when ready

Thank you for contributing to **SC Payslip**! 🚀
