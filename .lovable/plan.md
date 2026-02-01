
# Comprehensive Audit & Improvement Plan for Leafnode

## Executive Summary

This audit covers Frontend, Backend, UX/UI, Legacy Code, Cover Art, Supabase, and Resend integrations. I've identified **42 issues** ranging from critical bugs to polish opportunities, organized into actionable phases.

---

## PART 1: CRITICAL ISSUES (Must Fix)

### 1.1 Book Cover Art - Still Broken (Priority: CRITICAL)

**Current State:**
- 196 total film adaptations (excluding originals)
- 100 have covers cached to Supabase storage (working)
- **94 still have external URLs** (Google Books/OpenLibrary) that can break
- 2 have completely missing covers

**Root Cause Analysis:**
The `enrich-film-book-covers` function runs but doesn't re-process films that already have an external URL. The `FilmBookCover` component provides a live fallback, but the enrichment isn't caching these successful live fetches back to the database.

**Resolution Plan:**
1. Update `enrich-film-book-covers` to also process films with **external** URLs (not just null)
2. Add a "force re-cache all" mode for the enrichment function
3. Improve the `FilmBookCover` component to update the database after a successful live fetch
4. Create an admin "Cover Health" dashboard showing cache status

### 1.2 Cache-Image Edge Function Bug (Priority: HIGH)

**Issue:** Edge function logs show errors with relative URLs:
```
Error: TypeError: Invalid URL: '/scripts/pkd-religious-experience/page-1.webp'
```

**Cause:** The `imageCacheService.ts` is passing relative paths to the edge function instead of absolute URLs.

**Fix:** Add URL validation in both the client service and edge function to reject non-absolute URLs.

### 1.3 Security Linter Warnings (Priority: HIGH)

**Database Linter Found:**
- 2 extensions in public schema (should be in dedicated schema)
- **7 overly permissive RLS policies** with `USING (true)` on INSERT/UPDATE/DELETE

**Tables Affected:** Need to identify which tables have these policies and tighten them to require `auth.uid()`.

---

## PART 2: LEGACY CODE CLEANUP

### 2.1 Criterion Collection References Still Present

**Despite the cleanup, these files still reference Criterion:**

| File | Issue |
|------|-------|
| `supabase/functions/populate-verified-sf-films/index.ts` | Contains `CRITERION_SF_FILMS` array and `criterionUrl` references |
| `supabase/functions/ai-film-recommendations/index.ts` | Calls deleted `enrich-criterion-links` function |
| `src/integrations/supabase/types.ts` | Contains `criterion_films` table type and `criterion_*` columns |

**Database Legacy:**
- `criterion_films` table still exists (should be dropped or migrated)
- `sf_film_adaptations` still has `criterion_spine`, `criterion_url`, `is_criterion_collection` columns

**Action:** Complete the Criterion cleanup by:
1. Removing references from edge functions
2. Dropping the `criterion_films` table
3. Removing unused columns from `sf_film_adaptations`

### 2.2 ThreadMap Route Contradiction

**Issue:** The route `/thread-map` redirects to `/book-browser`, but:
- `ThreadMap.tsx` page component still exists
- Newsletter email template links to `https://leafnode.co.uk/thread-map`

**Fix:** 
1. Delete `src/pages/ThreadMap.tsx` 
2. Update email templates to use `/book-browser`

### 2.3 Copyright Year in Footer

Footer shows "© 2025" but current date is February 2026. Update to "© 2026".

---

## PART 3: BACKEND IMPROVEMENTS

### 3.1 Edge Function Audit Summary

| Function | Status | Issue |
|----------|--------|-------|
| `enrich-film-book-covers` | ⚠️ Partial | Doesn't re-process external URLs |
| `enrich-film-artwork` | ✅ Working | N/A |
| `enrich-trailer-urls` | ✅ Working | N/A |
| `enrich-author-data` | ✅ Working | N/A |
| `enrich-director-data` | ✅ Working | N/A |
| `cache-image` | ⚠️ Bug | Crashes on relative URLs |
| `ai-film-recommendations` | ⚠️ Legacy | References deleted function |
| `populate-verified-sf-films` | ⚠️ Legacy | Criterion references |
| `newsletter-subscribe` | ✅ Working | N/A |
| `auth-confirmation-email` | ✅ Working | N/A |

### 3.2 Resend Email Integration

**Current Implementation:**
- Welcome emails on signup (working)
- Newsletter subscription emails (working)
- Engagement emails for returning subscribers (working)

**Improvements:**
1. Add email delivery monitoring/logging
2. Update email templates to use correct routes
3. Add retry logic for failed sends

### 3.3 Supabase Storage Bucket Configuration

**Current Buckets:**
- `avatars` (public) - ✅
- `book-covers` (public) - ✅ 
- `user-uploads` (private) - ✅

**Issue:** Need to verify RLS policies on storage.objects table.

---

## PART 4: FRONTEND IMPROVEMENTS

### 4.1 Component Cleanup

| Component | Status | Action |
|-----------|--------|--------|
| `src/pages/ThreadMap.tsx` | Unused | Delete |
| `src/components/BookCoverWithFallback.tsx` | Deleted in prev session | Already removed |
| `AdminExternalLinksPanel.tsx` | Deleted | Already removed |

### 4.2 Image Loading Improvements

**Current Flow:**
```
FilmBookCover → Try stored URL → Live Google Books → Cache in background
```

**Improvement:** Add database write-back when live fetch succeeds:
```
FilmBookCover → Try stored URL → Live Google Books → Update database → Cache
```

### 4.3 Console Warning

```
cdn.tailwindcss.com should not be used in production
```

**Action:** Remove CDN Tailwind reference from `index.html` if present (using PostCSS already).

---

## PART 5: UX/UI POLISH

### 5.1 Missing Accessibility

- Some buttons lack `aria-label`
- Focus states could be more visible on mobile
- Skip-to-content link exists ✅

### 5.2 Loading States

All loading states are consistent with the "establishing connection" pattern.

### 5.3 Empty States

Empty states exist and are informative.

### 5.4 Mobile Responsiveness

Previous optimizations applied. Key patterns maintained:
- `px-3 sm:px-6` for padding
- `text-xl sm:text-3xl` for headings
- `min-h-44px` for touch targets

---

## PART 6: DATABASE IMPROVEMENTS

### 6.1 Tables to Clean Up

| Table | Status | Action |
|-------|--------|--------|
| `criterion_films` | Unused | DROP TABLE |
| `admin_data_events` | Check usage | Possibly legacy |
| `admin_jobs_log` | Check usage | Possibly legacy |

### 6.2 Columns to Remove from `sf_film_adaptations`

- `criterion_spine`
- `criterion_spine_number`
- `criterion_url`
- `is_criterion_collection`

### 6.3 Index Optimization

Consider adding indexes for frequently queried fields:
- `sf_film_adaptations.book_cover_url` (for null checks in enrichment)
- `cached_images.original_url` (for cache lookups)

---

## IMPLEMENTATION PHASES

### Phase 1: Critical Fixes (Week 1)
1. Fix `enrich-film-book-covers` to re-cache external URLs
2. Fix `cache-image` relative URL bug  
3. Run enrichment on all 94 films with external URLs
4. Update `FilmBookCover` to write back successful live fetches

### Phase 2: Legacy Cleanup (Week 1-2)
1. Remove Criterion references from edge functions
2. Delete `ThreadMap.tsx` and update email templates
3. Drop `criterion_films` table
4. Remove unused columns from `sf_film_adaptations`
5. Update copyright year in Footer

### Phase 3: Security Hardening (Week 2)
1. Review and tighten RLS policies with `USING (true)`
2. Move extensions from public schema
3. Audit storage bucket policies

### Phase 4: Backend Optimization (Week 2-3)
1. Add monitoring/logging to Resend emails
2. Create "Cover Health" admin dashboard
3. Add retry logic to enrichment functions
4. Clean up unused database tables

### Phase 5: Frontend Polish (Week 3)
1. Remove CDN Tailwind warning
2. Improve accessibility labels
3. Add database write-back to `FilmBookCover`
4. Final testing across all pages

### Phase 6: Documentation & Monitoring (Week 4)
1. Create enrichment runbook
2. Set up alerts for enrichment failures
3. Document architecture decisions
4. Final QA pass

---

## SUCCESS METRICS

| Metric | Current | Target |
|--------|---------|--------|
| Films with cached covers | 100/196 (51%) | 194/196 (99%) |
| Security linter warnings | 9 | 0-2 |
| Legacy Criterion references | 8+ files | 0 |
| Console errors | 1 | 0 |
| Email delivery rate | Unknown | Track & report |

---

## FILES TO MODIFY

**Delete:**
- `src/pages/ThreadMap.tsx`

**Major Updates:**
- `supabase/functions/enrich-film-book-covers/index.ts`
- `supabase/functions/cache-image/index.ts`
- `supabase/functions/ai-film-recommendations/index.ts`
- `supabase/functions/populate-verified-sf-films/index.ts`
- `supabase/functions/newsletter-subscribe/_templates/already-subscribed-email.tsx`
- `src/components/FilmBookCover.tsx`
- `src/services/imageCacheService.ts`
- `src/components/Footer.tsx`

**Database Migrations:**
- Drop `criterion_films` table
- Remove Criterion columns from `sf_film_adaptations`
- Review/fix RLS policies
