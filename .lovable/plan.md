

## Neural Map Redesign: ER-Diagram Style Visualization

### Problem
The current neural map is an indecipherable scatter of overlapping nodes and crossing lines. With 100+ books, 60+ authors, and 40+ protagonists all placed via grid/random positioning, the result is visual noise rather than insight.

### Design Direction
Inspired by Entity Relationship Diagrams: structured, grouped "entity cards" containing lists of items, connected by clear labeled relationship lines. The layout is deterministic and organized, not random.

```text
+------------------+          +------------------+          +------------------+
|   AUTHOR CARD    |          |    BOOK CARD     |          | PROTAGONIST CARD |
|  [portrait]      |--wrote-->|  [cover]         |<--in-----|  [portrait]      |
|  Philip K. Dick  |          |  Do Androids...  |          |  Rick Deckard    |
|  Ubik            |          |  Neuromancer     |          |  Case            |
|  A Scanner...    |          |  Solaris         |          |  Genly Ai        |
+------------------+          +------------------+          +------------------+
```

### Architecture

**Three-column layout** (scrollable, not fixed viewport):
- **Left column**: Author entity cards (amber border, circular portraits on hover)
- **Center column**: Book entity cards (cyan border, circular covers on hover) -- grouped by theme/tag
- **Right column**: Protagonist entity cards (purple border, circular portraits on hover)

Each "entity card" is a styled card (matching existing `bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20` aesthetic) containing a list of items within that group.

**Sidebar filter panel** (left, collapsible):
- Filter by: Author, Theme/Tag, Era
- Checkboxes to toggle visibility
- When a filter is active, only relevant cards and connections highlight

**Connection lines** (SVG overlay):
- Drawn as clean orthogonal or gently curved lines between cards
- Color-coded: amber (wrote), cyan (shared theme), purple (appears in)
- Labels on lines ("Wrote", "Cyberpunk", "Appears In")
- Lines only appear for visible/filtered relationships

### Visual Details

**Entity Cards** (the main visual unit):
- Rounded rectangle, `bg-slate-900/70 backdrop-blur border border-{color}/30`
- Header bar with entity type icon + group name (e.g., "Philip K. Dick" or "Cyberpunk" or "Protagonists - PKD")
- List of items inside, each row: circular thumbnail (40px) + title text
- GSAP hover on each item name (underline animation matching existing author-interaction-standards)
- Hover on any item shows a floating tooltip with the full image (book cover, author portrait, protagonist portrait)
- Click opens the existing Signal Details bottom sheet

**Circular thumbnails** (all node types):
- Books: 40px circle, cyan border, cover image clipped to circle
- Authors: 40px circle, amber border, portrait clipped to circle  
- Protagonists: 40px circle, purple border, portrait clipped to circle
- Fallback: first letter on dark gradient background

**Grouping logic**:
- Authors: one card per author (listing their books)
- Books: grouped by primary conceptual tag (e.g., "Cyberpunk", "Space Opera", "Dystopian Systems")
- Protagonists: grouped by parent author

### Sidebar Filter Key

A collapsible panel on the left side (desktop) or bottom sheet (mobile):

```text
+-- FILTER KEY --------+
| [x] Authors           |
|   [x] Philip K. Dick  |
|   [x] Ursula Le Guin  |
|   [ ] Liu Cixin       |
|                        |
| [x] Themes            |
|   [x] Cyberpunk        |
|   [x] Space Opera      |
|   [ ] Golden Age       |
|                        |
| [x] Protagonists       |
+------------------------+
```

Selecting/deselecting items dims or hides unrelated cards and connections, similar to existing `activeFilters` behavior but with a proper sidebar UI instead of tiny bottom-bar badges.

### Layout Algorithm

1. Group books by their primary conceptual tag
2. For each tag group, create a "Book Entity Card" positioned in the center column
3. For each unique author with books in visible groups, create an "Author Entity Card" in the left column
4. For each protagonist tied to a visible book, create a "Protagonist Entity Card" in the right column
5. Draw SVG connection lines between:
   - Author card row -> Book card row (amber, "Wrote")
   - Book card row -> Protagonist card row (purple, "Appears In")  
   - Book card -> Book card (cyan, shared theme -- shown subtly, only on hover/filter)

The page scrolls vertically. Cards are arranged top-to-bottom in each column with consistent spacing.

### Files to Change

| File | Change |
|------|--------|
| `src/pages/TestBrain.tsx` | Complete rewrite of the visualization: replace canvas/scatter with structured three-column layout, entity cards, SVG connections, sidebar filter |
| `src/components/neural-map/NeuralMapNode.tsx` | Replace imperative DOM node factory with a React `EntityCard` component and `EntityRow` component |
| `src/components/NeuralMapHeader.tsx` | Simplify -- remove bottom tag bar, stats move into sidebar |
| `src/components/NeuralMapRegionLabels.tsx` | Remove (no longer needed -- groups are explicit cards now) |
| `src/components/neural-map/EdgeLabel.tsx` | Adapt for structured line labels between cards |
| `src/components/NeuralMapLegend.tsx` | Merge into the sidebar filter panel |

### What is Retained (unchanged)

- `NeuralMapBottomSheet` -- Signal Details card, tabs, discovery -- fully preserved
- `BottomSheetDetailsTab`, `BottomSheetMiniGraph`, `BottomSheetAskTab` -- untouched
- `BrainChatInterface` -- neural assistant, untouched
- `useNeuralMapConnections` hook -- connection logic, untouched
- `usePatternRecognition` -- untouched
- Color palette: cyan (#22d3ee), amber (#fbbf24), purple (#c084fc), slate backgrounds
- Translucent overlay aesthetic (`bg-slate-900/60 backdrop-blur-xl`)
- All Supabase queries and data fetching logic

### Mobile Adaptation

On mobile (< 768px):
- Single-column layout: Author cards, then Book cards, then Protagonist cards stacked vertically
- Filter panel becomes a bottom sheet triggered by a filter icon button
- Connection lines hidden on mobile (too complex) -- relationships shown in card content instead
- Touch to open bottom sheet details

### Interaction Flow

1. Page loads -> structured cards appear with GSAP stagger animation
2. Hover over any item row -> GSAP underline on name + floating circular image tooltip
3. Click any item -> opens existing Signal Details bottom sheet
4. Sidebar filter -> check/uncheck to show/hide cards and connections
5. SVG lines animate in with GSAP, pulse gently on strong connections

