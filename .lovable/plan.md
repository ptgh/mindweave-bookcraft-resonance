

# Protagonist Mission Mode — Interactive Narrative Adventures

## Concept

Add a **"Go on a Mission"** mode alongside the existing chat. Instead of freeform conversation, the protagonist leads the user through a branching interactive adventure set within the book's world. The AI acts as both the protagonist companion and narrator, presenting situations, describing environments, and offering choices — all strictly within the novel's setting and lore.

## How It Works

The user opens the protagonist chat as usual, but now sees a second tab or button: **"Go on a Mission"**. When activated:

1. The AI generates an opening scene set in the book's world, with the protagonist addressing the user directly as a companion
2. Each AI response ends with **2-3 choices** presented as tappable buttons (not free text)
3. The user picks a choice (or types a custom action)
4. The narrative branches based on their decision
5. Missions have a natural arc: setup → tension → climax → resolution (roughly 8-15 exchanges)
6. At the end, a brief mission summary is shown

The entire experience stays within the novel's world. The protagonist never breaks character.

## Architecture

### Backend: New Edge Function `protagonist-mission`

A dedicated edge function with a mission-specific system prompt that instructs the AI to:
- Act as narrator + companion (the protagonist)
- Describe scenes vividly in 2nd person ("You step into the corridor...")
- End every response with a structured JSON block containing 2-3 choices
- Track mission state (active, phase, turn count)
- Use tool calling to return structured output (narrative text + choices array) instead of parsing markdown

The request body adds a `mode: 'mission'` field. Reuses the same `protagonist_conversations` and `protagonist_messages` tables with a `mission_id` metadata field to keep missions separate from regular chat.

### Frontend Changes

**ProtagonistChatModal.tsx** — Add a mode toggle:
- Two tabs in the header area: **"Chat"** (existing) and **"Mission"** (new)
- In Mission mode, the message area renders narrative text with atmospheric styling (slightly different background, italic scene descriptions)
- Below each AI message, render choice buttons extracted from the structured response
- A mission status indicator (e.g., "Chapter 2 of your mission")
- "End Mission" button to wrap up gracefully

**New component: `MissionChoiceButtons.tsx`**
- Renders 2-3 choice buttons with a subtle violet/cyan gradient border
- Each button sends the choice text as the next message
- Optional "Do something else..." free-text fallback

### Database

No new tables needed. Use existing `protagonist_messages` table. Add a `metadata` JSONB column (if not present) to tag messages as `mission` type and track mission state (turn count, active status).

### System Prompt (Mission Mode)

```text
You are ${protagonistName} from "${bookTitle}" by ${bookAuthor}.
You are guiding ${userPersona || 'a companion'} on a mission within your world.

RULES:
1. Narrate in second person for the user's actions ("You see...", "You hear...")
2. Speak as yourself in first person ("I think we should...", "Follow me...")
3. Every response MUST end with exactly 2-3 choices for the user
4. Keep within the world, characters, and locations of "${bookTitle}"
5. Build tension naturally over 8-15 exchanges
6. Never break character or reference the real world
```

Structured output via tool calling ensures choices are always parseable:
```json
{
  "narrative": "The corridor stretches ahead, dimly lit by...",
  "choices": [
    "Follow the sound deeper into the facility",
    "Search the abandoned terminal for clues",
    "Suggest heading back to regroup"
  ],
  "mission_phase": "rising_action",
  "turn": 3
}
```

## UI Flow

```text
┌─────────────────────────────────┐
│  Speaking with Winston Smith    │
│  from "1984" by George Orwell   │
│  [Chat]  [Mission]  [Voice]     │
├─────────────────────────────────┤
│                                 │
│  ┌─ NARRATIVE ──────────────┐   │
│  │ The telescreen flickers  │   │
│  │ as you follow me through │   │
│  │ the narrow alley behind  │   │
│  │ Victory Mansions...      │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐    │
│  │ ▸ Duck into the shop    │    │
│  ├─────────────────────────┤    │
│  │ ▸ Keep walking, act     │    │
│  │   natural                │    │
│  ├─────────────────────────┤    │
│  │ ▸ Ask about the poster  │    │
│  └─────────────────────────┘    │
│                                 │
│  [Type your own action...]      │
│  [End Mission]                  │
└─────────────────────────────────┘
```

## Implementation Steps

1. **Create `protagonist-mission` edge function** — mission-specific system prompt with tool calling for structured narrative + choices output
2. **Add mission mode toggle to `ProtagonistChatModal`** — tab switching between Chat and Mission, with mission-specific message rendering
3. **Build `MissionChoiceButtons` component** — renders choice buttons, handles selection, includes free-text fallback
4. **Style mission narrative differently** — atmospheric text rendering with scene descriptions visually distinct from regular chat bubbles
5. **Add mission lifecycle** — start mission prompt, turn tracking, natural conclusion after 8-15 turns, mission summary at end

## What Stays the Same

- All existing chat functionality untouched
- Same conversation persistence system
- Same voice mode access
- Same character rules (never breaks character, stays in-world)
- Same swipe-to-dismiss, portrait lightbox, etc.

