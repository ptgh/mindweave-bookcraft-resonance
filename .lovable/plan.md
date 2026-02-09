

## Plan: Fix Thematic Search Spotlight + Signal Archive Search Dropdown Overlay

### Issue 1: Search dropdown not overlaying correctly on Signal Archive

**Problem**: The search suggestions dropdown in `BookBrowserHeader.tsx` uses `position: absolute; z-index: 50` but the book cards rendered below in the DOM naturally paint over it. The parent container (`max-w-md mx-auto mb-6 relative`) constrains the stacking context.

**Fix** (in `src/components/BookBrowserHeader.tsx`):
- Add a higher `z-index` to the parent `relative` container of the search bar so the dropdown sits above all subsequent content.
- Specifically, change the search wrapper div from `max-w-md mx-auto mb-6 relative` to `max-w-md mx-auto mb-6 relative z-50` -- this ensures the entire search area (including its absolutely-positioned dropdown) renders above the book grid below.

### Issue 2: Selecting a thematic search result doesn't show the book in Signal Archive

**Problem**: When clicking a result in the Discovery page semantic search, it stores a SpotlightBook in sessionStorage and navigates to `/book-browser?spotlight=key`. The BookBrowser component reads this on mount and should display it first. However, the `useBookBrowser` hook also auto-loads books on first visit. If the auto-load triggers and sets `loading=true`, the loading spinner replaces the grid -- and by the time loading finishes, `displayBooks()` should include the spotlight. The likely issue is that the spotlight book renders but there is no visual differentiation or "Discovered" banner visible because the auto-load's `loading=true` state masks it, or the spotlight book blends in with the other 18 books.

**Fix** (in `src/pages/BookBrowser.tsx`):
- When a spotlight book is present, skip the loading state display -- show the spotlight book immediately even while the rest of the collection loads in the background. This means adjusting the conditional rendering so that when `spotlightBook` exists, the book grid renders (with at least the spotlight) rather than showing only the loading spinner.
- The conditional at line ~409 currently shows: `loading ? <spinner> : hasBooks ? <grid> : ...`. Change this so that when `spotlightBook || fetchedTransmission` is present, it always renders the grid section (even during loading), ensuring the discovered book is immediately visible.

### Technical Details

**File: `src/components/BookBrowserHeader.tsx`**
- Line ~230 area: Add `z-50` to the `relative` parent div wrapping the search input and dropdown

**File: `src/pages/BookBrowser.tsx`**
- Line ~409 area: Adjust the ternary rendering logic from:
  ```
  loading ? <spinner> : hasBooks ? <grid> : ...
  ```
  to:
  ```
  (loading && !spotlightBook && !fetchedTransmission) ? <spinner> : hasBooks ? <grid> : ...
  ```
  This ensures the spotlight/highlighted book shows immediately upon arrival from thematic search, while the rest of the collection loads behind it.

### What stays the same
- No changes to styling of book cards, grid layout, or any other UI
- No changes to the semantic search flow on Discovery page
- No changes to the spotlight sessionStorage mechanism (it's correct)
- No changes to the dropdown design -- same look, just properly layered

