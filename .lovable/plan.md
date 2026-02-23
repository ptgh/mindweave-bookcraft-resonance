
# Fix Voice Mode: Switch from WebRTC to WebSocket Transport

## Root Cause (definitively proven by logs)

The ElevenLabs SDK's `handleErrorEvent` function crashes on a malformed error event from the agent. Critically, the SDK **disconnects the LiveKit room internally before the error propagates to JavaScript**. This is why every client-side error suppression attempt has failed -- by the time our code runs, the WebRTC room is already torn down. The DataChannel errors in the logs ("Unknown DataChannel error on lossy/reliable") confirm the LiveKit transport is the problem.

## The Fix: WebSocket Instead of WebRTC

The `useConversation` hook supports two connection types:
- **WebRTC** (via `conversationToken`) -- uses LiveKit rooms, DataChannels, has the bug
- **WebSocket** (via `signedUrl`) -- direct WebSocket connection, no LiveKit, no DataChannels

Both provide **real-time full duplex** conversation. Same SDK, same hook, same natural back-and-forth voice experience. The only difference is the transport layer.

## Changes

### 1. Edge Function: `supabase/functions/elevenlabs-conversation-token/index.ts`

Change the API endpoint from the token endpoint to the signed URL endpoint:

- **Current**: `GET /v1/convai/conversation/token?agent_id=...` (returns `{ token }`)
- **New**: `GET /v1/convai/conversation/get-signed-url?agent_id=...` (returns `{ signed_url }`)

The function will return `{ signed_url }` instead of `{ token }`.

### 2. Client: `src/components/ProtagonistVoiceMode.tsx`

Change `startSession` call:

- **Current**: `conversation.startSession({ conversationToken: token })`
- **New**: `conversation.startSession({ signedUrl: signedUrl })`

Update the token-fetching logic to read `data.signed_url` instead of `data.token`.

Everything else stays exactly the same:
- Same `useConversation` hook with same callbacks
- Same keepalive interval (5s `sendUserActivity`)
- Same deferred context injection (wait for first agent message)
- Same `sendContextualUpdate` + `sendUserMessage` flow
- Same UI, animations, and pulse rings
- Same error handling and retry logic
- The `unhandledrejection` handler stays as a safety net

### 3. No Other Changes

- No new dependencies
- No new edge functions
- No UI changes
- Still real-time, full duplex, natural conversation

## Why This Will Work

WebSocket transport bypasses the entire LiveKit stack (rooms, DataChannels, ICE negotiation). The malformed error event that crashes `handleErrorEvent` is specific to the LiveKit/WebRTC message handling path. With WebSocket, messages flow over a simple WebSocket connection -- the same proven transport used by countless ElevenLabs integrations.
