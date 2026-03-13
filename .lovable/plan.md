

# Plan: Anonymous Access with Starter Transmissions

## Summary
Open the site to unauthenticated visitors by exposing key routes without auth, and show 5 curated starter books in the Library (Signal Archive) for anonymous users with a sign-up nudge banner.

## Changes

### 1. Open routes for anonymous users (`src/App.tsx`)
Currently, unauthenticated users are redirected to `/auth` for all routes except a few. Change the routing so that **all main read-only routes** are accessible without auth: `/` (Discovery), `/library`, `/book-browser`, `/author-matrix`, `/community`, `/protagonists`, `/book-to-screen`, `/publisher-resonance`.

Keep admin, insights, and write-heavy routes behind auth. The `FloatingNeuralAssistant` should render for all users.

### 2. Create starter transmissions data (`src/constants/starterTransmissions.ts`)
Define 5 iconic SF titles as mock `Transmission` objects with negative IDs (to distinguish from real DB records):

1. *Neuromancer* — William Gibson
2. *The Left Hand of Darkness* — Ursula K. Le Guin
3. *Do Androids Dream of Electric Sheep?* — Philip K. Dick
4. *Dune* — Frank Herbert
5. *The Dispossessed* — Ursula K. Le Guin

Each with status `want-to-read`, curated tags, and cover URLs from the existing catalog or Google Books thumbnails.

### 3. Show starter books for anonymous users (`src/pages/Index.tsx`)
- When `!user`, instead of an empty state, populate `books` with the 5 starter transmissions.
- Disable edit/keep/discard actions for starter books (show toast prompting sign-up).
- The "+ Log Signal" button prompts navigation to `/auth` for anonymous users.

### 4. Sign-up encouragement banner (in `src/pages/Index.tsx`)
Add a subtle banner above the transmissions grid when `!user`:

> "These are curated suggestions to get you started. Sign up to build your own library."

Styled consistently with existing UI — slate/cyan palette, small text, with a "Sign Up" link.

### 5. Header awareness (`src/components/Header.tsx`)
The header already uses `useAuth()`. Where it shows user-specific items (profile, notifications, sign out), show a "Sign In" button instead for anonymous users. This likely already works partially — just ensure navigation links render for anonymous visitors.

### Technical Details
- No database changes needed — starter data is purely client-side constants.
- No localStorage/cache changes in this phase — the starter books are hardcoded, not persisted.
- All existing authenticated flows remain untouched; the `saveTransmission` service still requires auth and will throw appropriately.
- Starter book IDs use negative numbers so `TransmissionsList` renders them without collision with real DB IDs.

### Files to create/edit
- **Create**: `src/constants/starterTransmissions.ts`
- **Edit**: `src/App.tsx` (open routes)
- **Edit**: `src/pages/Index.tsx` (starter books + banner)
- **Edit**: `src/components/Header.tsx` (sign-in button for anon users, if not already present)

