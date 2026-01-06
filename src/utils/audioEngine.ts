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
  StateChangeCallback,
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
  private stateChangeCallback: StateChangeCallback | null = null

  // Scheduler state
  private schedulerIntervalId: number | null = null
  private nextBeatTime = 0
  private currentBeat = 0

  // iOS background audio support
  private visibilityChangeHandler: (() => void) | null = null
  private wasPlayingBeforeHidden = false

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

    // Set up AudioContext state change listener for iOS interruption handling
    this.setupAudioContextStateMonitoring()

    // Set up visibility change handler for tab switches and screen lock
    this.setupVisibilityChangeHandler()

    // Set up Media Session API for iOS background audio
    this.setupMediaSession()

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

    // Update Media Session playback state
    this.updateMediaSessionPlaybackState()
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

    // Update Media Session playback state
    this.updateMediaSessionPlaybackState()
  }

  /**
   * Set tempo in BPM (can be called during playback)
   */
  setTempo(bpm: number): void {
    this._tempo = this.clampTempo(bpm)
    // Update Media Session metadata to reflect new tempo
    this.updateMediaSessionMetadata()
  }

  /**
   * Set time signature (can be called during playback)
   */
  setTimeSignature(timeSignature: TimeSignature): void {
    this._timeSignature = this.validateTimeSignature(timeSignature)
    // Update Media Session metadata to reflect new time signature
    this.updateMediaSessionMetadata()
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
   * Register a callback to be called when playback state changes externally
   */
  onStateChange(callback: StateChangeCallback): void {
    this.stateChangeCallback = callback
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop()

    // Remove visibility change handler
    if (this.visibilityChangeHandler) {
      document.removeEventListener(
        'visibilitychange',
        this.visibilityChangeHandler
      )
      this.visibilityChangeHandler = null
    }

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

  /**
   * Set up AudioContext state change monitoring for iOS interruption handling
   * iOS can interrupt audio when another app plays audio, screen locks, etc.
   */
  private setupAudioContextStateMonitoring(): void {
    if (!this.audioContext) return

    this.audioContext.onstatechange = () => {
      if (!this.audioContext) return

      const newState = this.audioContext.state as AudioEngineState
      const oldState = this._state
      this._state = newState

      console.log(`AudioContext state changed: ${oldState} → ${newState}`)

      // Handle interruption or suspension
      if (newState === 'suspended' || newState === 'interrupted') {
        if (this._isPlaying) {
          console.warn('Audio interrupted by iOS - stopping playback')

          // Stop the scheduler but don't clear isPlaying yet
          // This allows us to notify the UI about the interruption
          if (this.schedulerIntervalId !== null) {
            clearInterval(this.schedulerIntervalId)
            this.schedulerIntervalId = null
          }

          // Update internal state
          this._isPlaying = false

          // Notify UI about the state change
          if (this.stateChangeCallback) {
            this.stateChangeCallback(
              false,
              'Audio was interrupted (screen lock, app switch, or another audio source)'
            )
          }
        }
      }

      // Handle resumption - but require user gesture
      if (newState === 'running' && oldState !== 'running') {
        console.log('AudioContext resumed')

        // Don't auto-restart playback - wait for user action
        // The UI will handle prompting the user if needed
      }
    }
  }

  /**
   * Set up visibility change handler for tab switches and screen lock
   * Attempts to keep audio playing when page is hidden
   */
  private setupVisibilityChangeHandler(): void {
    this.visibilityChangeHandler = async () => {
      if (!this.audioContext) return

      if (document.hidden) {
        // Page is hidden (tab switch or screen lock)
        this.wasPlayingBeforeHidden = this._isPlaying
        console.log(`Page hidden, wasPlaying: ${this.wasPlayingBeforeHidden}`)

        // Try to keep AudioContext alive (iOS may still suspend it)
        if (this._isPlaying && this.audioContext.state === 'running') {
          // Audio should continue in background with Media Session API
          console.log('Attempting to maintain audio in background')
        }
      } else {
        // Page is visible again
        console.log(`Page visible, wasPlaying: ${this.wasPlayingBeforeHidden}`)

        // Resume AudioContext if it was suspended
        if (
          this.audioContext.state === 'suspended' &&
          this.wasPlayingBeforeHidden
        ) {
          try {
            await this.audioContext.resume()
            console.log('AudioContext resumed after page became visible')
          } catch (error) {
            console.error('Failed to resume AudioContext:', error)
          }
        }
      }
    }

    document.addEventListener('visibilitychange', this.visibilityChangeHandler)
  }

  /**
   * Set up Media Session API for iOS background audio support
   * This helps prevent iOS from suspending audio when screen locks or tab switches
   */
  private setupMediaSession(): void {
    // Check if Media Session API is supported
    if (!('mediaSession' in navigator)) {
      console.log('Media Session API not supported')
      return
    }

    // Set metadata for lock screen / notification controls
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Metronome',
      artist: `${this._tempo} BPM`,
      album: `${this._timeSignature.beatsPerBar}/${this._timeSignature.beatUnit}`,
      artwork: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    })

    // Set up action handlers for media controls
    navigator.mediaSession.setActionHandler('play', () => {
      console.log('Media Session: play action')
      if (!this._isPlaying) {
        this.start()
        if (this.stateChangeCallback) {
          this.stateChangeCallback(true, 'Started via media controls')
        }
      }
    })

    navigator.mediaSession.setActionHandler('pause', () => {
      console.log('Media Session: pause action')
      if (this._isPlaying) {
        this.stop()
        if (this.stateChangeCallback) {
          this.stateChangeCallback(false, 'Paused via media controls')
        }
      }
    })

    navigator.mediaSession.setActionHandler('stop', () => {
      console.log('Media Session: stop action')
      if (this._isPlaying) {
        this.stop()
        if (this.stateChangeCallback) {
          this.stateChangeCallback(false, 'Stopped via media controls')
        }
      }
    })

    // Set playback state
    navigator.mediaSession.playbackState = 'none'

    console.log('Media Session API configured')
  }

  /**
   * Update Media Session metadata when tempo or time signature changes
   */
  private updateMediaSessionMetadata(): void {
    if (!('mediaSession' in navigator)) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Metronome',
      artist: `${this._tempo} BPM`,
      album: `${this._timeSignature.beatsPerBar}/${this._timeSignature.beatUnit}`,
      artwork: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    })
  }

  /**
   * Update Media Session playback state
   */
  private updateMediaSessionPlaybackState(): void {
    if (!('mediaSession' in navigator)) return

    navigator.mediaSession.playbackState = this._isPlaying
      ? 'playing'
      : 'paused'
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
