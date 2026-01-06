# Database Migrations (Notes)

This workspace does **not** use an automated migration runner.

The current source of truth for the database is:

- `database/schema.sql`
- `database/storage-setup.sql`

Apply them with:

- Windows: `./scripts/apply-supabase-sql.ps1`
- Cross-platform: `node scripts/setup-supabase.js` (requires `psql`)

This `database/migrations/` folder may contain small historical SQL snippets (for example, a one-off change), but it is not wired into any script in this repo snapshot.