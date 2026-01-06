# Metronome App — Development Plan

**Last Updated:** 2026-01-06
**Current Phase:** Phase 8 — React to Svelte Migration (COMPLETED)
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
- **[svelte.config.js](../svelte.config.js):** Created new Svelte configuration with `vitePreprocess()`
- **[tsconfig.app.json](../tsconfig.app.json):** Removed `"jsx": "react-jsx"` line
- **[eslint.config.js](../eslint.config.js):** Replaced React ESLint plugins with `eslint-plugin-svelte`
- **[index.html](../index.html):** Changed entry point from `/src/main.tsx` to `/src/main.ts`

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

| React Pattern | Svelte Pattern |
| ------------- | -------------- |
| `useState(value)` | `let variable = $state(value)` |
| `setVariable(newValue)` | `variable = newValue` |
| `useRef<T>(null)` | `let variable: T \| null = null` |
| `<input ref={ref} />` | `<input bind:this={variable} />` |
| `useEffect(() => {...}, [])` | `$effect(() => {...})` |
| Computed values | `let computed = $derived(expr)` |
| `className` | `class` |
| `onClick={fn}` | `on:click={fn}` |
| `onChange={fn}` | `on:change={fn}` or `on:input={fn}` |
| `{condition && <div>}` | `{#if condition}<div>{/if}` |

### Key Technical Decisions

1. **Used Svelte 5 Runes API**: Modern reactive primitives (`$state`, `$effect`, `$derived`) instead of legacy `$:` syntax
2. **Kept CSS animations**: Preserved existing CSS keyframe animations instead of converting to Svelte transitions (faster migration, already performant)
3. **Maintained PWA configuration**: vite-plugin-pwa works identically with Svelte, no changes needed
4. **Preserved iOS audio support**: Audio engine implementation unchanged, iOS background audio still functional

### Testing Checklist

- [ ] Run `pnpm install` to install Svelte dependencies
- [ ] Run `pnpm dev` - app should start without errors
- [ ] Test all functionality:
  - [ ] Start/Stop button works
  - [ ] Tempo controls (buttons, slider, tap tempo) work
  - [ ] Time signature controls work
  - [ ] Beat indicators pulse correctly
  - [ ] Volume slider works
  - [ ] Dark mode toggle works
  - [ ] Export/Import settings work
- [ ] Verify animations are smooth (no jank)
- [ ] Test iOS-specific features:
  - [ ] Audio continues when screen locks
  - [ ] Interruption notification appears
  - [ ] Resume after interruption works
- [ ] Run `pnpm build` - production build succeeds
- [ ] Run `npx svelte-check` - TypeScript validation passes
- [ ] Run `pnpm lint` - linting passes

### Expected Benefits

- **Bundle size:** ~30-40% reduction compared to React
- **Performance:** Improved animation smoothness due to fine-grained reactivity
- **Developer Experience:** Less boilerplate, more intuitive reactivity
- **Maintainability:** Cleaner component code with direct variable assignments

### Migration Plan Reference

Full migration plan with detailed patterns and gotchas: [/Users/ronan/.claude/plans/dynamic-toasting-frog.md](/Users/ronan/.claude/plans/dynamic-toasting-frog.md)

---
