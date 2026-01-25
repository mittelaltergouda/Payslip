# Security Policy

Security is a priority for **SC Payslip**.  
If you discover a vulnerability, please report it responsibly so we can fix it quickly and protect users.

---

## Supported Versions

This repository is maintained on a best-effort basis.

In general, we support:
- The **default branch** (`master`)
- The **latest release**, if releases are published

If you're unsure whether your version is supported, please report the issue anyway.

---

## Reporting a Vulnerability (Responsible Disclosure)

### ❗ Please do NOT open a public GitHub Issue
Security reports should not be shared publicly because they could be abused before a fix is available.

### ✅ Preferred reporting method: GitHub Private Vulnerability Reporting
1. Go to this repository on GitHub
2. Click **Security**
3. Click **Report a vulnerability** (or use **Security advisories**)
4. Submit a private report

---

## What to Include in Your Report

Please provide as much information as possible:

- **Summary** of the vulnerability
- **Impact** (what can be exploited / what is the worst case)
- **Affected area** (file, endpoint, feature, dependency, etc.)
- **Steps to reproduce**
- **Proof of Concept (PoC)** if safe and minimal
- Any **logs/screenshots** that help investigation (remove sensitive data)
- If you have one: a **suggested fix or mitigation**

### Important: Do not include real secrets
Do **not** share API keys, tokens, passwords, session cookies, or private URLs in the report.  
If needed, use placeholders or redacted examples.

---

## Response Process

We aim to follow this process:

1. **Acknowledgement**: we confirm the report was received  
2. **Triage**: we evaluate severity and scope  
3. **Fix**: we implement and test a patch  
4. **Release**: we publish the fix (and/or deploy it)
5. **Disclosure**: we coordinate public disclosure where appropriate

### Typical Response Times (Best Effort)
- Acknowledgement: **3–7 days**
- Triage update: **7–14 days**
- Fix timeline: depends on severity and complexity

---

## Security Automation in This Repository

This repository may use the following GitHub security features:

- **CodeQL (Code Scanning)** to detect common vulnerabilities
- **Dependabot alerts** and **security update PRs** for vulnerable dependencies
- **Secret scanning** and **push protection** to prevent accidental credential leaks
- **Copilot Autofix** (when CodeQL alerts exist) to suggest secure fixes

These tools help prevent vulnerabilities but do not guarantee full protection.

---

## Guidelines for Contributors

If you contribute code to this repository:

- Never commit secrets (tokens, credentials, API keys)
- Avoid introducing unnecessary dependencies
- Prefer minimal, well-scoped changes
- Keep PRs small and easy to review
- If your change affects security behavior, explain it clearly in the PR description

---

## Coordinated Disclosure

Please allow time to release a fix before sharing details publicly.  
We appreciate coordinated disclosure and will credit reporters when appropriate (if requested).

---

Thank you for helping keep **SC Payslip** secure 🙏
