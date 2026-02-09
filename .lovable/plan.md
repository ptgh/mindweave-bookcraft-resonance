

# Protagonist Card Refinements

## Issues to Fix

1. **Title and author touching** -- need visible spacing between them
2. **Protagonist display** -- remove the bordered rectangle badge; show protagonist name as plain text on its own line with a subtle MessageCircle icon and GSAP underline (matching title/author treatment)
3. **World-specific descriptions** -- use Lovable AI (via a new edge function) to generate a one-line evocative description of each protagonist's world, stored in the database for reuse
4. **Bad protagonist data** -- "Aldous Huxley" is the author, not a protagonist; "Brave New World Revisited" is non-fiction, so protagonist should be cleared

## Changes

### 1. Fix protagonist data (database)
- Clear the `protagonist` field for "Brave New World Revisited" (id: 91) since it's non-fiction and has the author name stored as protagonist

### 2. Protagonist card layout (`src/pages/Protagonists.tsx`)

**Spacing**: Add `mt-2` gap between title and author buttons (currently `mt-1.5`, increase to `mt-2`)

**Protagonist display**: Replace the bordered violet badge/button with a plain-text clickable element on its own line below the author:
- Show a small `MessageCircle` icon (w-3 h-3, violet-400) inline with the protagonist name
- Text styled as `text-violet-300 text-xs font-medium` -- no background, no border, no rectangle
- Add a GSAP underline ref (violet, matching the blue underlines on title/author) that animates on scroll-in and on hover
- Clicking triggers `onChat(book)`
- Consistent placement: always below the author line with `mt-2` spacing

**World description**: Replace the generic template text with AI-generated descriptions. Until the AI description is available, use a shorter fallback: "Step into the world of [Title] and speak to [Protagonist]."

### 3. New edge function: `generate-protagonist-intro` 
Creates a one-sentence evocative introduction for each protagonist, describing their world (not just the book title). Example output for "Do Androids Dream of Electric Sheep?": *"In a dying Earth choked by radioactive dust, Rick Deckard hunts rogue androids to fund his dream of owning a real animal."*

- Uses Lovable AI (gemini-2.5-flash-lite) with a focused prompt
- Takes bookTitle, bookAuthor, protagonistName
- Returns a short (1-2 sentence) world-specific intro

### 4. Store and cache intros
- Add a `protagonist_intro` column to the `transmissions` table
- On page load, for any book missing a `protagonist_intro`, fire off the edge function to generate and store it (fire-and-forget, similar to how `infer-protagonist` works)
- Display the stored intro immediately for books that already have one

## Technical Details

### Files Created
- `supabase/functions/generate-protagonist-intro/index.ts` -- AI edge function

### Files Modified  
- `src/pages/Protagonists.tsx` -- card layout, GSAP underline on protagonist, AI intro fetch
  
### Database Changes
- Add `protagonist_intro` TEXT column to `transmissions` table (via migration)
- Clear protagonist for "Brave New World Revisited" (id: 91)

### Protagonist Line Layout (all cards, consistent)
```text
[Book Title]          <- clickable, GSAP underline, blue
                      <- mt-2 gap
[Author Name]         <- clickable, GSAP underline, blue  
                      <- mt-2 gap
[icon] [Protagonist]  <- clickable, GSAP underline, violet, no border/bg
                      <- mt-2 gap
[AI world intro text] <- italic, slate-500, 11px
```
