/**
 * Storage utilities for persisting application state
 *
 * Uses localStorage for critical settings that should persist across sessions.
 * Uses IndexedDB (via Dexie) for larger data like presets and history.
 */

import type { TimeSignature } from '../types/audio'

/** Keys for localStorage */
const STORAGE_KEYS = {
  TEMPO: 'metronome:tempo',
  TIME_SIGNATURE: 'metronome:timeSignature',
  VOLUME: 'metronome:volume',
  DARK_MODE: 'metronome:darkMode',
  LINK_TEMPO: 'metronome:linkTempo',
} as const

/** Application settings stored in localStorage */
export interface AppSettings {
  tempo: number
  timeSignature: TimeSignature
  volume: number
  darkMode: boolean
  linkTempo: boolean
}

/** Default settings */
const DEFAULT_SETTINGS: AppSettings = {
  tempo: 120,
  timeSignature: { beatsPerBar: 4, beatUnit: 4 },
  volume: 0.5,
  darkMode: false,
  linkTempo: false,
}

/**
 * Load settings from localStorage
 * Returns default settings if no saved settings exist
 */
export function loadSettings(): AppSettings {
  try {
    const tempo = localStorage.getItem(STORAGE_KEYS.TEMPO)
    const timeSignature = localStorage.getItem(STORAGE_KEYS.TIME_SIGNATURE)
    const volume = localStorage.getItem(STORAGE_KEYS.VOLUME)
    const darkMode = localStorage.getItem(STORAGE_KEYS.DARK_MODE)
    const linkTempo = localStorage.getItem(STORAGE_KEYS.LINK_TEMPO)

    return {
      tempo: tempo ? Number(tempo) : DEFAULT_SETTINGS.tempo,
      timeSignature: timeSignature
        ? JSON.parse(timeSignature)
        : DEFAULT_SETTINGS.timeSignature,
      volume: volume ? Number(volume) : DEFAULT_SETTINGS.volume,
      darkMode: darkMode ? darkMode === 'true' : DEFAULT_SETTINGS.darkMode,
      linkTempo: linkTempo ? linkTempo === 'true' : DEFAULT_SETTINGS.linkTempo,
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error)
    return DEFAULT_SETTINGS
  }
}

/**
 * Save tempo to localStorage
 */
export function saveTempo(tempo: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPO, String(tempo))
  } catch (error) {
    console.error('Failed to save tempo:', error)
  }
}

/**
 * Save time signature to localStorage
 */
export function saveTimeSignature(timeSignature: TimeSignature): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.TIME_SIGNATURE,
      JSON.stringify(timeSignature)
    )
  } catch (error) {
    console.error('Failed to save time signature:', error)
  }
}

/**
 * Save volume to localStorage
 */
export function saveVolume(volume: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VOLUME, String(volume))
  } catch (error) {
    console.error('Failed to save volume:', error)
  }
}

/**
 * Save dark mode preference to localStorage
 */
export function saveDarkMode(darkMode: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(darkMode))
  } catch (error) {
    console.error('Failed to save dark mode preference:', error)
  }
}

/**
 * Save link tempo preference to localStorage
 */
export function saveLinkTempo(linkTempo: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LINK_TEMPO, String(linkTempo))
  } catch (error) {
    console.error('Failed to save link tempo preference:', error)
  }
}

/**
 * Clear all settings from localStorage
 */
export function clearSettings(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
  } catch (error) {
    console.error('Failed to clear settings:', error)
  }
}

/**
 * Export settings to JSON file
 */
export function exportSettings(): void {
  try {
    const settings = loadSettings()
    const json = JSON.stringify(settings, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `metronome-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export settings:', error)
    throw new Error('Failed to export settings')
  }
}

/**
 * Import settings from JSON file
 * Returns the imported settings or null if import failed
 */
export function importSettings(file: File): Promise<AppSettings> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const json = event.target?.result as string
          const settings = JSON.parse(json) as AppSettings

          // Validate imported settings
          if (
            typeof settings.tempo !== 'number' ||
            typeof settings.volume !== 'number' ||
            typeof settings.darkMode !== 'boolean' ||
            typeof settings.linkTempo !== 'boolean' ||
            !settings.timeSignature ||
            typeof settings.timeSignature.beatsPerBar !== 'number' ||
            typeof settings.timeSignature.beatUnit !== 'number'
          ) {
            reject(new Error('Invalid settings file format'))
            return
          }

          // Save imported settings to localStorage
          saveTempo(settings.tempo)
          saveTimeSignature(settings.timeSignature)
          saveVolume(settings.volume)
          saveDarkMode(settings.darkMode)
          saveLinkTempo(settings.linkTempo)

          resolve(settings)
        } catch {
          reject(new Error('Failed to parse settings file'))
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read settings file'))
      }

      reader.readAsText(file)
    } catch {
      reject(new Error('Failed to import settings'))
    }
  })
}
