# SMD Development Notes

## Quick Start
```bash
npm install
npm run dev
```

## Supabase Setup Checklist
- [ ] Create Supabase project
- [ ] Run migration SQL (supabase/migrations/001_init_schema.sql)
- [ ] Copy project URL & anon key to .env.local
- [ ] Enable Google OAuth (optional)
- [ ] Test RLS policies by creating test user

## Module Status

### ✅ Phase 1 - MVP (Complete)
- [x] Auth (login/register/OAuth)
- [x] Dashboard overview
- [x] Time management (activity tracker)
- [x] Task management (Eisenhower matrix)
- [x] Finance management (transactions + alerts)
- [x] Habit tracking (streaks)
- [x] Goals & milestones
- [x] Notes (search)
- [x] Projects
- [x] Journal
- [x] AI assistant (UI only, mock responses)

### ⏳ Phase 2 - Next Steps
- [ ] Pattern detection engine
- [ ] Schedule conflict resolver
- [ ] Budget recommendations
- [ ] Realtime notifications

### 🔮 Future (Phase 3+)
- [ ] Real AI integration (requires API key budget)
- [ ] Mobile responsive optimization
- [ ] Data export/import
- [ ] Multi-language support

## Known Simplifications (Ponytail Comments)

1. **AI Assistant** - Mock responses only. Real integration needs:
   - API key (Anthropic/OpenAI)
   - Context aggregation from all tables
   - Prompt engineering for personalized advice

2. **Pattern Detection** - Rule-based only (type: positive/negative). Upgrade to ML when dataset is large enough.

3. **Conflict Resolver** - Manual resolution. Auto-prioritization needs scoring algorithm.

4. **Budget Alerts** - Simple threshold (80% of avg daily). Could be smarter with ML.

5. **Search** - Postgres tsvector (English only). Works for MVP, consider multilingual later.

## Database Maintenance

### Indexes Created
- All user_id columns (for RLS filtering)
- Timestamp columns (activities.start_time, transactions.transaction_date)
- Full-text search (notes.search_vector)

### No Backup Yet
Supabase free tier has daily backups, but no export implemented. Add CSV export when needed.

## Performance Notes

- Supabase free tier: 2 concurrent connections max
- No pagination yet (LIMIT 20-50 everywhere)
- Add pagination when lists grow >100 items
- Realtime subscriptions limited to critical modules (activities only)

## Security Checklist
- [x] RLS policies on all tables
- [x] Auth middleware for protected routes
- [x] API routes check user auth
- [ ] Input validation (currently client-side only)
- [ ] Rate limiting (not implemented, rely on Vercel/Supabase defaults)

## Deployment Notes

### Vercel
- Set env vars in dashboard
- Auto-deploy from main branch
- Build time ~2min

### Supabase
- Project pauses after 7 days inactivity
- Wake-up time ~10s first request
- Consider upgrading if daily active use

---

Last updated: 2026-09-12
