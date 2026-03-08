

# Fix: Input Bar Height Symmetry

## Problem
The text input (`h-10`) visually appears shorter than the mic and send buttons despite having the same class. On mobile, the input's thin border and subtle background make it look recessed compared to the bolder, more visually prominent square buttons.

## Fix
Increase all three elements — mic button, text input, send button — to `h-11` (44px) in both Chat and Mission input areas. This matches iOS recommended touch targets and gives the input field enough visual presence to read as the same height as the buttons.

### Changes in `src/components/ProtagonistChatModal.tsx`

**Chat input area (lines 469-490):**
- Line 469: Mic button `h-10 w-10` → `h-11 w-11`
- Line 481: Input `h-10` → `h-11`
- Line 487: Send button `h-10 w-10` → `h-11 w-11`

**Mission input area (lines 510-528):**
- Line 510: Mic button `h-10 w-10` → `h-11 w-11`
- Line 522: Input `h-10` → `h-11`
- Line 528: Send button `h-10 w-10` → `h-11 w-11`

Six simple class replacements, one file, no logic changes.

