/**
 * AudioEngine - Web Audio API-based metronome engine
 *
 * Implements look-ahead scheduling to maintain precise timing independent
 * of JavaScript timer jitter. Schedules audio events ~100ms ahead using
 * AudioContext.currentTime.
 */

import type {
  IAudioEngine,
  AudioEngineState,
  AudioEngineConfig,
  BeatCallback,
  TimeSignature,
  AccentType,
} from '../types/audio'

/** Look-ahead time in seconds (how far ahead to schedule) */
const SCHEDULE_AHEAD_TIME = 0.1 // 100ms

/** Scheduler interval in milliseconds (how often to check for scheduling) */
const SCHEDULER_INTERVAL = 25 // 25ms

/** Click duration in seconds */
const CLICK_DURATION = 0.05 // 50ms

/** Frequency for accent beat (beat 1) */
const ACCENT_FREQUENCY = 950 // Hz

/** Frequency for accent beat (secondary accent) */
const ACCENT_SECONDARY_FREQUENCY = 875 // Hz

/** Frequency for regular beats */
const REGULAR_FREQUENCY = 800 // Hz

/** Tempo constraints */
const MIN_TEMPO = 30
const MAX_TEMPO = 900

/** Time signature constraints */
const MIN_BEATS_PER_BAR = 1
const MAX_BEATS_PER_BAR = 99 // Support unconventional time signatures
const VALID_BEAT_UNITS = [1, 2, 4, 8, 16, 32, 64] as const

/**
 * Determine accent type for a given beat in a time signature
 *
 * Compound time signatures (6/8, 9/8, 12/8) have secondary accents:
 * - 6/8: Secondary accent on beat 4 (3+3 grouping)
 * - 9/8: Secondary accents on beats 4 and 7 (3+3+3 grouping)
 * - 12/8: Secondary accents on beats 4, 7, and 10 (3+3+3+3 grouping)
 *
 * @param beatNumber - The beat number (0-indexed)
 * @param timeSignature - The current time signature
 * @returns The accent type for the beat
 */
function getAccentType(
  beatNumber: number,
  timeSignature: TimeSignature
): AccentType {
  // Beat 1 (index 0) always gets the primary accent
  if (beatNumber === 0) {
    return 'primary'
  }

  // Check if this is a compound time signature
  // Compound meters have numerators divisible by 3 (and > 3) where beats group in threes
  const isCompound =
    timeSignature.beatsPerBar > 3 &&
    timeSignature.beatsPerBar % 3 === 0 &&
    timeSignature.beatUnit === 8

  if (isCompound) {
    // Secondary accents occur every 3 beats (at beats 4, 7, 10 for 12/8)
    // In 0-indexed: beats 3, 6, 9
    if (beatNumber % 3 === 0) {
      return 'secondary'
    }
  }

  return 'none'
}

export class AudioEngine implements IAudioEngine {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private _state: AudioEngineState = 'uninitialized'
  private _tempo: number
  private _timeSignature: TimeSignature
  private _isPlaying = false
  private _volume = 0.5 // Default volume (0.0 to 1.0)
  private beatCallback: BeatCallback | null = null

  // Scheduler state
  private schedulerIntervalId: number | null = null
  private nextBeatTime = 0
  private currentBeat = 0

  constructor(config: AudioEngineConfig) {
    this._tempo = this.clampTempo(config.tempo)
    this._timeSignature = this.validateTimeSignature(config.timeSignature)
  }

  get state(): AudioEngineState {
    return this._state
  }

  get tempo(): number {
    return this._tempo
  }

  get timeSignature(): TimeSignature {
    return { ...this._timeSignature }
  }

  get isPlaying(): boolean {
    return this._isPlaying
  }

  get volume(): number {
    return this._volume
  }

  /**
   * Initialize the audio context.
   * Must be called after a user gesture (click, touch, etc.)
   */
  async init(): Promise<void> {
    if (this.audioContext) {
      console.warn('AudioEngine already initialized')
      return
    }

    this.audioContext = new AudioContext()
    this._state = this.audioContext.state as AudioEngineState

    // Create master gain node for volume control
    this.masterGain = this.audioContext.createGain()
    this.masterGain.gain.value = this._volume
    this.masterGain.connect(this.audioContext.destination)

    // Resume context if it's suspended (some browsers auto-suspend)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
      this._state = 'running'
    }
  }

  /**
   * Start metronome playback
   */
  start(): void {
    if (!this.audioContext) {
      throw new Error('AudioEngine not initialized. Call init() first.')
    }

    if (this._isPlaying) {
      return
    }

    this._isPlaying = true
    this.currentBeat = 0

    // Initialize next beat time to current audio time
    this.nextBeatTime = this.audioContext.currentTime

    // Start the scheduler
    this.schedulerIntervalId = window.setInterval(
      () => this.schedule(),
      SCHEDULER_INTERVAL
    )
  }

  /**
   * Stop metronome playback
   */
  stop(): void {
    if (!this._isPlaying) {
      return
    }

    this._isPlaying = false

    // Stop the scheduler
    if (this.schedulerIntervalId !== null) {
      clearInterval(this.schedulerIntervalId)
      this.schedulerIntervalId = null
    }
  }

  /**
   * Set tempo in BPM (can be called during playback)
   */
  setTempo(bpm: number): void {
    this._tempo = this.clampTempo(bpm)
  }

  /**
   * Set time signature (can be called during playback)
   */
  setTimeSignature(timeSignature: TimeSignature): void {
    this._timeSignature = this.validateTimeSignature(timeSignature)
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume))
    if (this.masterGain) {
      this.masterGain.gain.value = this._volume
    }
  }

  /**
   * Register a callback to be called on each beat (for UI synchronization)
   */
  onBeat(callback: BeatCallback): void {
    this.beatCallback = callback
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop()

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
      this._state = 'closed'
    }
  }

  /**
   * Look-ahead scheduler
   * Schedules beats that will occur within the next SCHEDULE_AHEAD_TIME
   */
  private schedule(): void {
    if (!this.audioContext || !this._isPlaying) {
      return
    }

    // Schedule all beats that fall within the look-ahead window
    while (
      this.nextBeatTime <
      this.audioContext.currentTime + SCHEDULE_AHEAD_TIME
    ) {
      const accentType = getAccentType(this.currentBeat, this._timeSignature)
      this.scheduleBeat(this.nextBeatTime, accentType)

      // Advance to next beat
      this.nextBeatTime += 60.0 / this._tempo
      this.currentBeat =
        (this.currentBeat + 1) % this._timeSignature.beatsPerBar
    }
  }

  /**
   * Schedule a single beat at the specified time
   */
  private scheduleBeat(time: number, accentType: AccentType): void {
    if (!this.audioContext || !this.masterGain) {
      return
    }

    // Create oscillator for the click sound
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.connect(gain)
    gain.connect(this.masterGain)

    // Set frequency based on accent type
    if (accentType === 'primary') {
      osc.frequency.value = ACCENT_FREQUENCY
    } else if (accentType === 'secondary') {
      osc.frequency.value = ACCENT_SECONDARY_FREQUENCY
    } else {
      osc.frequency.value = REGULAR_FREQUENCY
    }

    // Set gain envelope (quick attack, exponential decay)
    gain.gain.setValueAtTime(0.5, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + CLICK_DURATION)

    // Schedule the click
    osc.start(time)
    osc.stop(time + CLICK_DURATION)

    // Fire beat callback for UI synchronization
    // Note: This will have slight jitter as it's JS-based, but audio timing is precise
    if (this.beatCallback) {
      const currentBeatNumber = this.currentBeat + 1 // 1-indexed for UI
      const delay = (time - this.audioContext.currentTime) * 1000

      setTimeout(
        () => {
          if (this.beatCallback) {
            this.beatCallback(currentBeatNumber, accentType)
          }
        },
        Math.max(0, delay)
      )
    }
  }

  /**
   * Clamp tempo to valid range
   */
  private clampTempo(bpm: number): number {
    return Math.max(MIN_TEMPO, Math.min(MAX_TEMPO, bpm))
  }

  /**
   * Validate and normalize time signature
   */
  private validateTimeSignature(ts: TimeSignature): TimeSignature {
    const beatsPerBar = Math.max(
      MIN_BEATS_PER_BAR,
      Math.min(MAX_BEATS_PER_BAR, Math.round(ts.beatsPerBar))
    )

    // Validate beat unit
    const beatUnit = VALID_BEAT_UNITS.includes(
      ts.beatUnit as (typeof VALID_BEAT_UNITS)[number]
    )
      ? ts.beatUnit
      : 4

    return { beatsPerBar, beatUnit }
  }
}

/**
 * Create a new AudioEngine instance with default configuration
 */
export function createAudioEngine(
  config: Partial<AudioEngineConfig> = {}
): AudioEngine {
  return new AudioEngine({
    tempo: config.tempo ?? 120,
    timeSignature: config.timeSignature ?? { beatsPerBar: 4, beatUnit: 4 },
  })
}
