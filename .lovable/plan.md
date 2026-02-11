

# Neural Map Relationship Visualization Upgrade

## Overview

This plan transforms the Neural Map from abstract dots-and-lines into a readable, explorable relationship graph where connections between books are immediately understood. It also fixes broken book cover images in the PWA. Two distinct experiences: a clean mobile view and a rich expanded desktop view.

---

## Problem Summary

1. **Broken images in PWA**: Book covers are external URLs (Google Books, etc.). The service worker tries to cache them but cross-origin opaque responses have `response.ok = false`, so they silently fail. Additionally, the SVG `<image>` elements in the mini-graph have no fallback.
2. **Relationships are unclear**: Nodes are tiny glowing dots (6-10px). Connection lines are thin, unlabeled curves. Users cannot tell *why* two books are connected without opening the bottom sheet.
3. **No distinction between mobile and desktop**: Both get the same abstract dot visualization.

---

## What Changes

### 1. Fix Broken PWA Images

**File: `public/sw.js`**
- For image requests, also cache opaque responses (cross-origin). Change the condition from `response.ok` to `response.ok || response.type === 'opaque'` so Google Books covers get cached.
- Add `{ mode: 'no-cors' }` fallback for cross-origin image fetches that fail with CORS.

**File: `src/components/neural-map/BottomSheetMiniGraph.tsx`**
- Add `onError` fallback for `<image>` SVG elements -- render a `<circle>` with a book icon placeholder when the cover fails to load.

**File: `src/components/NeuralMapBottomSheet.tsx`**  
- Add `onError` fallback for the book info `<img>` tag.

---

### 2. Mobile Neural Map -- Labeled Node Graph

**File: `src/pages/TestBrain.tsx`** (mobile path)

On screens under 768px, replace the abstract particle/dot rendering with a cleaner graph:

- **Larger nodes (28-36px circles)** showing book cover thumbnails clipped into circles (matching the mini-graph style from the bottom sheet). If no cover, show a styled placeholder with first letter of title.
- **Visible title labels** beneath each node (10px, 2-line clamp, slate-400 color) -- similar to how the reference images show "Star Maker", "Sci-Fi Designs" etc.
- **Connection lines with typed styling**:
  - Same author: solid cyan, thicker (1.5px)
  - Shared theme: solid teal, medium (1px)
  - Shared subgenre: dotted cyan (0.8px)
  - Shared era: dashed, muted (0.5px)
- **Tap a node**: opens the bottom sheet (existing behavior, unchanged).
- **Tap a connection line**: shows a small inline label ("Shares Dystopian Systems") that fades after 3 seconds.
- **Remove particle animations on mobile** -- no floating particles, no ambient energy flow. Keeps it readable and performant.
- **Keep region labels** (the existing NeuralMapRegionLabels component) as they already provide thematic context.

---

### 3. Desktop Neural Map -- Expanded Relationship Experience

**File: `src/pages/TestBrain.tsx`** (desktop path, 768px+)

On larger screens, the visualization becomes richer:

- **Book cover nodes (40-50px)** with circular clipping and a subtle glow ring based on connection count.
- **Always-visible title labels** beside each node (not below, to save vertical space), with author name in smaller cyan text.
- **Labeled connection edges**: midpoint of each connection line shows a small pill badge with the connection reason ("Same Author", "Shares Cyberpunk", "Dystopian Era"). Only shown for the top 30 strongest connections to avoid clutter.
- **Hover a node**: highlights all its connections (dims unrelated nodes to 15% opacity), and connection labels for that node's edges all become visible. The existing particle effects remain but are limited.
- **Hover a connection line**: shows a detailed tooltip with both book titles and all shared tags/reasons.
- **Click a node**: opens the bottom sheet (unchanged).
- **Focus mode** (existing): continues to work, now with visible labels making the focused neighborhood much clearer.
- **Connection legend**: update the existing NeuralMapLegend to show line-type meanings (solid = author, dotted = theme, dashed = era).

---

### 4. Shared Node Rendering Component

**New file: `src/components/neural-map/NeuralMapNode.tsx`**

A reusable component for rendering a single book node with:
- Circular cover image with fallback
- Title label (position configurable: below for mobile, beside for desktop)
- Connection count indicator (small dot with number)
- Glow intensity based on connection tier

This component is used by the main canvas renderer (via DOM manipulation as currently done, but with standardized styling).

---

### 5. Connection Edge Label Component

**New file: `src/components/neural-map/EdgeLabel.tsx`**

A small pill/badge rendered at the midpoint of a connection line:
- Shows the primary connection reason (e.g., "Shared Theme: AI Consciousness")
- Styled as translucent pill matching the app aesthetic (bg-slate-900/40, backdrop-blur, cyan border)
- Only rendered for top N connections (configurable; 0 on mobile by default, 30 on desktop)
- Fade in/out on hover/tap

---

## Files Changed Summary

| File | Action | Purpose |
|------|--------|---------|
| `public/sw.js` | Edit | Cache opaque cross-origin image responses |
| `src/pages/TestBrain.tsx` | Edit | Responsive mobile/desktop node rendering, labeled edges, remove mobile particles |
| `src/components/neural-map/NeuralMapNode.tsx` | Create | Reusable book node with cover, title, fallback |
| `src/components/neural-map/EdgeLabel.tsx` | Create | Connection reason pill badge |
| `src/components/neural-map/BottomSheetMiniGraph.tsx` | Edit | Image fallback handling |
| `src/components/NeuralMapBottomSheet.tsx` | Edit | Image fallback handling |
| `src/components/NeuralMapLegend.tsx` | Edit | Add connection type legend (line styles) |

No new dependencies required. All rendering uses existing GSAP, SVG, and DOM APIs.

---

## Technical Approach

### Node Rendering Strategy

The current approach creates DOM elements imperatively via `document.createElement`. This will continue for performance (avoids React re-renders on 50+ animated nodes), but the node creation code will be refactored into a helper function that:

1. Detects `isMobile` from viewport width
2. Creates appropriately sized nodes with cover images
3. Adds title labels as positioned `<div>` children
4. On desktop, positions labels to the right; on mobile, positions below

### Edge Label Rendering

Edge labels will be React-rendered `<div>` elements positioned absolutely based on the midpoint of each connection's SVG path. They are overlaid on top of the SVG layer (z-index 3) and are pointer-events-none by default (pointer-events-auto on desktop for hover interaction).

### Image Fallback Chain

For both the main graph and mini-graph:
1. Try the `coverUrl` directly
2. On error, try a proxy/cached version if available
3. Final fallback: styled circle with first letter of book title and a book icon

