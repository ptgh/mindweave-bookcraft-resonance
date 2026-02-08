

# Neural Map Functional Enhancements

Inspired by the Future Concern reference, these are targeted functional improvements to the Neural Map. No visual changes -- same cyan/teal aesthetic, same translucent overlays, same node rendering.

---

## 1. Tabbed Bottom Sheet: Details | Graph | Ask

**Current state:** The bottom sheet shows book info, connection breakdown, top related books, tags, and two action buttons (Focus Network, View Book) in a single scrollable view.

**Enhancement:** Add three subtle tab buttons below the header. Content switches based on active tab.

- **Details tab** (default): Current content -- book info, connection reasons, tags. Add a "Connections" list showing typed relationships: same author links show "Same author as [Book]", shared theme links show "Shares [Theme] with [Book]", etc. This gives the directional, labelled connections visible in the reference.

- **Graph tab**: A compact mini-visualization of the node's immediate neighborhood (1-degree connections). Rendered as a simple radial layout using SVG within the sheet -- the focused node in the center, connected nodes around it with lines. Tapping a neighbor in this mini-graph switches the sheet to that node. This mirrors the reference's "Graph" tab without needing a separate page.

- **Ask tab**: The existing BrainChatInterface, but pre-scoped to the selected node. When opening this tab, the chat automatically sets context to "Ask me about [Book Title]" with suggested questions like "What connects this to other books?", "What themes does this explore?", "What should I read next after this?". This reuses the existing `brain-chat` edge function with a node-specific context prompt.

**Technical approach:**
- Add `activeTab` state to `NeuralMapBottomSheet`
- Details tab: current content + a new "Connections List" section showing each neighbor with its relationship label
- Graph tab: small SVG radial layout component (new `BottomSheetMiniGraph.tsx`, ~80 lines)
- Ask tab: embed a slimmed-down version of BrainChatInterface (reuse existing component with a `scopedNode` prop that pre-populates context)

---

## 2. Spatial Era/Region Labels on Canvas

**Current state:** The canvas has nodes and edges but no spatial context. Users see a web of connections but can't easily identify clusters or regions.

**Enhancement:** Detect spatial clusters of nodes that share the same conceptual tag or context tag, and render subtle floating labels on the canvas at the centroid of each cluster.

For example, if 5 books tagged "Cyberpunk" are clustered in the upper-left area of the canvas, a label reading "CYBERPUNK" appears near their center, rendered in a very subtle way (matching the existing `text-slate-500/30` aesthetic, small caps, no background).

**Technical approach:**
- After nodes are placed, compute centroids for each tag that has 3+ nodes
- Pick the top 4-5 most populated tag clusters to avoid clutter
- Render as absolutely-positioned `div` elements with `pointer-events: none`, `text-xs`, `text-slate-400/25`, `uppercase`, `tracking-widest`
- Labels recompute when filters change (only show labels relevant to visible nodes)
- New small component: `NeuralMapRegionLabels.tsx` (~60 lines)
- Labels fade in with GSAP after nodes appear

---

## 3. "Find Similar" Discovery Action

**Current state:** "Focus Network" highlights existing connections. There is no way to discover books outside the current connections that might be similar.

**Enhancement:** Add a "Find Similar" button in the bottom sheet that triggers semantic search (reusing the existing `semantic-search` edge function) to find books from `publisher_books` or `sf_film_adaptations` that are thematically similar but not yet in the user's collection.

Results appear in a "Discovery" strip at the bottom of the sheet, showing 3-4 book suggestions with cover art and a reason ("Similar themes: Cyberpunk, Neural Interface"). Each suggestion can be tapped to open the `EnhancedBookPreviewModal` with the usual "Add to Transmission" flow.

**Technical approach:**
- Add a "Find Similar" button alongside "Focus Network" in the bottom sheet actions
- On click, call the existing `semantic-search` edge function with the node's title + tags as query
- Filter out books already in the user's transmissions
- Display results in a horizontal scroll strip (same style as the existing "Most Connected" strip)
- New helper: `useNeuralMapDiscovery.ts` hook (~50 lines) wrapping the search call
- Falls back gracefully if no embeddings exist ("No similar books found yet")

---

## 4. Typed Connection Labels in Tooltip

**Current state:** Hover tooltip shows title, author, and connection count. No detail about what the connections are.

**Enhancement:** When hovering a node, show the top 2 connection reasons below the connection count. For example: "3 connections -- Same author as Neuromancer -- Shares Cyberpunk with Snow Crash".

**Technical approach:**
- In the tooltip rendering (lines 1307-1343 of TestBrain.tsx), look up the node's top 2 edges by score using `getTopRelated` and `getEdgeData`
- Render 1-2 lines of connection reasons below the existing count
- Minimal code change (~15 lines added to tooltip section)

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/NeuralMapBottomSheet.tsx` | Add 3 tabs (Details/Graph/Ask), connections list, Find Similar strip |
| `src/components/BottomSheetMiniGraph.tsx` | New: compact SVG radial graph for Graph tab |
| `src/hooks/useNeuralMapDiscovery.ts` | New: hook for semantic similarity search from neural map |
| `src/components/NeuralMapRegionLabels.tsx` | New: spatial cluster labels on canvas |
| `src/pages/TestBrain.tsx` | Integrate region labels, pass additional props to bottom sheet, enhance tooltip with connection reasons |
| `src/components/BrainChatInterface.tsx` | Add optional `scopedNode` prop for node-specific Ask context |

No visual changes to node rendering, edge styling, colors, or animations. All enhancements are functional: better information density, better discovery, and contextual AI within the existing aesthetic.

