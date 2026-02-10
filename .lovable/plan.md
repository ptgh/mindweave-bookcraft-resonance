

# PWA Strategy: Full-Site + Standalone Protagonist Chat

## Overview

You currently have a basic web manifest and mobile meta tags, but no service worker (the engine that makes a PWA actually work offline and installable). This plan adds proper PWA support in two layers:

1. **Leafnode (full site)** -- installable from any page, caches the app shell for fast loads
2. **Protagonist Chat (standalone)** -- a focused install experience at `/protagonist-app` that opens directly to the chat page

Both will use the same Leafnode icon you already have.

---

## What You'll Get

- An "Install App" option accessible from the site header (small download icon) on mobile
- The existing `/protagonist-app` page enhanced with a working service worker so it genuinely works offline
- Offline fallback page when there's no network
- Faster repeat visits thanks to asset caching

---

## Technical Plan

### 1. Add a Service Worker (`public/sw.js`)

A lightweight, hand-written service worker (no heavy library needed) that:
- Pre-caches the app shell (index.html, key JS/CSS bundles)
- Uses a cache-first strategy for static assets (images, fonts, icons)
- Uses a network-first strategy for API calls (Supabase, AI gateway)
- Serves an offline fallback when the network is down

### 2. Register the Service Worker (`src/main.tsx`)

Add service worker registration after the app renders. Only registers in production to avoid dev confusion.

### 3. Create an Install Prompt Hook (`src/hooks/useInstallPrompt.ts`)

A reusable hook that:
- Captures the `beforeinstallprompt` event
- Detects iOS (for manual "Add to Home Screen" instructions)
- Detects if already installed (standalone display mode)
- Exposes `promptInstall()` and state flags

### 4. Add Install Button to Header (`src/components/Header.tsx`)

A subtle download icon in the mobile header bar (next to the Instagram icon) that:
- Shows only on mobile when the app is not yet installed
- Triggers the native install prompt on Android/Chrome
- Shows a small tooltip with iOS instructions on iPhone
- Disappears once installed

### 5. Upgrade the Protagonist App Page (`src/pages/ProtagonistApp.tsx`)

- Replace the inline install logic with the shared `useInstallPrompt` hook
- Keep the dedicated experience but wire it to the same service worker

### 6. Offline Fallback Page (`public/offline.html`)

A minimal branded page shown when the user is offline and the requested page isn't cached. Dark theme, Leafnode branding, "You're offline" message.

### 7. Update Manifest (`public/manifest.webmanifest`)

- Add `"id": "/"` for stable PWA identity
- Add `"scope": "/"` 
- Add `"categories": ["books", "entertainment"]`
- Add screenshot entries (optional, improves the install UI on Android)

---

## Files Changed

| File | Action |
|------|--------|
| `public/sw.js` | Create -- service worker |
| `public/offline.html` | Create -- offline fallback |
| `src/hooks/useInstallPrompt.ts` | Create -- shared install hook |
| `src/main.tsx` | Edit -- register service worker |
| `src/components/Header.tsx` | Edit -- add install button |
| `src/pages/ProtagonistApp.tsx` | Edit -- use shared hook |
| `public/manifest.webmanifest` | Edit -- add scope, id, categories |

No new dependencies required.

