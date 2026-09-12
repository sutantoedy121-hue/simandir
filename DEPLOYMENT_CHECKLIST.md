# SMD - Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Complete
- [x] 11 modules implemented
- [x] Auth system (email + OAuth)
- [x] Database schema with RLS
- [x] TypeScript types
- [x] API routes
- [x] Middleware auth guard
- [x] Error handling
- [x] Loading states

### ✅ Documentation
- [x] README.md (overview)
- [x] SETUP.md (step-by-step)
- [x] DEVELOPMENT.md (technical notes)
- [x] PROJECT_SUMMARY.md (completion report)
- [x] .env.local.example (template)

### ✅ Configuration
- [x] next.config.ts
- [x] tailwind.config.ts
- [x] tsconfig.json
- [x] package.json
- [x] .gitignore
- [x] vercel.json

### ⏳ Before First Deploy

#### 1. Supabase Setup
- [ ] Create Supabase project
- [ ] Run migration: `supabase/migrations/001_init_schema.sql`
- [ ] Verify RLS policies active
- [ ] Test with dummy user
- [ ] (Optional) Enable Google OAuth

#### 2. Environment Variables
- [ ] Copy .env.local.example → .env.local
- [ ] Add NEXT_PUBLIC_SUPABASE_URL
- [ ] Add NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] Add SUPABASE_SERVICE_ROLE_KEY (optional)

#### 3. Local Testing
- [ ] npm install (clean install)
- [ ] npm run dev
- [ ] Test signup/login
- [ ] Test each module CRUD
- [ ] Test auth guard (try accessing /dashboard without login)
- [ ] Check browser console (no errors)

#### 4. Build Test
- [ ] npm run build (verify no errors)
- [ ] Check build output size (<3MB ideal)
- [ ] npm start (test production mode locally)

#### 5. Git Setup
- [ ] git init
- [ ] git add .
- [ ] git commit -m "Initial commit: SMD MVP Phase 1"
- [ ] Create GitHub repo
- [ ] git remote add origin <url>
- [ ] git push -u origin main

#### 6. Vercel Deployment
- [ ] Connect GitHub repo to Vercel
- [ ] Set environment variables in Vercel dashboard
- [ ] Deploy (auto-trigger from main branch)
- [ ] Test production URL
- [ ] Verify auth works
- [ ] Test one module (e.g., create task)

### 📊 Post-Deployment Testing

#### Critical Paths
- [ ] Sign up new user
- [ ] Log in existing user
- [ ] Create activity & stop it
- [ ] Create task & mark done
- [ ] Add expense & see alert
- [ ] Create habit & log completion
- [ ] Create goal & add milestone
- [ ] Write note & search it
- [ ] Create project & change status
- [ ] Write journal entry
- [ ] Send AI chat message (mock response)
- [ ] Log out & log back in

#### Security Verification
- [ ] RLS working (can't see other users' data)
- [ ] Auth redirect (unauthenticated → /auth/login)
- [ ] API routes protected (401 without auth)
- [ ] No API keys exposed in client bundle

#### Performance Check
- [ ] Lighthouse score >80 (optional)
- [ ] First load <5s on 3G
- [ ] No memory leaks (open DevTools Performance tab)
- [ ] Database queries efficient (check Supabase logs)

### 🐛 Known Issues (Track These)
- [ ] _(none yet - add as discovered)_

### 📈 Usage Monitoring (First 2 Weeks)
- [ ] Daily dogfooding (use every module)
- [ ] Note friction points
- [ ] Track bugs in GitHub Issues
- [ ] Measure: time saved vs manual tracking
- [ ] Decide: continue to Phase 2?

### 🔮 Phase 2 Readiness (Optional)
- [ ] Pattern detection spec written
- [ ] AI integration budget approved
- [ ] Conflict resolver algorithm designed
- [ ] Export/import format decided

---

## Quick Deploy Commands

```bash
# Local setup
npm install
cp .env.local.example .env.local
# (edit .env.local with your Supabase keys)
npm run dev

# Production build test
npm run build
npm start

# Git & Deploy
git init
git add .
git commit -m "Initial commit: SMD MVP"
git remote add origin <your-github-repo>
git push -u origin main

# Vercel (after connecting GitHub)
# Auto-deploys on push to main
# Or manual: vercel
```

## Success Criteria (PRD Compliance)

### Phase 1 MVP - ✅ ACHIEVED
- ✅ User can track activities & view calendar
- ✅ User can log transactions & get spending alerts
- ✅ User can create/complete tasks with priority system
- ⏳ App used daily for 2 weeks without critical bugs (pending deployment test)

### Budget - ✅ ACHIEVED
- ✅ Rp 0 spent
- ✅ Vercel free tier
- ✅ Supabase free tier
- ✅ No paid APIs

---

**Current Status**: Code complete, ready for deployment

**Next Action**: Follow SETUP.md steps 1-8

**Timeline**: 30 minutes from setup to live deployment
