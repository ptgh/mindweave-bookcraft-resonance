

# Neural Map Refinements: Balance, Polish, and Focus Mode

## Issues from Screenshots

1. **"Similar" returns empty with error text** -- "No similar books found yet" message clutters the sheet. Should be hidden entirely when empty.
2. **Scrollbar visible** on the Ask tab response area and discovery strip -- native scrollbar breaks the aesthetic.
3. **Ask tab text not smooth** -- AI responses rendered as plain text without markdown formatting or smooth scroll.
4. **Focus button unclear** -- Closes the sheet and dims non-connected nodes, but the effect is too subtle and there's no context for the user about what it does.
5. **Edge saturation still too dense** -- Despite previous reduction, the mesh still obscures text/labels on dense networks. Further reduction needed.
6. **Region labels overlapping edges** -- Need better separation.

---

## Fixes

### A) Hide empty "Similar" results and error text

In `NeuralMapBottomSheet.tsx`:
- Remove the `discoveryError` paragraph entirely (lines 181-183). No message when results are empty -- the "Similar" button already exists for users to try.
- Keep the discovery results strip only when `discoveryResults.length > 0` (already conditional).
- Add `scrollbar-hide` class to the discovery strip's scrolling container (line 163).

### B) Hide all scrollbars in bottom sheet

In `NeuralMapBottomSheet.tsx`:
- Add `scrollbar-hide` class to the main sheet `overflow-y-auto` container (line 80).

In `BottomSheetAskTab.tsx`:
- Add `scrollbar-hide` class to the messages scroll container (line 78).

### C) Replace Focus button with contextual action

The Focus button sets `focusedBookId` which dims unrelated nodes and highlights the neighborhood. The problem: users don't understand what it does and it just looks like the sheet closed.

**Solution**: Replace the "Focus" button with a "Connections" count badge that's informational, and move the focus behavior to a long-press or make it automatic when viewing the Graph tab. Specifically:
- Remove the "Focus" button from the action bar.
- Consolidate to two buttons: "Similar" and "View".
- When the user taps the **Graph tab**, automatically set a subtle highlight on the selected node's neighbors on the main canvas (without closing the sheet). This gives focus behavior context.
- Keep the "Exit Focus" button in the header (already exists) for when users close the sheet while focus is active.

### D) Further reduce edge saturation

In `TestBrain.tsx`, the edge rendering:
- **Lower initial fade-in opacity**: Change from `style.intensity * 0.6` to `style.intensity * 0.4` for score > 30, and `0.3` for weaker edges.
- **Lower pulse ceiling**: Change from `style.intensity * 0.7` to `style.intensity * 0.5`.
- **Reduce stroke-width multiplier**: Change from `1.1 + scoreNormalized * 0.3` to `1.0 + scoreNormalized * 0.2`.
- **Reduce particle opacity**: From `0.5` to `0.35`.
- **Reduce gradient mid-stop opacities**: Scale `intensity * 0.5` and `0.6` down to `intensity * 0.3` and `0.4`.
- Net effect: edges are still visible and animated but much softer, allowing text and labels to be clearly readable.

### E) Improve region label visibility

In `NeuralMapRegionLabels.tsx`:
- Increase `z-index` from 3 to 5 (above edges, below nodes).
- Add `font-weight: 500` for slightly bolder text.
- Increase letter-spacing from `0.25em` to `0.3em`.

---

## Technical Summary

| File | Change |
|------|--------|
| `src/components/NeuralMapBottomSheet.tsx` | Remove error text, add scrollbar-hide, remove Focus button, auto-focus on Graph tab |
| `src/components/neural-map/BottomSheetAskTab.tsx` | Add scrollbar-hide to messages area |
| `src/pages/TestBrain.tsx` | Further reduce edge opacity/width/particles for readability |
| `src/components/NeuralMapRegionLabels.tsx` | Increase z-index and letter-spacing for label clarity |

No UI/UX design changes. Same cyan aesthetic, same layout, same tabs -- just better balanced and cleaner.

