

# Neural Map Balance and Bug Fixes

Four targeted fixes to improve readability and fix the Ask tab, without changing the existing UI/UX design.

---

## Issues Identified

1. **Graph tab: titles truncated to 12 characters** -- "The Collecti..." and "Flow My Tear..." are unreadable. The SVG text element hard-caps at 12 chars.
2. **Ask tab returns "No response received"** -- Bug: the `brain-chat` edge function returns `data.reply`, but `BottomSheetAskTab` reads `data.response`. The response is always falsy, so it falls through to the fallback string.
3. **Edge saturation** -- With 80 visible edges, the pulsing GSAP animation pushes opacity up to `intensity * 1.2` (nearly 1.0 for strong connections) and widens strokes, creating a dense bright mesh that obscures region labels and node text.
4. **Region labels barely visible** -- Currently rendered at `text-slate-400/20` (20% opacity), which is too faint to read against the edge glow.

---

## Fixes

### A) Graph tab: show full titles with word-wrap

In `BottomSheetMiniGraph.tsx`:
- Increase SVG canvas from 280 to 320px and radius from 100 to 110 to give more room
- Replace the single `<text>` element (12-char truncation) with a `<foreignObject>` containing an HTML `<div>` that wraps the full title across 2 lines with `line-clamp-2`
- This allows up to ~30 characters across two lines, which covers most book titles

### B) Ask tab: fix response field name

In `BottomSheetAskTab.tsx` line 62:
- Change `data?.response` to `data?.reply` to match what the `brain-chat` function actually returns
- This single-character fix resolves "No response received"

### C) Reduce edge saturation for better readability

In `TestBrain.tsx`, the edge rendering section (~lines 930-990):
- **Lower max opacity**: Change the initial animation target from `style.intensity * 1` to `style.intensity * 0.6` for the fade-in, and cap the pulse ceiling at `style.intensity * 0.7` (down from `1.2`)
- **Narrow pulse width range**: Change pulse stroke-width multiplier from `1.5 + scoreNormalized * 0.5` to `1.1 + scoreNormalized * 0.3`
- **Reduce gradient stop opacity**: Scale down the mid-gradient opacity stops by ~40% so the core glow is softer
- **Reduce particle opacity**: Lower particle opacity from `style.intensity * 0.9` to `style.intensity * 0.5`
- **Net effect**: Edges remain visible and animated but won't form a saturated bright mesh; text and labels become readable through the network

### D) Make region labels more legible

In `NeuralMapRegionLabels.tsx`:
- Increase opacity from `text-slate-400/20` to `text-slate-400/35`
- Increase font size from `text-[10px]` to `text-[11px]`
- Add a very subtle text-shadow (`0 0 8px rgba(0,0,0,0.6)`) to separate from edge glow behind
- These are still ambient/subtle but actually readable

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/neural-map/BottomSheetMiniGraph.tsx` | Full title display via foreignObject, larger canvas |
| `src/components/neural-map/BottomSheetAskTab.tsx` | Fix `data.response` to `data.reply` (line 62) |
| `src/pages/TestBrain.tsx` | Lower edge opacity caps, narrower pulse widths, softer particles |
| `src/components/NeuralMapRegionLabels.tsx` | Increase label opacity and add text-shadow |

No visual design changes. Same cyan aesthetic, same animations, same layout -- just better balanced.

