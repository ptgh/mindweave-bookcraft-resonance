

# Voice Mode: Root Cause Audit and Resolution

## What is actually happening

The edge function logs confirm tokens are generated successfully every time (status 200, token length 771). The WebRTC connection to ElevenLabs **does connect** -- evidenced by the UI showing "Session ended" (not an error), which means `wasConnectedRef.current` becomes `true` before `onDisconnect` fires.

**The session connects, then disconnects within seconds.**

## Why previous fixes were wrong

Every previous attempt focused on the connection phase (switching protocols, removing overrides, adding retries). The connection was never the problem -- it succeeds. The real issue is what happens **after** connection:

1. We removed `overrides` (including `firstMessage`) from `startSession()` to avoid the security rejection -- correct decision
2. We replaced it with `sendContextualUpdate()` to inject protagonist identity -- correct approach
3. **But `sendContextualUpdate` does NOT trigger the agent to speak.** It silently updates context without generating a response
4. The agent connects, receives context, then... silence. No first message. No agent greeting. Nothing happens
5. The ElevenLabs agent's **inactivity timeout** (configured in the dashboard, typically 10-30 seconds) kicks in and terminates the session
6. `onDisconnect` fires, `wasConnectedRef.current` is `true`, so state goes to `"idle"` which shows "Session ended"

**The agent is waiting for the user to speak first, but the user expects the character to introduce itself.** When nobody speaks, the agent's server-side inactivity timeout ends the session.

## The fix

After sending the contextual update with the protagonist's identity, we must **trigger the agent to speak** by sending an initial user message via `conversation.sendUserMessage()`. This prompts the agent to respond in-character, starting the conversation naturally.

### Changes to `src/components/ProtagonistVoiceMode.tsx`

In the `useEffect` that runs after `voiceState === "connected"`:

1. Call `conversation.sendContextualUpdate(protagonistContext)` -- inject the character identity (already done)
2. Immediately follow with `conversation.sendUserMessage("*You sense someone approaching. Introduce yourself.*")` -- this triggers the agent to respond with an in-character greeting
3. Add a small delay (500ms) between the context update and the user message to ensure the context is processed first

Additionally:
- When `onDisconnect` fires and `wasConnected` is true, instead of showing "Session ended" with no options, show a "Session ended. Tap to reconnect." button so the user can restart without going back to chat
- Add a `disconnectReasonRef` to capture whether the disconnect was user-initiated (via "Return to chat") vs server-initiated (inactivity timeout / error), and show different UI accordingly

### No edge function changes needed

The token generation is working perfectly. The issue is purely client-side session lifecycle.

### No ElevenLabs dashboard changes needed

The agent's default prompt handles general conversation. The `sendContextualUpdate` injects character-specific context, and `sendUserMessage` triggers the first response. This works entirely within the existing agent security settings.

---

## Technical Details

### Current broken flow

```text
Mount -> getUserMedia -> fetch token -> startSession
  -> onConnect fires -> sendContextualUpdate(context)
  -> SILENCE (no one speaks)
  -> Agent inactivity timeout (10-30s)
  -> onDisconnect fires -> "Session ended"
```

### Fixed flow

```text
Mount -> getUserMedia -> fetch token -> startSession
  -> onConnect fires -> sendContextualUpdate(context)
  -> wait 500ms -> sendUserMessage("introduce yourself")
  -> Agent speaks first greeting in character
  -> User responds -> natural conversation continues
```

### Code changes summary

**File: `src/components/ProtagonistVoiceMode.tsx`**

1. Update the post-connection `useEffect` (lines 98-108):
   - Keep `sendContextualUpdate` call
   - Add `setTimeout` of 500ms, then call `conversation.sendUserMessage(...)` with a brief roleplay prompt
   - This triggers the agent to deliver its first in-character greeting

2. Update the `onDisconnect` handler (lines 70-83):
   - Add a `userInitiatedEndRef` boolean that gets set to `true` in `endSession()`
   - In `onDisconnect`, if `wasConnected` is true AND user did NOT initiate the end, show "Connection lost. Tap to reconnect." with a retry button instead of plain "Session ended"
   - If user initiated, show "Session ended" as before

3. Update `endSession` (lines 217-225):
   - Set `userInitiatedEndRef.current = true` before calling `conversation.endSession()`

4. Update the idle state UI (around line 257-258):
   - When state is "idle" and NOT user-initiated, show retry button

These changes ensure the conversation starts immediately with the agent speaking in character, and unexpected disconnects give the user a way to reconnect without leaving voice mode.
