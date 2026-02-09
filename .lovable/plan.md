

# Speak to Protagonist -- New Feature

## Overview
Add a dedicated "Speak to Protagonist" page listing all books with identified protagonists, plus promote it via a cycling tile on the Community page, a link on the Home page, and a header navigation item.

## What Gets Built

### 1. New Page: `/protagonists` (ProtagonistDirectory)
- Fetches all transmissions where `protagonist IS NOT NULL`
- Displays a grid of book cards, each showing: book cover, title, author, protagonist name (with the existing checkmark style), and a "Chat" button
- Clicking "Chat" opens the existing `ProtagonistChatModal`
- Searchable/filterable by book title or protagonist name
- Styled consistently with existing pages (dark slate gradient, Header, SEOHead)
- Currently 47 books have protagonists available

### 2. Community Page: Cycling Protagonist Tile
- New component `ProtagonistShowcase` placed alongside the existing `AwardWinnersShowcase`
- Shows 3-4 rotating tiles (similar fade-in/out pattern as the award tiles) featuring random protagonists
- Each tile shows: protagonist name, book title, author, and a "Speak to them" prompt
- Clicking a tile opens `ProtagonistChatModal` directly
- Accent color: violet/purple to distinguish from the emerald/amber community palette

### 3. Home Page (Discovery) Menu Link
- New navigation card added to the feature blocks grid on the Discovery page
- Icon: `MessageCircle` (violet accent)
- Label: "Speak to Protagonist"
- Description: "Chat with characters from your library"
- Links to `/protagonists`

### 4. Header Navigation
- **Desktop**: New link "Protagonists" added between "Community" and "Book to Screen" (violet accent, matching the feature's identity)
- **Mobile dropdown**: New menu item with `MessageCircle` icon in the same position

### 5. Routing
- Add `/protagonists` lazy-loaded route in `App.tsx`

## Technical Details

### Files Created
- `src/pages/Protagonists.tsx` -- the dedicated page component
- `src/components/community/ProtagonistShowcase.tsx` -- cycling tile for Community page

### Files Modified
- `src/App.tsx` -- add lazy import and route for `/protagonists`
- `src/components/Header.tsx` -- add nav link (desktop + mobile)
- `src/pages/Discovery.tsx` -- add feature block link
- `src/pages/Community.tsx` -- include `ProtagonistShowcase` component

### Data Query
The page fetches from Supabase:
```text
SELECT id, title, author, protagonist, cover_url
FROM transmissions
WHERE protagonist IS NOT NULL AND protagonist != ''
ORDER BY title ASC
```

No new database tables or edge functions required -- this reuses the existing `transmissions` table and `ProtagonistChatModal` component.

