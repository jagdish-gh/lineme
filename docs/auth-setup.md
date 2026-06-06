# Creator authentication setup

Line creators use Supabase Auth. Visitors can join lines without an account.

## Environment

Copy `.env.example` to `.env.local` and set:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## Supabase dashboard

1. Open Authentication > Sign In / Providers > Google.
2. Copy the Supabase callback URL shown on that page. It has this format:

```text
https://your-project-ref.supabase.co/auth/v1/callback
```

3. In Google Cloud, create a Web OAuth client and add that exact Supabase URL
   under Authorized redirect URIs.
4. Copy the Google client ID and client secret into the Supabase Google provider,
   enable the provider, and save it.
5. Keep email sign-in enabled for magic links.
6. In Authentication > URL Configuration, set the production Site URL and add
   the application callback URLs:

```text
http://localhost:3000/auth/callback
https://your-domain.com/auth/callback
```

The Google Cloud redirect URI points to Supabase (`/auth/v1/callback`). The URLs
in the Supabase redirect allow-list point back to this application
(`/auth/callback`).

The create-line draft is stored in session storage before sign-in. After authentication,
the callback restores the creator to the localized create-line flow.

## Create-line database

Before creating a line, apply this migration in the Supabase SQL Editor:

```text
supabase/migrations/202606060001_create_lines.sql
```

Run the complete file as one query. It creates the line tables, row-level security
policies, and the `public.create_line` database function used by the application.
