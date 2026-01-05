# Audio Engine

**Last Updated:** 2026-01-04

## Overview

The AudioEngine is responsible for generating precise, stable metronome clicks using the Web Audio API. It employs a look-ahead scheduling pattern to ensure timing accuracy regardless of UI updates, browser throttling, or background tab behavior.

## Core Problem: JavaScript Timer Jitter

JavaScript timers (`setTimeout`, `setInterval`, `requestAnimationFrame`) are inherently imprecise:

1. **Resolution Limitations:** JS timers have ~4-10ms resolution depending on browser and context
2. **Main Thread Blocking:** UI updates, layout calculations, and other JS execution delay timer callbacks
3. **Browser Throttling:** Background tabs may throttle timers to 1000ms or more
4. **Frame Sync Issues:** `requestAnimationFrame` is tied to display refresh (16.67ms @ 60fps), creating quantization

**Example:** A 120 BPM metronome requires clicks every 500ms. If each click is scheduled using `setTimeout(playClick, 500)`, accumulated jitter can make the timing drift by 10-50ms or more, which is easily audible.

## Solution: Look-Ahead Scheduling with AudioContext

The Web Audio API provides `AudioContext.currentTime`, a high-precision clock that increments in audio sample time. By scheduling audio events ahead of time using this clock, we decouple audio timing from JavaScript execution timing.

### Look-Ahead Scheduler Pattern

The following sequence diagram illustrates the look-ahead scheduling pattern:

```mermaid
sequenceDiagram
  autonumber
  participant User
  participant UI as React UI
  participant Engine as AudioEngine
  participant AC as AudioContext

  User->>UI: Tap Start
  UI->>Engine: init()
  Engine->>AC: create + resume
  UI->>Engine: start(tempo, meter)

  loop Every 25ms (scheduler tick)
    Engine->>Engine: compute notes <= currentTime + 0.1s
    Engine->>AC: schedule click nodes (start/stop)
  end

  User->>UI: Change tempo
  UI->>Engine: setTempo(newTempo)
  Engine->>Engine: future scheduling uses new tempo
```

The scheduler runs in two concurrent loops:

#### 1. Scheduler Tick (JavaScript Timer)

_Implementation: `src/utils/audioEngine.ts` (placeholder - will link to scheduling function when implemented)_

```text
Every 25ms:
  - Check currentTime
  - Schedule any beats that fall within [currentTime, currentTime + 100ms]
  - Track next beat time
```

**Constants:**

- **Tick Interval:** 25ms (scheduler loop frequency)
  - _Link: `src/utils/audioEngine.ts#L{line}` (placeholder)_
- **Look-Ahead Time:** 100ms (scheduling window)
  - _Link: `src/utils/audioEngine.ts#L{line}` (placeholder)_

The 25ms tick interval is frequent enough to catch beats with margin, but not so frequent that it wastes CPU.

#### 2. Audio Event Scheduling (Web Audio API)

_Implementation: `src/utils/audioEngine.ts` (placeholder - will link to click synthesis when implemented)_

```text
For each beat in the look-ahead window:
  - Create OscillatorNode
  - Set frequency (higher for beat 1, lower for other beats)
  - Set gain (accent on beat 1)
  - Schedule start(beatTime) and stop(beatTime + 0.05)
```

Audio nodes are scheduled using `AudioContext.currentTime` offsets, ensuring sample-accurate timing independent of when the JavaScript code runs.

### Why This Works

- **Decoupling:** Audio scheduling happens in the audio thread, not the main thread
- **Look-Ahead Buffer:** The 100ms window absorbs JavaScript jitter
- **Sample Accuracy:** Web Audio API schedules events at the sample level (typically 44.1kHz or 48kHz)

Even if a scheduler tick is delayed by 20ms due to UI work, it doesn't matter—the audio events are already scheduled 100ms ahead.

## Implementation Details

### AudioContext Lifecycle

_Implementation: `src/utils/audioEngine.ts` (placeholder - will link to init/cleanup when implemented)_

The AudioContext follows a specific lifecycle with state transitions:

```mermaid
stateDiagram-v2
  [*] --> Uninitialized
  Uninitialized --> Suspended: create AudioContext
  Suspended --> Running: resume() on user gesture
  Running --> Suspended: browser suspends tab
  Suspended --> Running: resume() on focus
  Running --> Closed: close() / cleanup
  Closed --> [*]
```

**State Transitions:**

1. **Creation:** `new AudioContext()` when user first interacts (browser autoplay policy)
2. **Resume:** Call `audioContext.resume()` on user gesture (required by browsers)
3. **Suspend/Resume:** Handle page visibility changes to support background tabs
4. **Cleanup:** Call `audioContext.close()` when done

### Click Sound Synthesis

_Implementation: `src/utils/audioEngine.ts` (placeholder - will link to synthesis function when implemented)_

Each click is generated using:

- **OscillatorNode:** Short sine wave burst
- **GainNode:** Volume control and envelope (attack/release)
- **Accent Implementation:**
  - Beat 1: Higher frequency (e.g., 1200 Hz) or higher gain
  - Other beats: Lower frequency (e.g., 800 Hz) or lower gain

Duration: 50ms burst (start + 5ms decay envelope)

### Tempo and Time Signature Support

**Tempo Range:** 30–300 BPM

- Formula: `beatInterval = 60 / tempo` (in seconds)
- 30 BPM = 2 seconds per beat
- 300 BPM = 0.2 seconds per beat

**Time Signature:** 1–12 beats per bar

- Tracks current beat number (1-based)
- Applies accent to beat 1
- Wraps to 1 after reaching beats-per-bar

### Beat Callbacks for UI Synchronization

_Implementation: `src/utils/audioEngine.ts` (placeholder - will link to callback mechanism when implemented)_

The engine provides a callback fired on each beat for UI updates (e.g., beat indicator flash). This callback runs in JavaScript time and may have visual jitter, but does not affect audio accuracy.

```typescript
engine.onBeat = (beatNumber: number) => {
  // Update UI beat indicator
  // This may lag slightly due to main thread work
}
```

**Important:** The UI callback is informational only. Audio timing is independent.

### Parameter Changes During Playback

When tempo or time signature changes while playing:

- **No Audio Glitch:** Current look-ahead schedule completes
- **Smooth Transition:** Next scheduling tick uses new parameters
- **Beat Continuity:** Beat counter optionally resets or continues based on UI semantics

## Constants Reference

| Constant                  | Value   | Purpose                     | Location                                         |
| ------------------------- | ------- | --------------------------- | ------------------------------------------------ |
| `LOOK_AHEAD_TIME`         | 100ms   | Scheduling window size      | `src/utils/audioEngine.ts#L{line}` (placeholder) |
| `SCHEDULER_TICK_INTERVAL` | 25ms    | Frequency of scheduler loop | `src/utils/audioEngine.ts#L{line}` (placeholder) |
| `CLICK_DURATION`          | 50ms    | Length of each click sound  | `src/utils/audioEngine.ts#L{line}` (placeholder) |
| `ACCENT_FREQUENCY`        | 1200 Hz | Frequency for beat 1        | `src/utils/audioEngine.ts#L{line}` (placeholder) |
| `NORMAL_FREQUENCY`        | 800 Hz  | Frequency for other beats   | `src/utils/audioEngine.ts#L{line}` (placeholder) |
| `MIN_TEMPO`               | 30 BPM  | Minimum supported tempo     | `src/utils/audioEngine.ts#L{line}` (placeholder) |
| `MAX_TEMPO`               | 300 BPM | Maximum supported tempo     | `src/utils/audioEngine.ts#L{line}` (placeholder) |
| `MAX_BEATS_PER_BAR`       | 12      | Maximum time signature      | `src/utils/audioEngine.ts#L{line}` (placeholder) |

_Note: Line links will be updated once the implementation stabilizes._

## Testing Audio Accuracy

To validate timing accuracy:

1. **Metronome Comparison:** Compare against a hardware metronome or trusted software
2. **Recording Analysis:** Record output and analyze inter-click intervals in a DAW
3. **Stress Testing:** Run with heavy UI load (animations, complex updates) to ensure no audio drift
4. **Background Tab:** Verify timing remains accurate when tab is backgrounded

Expected result: Inter-click intervals should vary by less than ±1ms even under load.

## Browser Support

The look-ahead scheduling pattern works in all browsers supporting Web Audio API:

- Chrome/Edge 35+
- Firefox 25+
- Safari 14+ (iOS and macOS)

## References

- [Web Audio API Scheduling](https://www.html5rocks.com/en/tutorials/audio/scheduling/)
- [AudioContext.currentTime MDN](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/currentTime)
- [Chris Wilson's A Tale of Two Clocks](https://web.dev/audio-scheduling/)

## Future Enhancements

Potential improvements (not required for initial release):

- **Subdivisions:** 8th notes, triplets, etc.
- **Customizable Sounds:** User-provided samples via AudioBuffer
- **Visual Metronome:** Flashing light for silent practice
- **Polyrhythms:** Multiple simultaneous time signatures
