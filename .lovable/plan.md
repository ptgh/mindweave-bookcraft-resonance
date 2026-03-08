

## Plan: Neural Map Enhancements

### Problem Summary
1. **"Uncategorized" group** — 25+ books with empty tags fall into a catch-all bucket
2. **No interactivity on EntityCard headers** — category titles and author group titles are plain text with no tooltips
3. **Signal Details bottom sheet** — missing "Life" (author bio) and "Story" (protagonist info) tabs; author/protagonist names not clickable to chat
4. **Protagonist/author names in Signal Details** — no GSAP underline or link to chat

### Changes (4 files modified, 1 new file created)

---

### 1. Fix "Uncategorized" — Auto-infer tags for untagged books
**File: `src/pages/TestBrain.tsx`** (~5 lines changed)

In the `bookNodes` mapping, when `filterConceptualTags` returns an empty array, run a simple keyword-based fallback that infers a primary tag from the book's title/author/notes. For example, Philip K. Dick → "Cyberpunk", Orwell → "Dystopian Systems", Haldeman → "Space Opera", etc. This uses a small local lookup — no API calls. Books that still can't be classified get labelled **"Unclassified Signals"** instead of "Uncategorized" (more on-brand).

A helper function `inferFallbackTag(node)` will check:
- Author name against known author→genre mappings (e.g., Dick→Cyberpunk, Orwell→Dystopian Systems, Clarke→Hard Science Fiction, Lem→Hard Science Fiction, Herbert→Space Opera)
- This keeps the "Uncategorized" bucket small or eliminates it entirely

---

### 2. Clickable EntityCard headers with tooltips
**File: `src/components/neural-map/EntityCard.tsx`** (~30 lines added)

- Make the **header title** (`<span>`) clickable with a GSAP underline on hover
- On click, show a small **tooltip popover** positioned below the header:
  - **For theme/category headers** (type=book): Show a brief description of the tag (from a small local map of tag→description, e.g., "Cyberpunk" → "High tech, low life. A subgenre exploring the intersection of advanced technology and societal breakdown.")
  - **For author headers** (type=author): Show author name, birth/death years, and a one-line bio pulled from the `authorData` already available in the node's `description` field
  - **For protagonist group headers** (type=protagonist): Show the author name and number of characters
- Tooltip styled with the translucent overlay aesthetic (bg-slate-900/90, backdrop-blur, border-cyan-400/20)
- Dismiss on click outside or after 5 seconds

---

### 3. New "Life" and "Story" tabs in Signal Details
**New file: `src/components/neural-map/BottomSheetLifeTab.tsx`** (~80 lines)

A new tab component that:
- Fetches author data from `scifi_authors` table (bio, nationality, birth_year, death_year, portrait_url)
- Displays: portrait, name, nationality, birth–death years, and full bio
- If the selected node is a protagonist, shows "Story" content instead: protagonist name, the book they appear in, and their description
- Author name has GSAP underline and is clickable to open `ProtagonistChatModal` (or `AuthorPopup` if available)

**File: `src/components/NeuralMapBottomSheet.tsx`** (~20 lines changed)

- Add two conditional tabs to the `TABS` array:
  - `'life'` tab (label: "Life") — shown when the selected node is a book or author type, provides author biographical info
  - `'story'` tab (label: "Story") — shown when the selected node is a book with a protagonist, provides protagonist info
- Tabs appear after "Ask" tab
- Render `BottomSheetLifeTab` for both, passing a `mode` prop ('author' | 'protagonist')

---

### 4. GSAP underline on author/protagonist names in Signal Details header
**File: `src/components/NeuralMapBottomSheet.tsx`** (~15 lines changed)

- In the "Book Info" section, wrap `node.author` in a clickable span with GSAP underline animation
- On click, open `AuthorPopup` component (already exists in codebase)
- If the node has a protagonist, show protagonist name below author with a purple GSAP underline that opens `ProtagonistChatModal` on click
- Import `gsap`, `AuthorPopup`, and `ProtagonistChatModal`

---

### 5. Tag description map for tooltips
**File: `src/constants/conceptualTags.ts`** (~25 lines added)

Add an exported `TAG_DESCRIPTIONS` map with a one-line description for each of the 22 conceptual tags. This is used by the EntityCard tooltip. Example:
```
"Cyberpunk": "High tech, low life — exploring advanced technology amid societal decay"
"Space Opera": "Epic interstellar narratives spanning galaxies and civilisations"
```

---

### Technical Notes
- **No removals** — all existing UI and functionality preserved
- **GSAP usage** — consistent with existing underline pattern (`story-link` class + gsap hover animations)
- **Data** — author bio/years already loaded in TestBrain's `authorMap`; passed through node's `description` field for authors. For the Life tab, a targeted Supabase query fetches full author data by name
- **Protagonist chat** — reuses existing `ProtagonistChatModal` component with same props pattern
- **Fallback tag inference** — purely client-side, no edge function calls needed

