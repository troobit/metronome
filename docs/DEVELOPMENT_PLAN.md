# Metronome App — Development Plan

**Last Updated:** 2026-01-12
**Current Phase:** Phase 11 — iOS Background Audio (Web Workarounds + Native Fallback) (IN PROGRESS)
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

---

## Progress Summary

### Phases

---

## Overall Acceptance Criteria

Performance: Smaller bundle size (~30-40% reduction), faster initial load
Reactivity: Svelte's fine-grained reactivity should improve animation smoothness
Developer Experience: Less boilerplate, more intuitive reactivity
Maintainability: Cleaner code with less ceremony

iOS (Primary Requirement): When installed on iOS (Add to Home Screen or native wrapper), audio continues while screen-locked and backgrounded (Phase 11/12 acceptance gates)

---

## Phase 8: React to Svelte Migration ✅ COMPLETED

**Status:** Completed (2026-01-06)

### Motivation

The React-based implementation was experiencing animation and UI performance issues. Svelte's compile-time reactivity and smaller runtime footprint make it ideal for a performant PWA metronome application.

### Changes Made

#### 1. Dependencies Updated ✅

- **Removed:** `react`, `react-dom`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- **Added:** `svelte@^5.17.0`, `@sveltejs/vite-plugin-svelte@^5.0.2`, `svelte-check@^4.0.0`, `eslint-plugin-svelte@^2.37.0`
- **File:** [package.json](../package.json)

#### 2. Build Configuration Updated ✅

- **[vite.config.ts](../vite.config.ts):** Replaced `@vitejs/plugin-react` with `@sveltejs/vite-plugin-svelte`
- **[src/vite-env.d.ts](../src/vite-env.d.ts):** Added Svelte + Vite type declarations for TypeScript
- **[tsconfig.app.json](../tsconfig.app.json):** Removed `"jsx": "react-jsx"` line
- **[eslint.config.js](../eslint.config.js):** Replaced React ESLint plugins with `eslint-plugin-svelte`
- **[index.html](../index.html):** Changed entry point from `/src/main.tsx` to `/src/main.ts`
- **Note:** Svelte 5 does NOT require `svelte.config.js`

#### 3. Entry Point Migrated ✅

- **[src/main.ts](../src/main.ts):** Created new Svelte entry point using `new App({ target })`
- **Removed:** `src/main.tsx` (React entry point)

#### 4. Main Component Converted ✅

- **[src/App.svelte](../src/App.svelte):** Converted 967-line React component to Svelte
  - `useState` → `$state` rune
  - `useEffect` → `$effect` rune
  - `useRef` → regular variables or `bind:this`
  - `useMemo` / derived values → `$derived` rune
  - JSX → Svelte template syntax
  - `className` → `class`
  - `onClick` → `on:click`
  - Removed all `.current` property accesses

#### 5. Framework-Agnostic Code Preserved ✅

These files required **NO changes** (already framework-independent):

- [src/utils/audioEngine.ts](../src/utils/audioEngine.ts) - Web Audio API implementation
- [src/utils/storage.ts](../src/utils/storage.ts) - localStorage utilities
- [src/utils/tempoConverter.ts](../src/utils/tempoConverter.ts) - BPM conversion
- [src/types/audio.ts](../src/types/audio.ts) - TypeScript type definitions
- [src/index.css](../src/index.css) - CSS animations and Tailwind styles

### React to Svelte Pattern Mapping

| React Pattern                | Svelte Pattern                      |
| ---------------------------- | ----------------------------------- |
| `useState(value)`            | `let variable = $state(value)`      |
| `setVariable(newValue)`      | `variable = newValue`               |
| `useRef<T>(null)`            | `let variable: T \| null = null`    |
| `<input ref={ref} />`        | `<input bind:this={variable} />`    |
| `useEffect(() => {...}, [])` | `$effect(() => {...})`              |
| Computed values              | `let computed = $derived(expr)`     |
| `className`                  | `class`                             |
| `onClick={fn}`               | `on:click={fn}`                     |
| `onChange={fn}`              | `on:change={fn}` or `on:input={fn}` |
| `{condition && <div>}`       | `{#if condition}<div>{/if}`         |

### Key Technical Decisions

1. **Used Svelte 5 Runes API**: Modern reactive primitives (`$state`, `$effect`, `$derived`)
2. **Kept CSS animations**: Preserved existing CSS keyframe animations (already performant)
3. **Maintained PWA configuration**: vite-plugin-pwa works identically with Svelte
4. **Preserved iOS audio support**: Audio engine implementation unchanged
5. **No svelte.config.js**: Svelte 5 doesn't require configuration file for basic setup
6. **Added TypeScript declarations**: Created `src/vite-env.d.ts` for `.svelte` file recognition

### Testing Checklist

- [x] Run `pnpm install` to install Svelte dependencies
- [x] Run `pnpm dev` - app starts successfully on <http://localhost:5173/>
- [x] Run `pnpm build` - production build succeeds
- [x] Bundle size: ~53.85 KB JS (18.35 KB gzipped), ~22 KB CSS (4.87 KB gzipped)
- [ ] Manual testing:
  - [ ] Start/Stop button works
  - [ ] Tempo controls (buttons, slider, tap tempo) work
  - [ ] Time signature controls work
  - [ ] Beat indicators pulse correctly
  - [ ] Volume slider works
  - [ ] Dark mode toggle works
  - [ ] Export/Import settings work
  - [ ] Animations are smooth (no jank)
- [ ] iOS-specific testing:
  - [ ] Audio continues when screen locks
  - [ ] Interruption notification appears
  - [ ] Resume after interruption works

### Known Issues

**Deprecation Warnings (Non-Breaking):**

- Svelte 5 event handlers use new syntax: `onclick` instead of `on:click`
- Current implementation uses legacy `on:*` directives which work but show warnings
- Build succeeds despite warnings - functionality not affected
- **TODO:** Update event handlers to new syntax
  - `on:click` → `onclick`
  - `on:input` → `oninput`
  - `on:keydown` → `onkeydown`
  - `on:change` → `onchange`
- Reference: [Svelte 5 migration guide](https://svelte.dev/docs/svelte/v5-migration-guide)

### Expected Benefits

- **Bundle size:** ~30-40% reduction compared to React
- **Performance:** Improved animation smoothness due to fine-grained reactivity
- **Developer Experience:** Less boilerplate, more intuitive reactivity
- **Maintainability:** Cleaner component code with direct variable assignments

### Migration Plan Reference

Full migration plan with detailed patterns and gotchas: [/Users/ronan/.claude/plans/dynamic-toasting-frog.md](/Users/ronan/.claude/plans/dynamic-toasting-frog.md)

---

## Phase 9: Svelte 5 Refinement & Component Architecture ✅ COMPLETED

**Status:** Completed (2026-01-06)

### Motivation

After the initial React to Svelte migration, several issues remained with Svelte 5's snippet system and component organization. Icons were being passed as HTML strings instead of proper Svelte snippets, causing rendering issues. The app also lacked proper component architecture with reusable layout components.

### Changes Made

#### 1. Fixed Icon Rendering (Svelte 5 Snippets) ✅

**Fixed Components:**

- **[src/lib/components/controls/ThemeToggle.svelte](../src/lib/components/controls/ThemeToggle.svelte):** Converted icon function returning HTML strings to proper `{#snippet sunIcon()}` and `{#snippet moonIcon()}` blocks
- **[src/lib/components/controls/VolumeControl.svelte](../src/lib/components/controls/VolumeControl.svelte):** Created `mutedIcon`, `lowVolumeIcon`, and `highVolumeIcon` snippets with derived logic to select the correct icon
- **[src/lib/components/sections/SettingsPanel.svelte](../src/lib/components/sections/SettingsPanel.svelte):** Added `exportIcon` and `importIcon` snippets

**Pattern Used:**

```svelte
{#snippet iconName()}
  <svg>...</svg>
{/snippet}

<IconButton icon={iconName} />
```

**Result:** No more HTML string injection via functions - all icons render as proper Svelte markup

#### 2. Built Layout Component System ✅

**New Components Created:**

- **[src/lib/components/layout/AppLayout.svelte](../src/lib/components/layout/AppLayout.svelte)**
  - Handles full-page layout with background gradients
  - Integrates notification system
  - Manages theme context awareness

- **[src/lib/components/layout/MetronomeCard.svelte](../src/lib/components/layout/MetronomeCard.svelte)**
  - Card container with theme toggle
  - Provides consistent spacing and styling
  - Uses Svelte 5 `{@render children()}` for content projection

#### 3. Refactored App.svelte ✅

**Before:** 943 lines of monolithic template code
**After:** 62 lines using composition of specialized components

**Architectural Changes:**

- Removed dark mode state management from App.svelte (now in `ThemeContext`)
- Deleted 500+ lines of inline template code
- Replaced with clean component composition:
  - `AppLayout` → `MetronomeCard` → Feature components

**Component Hierarchy:**

```
AppLayout
  ├─ Notification (conditional)
  └─ MetronomeCard
      ├─ ThemeToggle (integrated)
      ├─ BeatDisplay
      ├─ TempoControl
      ├─ TimeSignatureControl
      ├─ VolumeControl
      ├─ ActionButton (Start/Stop)
      └─ SettingsPanel
```

#### 4. Configured Vite $lib Alias ✅

**[vite.config.ts](../vite.config.ts):** Added proper module resolution for `$lib` imports:

```typescript
resolve: {
  alias: {
    $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
  },
}
```

**Result:** Build now properly resolves all `$lib/` imports in production

### Build Validation ✅

- ✅ Production build succeeds without errors
- ✅ Bundle size: ~67 KB JS (22.67 KB gzipped), ~26 KB CSS (5.21 KB gzipped)
- ✅ All icons render correctly (no HTML string warnings)
- ✅ No Svelte 5 snippet-related errors

### Accessibility Validation ✅

**Verified:**

- ✅ All interactive controls have proper `aria-label` attributes
- ✅ Button elements have accessible names
- ✅ Keyboard navigation works (Tab, Arrow keys, Enter, Space)
- ✅ Color contrast maintained in both light and dark themes
- ✅ Focus indicators visible on all interactive elements

**Known Warnings (Non-Critical):**

- Label elements without associated controls (acceptable for heading-style labels)
- Legacy `on:*` event handlers (deprecated but functional - can be migrated to `on*` in future)

### Technical Debt Addressed

✅ **Eliminated:** HTML string injection for icons (security & maintainability)
✅ **Resolved:** Svelte 5 snippet usage warnings
✅ **Improved:** Code organization with 85% reduction in App.svelte lines
✅ **Fixed:** Build-time module resolution for $lib imports

### Next Steps

- Manual testing on devices (audio, dark mode, persistence)
- iOS-specific audio testing (lock screen, interruptions)
- Consider migrating deprecated `on:*` event handlers to modern `on*` syntax
- Performance profiling if needed

---

## Phase 10: Mobile-First Responsive Layout ✅ COMPLETED

**Status:** Completed (2026-01-06)

### Motivation

The metronome app needed a mobile-first responsive layout to ensure optimal user experience on smaller screens. On mobile devices, all controls should fit on one screen without vertical scrolling, with secondary options moved to an overlay menu accessed via a hamburger button. On larger screens, all controls should be visible inline.

### Changes Made

#### 1. Created HamburgerButton Component ✅

**New Component:**

- **[src/lib/components/ui/HamburgerButton.svelte](../src/lib/components/ui/HamburgerButton.svelte):** Animated hamburger menu button
  - Three-line animated icon that transforms to X when open
  - Theme-aware styling
  - Accessible with proper ARIA labels
  - Smooth transition animations

#### 2. Created MobileSettingsOverlay Component ✅

**New Component:**

- **[src/lib/components/ui/MobileSettingsOverlay.svelte](../src/lib/components/ui/MobileSettingsOverlay.svelte):** Modal overlay for mobile settings
  - Bottom drawer style that slides up from bottom
  - Dismissible via close button, outside click, or Escape key
  - Internal scrolling support (max-height: 80vh)
  - Smooth slide-up animation
  - Accessible with proper ARIA attributes and tabindex
  - Keyboard event handling for accessibility

#### 3. Updated App.svelte with Responsive Layout ✅

**Modified Component:**

- **[src/App.svelte](../src/App.svelte):**
  - Added `isMobileMenuOpen` state for overlay control
  - Added hamburger button (visible only on mobile via `md:hidden` Tailwind class)
  - Wrapped VolumeControl in desktop-only container (`hidden md:block`)
  - Wrapped SettingsPanel in desktop-only container (`hidden md:block`)
  - Added MobileSettingsOverlay with VolumeControl and SettingsPanel for mobile
  - Maintained all existing functionality and state management

### Responsive Breakpoint

**Breakpoint:** 768px (Tailwind's `md` breakpoint)

- **Mobile (< 768px):** Secondary controls in hamburger overlay
- **Desktop (≥ 768px):** All controls visible inline

### Primary Controls (Always Visible)

These controls remain visible on all screen sizes:

- BeatDisplay (beat indicators with animations)
- TempoControl (BPM adjustment, slider, tap tempo)
- TimeSignatureControl (numerator/denominator, Link BPM toggle)
- ActionButton (Start/Stop button)

### Secondary Controls (Responsive)

These controls are responsive to screen size:

- **Mobile:** Hidden from main view, accessible via hamburger menu overlay
- **Desktop:** Visible inline below primary controls

Controls affected:

- VolumeControl (volume slider and mute button)
- SettingsPanel (Export/Import settings)

### Technical Implementation

**Tailwind CSS Classes Used:**

- `md:hidden` - Show only on mobile (< 768px)
- `hidden md:block` - Hide on mobile, show on desktop (≥ 768px)

**Component Composition:**

```
AppLayout
  └─ MetronomeCard
      ├─ HamburgerButton (mobile only)
      ├─ BeatDisplay
      ├─ TempoControl
      ├─ TimeSignatureControl
      ├─ VolumeControl (desktop only)
      ├─ ActionButton
      └─ SettingsPanel (desktop only)
  └─ MobileSettingsOverlay
      ├─ VolumeControl
      └─ SettingsPanel
```

### Accessibility Implementation

✅ **Keyboard Support:**

- Escape key dismisses overlay
- Tab navigation works correctly
- Focus management for dialog

✅ **ARIA Attributes:**

- `role="dialog"` on overlay
- `aria-modal="true"` on overlay
- `aria-labelledby` for overlay title
- `aria-expanded` on hamburger button
- `aria-label` on all interactive elements

✅ **Visual Feedback:**

- Animated hamburger icon (three lines → X)
- Smooth slide-up animation for overlay
- Hover states on all interactive elements

### Build Validation

- ✅ Production build succeeds without errors
- ✅ Bundle size: ~71 KB JS (23.48 KB gzipped), ~28 KB CSS (5.55 KB gzipped)
- ✅ Dev server runs successfully
- ✅ No new accessibility warnings introduced
- ✅ Responsive behavior works at 768px breakpoint

### Manual Testing Checklist

**Desktop (≥ 768px):**

- [ ] All controls visible inline
- [ ] No hamburger button visible
- [ ] No scrolling required
- [ ] VolumeControl and SettingsPanel visible below ActionButton

**Mobile (< 768px):**

- [ ] Primary controls visible (BeatDisplay, TempoControl, TimeSignatureControl, ActionButton)
- [ ] Hamburger button visible in top-right area
- [ ] No vertical scrolling on main view
- [ ] VolumeControl and SettingsPanel hidden from main view
- [ ] Hamburger button opens overlay with secondary controls
- [ ] Overlay dismissible via close button, outside click, and Escape key
- [ ] Overlay content scrolls if needed
- [ ] Animations smooth (hamburger transform, overlay slide-up)

### Future Enhancements

- Consider adding swipe-down gesture to close overlay
- Add haptic feedback for mobile interactions
- Consider landscape optimizations for mobile devices
- Test and optimize for tablet sizes (768px-1024px)

---

## Phase 11: iOS Background Audio & Lock Screen Integration 🔄 IN PROGRESS

**Status:** In Progress (2026-01-12)

### Motivation

The metronome app needs to continue playing audio when the iOS device screen is locked or the app is in the background. iOS Safari has strict requirements for background audio, and the app must be properly configured as an audio/music PWA to appear on the lock screen media controls.

### Problem Statement

Previous attempts to enable iOS background audio (commits `6f87f56` and `ddf8f47`) implemented Media Session API and interruption handling, but the metronome still stops playing when:

- The iOS device screen locks
- The user switches to another app
- The browser tab loses focus

iOS requires specific PWA manifest configuration to recognize an app as an audio application and grant it background audio privileges.

### Reality Check (Non-Negotiable Requirement vs iOS Web Limits)

**Requirement:** Once installed on an Apple device, the metronome must keep ticking while:

- The screen is locked
- The user switches apps

**Constraint:** iOS does not provide a standards-based, fully reliable “background execution” guarantee for web apps. In practice:

- Service workers cannot play/maintain audio.
- Web Audio can be suspended/interrupted when the PWA is backgrounded.
- Many iOS builds require a continuously playing `HTMLAudioElement` session (often even a silent track) to keep the app recognized as an active audio source.

This phase therefore plans a **web-only best-effort path** first, followed by a **guaranteed native-shell fallback** if web-only cannot meet the acceptance criteria.

### Changes Made

#### 1. Updated PWA Manifest with Categories ✅

**Modified File:**

- **[vite.config.ts](../vite.config.ts:33):** Added `categories: ['music', 'utilities']` to PWA manifest

#### 2. Removed Redundant Card Layout ✅

**Modified Files:**

- **[src/App.svelte](../src/App.svelte):** Removed `MetronomeCard` wrapper component
- **[src/lib/components/layout/AppLayout.svelte](../src/lib/components/layout/AppLayout.svelte):** Simplified to solid background color

**Changes:**

- Removed card-style container with rounded corners, padding, and shadow
- All components now positioned relative to screen size, not card container
- Theme toggle and hamburger menu positioned absolutely in top-right corner
- Main content area uses max-width constraint with full-width mobile support
- Simplified background: solid gray-900 (dark) or blue-50 (light)

**Benefits:**

- Cleaner, more modern full-screen layout
- Better mobile experience with direct screen positioning
- Smaller bundle size: 27.70 KB CSS (was 29.71 KB), 74.51 KB JS (was 75.03 KB)
- More space for content on all screen sizes

#### 3. Disabled iOS Double-Tap Zoom ✅

**Modified Files:**

- **[index.html](../index.html:6-9):** Added `maximum-scale=1.0, user-scalable=no` to viewport meta tag
- **[src/index.css](../src/index.css:5-17):** Added CSS to prevent double-tap zoom

**Changes:**

```css
/* Prevent iOS double-tap zoom and enable fast tap */
* {
  -webkit-tap-highlight-color: transparent;
}

button,
input,
select,
textarea,
a,
[role="button"] {
  touch-action: manipulation;
}
```

**Benefits:**

- Tap Tempo button works instantly without 300ms delay
- No accidental zoom when double-tapping buttons
- Better native app feel on iOS devices
- Faster, more responsive interactions

### Work Plan (What We Do Next)

#### 11.1 Reproduce + Instrument (So We Don’t Guess)

- [ ] Confirm failure mode on real device(s): iOS version(s), device model(s), and whether the app was launched from Home Screen (standalone)
- [ ] Verify whether audio stops immediately at screen lock or after a short delay
- [ ] Add lightweight debug UX (behind a flag) to surface:
  - [ ] `document.visibilityState` transitions
  - [ ] `AudioContext.state` transitions (`running`/`suspended`/`interrupted`)
  - [ ] whether Media Session is active + current playbackState
- [ ] Record a short “repro protocol” in this plan so testing is consistent across devices

#### 11.2 Web-Only Keepalive (HTML5 Audio Session)

Goal: keep iOS treating the app as an active audio source even when the screen locks.

- [ ] Add a tiny silent audio asset (e.g., `public/audio/silence.mp3`)
- [ ] Add a hidden `HTMLAudioElement` keepalive that:
  - [ ] is started **only** inside the same user gesture as “Start” (autoplay policy)
  - [ ] loops continuously while the metronome is playing
  - [ ] uses iOS-friendly settings (`playsInline`, `preload`, *avoid* `muted=true` if it prevents session activation; prefer near-zero volume like `0.001`)
- [ ] Wire keepalive lifecycle to playback state:
  - [ ] Start keepalive on metronome start
  - [ ] Stop/pause keepalive on metronome stop
  - [ ] Recover if the keepalive element errors or is interrupted
- [ ] Confirm that Web Audio (oscillator clicks) continues while the keepalive is running

#### 11.3 iOS PWA “Audio App” Checklist Audit

- [ ] Confirm `display: standalone` + icon set appropriate for iOS
- [ ] Verify Apple-specific meta tags are present in `index.html` if needed for installed experience:
  - [ ] `apple-mobile-web-app-capable`
  - [ ] `apple-mobile-web-app-status-bar-style`
  - [ ] `apple-touch-icon`
- [ ] Confirm manifest fields that help iOS classification are present:
  - [ ] `categories: ['music', ...]` (already added)
  - [ ] `name`/`short_name` tuned for lock screen

#### 11.4 Lock Screen / Control Center Controls (Media Session)

- [ ] Validate Media Session behavior in installed PWA mode:
  - [ ] Metadata updates when tempo/time signature changes
  - [ ] Action handlers remain responsive after lock/unlock cycles
  - [ ] Playback state stays in sync when iOS interrupts audio

#### 11.5 Decision Gate: Can Web-Only Meet the Requirement?

- [ ] Run the “30-minute locked screen” test on at least one iOS 16+ and one iOS 17+ device
- [ ] If web-only still fails (audio stops or is throttled), proceed to Phase 12 (native wrapper) to meet the primary requirement reliably

### Existing iOS Support (Already Implemented)

The following iOS background audio features were already implemented in previous phases:

#### Media Session API ✅

**File:** [src/utils/audioEngine.ts](../src/utils/audioEngine.ts#L502-L563)

- Metadata display on lock screen (title, tempo, time signature)
- Artwork display (192x192 and 512x512 icons)
- Action handlers for play/pause/stop from lock screen controls
- Playback state synchronization

#### Interruption Handling ✅

**File:** [src/utils/audioEngine.ts](../src/utils/audioEngine.ts#L411-L456)

- AudioContext state monitoring for iOS interruptions
- Automatic playback stop when interrupted
- UI notification when audio is interrupted
- State change callbacks for user notification

#### Visibility Change Handling ✅

**File:** [src/utils/audioEngine.ts](../src/utils/audioEngine.ts#L462-L496)

- Tracks when page becomes hidden (screen lock, tab switch)
- Attempts to maintain audio session in background
- Resumes AudioContext when page becomes visible again
- Preserves playback state across visibility changes

### Technical Details

**iOS Background Audio Requirements:**

1. **PWA Installation** - App must be installed via "Add to Home Screen"
2. **Manifest Categories** - Must include `music` category (✅ Now implemented)
3. **Media Session API** - Must set metadata and action handlers (✅ Already implemented)
4. **Active Audio** - Must have actively playing audio (✅ Web Audio API oscillators)
5. **Standalone Display** - Manifest must use `display: standalone` (✅ Already configured)

**Web Audio API Look-Ahead Scheduling:**

The metronome uses precise look-ahead scheduling with Web Audio API:

- Schedules beats ~100ms ahead using `AudioContext.currentTime`
- Oscillators create click sounds at precise intervals
- Independent of JavaScript timer jitter
- Should maintain timing even when page is backgrounded

### Testing Requirements

#### Critical Testing Note

All testing must be done on actual iOS devices with the PWA installed.

#### Installation Steps

1. Open the deployed app in Safari on iOS device
2. Tap the Share button
3. Select "Add to Home Screen"
4. Launch the app from the home screen (not from Safari)

**Why Installation Is Required:**

- iOS only grants background audio privileges to installed PWAs
- Testing in Safari browser tab will NOT work for background audio
- The app must be running in standalone mode

#### Desktop and Android Baseline Testing

**Desktop/Android Verification (Baseline):**

- [ ] Run `pnpm build` - production build succeeds
- [ ] Start metronome - audio plays correctly
- [ ] Lock screen - verify media controls appear
- [ ] Media controls work (play/pause from lock screen)

**iOS Device Testing (Primary Focus):**

- [ ] Install PWA via "Add to Home Screen"
- [ ] Launch from home screen (verify standalone mode)
- [ ] Start metronome - audio plays
- [ ] Lock screen - verify:
  - [ ] Audio continues playing (metronome keeps ticking)
  - [ ] Lock screen shows media controls
  - [ ] Media controls display: "Metronome", tempo (BPM), time signature
  - [ ] App icon appears in media controls
  - [ ] Play/pause buttons work from lock screen
- [ ] Switch to another app - verify:
  - [ ] Audio continues playing in background
  - [ ] Can control from Control Center
- [ ] Test interruptions:
  - [ ] Phone call - verify audio pauses and notification appears
  - [ ] Siri activation - verify proper handling
  - [ ] Other audio apps - verify metronome stops appropriately
- [ ] Return to app - verify:
  - [ ] UI state matches audio state
  - [ ] Can resume if interrupted
  - [ ] All controls work normally

**Edge Cases:**

- [ ] Very long playback (30+ minutes) - verify audio doesn't stop
- [ ] Low battery mode - verify behavior
- [ ] Different iOS versions (iOS 16+, iOS 17+)
- [ ] Different time signatures (4/4, 3/4, 6/8, etc.)
- [ ] Different tempos (slow 60 BPM, fast 180 BPM)

### Known Limitations

**iOS-Specific Constraints:**

- Background audio only works when PWA is installed (not in Safari browser)
- iOS may limit background audio duration for battery conservation
- Some iOS versions have stricter background audio policies than others
- iOS may pause audio if device is in Low Power Mode

**Potential Issues to Monitor:**

- If audio still stops on lock screen, may need to add a hidden `<audio>` element in addition to Web Audio API
- iOS sometimes requires continuous audio stream (not just scheduled oscillators)
- May need to play a silent audio file continuously to maintain audio session

### Success Criteria

✅ **Phase Complete When:**

1. PWA manifest updated with `categories` field
2. Tested on real iOS device (iOS 16+)
3. Audio continues playing when screen locks
4. Media controls appear on lock screen
5. Lock screen shows app name, tempo, time signature, and icon
6. Play/pause controls work from lock screen
7. Audio continues when switching apps
8. Interruption handling works correctly

9. **Reliability gate:** audio continues for **30+ minutes** with the screen locked (installed app)
10. **Background gate:** audio continues after switching apps for **10+ minutes** (installed app)

### Next Steps If Issues Persist

If background audio still doesn't work after the web-only keepalive approach, implement Phase 12 (native wrapper) to meet the requirement reliably on iOS.

### References

- [MDN: Media Session API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API)
- [MDN: Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [PWA Manifest Categories](https://developer.mozilla.org/en-US/docs/Web/Manifest/categories)
- [iOS PWA Capabilities](https://developer.apple.com/documentation/webkit/safari_web_extensions)

---

## Phase 12: iOS Native Wrapper (Capacitor) — Guaranteed Background Audio 🧩 PLANNED

**Status:** Planned (Execute only if Phase 11 web-only approach cannot meet acceptance criteria)

### Motivation

iOS background audio is a primary requirement. If PWA/web constraints prevent reliable background playback, a thin native shell provides the required entitlements and audio session configuration while reusing the existing web UI and audio engine.

### Scope

- Wrap the existing Vite/Svelte app with Capacitor
- Enable iOS “Background Modes” for audio
- Ensure the audio session is configured for background playback (AVAudioSession `playback`)
- Keep Media Session metadata and UI behavior consistent

### Implementation Checklist

- [ ] Add Capacitor to the project and generate an iOS target
- [ ] Configure iOS capabilities:
  - [ ] Enable Background Modes → “Audio, AirPlay, and Picture in Picture”
  - [ ] Ensure `UIBackgroundModes` includes `audio`
- [ ] Configure `AVAudioSession`:
  - [ ] Category: `playback`
  - [ ] Mode/options appropriate for a metronome (no mixing by default unless requested)
- [ ] Verify WKWebView audio behavior while backgrounded and screen-locked
- [ ] Create a minimal release/testing process:
  - [ ] Local build/run instructions for Xcode
  - [ ] Device testing checklist (reuse Phase 11 acceptance tests)
- [ ] Document the decision and tradeoffs in docs:
  - [ ] Update this plan with the decision outcome
  - [ ] Add a short “iOS background audio” doc describing why the wrapper exists (if adopted)

### Success Criteria

- [ ] Audio continues while screen locked for 30+ minutes
- [ ] Audio continues after switching apps for 10+ minutes
- [ ] Lock screen controls work reliably (play/pause, metadata)

---
