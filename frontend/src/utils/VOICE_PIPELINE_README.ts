// Voice Pipeline Cleanup Notes (MYA-1167)
// This file exists because the workspace currently restricts writing Markdown files at the repo root.
// Content mirrors what would normally live in README.md

export const VOICE_PIPELINE_NOTES = `
Cottage Tandoori – Voice Pipeline Cleanup (MYA-1167)

What's new
- Unified mic/VAD utility: ui/src/utils/audioPipeline.ts
  - Shared mic capture for both Ultravox/LiveKit (WebRTC) and Gemini Live paths
  - Simple RMS-based VAD available but OFF by default
- Feature flag: voice_pipeline_v1 (default OFF)
  - Toggle via URL: ?ff_voice_pipeline_v1=1
  - Or localStorage: localStorage.setItem('ff_voice_pipeline_v1','1')
- Deprecated experiment removed: src/app/apis/gemini_voice_test

Current vs. deprecated paths
- Current
  - Ultravox/LiveKit WebRTC: ui/src/utils/webrtcVoiceClient.ts (OnlineOrders/POS)
  - Google Gemini Live SDK: ui/src/utils/geminiVoiceClient.ts (labs/voice modals)
- Deprecated (removed)
  - Backend WebSocket tests: src/app/apis/gemini_voice_test/__init__.py

Regression checklist
- Build compiles (frontend + backend hot reload OK)
- OnlineOrders page loads, voice button behavior unchanged
- POSDesktop loads with no console or backend errors
- Starting/stopping voice in Gemini Voice Lab still works
- No references to gemini_voice_test remain in code

How to test quickly
1) Open OnlineOrders and POSDesktop – ensure no new console errors.
2) In Gemini Voice Lab, start/stop a session – audio streams and replies play.
3) Optionally enable VAD: append ?ff_voice_pipeline_v1=1 to the URL and repeat (no UX change expected).

Rollback plan
- Revert this commit to restore previous separate mic code and the removed API file.

Notes
- No schema changes. No secrets changed. Ultravox/LiveKit behavior unchanged.
`;
