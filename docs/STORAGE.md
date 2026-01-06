# Storage & Persistence

**Last Updated:** 2026-01-06

## Overview

The metronome application uses a tiered storage approach to persist user settings and data:

1. **localStorage** - Critical settings that should persist across sessions
2. **Export/Import JSON** - Data portability and backup
3. **IndexedDB** - (Future) For presets and history

## localStorage

### Implementation

_File: [src/utils/storage.ts](../src/utils/storage.ts)_

Critical settings are automatically saved to localStorage whenever they change:

- **Tempo** (30-600 BPM)
- **Time Signature** (numerator/denominator)
- **Volume** (0.0-1.0)
- **Dark Mode** (boolean)
- **Link Tempo** (boolean)

### Storage Keys

```typescript
const STORAGE_KEYS = {
  TEMPO: 'metronome:tempo',
  TIME_SIGNATURE: 'metronome:timeSignature',
  VOLUME: 'metronome:volume',
  DARK_MODE: 'metronome:darkMode',
  LINK_TEMPO: 'metronome:linkTempo',
}
```

### Loading Settings

Settings are loaded once when the app initializes using lazy initialization:

```typescript
const [tempo, setTempo] = useState(() => loadSettings().tempo)
```

This ensures settings are loaded from localStorage before the first render.

### Saving Settings

Settings are saved immediately when they change:

```typescript
const updateTempo = (newTempo: number) => {
  const clampedTempo = clampBPM(newTempo, 30, 600)
  setTempo(clampedTempo)
  saveTempoToStorage(clampedTempo) // Save to localStorage
  if (engineRef.current) {
    engineRef.current.setTempo(clampedTempo)
  }
}
```

### Error Handling

All storage operations include try/catch blocks to handle:

- localStorage not available (private browsing, quota exceeded)
- Parsing errors (corrupted data)
- Permission errors

If localStorage fails, the app falls back to default settings without crashing.

## Export/Import JSON

### Export

_Implementation: [src/utils/storage.ts:135-152](../src/utils/storage.ts#L135-L152)_

Users can export their current settings to a JSON file:

```typescript
export function exportSettings(): void {
  const settings = loadSettings()
  const json = JSON.stringify(settings, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  // ... trigger download
}
```

**File format:**

```json
{
  "tempo": 120,
  "timeSignature": {
    "beatsPerBar": 4,
    "beatUnit": 4
  },
  "volume": 0.5,
  "darkMode": false,
  "linkTempo": false
}
```

**Filename format:** `metronome-settings-YYYY-MM-DD.json`

### Import

_Implementation: [src/utils/storage.ts:158-204](../src/utils/storage.ts#L158-L204)_

Users can import settings from a JSON file:

1. User selects JSON file
2. File is validated for correct structure
3. Settings are saved to localStorage
4. App state is updated immediately
5. Audio engine is reconfigured

**Validation:**

The import function validates:

- All required fields are present
- Types are correct (numbers, booleans, objects)
- Time signature structure is valid

If validation fails, the import is rejected with a clear error message.

## UI Integration

_File: [src/App.tsx:805-864](../src/App.tsx#L805-L864)_

Export/import buttons are located at the bottom of the UI:

- **Export** - Downloads current settings as JSON
- **Import** - Opens file picker to select JSON file

Both buttons adapt to the current theme (light/dark mode).

## Future Enhancements

### IndexedDB with Dexie.js

_(Not yet implemented)_

Future versions will include:

1. **Presets**
   - Save named configurations
   - Quick switching between presets
   - Share presets via export

2. **History** (Optional)
   - Track practice sessions
   - Statistics (total time, tempo ranges)
   - Replay recent settings

### Implementation Plan

```typescript
// Database schema (future)
interface MetronomeDB extends Dexie {
  presets: Dexie.Table<Preset, number>
  history: Dexie.Table<HistoryEntry, number>
}

interface Preset {
  id?: number
  name: string
  tempo: number
  timeSignature: TimeSignature
  volume: number
  createdAt: Date
}
```

## Browser Compatibility

### localStorage

Supported in all target browsers:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

### IndexedDB

Also universally supported in target browsers.

### File API

Export/Import uses standard File API (Blob, FileReader) supported in all target browsers.

## Data Privacy

All data is stored locally in the user's browser:

- No data is sent to external servers
- Settings remain on the device
- Users control their data via export/import

## Testing

To test storage functionality:

1. **localStorage persistence:**
   - Change settings
   - Refresh the page
   - Verify settings are restored

2. **Export:**
   - Click "Export Settings"
   - Verify JSON file downloads
   - Check file contents match current settings

3. **Import:**
   - Modify settings
   - Import a previously exported file
   - Verify settings are restored correctly

4. **Error cases:**
   - Try importing invalid JSON
   - Try importing JSON with wrong structure
   - Verify graceful error handling

## Troubleshooting

### Settings not persisting

**Possible causes:**

- Private browsing mode (localStorage disabled)
- Storage quota exceeded
- Browser extension blocking storage

**Solutions:**

- Use export/import as a workaround
- Clear browser cache to free up space
- Disable interfering extensions

### Import fails

**Common issues:**

- Invalid JSON format
- Missing required fields
- Wrong data types

**Solutions:**

- Verify JSON is valid
- Compare with a freshly exported file
- Check error message for details
