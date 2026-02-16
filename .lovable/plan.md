
# AI-Generated Protagonist Portraits

## Overview
Generate a unique AI portrait for each of the ~52 protagonists using the Gemini image generation model (`google/gemini-2.5-flash-image`), store them in Supabase Storage, and display them on protagonist cards and the chat modal. Portraits will be based purely on literary descriptions, not film depictions.

## Architecture

1. **New Supabase Storage bucket**: `protagonist-portraits` (public)
2. **New database column**: `transmissions.protagonist_portrait_url` (text, nullable)
3. **New edge function**: `generate-protagonist-portrait` -- takes book/protagonist info, generates an image via Lovable AI image model, uploads to storage, writes URL back to DB
4. **Frontend updates**: Show the portrait on `ProtagonistCard` and `ProtagonistChatModal`

## Detailed Steps

### Step 1: Database Migration
- Add `protagonist_portrait_url TEXT` column to `transmissions` table
- Create `protagonist-portraits` storage bucket (public)

### Step 2: Edge Function -- `generate-protagonist-portrait`
- Accepts `{ bookTitle, bookAuthor, protagonistName, transmissionId }`
- Requires auth (uses `requireUser` pattern)
- Checks if portrait already exists in DB -- if so, returns it immediately
- Builds a detailed prompt emphasizing literary description:
  - "Based ONLY on the novel [title] by [author], create a portrait of [protagonist]. Do NOT reference any film or TV adaptation. Style: painterly, moody, dark sci-fi palette with violet and slate tones, consistent with a literary reading app."
- Calls `https://ai.gateway.lovable.dev/v1/chat/completions` with model `google/gemini-2.5-flash-image` and `modalities: ["image", "text"]`
- Extracts the base64 image from `data.choices[0].message.images[0].image_url.url`
- Decodes base64 and uploads to Supabase Storage at `protagonist-portraits/{transmissionId}.png`
- Updates `transmissions.protagonist_portrait_url` with the public URL
- Returns `{ portraitUrl }`

### Step 3: Frontend -- ProtagonistCard Updates
- Add `protagonist_portrait_url` to the `ProtagonistBook` interface and the Supabase query
- Display a small circular portrait next to the protagonist name (or as an avatar on the card)
- If no portrait exists yet, trigger generation on first view (fire-and-forget, similar to how `protagonist_intro` works)
- Show a subtle loading shimmer while generating

### Step 4: Frontend -- ProtagonistChatModal Updates
- Show the protagonist portrait in the chat header beside "Speaking with [Name]"
- Use a circular avatar style (~32px) with a violet ring border
- Fall back to a `MessageCircle` icon if no portrait available

### Step 5: Protagonists Page Query Update
- Add `protagonist_portrait_url` to the select query in `Protagonists.tsx`

## Design Consistency
- Portraits use a **painterly, moody sci-fi art style** with the site's slate/violet palette
- Circular crop with a `border-2 border-violet-500/30` ring
- 48x48px on cards, 32x32px in chat header
- Subtle glow effect (`shadow-violet-500/20`) to tie into the neural/sci-fi aesthetic

## Technical Details

```text
Flow:
  User visits /protagonists
    -> Page loads books with protagonist_portrait_url
    -> If portrait is null, ProtagonistCard fires generate-protagonist-portrait
    -> Edge function generates image, uploads to storage, updates DB
    -> Card re-renders with portrait

Storage path: protagonist-portraits/{transmissionId}.png
Image size: 512x512 (generated), displayed at 48px circular crop
```

## Config Updates
- Add `[functions.generate-protagonist-portrait]` with `verify_jwt = true` to `supabase/config.toml`

## Cost Considerations
- ~52 protagonists, each generating one image
- Uses `google/gemini-2.5-flash-image` (cost-effective image model)
- One-time generation per protagonist; subsequent visits use cached URL
- Generation is lazy (only when a user views the card and no portrait exists)
