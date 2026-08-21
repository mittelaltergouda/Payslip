# Public local-only deployment

SC Payslip is deployed without server-side session persistence: application data remains in browser storage, and the public session/share APIs fail closed with HTTP 404. A cutover is safe only after confirming that any previous server-side session database is empty or has been archived outside the release directory.

## Cutover gate

Before enabling the local-only release:

1. Inspect the previous production database and count existing sessions.
2. If records exist, stop and export or archive them before replacing the application.
3. Do not copy a development database into the production artifact.
4. Verify the release and rollback directories contain no production database.
5. Confirm `GET /api/sessions` returns HTTP 404 after deployment.

The initial `payslip.cheesy.cloud` local-only deployment was explicitly created as a fresh instance. The deployed systemd unit has no `DATABASE_URL`, no writable application data directory, and the verified production and rollback artifacts contained no database files.
