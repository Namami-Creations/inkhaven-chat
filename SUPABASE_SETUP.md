# Supabase Setup Guide

## 1. Create Supabase Project
1. Go to https://supabase.com
2. Create a new project
3. Note your project URL and anon key

## 2. Run Database Migration
Execute the following SQL in your Supabase SQL editor:

```sql
-- Copy contents from lib/supabase-schema.sql
-- Then copy contents from lib/supabase-rls-policies.sql
```

## 3. Configure Environment Variables
Update your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 4. Enable PayPal Integration (Optional)
```bash
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENVIRONMENT=sandbox  # or production
```

## 5. AI Services Setup (Optional)
```bash
OPENAI_API_KEY=your_openai_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
```
