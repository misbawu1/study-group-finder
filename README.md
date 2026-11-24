# Study Circle

A student friendly study group finder with accounts, group discovery, membership, and realtime group chat. It uses one Next.js app plus Supabase for hosted authentication, Postgres, and Realtime.

The current app runs from the repository root. The earlier React/Express version is retained in `frontend/` and `backend/` for reference; Vercel should use the repository root for this rebuild.

## What you need

- Node.js 20.9 or newer
- A free Supabase account and project
- npm

Supabase's free tier currently includes a hosted Postgres database and Auth; free projects can pause after a week of inactivity. Review [Supabase's current plan details](https://supabase.com/pricing) before relying on it for a long-running demo.

## Start locally

1. Create a project at [supabase.com](https://supabase.com/).
2. In the project dashboard, open **SQL Editor**, paste in [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the tables, signup profile trigger, access policies, and chat Realtime publication.
3. In **Project Settings → API**, copy the Project URL and publishable (or anon) key.
4. Copy `.env.example` to `.env.local` and fill these values:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

5. In **Authentication → URL Configuration**, set the Site URL to `http://localhost:3000` while developing and add `http://localhost:3000/auth/callback` to Redirect URLs. Add the equivalent production callback URL after deployment.
6. Install and run:

   ```bash
   npm install
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000), create an account, then create a group. If email confirmation is enabled, confirm the email before signing in.

## Deploy for a class demo

Push this folder to a new GitHub repository and import it into Vercel. In Vercel project settings, add the same two `NEXT_PUBLIC_SUPABASE_*` values, then redeploy. Add the production URL in Supabase Authentication → URL Configuration. Vercel's and Supabase's free plans are enough for a small student project within their published limits.

## Keep it safe

- Never put a Supabase `service_role` or secret key in a `NEXT_PUBLIC_` variable or in this app.
- The browser uses the publishable/anon key; the row-level security policies in the SQL file control access.
- This starter lets any signed-in user browse and join any group. Only group members can read or send messages. Group owners can delete their groups through the database policy, though a delete button is not part of the starter UI yet.

## Features

- Email/password sign up and sign in
- Create groups and browse/search by name, subject, or description
- Join or leave groups
- Realtime group messages, protected so only members can read/send
- Responsive layout for desktop and mobile
