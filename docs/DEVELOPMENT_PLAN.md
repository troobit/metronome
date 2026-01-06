# Metronome App — Development Plan

**Last Updated:** 2026-01-06
**Current Phase:** Phase 7 — iOS Background Audio & State Synchronization
**Repository:** <https://github.com/troobit/metronome>

---

## 🤖 Claude Code: How to Use This Plan

**This document is YOUR source of truth for project progress and next steps.**

### Your Responsibilities

1. **Check this plan FIRST** when starting any work session
2. **Update progress** after completing any phase or task
3. **Mark checkboxes** as tasks are completed using `[x]`
4. **Update the "Last Updated" date** whenever you modify this file
5. **Update "Current Phase"** when transitioning to a new phase
6. **Consult the user** before skipping or reordering phases

### When to Update This Plan

- ✅ After completing any checklist item
- ✅ When starting a new phase
- ✅ When discovering additional tasks that should be tracked
- ✅ After major architectural decisions
- ✅ When the user asks "what's next?" (check this plan first!)

### How to Reference This Plan

When the user asks about progress or next steps:

```text
"Let me check the development plan..."
[Read DEVELOPMENT_PLAN.md]
"According to the plan, we've completed Phases 0-3. Phase 4 (Core Audio Engine) is next."
```

### Integration with Todo System

- Use TodoWrite for **intra-phase task tracking** (implementation details)
- Use this plan for **inter-phase progress tracking** (milestones)
- When completing a phase, update both the todos AND this plan

---

## Operating Principles (Non-Negotiable)

### Documentation ships with code

- Every phase includes explicit documentation tasks.
- No phase is considered done until its docs are updated.

### Pipelines stay green from day 1

- A CI workflow must exist and pass as soon as the Vite scaffold exists.
- Deployment workflows must be **non-failing by default** (no required secrets on day 1). Deploy steps should be conditional and skipped when secrets are not configured.

---

## Documentation Requirements (Line-Linked)

### Rule: Line-linked docs are added incrementally

- When a module is first introduced, docs must at least link to the file path.
- After the module stabilizes (no major refactors expected), add GitHub-style line anchors.

Example (to be updated when files exist): [src/utils/audioEngine.ts](src/utils/audioEngine.ts#L1-L200)

### Required docs to create and maintain

- docs/ARCHITECTURE.md ✅ CREATED
  - ✅ Includes system overview Mermaid diagram
  - ✅ Updated with actual implementation details
- docs/AUDIO_ENGINE.md ✅ CREATED
  - ✅ Includes look-ahead scheduling sequence diagram and AudioContext lifecycle diagram
  - ✅ Links to scheduler constants and implementation
  - ✅ Describes why JS timers jitter and why audio scheduling must use `AudioContext.currentTime`
- docs/TIME_SIGNATURES.md ✅ CREATED
  - ✅ Documents time signature support and accent patterns
  - ✅ Explains compound meter implementation
- docs/CLAUDE_CODE_GUIDE.md ✅ CREATED
  - Comprehensive guide for using Claude Code with this project
  - Explains agent system, MCP integration, and effective workflows
- docs/STORAGE.md ✅ CREATED
  - Documents localStorage implementation
  - Explains export/import JSON functionality
  - Describes future IndexedDB plans for presets

---

## Progress Summary

### Phases 0-6 (Core), 8 Complete

The project foundation, core UI, persistence, and deployment pipeline are fully established:

- **Stack:** Vite + React + TypeScript with pnpm, Tailwind CSS v4
- **Quality:** ESLint, Prettier, CI pipeline (lint/build/format/docs checks all passing)
- **Audio Engine:** [src/utils/audioEngine.ts](src/utils/audioEngine.ts) implements Web Audio API with look-ahead scheduling
  - Look-ahead: 100ms window, 25ms tick interval
  - Click synthesis: 950Hz (primary accent), 875Hz (secondary), 800Hz (regular)
  - Time signatures: 1-99 beats per bar, power-of-2 beat units (1, 2, 4, 8, 16, 32, 64)
  - Secondary accents for compound meters (6/8, 9/8, 12/8)
  - Tempo linking: Optional BPM adjustment when beat unit changes
  - Tempo range: 30-900 BPM (engine), 30-600 BPM (UI)
  - Volume control: Master gain node (0.0-1.0)
- **UI Features:** [src/App.tsx](src/App.tsx)
  - Tempo controls with slider and tap tempo
  - Time signature controls with keyboard navigation
  - Volume control with mute button
  - Light/dark mode with smooth transitions
  - Visual beat grouping for compound time signatures
  - Smooth animations and polished button interactions
- **Persistence:** [src/utils/storage.ts](src/utils/storage.ts)
  - localStorage for critical settings (auto-saves on change)
  - Export/Import JSON for backup and data portability
  - IndexedDB presets system (planned for future)
- **Documentation:** ARCHITECTURE.md, AUDIO_ENGINE.md, TIME_SIGNATURES.md, STORAGE.md, CLAUDE_CODE_GUIDE.md all created with line links

## Phased Delivery Plan (Amalgamated)

### Phase 5 — Core UI ✅ COMPLETE

**Completed:** 2026-01-06

- [x] App shell with tempo and time signature controls
- [x] Beat indicator synchronized to beat callbacks with accent colors
- [x] Start/stop button
- [x] Mobile-first layout with touch-friendly controls (44x44px minimum)
- [x] Tempo slider with BPM range 30-600
- [x] Time signature controls (numerator/denominator with increment/decrement buttons)
- [x] Tempo linking toggle (adjusts BPM when beat unit changes)
- [x] Tap tempo (averages last 8 taps, 2s auto-reset)
- [x] Volume control (slider with mute button, 0-100%)
- [x] Light/dark mode toggle with smooth transitions
- [x] Visual grouping for compound time signatures (6/8, 9/8, 12/8)
- [x] Button and animation polish (smooth transitions, beat pulse animation)
- [x] Docs gate: update docs/ARCHITECTURE.md with final implementation details

### Phase 6 — Persistence (Tiered) ✅ CORE COMPLETE

**Core Features Completed:** 2026-01-06

- [x] localStorage for critical settings (tempo, time signature, volume, dark mode, link tempo)
  - Auto-saves on every change
  - Lazy initialization on app start
  - Graceful fallback to defaults
- [x] Export/Import JSON (mandatory)
  - Export to dated JSON file
  - Import with validation
  - UI buttons at bottom of app
- [x] Docs gate: create docs/STORAGE.md with implementation details
- [x] Update ARCHITECTURE.md with persistence layer

**Future Enhancements:**

- [ ] Dexie/IndexedDB for presets
  - Save named configurations
  - Quick switching between presets
  - Optional practice session history

### Phase 7 — iOS Background Audio & State Synchronization 🚨 HIGH PRIORITY

**Status:** Pending
**Priority:** Critical mobile UX issue

#### Problem Statement

The metronome has critical iOS issues that severely impact mobile usability:

1. **Audio Interruption**: Audio stops when:
   - User switches browser tabs
   - Browser loses window focus
   - Device screen is locked

2. **State Desynchronization**: When iOS silently stops audio (e.g., screen lock), the app's internal state remains "playing," causing:
   - Incorrect UI play/pause state
   - Start/stop button becomes non-functional
   - Requires force-refresh to recover

This is a critical UX issue—requiring constant screen-on drains battery significantly, and state desync makes the app unusable after screen lock.

#### Implementation Tasks

- [ ] **Media Session API Integration**
  - Register app as active audio source using `navigator.mediaSession`
  - Set metadata (title, artist, artwork) for iOS lock screen controls
  - Handle media session action handlers (play, pause, stop)

- [ ] **AudioContext State Monitoring**
  - Listen to `AudioContext.onstatechange` event
  - Detect when iOS suspends/interrupts audio (state: "suspended", "interrupted")
  - Automatically sync internal `isPlaying` state when AudioContext state changes
  - Log state transitions for debugging

- [ ] **Visibility Change Handlers**
  - Listen to `visibilitychange` event
  - Attempt to keep AudioContext alive during tab switches
  - Resume AudioContext when tab becomes visible again

- [ ] **State Synchronization Logic**
  - Update internal `_isPlaying` flag when AudioContext is interrupted
  - Notify React component when state changes externally (via callback)
  - Ensure UI accurately reflects actual audio playback status
  - Clear scheduler interval when audio is forcibly stopped

- [ ] **User Notification for Interruptions**
  - Display clear UI feedback when audio was interrupted
  - Show message if manual interaction is required to resume (iOS gesture requirement)
  - Add dismiss button for interruption notifications
  - Gracefully handle external audio source interruptions (allow them to stop metronome)

- [ ] **iOS-Specific Keep-Alive Techniques**
  - Experiment with silent audio track or oscillator as keep-alive
  - Test different approaches for maintaining AudioContext during screen lock
  - Document which techniques work and battery impact

- [ ] **Testing & Validation**
  - Test on iOS Safari and Chrome on iOS
  - Verify audio continues during tab switches
  - Verify audio continues when browser loses focus
  - Test screen lock behavior (continue or graceful handling)
  - Verify stop/start button works after interruption
  - Confirm state stays synchronized
  - Ensure desktop functionality remains unaffected
  - Measure battery impact

- [ ] **Documentation**
  - Update docs/AUDIO_ENGINE.md with iOS-specific behavior
  - Document limitations and workarounds
  - Add troubleshooting section for iOS audio issues

#### Technical Notes

- iOS AudioContext states: "running", "suspended", "closed", "interrupted" (iOS-specific)
- `navigator.mediaSession` helps prevent OS-level audio interruption
- AudioContext may require user gesture to resume after interruption
- When iOS interrupts with another audio source, allow it (stop metronome gracefully)
- Silent audio tracks may help keep-alive but have battery implications
- All iOS-specific code should be conditional to avoid affecting desktop

#### Acceptance Criteria

- ✅ Audio continues uninterrupted when switching tabs
- ✅ Audio continues when browser loses focus
- ✅ Audio continues when screen is locked (or gracefully handles iOS limitations)
- ✅ App state correctly reflects actual audio playback status after screen lock/unlock
- ✅ Stop/start button functions correctly after audio interruption
- ✅ User is notified if manual interaction is required to resume audio
- ✅ Battery impact is minimized (no unnecessary wake locks or polling)
- ✅ Graceful fallback if background audio is unsupported
- ✅ Desktop functionality remains unaffected

---

### Phase 8 — PWA (Offline)

- [ ] Install and configure `vite-plugin-pwa`
  - `registerType: 'autoUpdate'`
  - include icons + manifest
  - enable `devOptions.enabled` for dev testing if desired
- [ ] Create `public/` icons (192/512 + apple-touch)
- [ ] Verify offline after first load (`pnpm run build` + `pnpm run preview`)

---

## Overall Acceptance Criteria

- Metronome audio timing is stable across UI load and window interactions
- UI reflects beats (may lag slightly, but doesn't affect audio accuracy)
- Settings persist across sessions; presets persist when IndexedDB is available
- Export/Import JSON works
- iOS background audio works or gracefully handles interruptions with proper state sync
- PWA installs and works offline after first load
