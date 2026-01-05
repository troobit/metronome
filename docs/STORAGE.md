# Storage Strategy

**Last Updated:** 2026-01-04

## Overview

Metronome uses a tiered storage approach to balance persistence guarantees, data richness, and iOS compatibility. Critical settings use localStorage, extended data uses IndexedDB, and a mandatory JSON export/import system provides portability and backup.

## Tiered Storage Architecture

### Tier 1: localStorage (Critical Settings)

_Implementation: `src/utils/storage.ts` (placeholder - will link when implemented)_

**Purpose:** Persistent storage for essential settings that must survive app reinstalls and iOS storage purges.

**Keys and Values:**

- `metronome:tempo` → number (30-300)
  - _Link: `src/utils/storage.ts#L{line}` (placeholder)_
- `metronome:timeSignature` → number (1-12)
  - _Link: `src/utils/storage.ts#L{line}` (placeholder)_
- `metronome:volume` → number (0-100)
  - _Link: `src/utils/storage.ts#L{line}` (placeholder)_

**Guarantees:**

- Available in all browsers (localStorage is universally supported)
- Survives page reloads, browser restarts, and iOS storage purges
- Synchronous access (no async overhead for critical reads on app load)

**Limitations:**

- Limited to ~5-10 MB (browser-dependent)
- No structured queries
- String-only storage (requires JSON serialization for objects)

### Tier 2: IndexedDB via Dexie (Rich Data)

_Schema: `src/db/schema.ts` (placeholder - will link when implemented)_

**Purpose:** Structured storage for presets and optional practice history.

#### Dexie Schema

```typescript
// Placeholder schema - will be implemented in Phase 6
const db = new Dexie('MetronomeDB')

db.version(1).stores({
  presets: '++id, name, tempo, timeSignature, createdAt',
  history: '++id, tempo, timeSignature, duration, timestamp',
})
```

**Preset Table:**

- `id`: Auto-increment primary key
- `name`: User-defined preset name (string)
- `tempo`: BPM (number)
- `timeSignature`: Beats per bar (number)
- `createdAt`: ISO timestamp (string)

**History Table (Optional):**

- `id`: Auto-increment primary key
- `tempo`: BPM used (number)
- `timeSignature`: Time signature used (number)
- `duration`: Practice duration in seconds (number)
- `timestamp`: ISO timestamp (string)

**Guarantees:**

- Large storage capacity (typically 50 MB+, can request more)
- Structured queries with indexes
- Async/Promise-based API (via Dexie)

**Limitations:**

- May be cleared on iOS in low storage conditions
- Requires async initialization
- Not guaranteed to persist long-term on all platforms

### Tier 3: JSON Export/Import (Mandatory Portability)

_Implementation: `src/utils/export.ts` (placeholder - will link when implemented)_

**Purpose:** User-controlled data portability and backup mechanism. Mandatory for iOS users.

#### Export Format

```json
{
  "version": "1.0",
  "exportedAt": "2026-01-04T12:34:56.789Z",
  "settings": {
    "tempo": 120,
    "timeSignature": 4,
    "volume": 80
  },
  "presets": [
    {
      "name": "Fast Practice",
      "tempo": 180,
      "timeSignature": 4,
      "createdAt": "2026-01-03T10:00:00.000Z"
    }
  ],
  "history": [
    {
      "tempo": 120,
      "timeSignature": 4,
      "duration": 600,
      "timestamp": "2026-01-04T11:00:00.000Z"
    }
  ]
}
```

**Export Functionality:**
_Link: `src/utils/export.ts#L{line}` (placeholder)_

- Triggered via UI button
- Generates JSON file with timestamp in filename: `metronome-backup-2026-01-04.json`
- Downloads to user's device via browser download API

**Import Functionality:**
_Link: `src/utils/export.ts#L{line}` (placeholder)_

- Triggered via file picker
- Validates JSON structure and schema version
- Merges or replaces existing data based on user choice
- Handles version migration if future schema changes occur

**Guarantees:**

- User owns their data as a plain JSON file
- Works on all platforms (including iOS)
- Survives app uninstall, device change, or storage purges
- Human-readable format for inspection/editing

## iOS Storage Considerations

### The Problem

iOS Safari and PWAs have aggressive storage limits:

1. **IndexedDB Eviction:** May be cleared after 7 days of inactivity or when storage is low
2. **50 MB Quota:** Default quota is stricter than desktop
3. **No Persistent Storage API:** The `navigator.storage.persist()` API is not supported on iOS

### The Solution

1. **Critical Settings in localStorage:**
   - localStorage is more durable on iOS than IndexedDB
   - Last-used tempo, time signature, and volume always restore

2. **Mandatory Export/Import:**
   - Users must be able to export before uninstalling or when switching devices
   - UI should prompt export periodically (e.g., "Back up your presets")
   - Import restores full state including presets and history

3. **Graceful Degradation:**
   - App works without IndexedDB (no presets, but core functionality intact)
   - Display warning if IndexedDB is unavailable or has been cleared

## Storage Initialization Flow

_Implementation: `src/utils/storage.ts` (placeholder - will link when implemented)_

```typescript
async function initStorage() {
  // 1. Load critical settings from localStorage (synchronous)
  const tempo = localStorage.getItem('metronome:tempo') ?? '120'
  const timeSignature = localStorage.getItem('metronome:timeSignature') ?? '4'
  const volume = localStorage.getItem('metronome:volume') ?? '80'

  // 2. Initialize IndexedDB (async, may fail)
  try {
    await db.open()
    const presets = await db.presets.toArray()
    return { tempo, timeSignature, volume, presets }
  } catch (error) {
    // IndexedDB unavailable or blocked
    console.warn('IndexedDB unavailable, running without presets')
    return { tempo, timeSignature, volume, presets: [] }
  }
}
```

**Key Points:**

- Critical settings load immediately (synchronous)
- IndexedDB loads in background (async)
- App is functional even if IndexedDB fails

## Data Persistence Rules

### When to Write to localStorage

_Implementation: `src/utils/storage.ts` (placeholder - will link to save functions when implemented)_

Update localStorage immediately when:

- Tempo changes
- Time signature changes
- Volume changes

Use debouncing for high-frequency updates (e.g., dragging a slider).

### When to Write to IndexedDB

_Implementation: `src/db/schema.ts` (placeholder - will link to DB operations when implemented)_

Update IndexedDB when:

- User saves a preset
- User deletes a preset
- User updates a preset name
- Practice session ends (if history tracking is enabled)

No debouncing needed—these are explicit user actions.

### When to Prompt for Export

Prompt user to export when:

- Significant data exists (e.g., 5+ presets)
- App hasn't been backed up in 30 days
- User is on iOS (detect via user agent)
- Before major app updates (if schema changes are planned)

## Storage Quota Management

Check available storage on app load:

```typescript
if ('storage' in navigator && 'estimate' in navigator.storage) {
  const estimate = await navigator.storage.estimate()
  const percentUsed = (estimate.usage / estimate.quota) * 100

  if (percentUsed > 80) {
    // Warn user that storage is nearly full
  }
}
```

_Implementation: `src/utils/storage.ts#L{line}` (placeholder)_

## Testing Storage Behavior

### localStorage Testing

1. Set tempo/volume, reload page → values persist
2. Close browser, reopen → values persist
3. Clear site data → values reset to defaults

### IndexedDB Testing

1. Save presets, reload → presets persist
2. Close browser, reopen → presets persist
3. Simulate iOS storage purge (manually delete IndexedDB) → presets lost, but app works

### Export/Import Testing

1. Export with 10 presets → JSON file downloads
2. Clear all data
3. Import JSON → all presets and settings restored
4. Export on device A, import on device B → data transfers successfully

## Privacy Considerations

- All data is stored locally (no server transmission)
- Export files may contain user data; users should secure their backups
- History tracking is optional and can be disabled

## Future Enhancements

Potential improvements (not required for initial release):

- **Cloud Sync:** Optional Google Drive / Dropbox integration
- **Auto-Backup:** Periodic automatic export to local file
- **Schema Versioning:** Migration system for breaking changes
- **Selective Export:** Export only presets or only history
