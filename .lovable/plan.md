

# Voice Mode Audit and Resolution Plan

## Root Cause Analysis

After thorough investigation, here is exactly why the voice feature fails:

### What happens now
1. The edge function successfully generates a WebRTC token (confirmed via logs and direct API test)
2. The client calls `conversation.startSession()` with `overrides` containing a custom system prompt, first message, and language
3. **The ElevenLabs agent immediately rejects the session** because overrides are disabled by default in the agent's security settings
4. The SDK fires `onDisconnect` but the code only transitions from "connecting" to "idle" (line 57: `setVoiceState(prev => prev === "error" ? "error" : "idle")`), which shows "Starting session..." indefinitely since `voiceState` becomes `"idle"` and the label for idle is "Starting session..."
5. No error is surfaced to the user

### Why previous fixes didn't work
- **First attempt**: Switched from WebSocket to WebRTC -- correct protocol, but didn't address the overrides rejection
- **Second attempt**: Moved overrides from `useConversation` to `startSession` -- this addresses a different SDK bug (#92) but the real problem is that overrides must be **explicitly enabled in the ElevenLabs dashboard** for agent `agent_8501khxttz5zf9rt0zpn1vtkv1qj`. Without that, any override causes session abort
- Neither attempt checked whether the agent's security settings actually permit overrides

### The silent failure bug
When `startSession` fails due to rejected overrides, `onError` is NOT always called. Instead, `onDisconnect` fires, setting state to `"idle"`, which displays "Starting session..." with no retry option -- the user is stuck.

---

## Resolution Plan

### 1. Remove client-side overrides entirely (eliminate the root cause)

Instead of passing dynamic overrides (which require dashboard configuration that may not be set), configure the agent's default system prompt directly in the ElevenLabs dashboard to be a generic protagonist prompt, then pass character-specific context via `customLlmExtraBody` or remove overrides and rely on the agent's configured prompt.

**The robust approach**: Remove all `overrides` from `startSession()` and let the agent use its dashboard-configured prompt. Since the agent is already configured for protagonist roleplay, this eliminates the override rejection entirely.

If character-specific prompts are needed, there are two options:
- **Option A**: Enable overrides in the ElevenLabs dashboard (Security tab) for the agent, then keep current code
- **Option B**: Use `sendContextualUpdate()` after connection to inject character context without requiring override permissions

**Recommended: Option B** -- connect first without overrides, then use `sendContextualUpdate()` to inject the protagonist's identity after connection is established. This is the most robust approach.

### 2. Fix the silent failure state machine

The current state machine has a critical bug: when `onDisconnect` fires during the connecting phase, the state goes to `"idle"` which shows "Starting session..." with no way out.

Fix:
- Track whether we ever reached `"connected"` state
- If `onDisconnect` fires and we were never connected, treat it as an error
- Add a connection timeout (e.g. 15 seconds) that triggers error state if we never connect

### 3. Improve error recovery

- The `sessionStartedRef` guard prevents retry after certain failures -- needs to be reset in more failure paths
- Add a visible connection timeout so users aren't stuck on "Starting session..."
- Show meaningful error messages for different failure modes

### 4. Handle the microphone stream lifecycle

On iOS Safari, the media stream can be garbage-collected if not held in a ref. The current code requests `getUserMedia` but doesn't store the stream reference -- the ElevenLabs SDK manages its own stream internally, but requesting early can cause issues on iOS where the permission prompt timing matters.

---

## Technical Implementation

### File: `src/components/ProtagonistVoiceMode.tsx`

Changes:
- Remove `overrides` from `startSession()` call entirely
- After `onConnect` fires, call `conversation.sendContextualUpdate()` with the protagonist context
- Add `wasConnectedRef` to track if connection was ever established
- Add 15-second connection timeout that triggers error state
- Fix `onDisconnect` handler to detect "never connected" scenario and show error
- Ensure `sessionStartedRef` is properly reset on all failure paths
- Add better error classification and user-facing messages

### File: `supabase/functions/elevenlabs-conversation-token/index.ts`

Add diagnostic logging:
- Log the full response from ElevenLabs token API (not just success/fail)
- Add subscription/quota check endpoint call to verify API key health

### No changes needed to:
- `supabase/config.toml` (already has `verify_jwt = false` for the token function)
- Package version (0.14.0 is current)

---

## Quality Improvements

- **Connection status feedback**: Show "Connecting to [protagonist name]..." with a subtle animated indicator
- **Timeout with graceful fallback**: After 15 seconds, show "Connection taking longer than expected" with a retry button rather than hanging indefinitely
- **iOS-specific handling**: Ensure audio context is resumed on user interaction (iOS requires user gesture for audio playback)
- **Clean disconnection**: Properly end the session and release the microphone when returning to chat or on component unmount

