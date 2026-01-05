# Metronome App — Development Plan

**Last Updated:** 2026-01-04

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

- docs/ARCHITECTURE.md
  - Must include the Mermaid diagrams in DIAGRAMS.md
  - Must include line links to:
    - `AudioEngine` implementation (scheduler loop, click synthesis)
    - app state wiring (tempo/time signature/play)
    - persistence layer
- docs/AUDIO_ENGINE.md
  - Must link to the scheduler constants (lookAhead, tick interval), and the scheduling function.
  - Must describe why JS timers jitter and why audio scheduling must use `AudioContext.currentTime`.
- docs/STORAGE.md
  - Must link to the localStorage keys/constants and Dexie schema definition.
  - Must describe Export/Import flow and iOS caveats.

---

## Phased Delivery Plan (Amalgamated)

### Phase 0 — Documentation Skeleton (No code required)

- [ ] Create docs/ARCHITECTURE.md (must reference DIAGRAMS.md)
- [ ] Create docs/AUDIO_ENGINE.md (include look-ahead rationale; line links can be placeholders until code exists)
- [ ] Create docs/STORAGE.md (include iOS strategy; line links can be placeholders until code exists)
- [ ] Update README.md (setup + environment + how to validate)

### Phase 1 — Project Scaffold + CI Baseline (Pipelines green)

- [ ] Decide package manager (recommend pnpm) and standardize commands (`pnpm` everywhere)
- [ ] Scaffold Vite + React project (prefer React + TypeScript unless you explicitly want JS)
- [ ] Add `.gitignore`
- [ ] Add `.devcontainer/devcontainer.json` for Codespaces (Node 20+)
- [ ] Ensure `pnpm run dev` works and is accessible via forwarded port 5173
- [ ] Add GitHub Actions CI workflow that runs on PR/push and passes with no secrets:
  - install deps (`pnpm install --frozen-lockfile`)
  - `pnpm run lint` (once added)
  - `pnpm run build`
  - `pnpm run format:check` (once added)
  - `pnpm run docs:check` (once added)
- [ ] Docs gate: update README.md with “how to run lint/build/docs checks locally”

### Phase 2 — Code Quality + Docs Checking

- [ ] Add ESLint (flat config) and Prettier
- [ ] Add scripts:
  - `lint`
  - `format`
  - `format:check`
  - `docs:check` (markdown lint + link check)
- [ ] Install doc tooling (recommended):
  - `markdownlint-cli2`
  - `markdown-link-check`
- [ ] Configure editor defaults (format on save, ESLint fix on save)
- [ ] Docs gate: ensure docs reflect new scripts and conventions

### Phase 3 — Tailwind v4 Setup (Vite Plugin)

- [ ] Install `tailwindcss` + `@tailwindcss/vite`
- [ ] Add `tailwindcss()` to `vite.config.*`
- [ ] Create `src/index.css` with `@import "tailwindcss";`
- [ ] Verify Tailwind HMR works by changing a class in the app
- [ ] Docs gate: update docs/ARCHITECTURE.md to link to styling entrypoints once created

### Phase 4 — Core Audio Engine

- [ ] Implement `AudioEngine` using Web Audio API
  - [ ] Look-ahead scheduler: schedule ~100ms ahead, tick ~25ms
  - [ ] Use `AudioContext.currentTime` for event times
  - [ ] Provide accent on beat 1 (pitch or amplitude)
  - [ ] Support tempo range 30–300 BPM
  - [ ] Support time signature beats-per-bar 1–12
  - [ ] Expose a beat callback for UI sync (acknowledging visual jitter)
- [ ] Docs gate: update docs/AUDIO_ENGINE.md with file links immediately; add line links once stable

### Phase 5 — Core UI

- [ ] App shell (tempo, time signature, start/stop)
- [ ] Beat indicator synchronized to beat callbacks
- [ ] Tap tempo
- [ ] Mobile-first layout and touch target sizing
- [ ] Docs gate: update docs/ARCHITECTURE.md with component wiring links

### Phase 6 — Persistence (Tiered)

- [ ] localStorage for critical settings
  - tempo
  - time signature
  - volume
- [ ] Dexie/IndexedDB for presets (and optional history)
- [ ] Export/Import JSON (mandatory)
- [ ] Docs gate: update docs/STORAGE.md with schema + key definitions (file links first, line links later)

### Phase 7 — PWA (Offline)

- [ ] Install and configure `vite-plugin-pwa`
  - `registerType: 'autoUpdate'`
  - include icons + manifest
  - enable `devOptions.enabled` for dev testing if desired
- [ ] Create `public/` icons (192/512 + apple-touch)
- [ ] Verify offline after first load (`pnpm run build` + `pnpm run preview`)

### Phase 8 — Deployment Pipelines (Clean from the start)

- [ ] Add a deploy workflow for the chosen target (Vercel or Azure Static Web Apps)
- [ ] Deployment workflow must:
  - always run build/lint/docs checks
  - **skip deploy steps** when required secrets are missing (do not fail the workflow)
  - run deploy only on `main` (PRs run CI only)
- [ ] Docs gate: README.md includes how to configure required secrets and verify deployment

---

## Acceptance Criteria

- Metronome audio timing is stable across UI load and window interactions
- UI reflects beats (may lag slightly, but doesn’t affect audio accuracy)
- Settings persist across sessions; presets persist when IndexedDB is available
- Export/Import JSON works
- PWA installs and works offline after first load
