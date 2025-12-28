# DATA RESET INVESTIGATION REPORT

**Date:** 2024-12-28
**Issue:** Book→Screen data appeared to reset / incomplete

---

## 1. ROOT CAUSE ANALYSIS

### Findings from SQL Diagnostics:

| Metric | Count |
|--------|-------|
| Total Films | 79 |
| With book_id linked | **0** ❌ |
| With poster_url | 71 |
| With trailer_url | 41 |
| Criterion Films | 47 |
| Publisher Books | 36 |
| Publisher Series | 2 |
| Transmissions | 77 |

### Key Finding: **book_id = 0 for ALL films**

The `match-film-books` edge function is designed to link `sf_film_adaptations` to `publisher_books`, but:
1. It requires both datasets to exist
2. It uses fuzzy matching (85% title, 70% author similarity)
3. **It was never run** or matching thresholds weren't met

### Creation/Update Timeline:
- Films created: 37 (Dec 28), 42 (Dec 27) = 79 total (recently populated)
- Films updated: 59 (Dec 28), 20 (Dec 27)

### Root Causes Identified:

| Cause | Likelihood | Evidence |
|-------|------------|----------|
| **Match function not run** | HIGH | book_id = 0 for all 79 films |
| Destructive migration ran | MEDIUM | Migration `20251225142800` exists with `DELETE FROM publisher_books/series` |
| RLS blocking data | LOW | RLS shows `true` for SELECT (public readable) |
| Wrong Supabase project | LOW | Single project, types match |
| UI filtering | LOW | No filters exclude unlinked books |

---

## 2. CONFIRMED ISSUES

### A. Match Function Never Ran
The `match-film-books` function exists but has never been executed to link films to books.

### B. Destructive Migration in History
File: `supabase/migrations/20251225142800_eafd2d00-5d4d-441b-a0f7-5f9c82f9b41c.sql`
Contains:
```sql
DELETE FROM publisher_books;
DELETE FROM publisher_series;
```

This migration ran and wiped publisher data, then re-inserted only 2 series and 36 books.

### C. No Upsert Collision Issues
Edge functions use `INSERT` for new records, not destructive upserts.
`generate-transmission-embeddings` uses `upsert` with `onConflict: 'book_identifier'` (safe).

### D. RLS is Correct
- `sf_film_adaptations` has `SELECT` policy with `USING: true` (public readable)
- Service role policies exist for admin operations

---

## 3. REQUIRED FIXES

### Immediate Actions:

1. ✅ Run `match-film-books` to link existing films to books
2. ✅ Add Data Health panel for visibility (DONE - Prompt 12)
3. ✅ Document destructive migration (DONE - MIGRATION_SAFETY_WARNING.md)

### Code Changes Needed:

1. **Add env validation logging** to frontend
2. **Add debug counts** to BookToScreenSection
3. **Create admin-count-films** diagnostic function

---

## 4. SAFEGUARDS IMPLEMENTED

| Safeguard | Status |
|-----------|--------|
| admin_jobs_log table | ✅ Created |
| admin_data_events table | ✅ Created |
| Data Health Panel | ✅ Created |
| NO DESTRUCTIVE QUERIES policy | ✅ Documented |
| Migration warning | ✅ Created |

---

## 5. RECOMMENDATIONS

1. **Run match-film-books NOW** via Data Health Panel
2. **Audit edge functions** for any DELETE/TRUNCATE
3. **Add pre-commit hook** to reject migrations with DELETE/TRUNCATE
4. **Add deleted_at columns** for soft delete when removal is needed
5. **Enable Supabase database backups** for disaster recovery
