# Voice Mode: RESOLVED

## Fix Applied

The session was connecting successfully but disconnecting due to ElevenLabs' inactivity timeout — no one spoke first.

### Changes made to `src/components/ProtagonistVoiceMode.tsx`:

1. **Trigger agent greeting**: After `sendContextualUpdate`, a 500ms delayed `sendUserMessage("*You sense someone approaching. Introduce yourself.*")` triggers the agent to speak first in character.

2. **User-initiated vs server disconnect**: Added `userInitiatedEndRef` to distinguish between user clicking "Return to chat" (clean close) vs server-side timeout/drop (shows retry button).

3. **Error recovery on unexpected disconnect**: If `wasConnected` is true but user didn't initiate the end, shows "Connection lost. Tap to reconnect." instead of silent "Session ended".
