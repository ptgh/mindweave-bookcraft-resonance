
## What’s happening (root cause, based on the code + the specific “Do Androids…” case)

### 1) The “main page” card is not using the same cover source as the preview modal
- In the **grid/card view** (your screenshot with BOOK + FILM cards), the book cover is rendered by **`BookToScreenSection` → `FilmBookCover`**, passing only:
  - `storedCoverUrl={film.book_cover_url}`
- In the **preview modal**, cover art can come from **Apple Books / Google Books / Free ebook sources** (runtime lookups), so it often has “two cover options” even when the grid does not.

Result: the modal can “find” a cover that the grid never attempts (or never persists).

### 2) “Do Androids Dream of Electric Sheep?” specifically has a canonical cover available via `publisher_books`, but the grid doesn’t use it
In your DB, this title is *linked* (`sf_film_adaptations.book_id` is present). The linked `publisher_books` rows have a valid, reliable publisher cover URL (Gollancz).
But the card/grid code does not prioritize `publisher_books.cover_url` for linked records; it only uses `sf_film_adaptations.book_cover_url`.

So even when the canonical cover exists, the grid may still show:
- a missing URL,
- a stale URL,
- or a “valid image” that is actually a provider “image not available” placeholder.

### 3) There is also an outlier class caused by HTTP cover URLs (mixed content) in some parts of the app
`EnhancedBookCover` does an “immediate render” with the first URL it gets and **does not normalize `http://` → `https://`** before using it.
If any “missing cover” books are coming from `transmissions.cover_url` (which can be `http://books.google.com/...`), Safari/Chrome can block those images on an HTTPS site.

This produces “random” missing covers (outliers) even when the cover exists, because the URL is simply blocked.

---

## Goals (your constraints)
- Fix the **missing-cover outliers** without big refactors.
- Focus on cases like “Do Androids…” where there is clearly a good cover available but the grid shows none (or shows a placeholder).
- Make the grid consistently use the best existing cover source and only fall back to live lookups when needed.

---

## Implementation plan (minimal, targeted)

### A) Fix the linked-book canonical cover path (this should fix “Do Androids…”)
1. **Change the `sf_film_adaptations` fetch in `BookToScreenSection`** to include the linked `publisher_books.cover_url` in the same query (single request), using Supabase relational select.
   - We already fetch `book_id`; we should fetch `publisher_books(cover_url,isbn,title,author)` via the relationship.
2. **When mapping rows → `FilmAdaptation` objects**, compute an `effective_book_cover_url`:
   - Prefer `publisher_books.cover_url` when `book_id` exists.
   - Else fall back to `sf_film_adaptations.book_cover_url`.
3. **Pass that effective URL into `FilmBookCover`** instead of the raw `film.book_cover_url`.

Why this is minimal:
- No UI rewrite.
- No new components.
- One query tweak + one mapping tweak + one prop tweak.

Expected impact:
- Any adaptation that’s already linked (`book_id`) will immediately display the canonical publisher cover, even if `book_cover_url` is missing/bad.

---

### B) Fix mixed-content outliers for books rendered via `EnhancedBookCover`
1. In `EnhancedBookCover`, before the “IMMEDIATE RENDER” early return, normalize the first URL:
   - If it’s `http://` and from known-safe providers (Google Books, googleusercontent, OpenLibrary, TMDB), upgrade to `https://`.
2. Apply the same normalization when building fallbacks (it already adds https variants, but the immediate-return path bypasses validation).

Why this matters:
- This addresses the “some books are missing covers but most are fine” pattern that is typical of mixed-content URL storage.

Expected impact:
- Any transmissions/books that still store old `http://books.google.com/...` URLs will start rendering reliably.

---

### C) Add a “last-mile” fallback for the few remaining outliers (only when needed)
This is for books that:
- are **not linked** (`book_id` missing), and
- have missing/invalid `book_cover_url`, and
- Google Books search sometimes yields no usable art (or yields “image not available”).

Minimal enhancement (kept strictly to outliers):
1. Extend `FilmBookCover` to accept an optional `filmId` prop (or `adaptationId`) from `BookToScreenSection`.
2. If stages fail (stored URL fails + Google Books fails), optionally try **Apple Books search** (re-using existing `searchAppleBooks`) **only in this failure path**.
3. When Apple Books yields a cover:
   - render it,
   - `requestImageCache(coverUrl, 'book')`,
   - write back to `sf_film_adaptations` using the **film adaptation ID** (more precise than title/author matching).
     - This requires a very small update to `filmCoverWritebackService` to support “update by adaptation id” (or a tiny new function just for this).

Why this is still “not major”:
- Apple Books calls only occur for items already failing everything else.
- The write-back is narrowly scoped and improves the dataset so the fix becomes permanent.

---

## Data-side verification (important because Test vs Live DB can differ)
To ensure we’re fixing the real thing you’re seeing on the published site:
1. Check the **Live** database row for the specific adaptation(s) showing missing cover:
   - Is `sf_film_adaptations.book_id` present?
   - Is `publisher_books.cover_url` present?
   - What is `sf_film_adaptations.book_cover_url` currently set to?
2. If `book_id` exists and `publisher_books.cover_url` is good, plan A alone fixes the UI without needing more enrichment.
3. If `book_id` is missing, the “Cache External” / enrichment pipeline is the right long-term fix; plan C handles the remaining outliers at runtime and persists the improvement.

---

## Testing checklist (focused on your screenshots)
1. On the published site, open the BOOK+FILM grid and confirm:
   - “Do Androids Dream of Electric Sheep?” shows the publisher cover (not “image not available”).
2. Confirm the preview modal still works and does not regress.
3. Spot-check a handful of other previously missing covers:
   - one that’s linked (`book_id` present),
   - one that’s unlinked (`book_id` null),
   - one known to have `http://books.google.com/...` in `transmissions.cover_url` (should now render).
4. Confirm no noticeable performance regression on mobile:
   - Apple Books fallback should only trigger for truly missing items.

---

## Deliverables (what I will change once you approve)
- `src/components/BookToScreenSection.tsx`
  - relational select for `publisher_books.cover_url`
  - compute & use an “effective” cover URL for the grid
  - pass optional `filmId` to `FilmBookCover` (if we do plan C)
- `src/components/FilmBookCover.tsx`
  - optionally accept `filmId`
  - only-if-needed Apple Books fallback (optional, for outliers)
  - precise writeback using adaptation id (via service)
- `src/components/EnhancedBookCover.tsx`
  - normalize HTTP → HTTPS for known providers in the immediate-render path

No schema changes. No storing images in DB. Only URLs and caching to storage.

---

## One critical clarification (affects where we validate)
Because Lovable has separate **Test** and **Live** environments, the most common reason we “keep looking at this” is:
- the dataset looks fixed in Test, but the published site is reading Live where those rows still have old URLs.

When implementing, we’ll verify the fix against the same environment you’re observing (published URL / Live DB).
