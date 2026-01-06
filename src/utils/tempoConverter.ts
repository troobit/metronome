/**
 * Tempo Converter Utility
 *
 * Handles BPM adjustments when time signatures change to preserve musical "tempo feel"
 */

import type { TimeSignature } from '../types/audio'

/**
 * Beat unit relative values for conversion
 * These represent the rhythmic relationship between different beat units
 */
const BEAT_UNIT_VALUES: Record<number, number> = {
  1: 0.25, // Whole note
  2: 0.5, // Half note
  4: 1.0, // Quarter note (baseline)
  8: 2.0, // Eighth note
  16: 4.0, // Sixteenth note
  32: 8.0, // 32nd note
  64: 16.0, // 64th note
}

/**
 * Calculate the new BPM when changing time signatures
 * to preserve the musical "tempo feel"
 *
 * @param currentBPM - Current tempo in beats per minute
 * @param oldTimeSignature - Previous time signature
 * @param newTimeSignature - New time signature
 * @returns Converted BPM value
 *
 * @example
 * // 3/4 → 6/8 at 120 BPM
 * convertBPM(120, { beatsPerBar: 3, beatUnit: 4 }, { beatsPerBar: 6, beatUnit: 8 })
 * // Returns: 240 (doubled because eighth notes are twice as fast)
 */
export function convertBPM(
  currentBPM: number,
  oldTimeSignature: TimeSignature,
  newTimeSignature: TimeSignature
): number {
  const oldBeatValue = BEAT_UNIT_VALUES[oldTimeSignature.beatUnit]
  const newBeatValue = BEAT_UNIT_VALUES[newTimeSignature.beatUnit]

  if (!oldBeatValue || !newBeatValue) {
    console.warn('Invalid beat unit for conversion, returning original BPM')
    return currentBPM
  }

  // Calculate the ratio and apply it to the current BPM
  const ratio = newBeatValue / oldBeatValue
  return currentBPM * ratio
}

/**
 * Clamp BPM to valid range
 *
 * @param bpm - BPM value to clamp
 * @param min - Minimum allowed BPM (default: 30)
 * @param max - Maximum allowed BPM (default: 600)
 * @returns Clamped BPM value
 */
export function clampBPM(
  bpm: number,
  min: number = 30,
  max: number = 600
): number {
  return Math.max(min, Math.min(max, Math.round(bpm)))
}
