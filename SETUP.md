# Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- Supabase account (free tier)
- Vercel account (optional, for deployment)

## Setup Steps (15 minutes)

### 1. Install Dependencies
```bash
cd smd
npm install
```

### 2. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Set name: `smd` (or any name)
4. Set database password (save it!)
5. Wait ~2 minutes for provisioning

### 3. Run Database Migration
1. In Supabase dashboard, go to SQL Editor
2. Click "New Query"
3. Copy entire content from `supabase/migrations/001_init_schema.sql`
4. Paste and click "Run"
5. Verify success (should see "Success. No rows returned")

### 4. Get API Keys
1. In Supabase dashboard, go to Settings > API
2. Copy "Project URL" 
3. Copy "anon public" key
4. Copy "service_role" key (optional, for admin operations)

### 5. Configure Environment
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 6. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Create First User
1. Click "Daftar" (Register)
2. Enter email + password
3. Check Supabase Auth > Users to verify

### 8. Test Modules
- Dashboard: Should show 0 for all stats
- Time: Start an activity, stop it
- Tasks: Create a task, mark done
- Finance: Add expense, see alert trigger
- Habits: Create habit, log completion
- etc.

## Optional: Google OAuth

1. In Supabase dashboard: Authentication > Providers
2. Enable Google
3. Follow Supabase instructions to create Google OAuth app
4. Add authorized redirect: `https://your-project.supabase.co/auth/v1/callback`

## Optional: Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel
```

Or connect GitHub repo to Vercel dashboard for auto-deploy.

Set environment variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Troubleshooting

### Error: "Failed to fetch"
- Check Supabase URL is correct
- Verify API keys match your project

### Error: "Row Level Security policy violation"
- Run migration again
- Check RLS policies exist: `SELECT * FROM pg_policies;`

### Auth not working
- Clear browser cookies
- Check middleware.ts is present
- Verify Supabase Auth is enabled

### Google OAuth fails
- Check redirect URL matches Supabase settings
- Verify OAuth app credentials are correct

## Free Tier Limits

**Supabase**:
- 500MB database storage
- 1GB file storage
- 2GB bandwidth/month
- Project pauses after 7 days inactivity

**Vercel**:
- Unlimited personal projects
- 100GB bandwidth/month
- Serverless function: 10s timeout

## Next Actions

1. Use app daily for 2 weeks (dogfooding)
2. Note bugs/UX issues
3. Decide on Phase 2 features
4. Consider paid tier if hitting limits

---

Need help? Check DEVELOPMENT.md for technical details.
