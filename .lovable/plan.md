

# Voice Mode: Definitive Fix

## What is actually going wrong

The edge function logs prove tokens generate successfully every time (status 200, token length 771). The WebRTC connection establishes -- `wasConnectedRef` becomes `true`. Then the session drops within seconds, showing "Connection lost."

The root cause is a **combination of three issues**:

### Issue 1: `sendUserMessage` is unreliable (known ElevenLabs bug #183)

The previous fix sent `sendUserMessage("*You sense someone approaching...*")` after connection to trigger a greeting. However, ElevenLabs GitHub Issue #183 documents that `sendUserMessage` "stops working randomly" -- the agent sometimes ignores text messages entirely and only responds to voice. When the agent ignores the text message, the session falls silent, and the inactivity timeout kills it.

### Issue 2: No keepalive mechanism

ElevenLabs documentation explicitly states that `sendUserActivity()` is the way to "reset the turn timeout timer" and prevent inactivity disconnects. The current code has zero keepalive logic. Even if the initial greeting works, any pause in conversation triggers the server-side timeout.

### Issue 3: Double `getUserMedia` call conflicts on iOS

The code calls `navigator.mediaDevices.getUserMedia({ audio: true })` on line 158 to check permissions, then the ElevenLabs SDK internally calls it again during `startSession()`. On iOS Safari, having two active media streams can cause the second to fail silently or the first to block the second, resulting in the SDK getting no audio input.

## Why every previous fix failed

| Attempt | What it did | Why it failed |
|---------|------------|---------------|
| 1 | Switched WebSocket to WebRTC | Connection protocol was never the problem |
| 2 | Moved overrides from hook to startSession | Overrides are disabled in agent dashboard |
| 3 | Removed overrides, used sendContextualUpdate | Context doesn't trigger agent to speak, inactivity timeout |
| 4 | Added sendUserMessage after context | sendUserMessage is unreliable (known bug), no keepalive |

## The fix (three changes)

### 1. Add keepalive interval using `sendUserActivity()`

After connection, start a 15-second interval that calls `conversation.sendUserActivity()`. This resets the ElevenLabs inactivity timer continuously, preventing server-side timeouts. Clear the interval on disconnect or unmount.

### 2. Make the initial greeting more resilient

Keep the `sendContextualUpdate` + `sendUserMessage` approach (it works most of the time), but add a fallback: if no `agent_response` message is received within 5 seconds of sending the user message, re-send it once. This handles the known unreliability.

### 3. Fix the iOS microphone conflict

Stop calling `getUserMedia` separately before `startSession`. Instead, wrap the entire flow in a try/catch and handle `NotAllowedError` from `startSession` itself. This lets the SDK manage its own single media stream, avoiding the dual-stream conflict on iOS.

## File changes

### `src/components/ProtagonistVoiceMode.tsx`

- Add a `keepaliveRef` for the `setInterval` handle
- After `voiceState === "connected"`, start `setInterval(() => conversation.sendUserActivity(), 15_000)`
- Clear the interval in `onDisconnect`, `endSession`, and unmount cleanup
- Remove the standalone `getUserMedia` call; let `startSession` handle it and catch `NotAllowedError` from the startSession catch block
- Add a `greetingReceivedRef` and a 5-second timeout after `sendUserMessage` -- if no `agent_response` arrives, re-send the user message once
- Track `agent_response` in the existing `handleMessage` callback to set `greetingReceivedRef`

No edge function changes needed -- the token generation is working perfectly.

## Technical detail

```text
FIXED FLOW:
Mount -> startSession(token, webrtc)
  -> SDK internally calls getUserMedia
  -> onConnect fires
  -> sendContextualUpdate(protagonist context)
  -> 500ms delay -> sendUserMessage("introduce yourself")
  -> Start keepalive: sendUserActivity() every 15s
  -> If no agent_response in 5s -> retry sendUserMessage once
  -> Agent speaks, user responds, conversation flows
  -> Keepalive prevents any silence-based timeout
  -> User clicks "Return to chat" -> endSession -> cleanup intervals
```

