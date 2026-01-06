/**
 * Audio Engine Types
 *
 * Type definitions for the Web Audio API-based metronome engine.
 */

/** Accent type for each beat */
export type AccentType = 'primary' | 'secondary' | 'none'

/** Callback fired on each beat for UI synchronization */
export type BeatCallback = (beatNumber: number, accentType: AccentType) => void

/** Callback fired when playback state changes externally (e.g., iOS interruption) */
export type StateChangeCallback = (isPlaying: boolean, reason: string) => void

/** Audio engine state */
export type AudioEngineState =
  | 'uninitialized'
  | 'suspended'
  | 'running'
  | 'closed'
  | 'interrupted' // iOS-specific state

/** Time signature configuration */
export interface TimeSignature {
  /** Numerator - beats per bar (1-12) */
  beatsPerBar: number
  /** Denominator - note value that gets the beat (1, 2, 4, 8, 16, 32, 64) */
  beatUnit: 1 | 2 | 4 | 8 | 16 | 32 | 64
}

/** Audio engine configuration */
export interface AudioEngineConfig {
  /** Tempo in beats per minute (30-300) */
  tempo: number
  /** Time signature (numerator/denominator) */
  timeSignature: TimeSignature
}

/** Audio engine public interface */
export interface IAudioEngine {
  /** Current state of the audio engine */
  readonly state: AudioEngineState
  /** Current tempo in BPM */
  readonly tempo: number
  /** Current time signature */
  readonly timeSignature: TimeSignature
  /** Whether the engine is currently playing */
  readonly isPlaying: boolean
  /** Current volume (0.0 to 1.0) */
  readonly volume: number

  /** Initialize the audio context (requires user gesture) */
  init(): Promise<void>
  /** Start playback */
  start(): void
  /** Stop playback */
  stop(): void
  /** Set tempo (can be called during playback) */
  setTempo(bpm: number): void
  /** Set time signature (can be called during playback) */
  setTimeSignature(timeSignature: TimeSignature): void
  /** Set volume (0.0 to 1.0) */
  setVolume(volume: number): void
  /** Set beat callback for UI synchronization */
  onBeat(callback: BeatCallback): void
  /** Set state change callback for external interruptions */
  onStateChange(callback: StateChangeCallback): void
  /** Clean up resources */
  dispose(): void
}
