# InkHaven Chat Scripts

This folder contains the scripts that are actually present and used in this workspace.

## Quick Start (Supabase)

Recommended (Windows, easiest):

```powershell
./scripts/apply-supabase-sql.ps1
```

Cross-platform (requires `psql` in PATH):

```bash
node scripts/setup-supabase.js
```

## What’s Here

### Supabase setup

- `apply-supabase-sql.ps1`: Applies `database/schema.sql` + `database/storage-setup.sql` via Supabase pooler.
- `setup-supabase.js`: Same goal as above, but Node-based and cross-platform.
- `run-schema.js`: Applies only `database/schema.sql` (requires DB password via `DATABASE_URL` or `PGPASSWORD`).
- `run-storage-setup.ps1` / `run-storage-setup.sql`: Applies only storage setup (advanced usage).
- `check-db.js`: Verifies required tables + buckets exist (uses service role key).

### Environment validation

- `validate-environment.js`: Checks required env vars for the current app (Supabase required; TURN/NextAuth optional).

### Misc

- `generate-icons.js`: Icon generation helper.
- `delete-bloat.ps1`: Cleanup helper.

### Payments (optional)

- `complete-paypal-setup.js`: Creates PayPal plans. Requires `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, optional `PAYPAL_ENVIRONMENT`.
- `create-razorpay-plans.js`: Creates Razorpay plans. Requires `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.

## Required Environment Variables (App)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional (but recommended for video reliability):

- `NEXT_PUBLIC_METERED_DOMAIN`
- `NEXT_PUBLIC_TURN_USERNAME`
- `NEXT_PUBLIC_TURN_CREDENTIAL`

Optional (only if you enable NextAuth flows):

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`