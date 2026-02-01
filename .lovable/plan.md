
# Comprehensive Audit & Improvement Plan for Leafnode

## Executive Summary

This audit covers Frontend, Backend, UX/UI, Legacy Code, Cover Art, Supabase, and Resend integrations. Original audit identified **42 issues** ranging from critical bugs to polish opportunities.

---

## ✅ COMPLETED FIXES (Phase 1 & 2)

### 1. Cache-Image Relative URL Bug - FIXED
- Added URL validation in `imageCacheService.ts` to reject non-absolute URLs
- Added server-side validation in `cache-image/index.ts` edge function
- Error message now clearly states "Only absolute URLs (http/https) can be cached"

### 2. Legacy Criterion Collection Cleanup - FIXED
- Updated `ai-film-recommendations/index.ts` to remove `enrich-criterion-links` reference
- Replaced enrichment triggers with `enrich-film-book-covers`
- Removed `is_criterion_collection: false` from inserts
- Rewrote `populate-verified-sf-films/index.ts` to remove all Criterion-specific code
- Renamed array from `CRITERION_SF_FILMS` to `VERIFIED_SF_FILMS`

### 3. ThreadMap Route - FIXED
- Deleted `src/pages/ThreadMap.tsx` (legacy component)
- Route `/thread-map` already redirects to `/book-browser` in App.tsx
- Updated `already-subscribed-email.tsx` to use `/book-browser` instead of `/thread-map`

### 4. Footer Copyright Year - FIXED
- Updated from "© 2025" to "© 2026"

### 5. Email Template Links - FIXED
- Changed `https://leafnode.co.uk/thread-map` to `https://leafnode.co.uk/book-browser`

---

## 🔄 STILL PENDING

### 1. Book Cover Art (94 films with external URLs)
The `enrich-film-book-covers` function already processes external URLs - no code changes needed.
**Action Required**: Run the enrichment function from Admin panel to cache all external URLs.

### 2. Database Migration (Phase 3)
These require Supabase migrations (user approval):
- Drop `criterion_films` table
- Remove columns from `sf_film_adaptations`:
  - `criterion_spine`
  - `criterion_spine_number` 
  - `criterion_url`
  - `is_criterion_collection`

### 3. Security RLS Policies (Phase 3)
Run the database linter and tighten overly permissive policies.

### 4. FilmBookCover Database Write-back (Phase 4)
Currently, successful live fetches are cached but not written back to `sf_film_adaptations.book_cover_url`.
This optimization would reduce API calls on subsequent loads.

---

## FILES MODIFIED

| File | Change |
|------|--------|
| `src/services/imageCacheService.ts` | Added `isAbsoluteUrl` validation |
| `supabase/functions/cache-image/index.ts` | Added server-side URL validation |
| `supabase/functions/ai-film-recommendations/index.ts` | Removed Criterion references |
| `supabase/functions/populate-verified-sf-films/index.ts` | Complete rewrite - removed Criterion |
| `supabase/functions/newsletter-subscribe/_templates/already-subscribed-email.tsx` | Fixed route |
| `src/components/Footer.tsx` | Updated copyright year to 2026 |

## FILES DELETED

| File | Reason |
|------|--------|
| `src/pages/ThreadMap.tsx` | Legacy route - redirects to /book-browser |

---

## SUCCESS METRICS UPDATE

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Cache-image crashes | Yes | No | ✅ Fixed |
| Legacy Criterion references | 8+ files | 0 | ✅ Fixed |
| Console errors | 1 | 0 | ✅ Fixed |
| Footer year correct | No | Yes | ✅ Fixed |
| Email routes correct | No | Yes | ✅ Fixed |
| Films with cached covers | 100/196 | Pending enrichment run | 194/196 |
| Security linter warnings | 9 | Pending | 0-2 |

---

## NEXT STEPS

1. **Run Enrichment**: Go to Admin > Enrichment and run "Enrich Book Covers" to cache remaining 94 external URLs
2. **Database Migration**: Create migration to drop Criterion columns/tables (optional cleanup)
3. **Security Review**: Run database linter and address RLS policy warnings
4. **Test Deployment**: Verify all changes work in production

---

## ARCHITECTURE NOTES

### Image Caching Flow
```
User views film grid
  → FilmBookCover tries stored URL
  → If external URL fails, searches Google Books API
  → Successful fetch queued for caching
  → cache-image edge function downloads & stores in Supabase
  → cached_images table tracks original → cached URL mapping
```

### Enrichment Pipeline
```
Admin triggers enrichment
  → enrich-film-book-covers fetches films with NULL or external URLs
  → For each film: Google Books → OpenLibrary → Cache to storage
  → Updates sf_film_adaptations.book_cover_url with Supabase URL
```
