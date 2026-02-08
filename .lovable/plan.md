

# Signal Archive, Transmissions, and Protagonist Voice Chat

## Issues and Features

### 1. Signal Archive search missing `author_books` results

**Root cause**: `BookBrowserHeader.tsx` searches `sf_film_adaptations` and `publisher_books` but never queries the `author_books` table. "Galactic Pot-Healer" exists in `author_books` (linked via Author Matrix) but not in the other two tables, so it never appears in Signal Archive search.

**Fix**: Add a third search query in `BookBrowserHeader.tsx` that searches `author_books` joined with `scifi_authors` for the author name. Merge results into the suggestions dropdown, deduplicating by title.

---

### 2. Author search in Log Signal should show title dropdown

**Current behavior**: When you select an author (e.g. "Philip K. Dick") in the Log Signal modal, the Title field still requires manual typing or Google Books search. There's no way to quickly pick from the author's known catalogue.

**Fix**: In `BookSearchSection.tsx`, when an author is selected via `onAuthorSelect`, fetch that author's books from `author_books` table and pass them as pre-populated suggestions to `BookSearchInput`. Update `BookSearchInput` to accept an optional `authorBooks` prop -- when present and the title field is empty or short, show the author's book list as suggestions instead of requiring a Google Books search.

**Files changed**:
- `src/components/BookForm/BookSearchSection.tsx` -- fetch author books on selection, pass to BookSearchInput
- `src/components/BookSearchInput.tsx` -- accept `authorBooks` prop, show as default suggestions when author is selected

---

### 3. Add Preview button to Transmission cards

**Current behavior**: Transmission cards (BookCard) show Edit, Keep, Discard, and Share buttons. No way to preview book details without editing.

**Fix**: Add a "Preview" button to `BookCard.tsx` that opens `EnhancedBookPreviewModal` for that transmission. The button goes in the action row alongside the existing buttons. Transform the transmission data into the `EnrichedPublisherBook` shape the modal expects.

**Files changed**:
- `src/components/BookCard.tsx` -- add Preview button and modal state

---

### 4. Protagonist name on Transmission cards

**Approach**: Add a `protagonist` column to the `transmissions` table. On save/edit, use the existing `brain-chat` edge function to infer the protagonist name from the book title and author. Display it subtly on the BookCard below the author name.

**Files changed**:
- New migration: add `protagonist` text column to `transmissions`
- `src/services/transmissionsService.ts` -- include `protagonist` in the Transmission interface and mapping
- `src/components/BookCard.tsx` -- display protagonist if available
- `src/components/BookForm/BookFormModal.tsx` -- add optional protagonist field, auto-populate via AI on save

---

### 5. Protagonist Voice Chat (ElevenLabs)

This is the most ambitious feature. The user wants to "talk to" a book's protagonist (e.g., Joe Fernwright from Galactic Pot-Healer) via text or voice, with responses guarded to stay within the book's narrative.

**Architecture**:

```text
User (text/voice) --> Frontend component
  --> brain-chat edge function (with protagonist system prompt)
  --> AI response (text)
  --> ElevenLabs TTS edge function (voice reply)
```

**Implementation**:

a) **New edge function** `protagonist-chat/index.ts`: A specialized chat endpoint that receives the book title, author, protagonist name, and conversation history. The system prompt instructs the AI to roleplay as the protagonist, staying strictly within the book's narrative, events, and world. It refuses to discuss anything outside the book.

b) **New component** `ProtagonistChatModal.tsx`: A modal triggered from the BookCard "Preview" or a dedicated button. Shows a chat interface where users can type messages. Includes a microphone button that uses the existing `elevenlabs-stt` edge function for speech-to-text input, and a speaker button that uses `elevenlabs-tts` for reading the protagonist's responses aloud.

c) **Voice selection**: Use the "Roger" voice (contemplative, intellectual) as default for male protagonists. The voice ID is already configured in the existing `elevenlabs-tts` function.

d) **Guard rails**: The system prompt explicitly instructs the AI:
   - Only respond as the named protagonist
   - Only reference events, characters, and world from the specific book
   - Refuse to break character or discuss real-world topics
   - If asked about something outside the book, respond in-character ("I don't know what you mean by that...")

**Files changed**:
- `supabase/functions/protagonist-chat/index.ts` -- new edge function
- `src/components/ProtagonistChatModal.tsx` -- new chat modal component
- `src/components/BookCard.tsx` -- add "Chat" button to trigger the modal

---

## Summary of All Changes

| File | Change |
|------|--------|
| `src/components/BookBrowserHeader.tsx` | Add `author_books` search query |
| `src/components/BookForm/BookSearchSection.tsx` | Fetch author books on selection |
| `src/components/BookSearchInput.tsx` | Accept `authorBooks` prop for quick title selection |
| `src/components/BookCard.tsx` | Add Preview button, protagonist display, Chat button |
| `src/services/transmissionsService.ts` | Add `protagonist` field |
| `supabase/migrations/...` | Add `protagonist` column to transmissions |
| `supabase/functions/protagonist-chat/index.ts` | New protagonist roleplay chat endpoint |
| `src/components/ProtagonistChatModal.tsx` | New voice/text chat modal |

## Implementation Order

1. Signal Archive search fix (quick data fix)
2. Author title dropdown in Log Signal
3. Preview button on transmissions
4. Protagonist name column and display
5. Protagonist voice chat modal and edge function

