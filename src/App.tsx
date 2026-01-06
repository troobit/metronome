import { useEffect, useRef, useState } from 'react'
import { createAudioEngine } from './utils/audioEngine'
import type { AudioEngine } from './utils/audioEngine'
import type { TimeSignature, AccentType } from './types/audio'
import { convertBPM, clampBPM } from './utils/tempoConverter'
import {
  loadSettings,
  saveTempo as saveTempoToStorage,
  saveTimeSignature as saveTimeSignatureToStorage,
  saveVolume as saveVolumeToStorage,
  saveDarkMode as saveDarkModeToStorage,
  saveLinkTempo as saveLinkTempoToStorage,
  exportSettings,
  importSettings,
} from './utils/storage'

function App() {
  const engineRef = useRef<AudioEngine | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Load settings from localStorage - use lazy initialization
  const [tempo, setTempo] = useState(() => loadSettings().tempo)
  const [timeSignature, setTimeSignature] = useState<TimeSignature>(
    () => loadSettings().timeSignature
  )
  const [volume, setVolume] = useState(() => loadSettings().volume)
  const [isDarkMode, setIsDarkMode] = useState(() => loadSettings().darkMode)
  const [linkTempo, setLinkTempo] = useState(() => loadSettings().linkTempo)

  const [currentBeat, setCurrentBeat] = useState(0)
  const [currentAccentType, setCurrentAccentType] = useState<AccentType>('none')
  const [animateNumerator, setAnimateNumerator] = useState(false)
  const [animateDenominator, setAnimateDenominator] = useState(false)
  const [tapTimes, setTapTimes] = useState<number[]>([])
  const [tapActive, setTapActive] = useState(false)
  const tapResetTimeoutRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Audio interruption notification state
  const [interruptionMessage, setInterruptionMessage] = useState<string | null>(
    null
  )

  useEffect(() => {
    // Load settings once on mount
    const settings = loadSettings()

    // Create engine on mount with saved values
    engineRef.current = createAudioEngine({
      tempo: settings.tempo,
      timeSignature: settings.timeSignature,
    })

    // Set initial volume
    if (engineRef.current) {
      engineRef.current.setVolume(settings.volume)
    }

    // Set up beat callback
    engineRef.current.onBeat((beatNumber, accentType) => {
      setCurrentBeat(beatNumber)
      setCurrentAccentType(accentType)
      const accentLabel =
        accentType === 'primary'
          ? ' (PRIMARY ACCENT)'
          : accentType === 'secondary'
            ? ' (SECONDARY ACCENT)'
            : ''
      console.log(`Beat ${beatNumber}${accentLabel}`)
    })

    // Set up state change callback for iOS interruption handling
    engineRef.current.onStateChange((isPlaying, reason) => {
      console.log(
        `State change from audio engine: isPlaying=${isPlaying}, reason=${reason}`
      )

      // Update UI state to match audio engine state
      setIsPlaying(isPlaying)

      if (!isPlaying) {
        // Audio was stopped externally (e.g., iOS interruption)
        setCurrentBeat(0)
        setCurrentAccentType('none')

        // Show notification to user
        setInterruptionMessage(reason)

        // Auto-dismiss notification after 8 seconds
        setTimeout(() => {
          setInterruptionMessage(null)
        }, 8000)
      }
    })

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose()
      }
    }
  }, [])

  const handleInitialize = async () => {
    if (engineRef.current && !isInitialized) {
      await engineRef.current.init()
      setIsInitialized(true)
    }
  }

  const handleStartStop = async () => {
    if (!engineRef.current) return

    if (!isInitialized) {
      await handleInitialize()
    }

    if (isPlaying) {
      engineRef.current.stop()
      setIsPlaying(false)
      setCurrentBeat(0)
      setCurrentAccentType('none')
    } else {
      engineRef.current.start()
      setIsPlaying(true)
    }
  }

  const updateTempo = (newTempo: number) => {
    const clampedTempo = clampBPM(newTempo, 30, 600)
    setTempo(clampedTempo)
    saveTempoToStorage(clampedTempo)
    if (engineRef.current) {
      engineRef.current.setTempo(clampedTempo)
    }
  }

  const updateVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setVolume(clampedVolume)
    saveVolumeToStorage(clampedVolume)
    if (engineRef.current) {
      engineRef.current.setVolume(clampedVolume)
    }
  }

  // Valid denominators for time signatures (powers of 2)
  const VALID_DENOMINATORS = [1, 2, 4, 8, 16, 32, 64] as const
  type ValidDenominator = (typeof VALID_DENOMINATORS)[number]

  const updateTimeSignature = (updates: Partial<TimeSignature>) => {
    const oldTimeSignature = timeSignature
    const newTimeSignature = { ...timeSignature, ...updates }
    // Allow unconventional time signatures - only enforce minimum of 1
    // Maximum of 99 to prevent UI overflow and performance issues
    newTimeSignature.beatsPerBar = Math.max(
      1,
      Math.min(99, newTimeSignature.beatsPerBar)
    )
    // Validate denominator - check if it's one of the valid denominators
    const isValidDenominator = (value: number): value is ValidDenominator => {
      return VALID_DENOMINATORS.includes(value as ValidDenominator)
    }
    if (!isValidDenominator(newTimeSignature.beatUnit)) {
      newTimeSignature.beatUnit = 4 // Default to 4 if invalid
    }
    setTimeSignature(newTimeSignature)
    saveTimeSignatureToStorage(newTimeSignature)
    if (engineRef.current) {
      engineRef.current.setTimeSignature(newTimeSignature)
    }

    // If linkTempo is enabled and beat unit changed, adjust BPM proportionally
    if (linkTempo && oldTimeSignature.beatUnit !== newTimeSignature.beatUnit) {
      const newBPM = convertBPM(tempo, oldTimeSignature, newTimeSignature)
      const clampedBPM = clampBPM(newBPM, 30, 600)
      updateTempo(clampedBPM)

      // Notify user if BPM was clamped
      if (clampedBPM !== Math.round(newBPM)) {
        console.log(
          `BPM adjusted from ${Math.round(newBPM)} to ${clampedBPM} (clamped to valid range)`
        )
      }
    }
  }

  // Trigger animation when numerator changes
  const triggerNumeratorAnimation = () => {
    setAnimateNumerator(true)
    setTimeout(() => setAnimateNumerator(false), 150)
  }

  // Trigger animation when denominator changes
  const triggerDenominatorAnimation = () => {
    setAnimateDenominator(true)
    setTimeout(() => setAnimateDenominator(false), 150)
  }

  // Increment numerator (with wrapping)
  const incrementNumerator = () => {
    const newValue =
      timeSignature.beatsPerBar >= 99 ? 1 : timeSignature.beatsPerBar + 1
    updateTimeSignature({ beatsPerBar: newValue })
    triggerNumeratorAnimation()
  }

  // Decrement numerator (with wrapping)
  const decrementNumerator = () => {
    const newValue =
      timeSignature.beatsPerBar <= 1 ? 99 : timeSignature.beatsPerBar - 1
    updateTimeSignature({ beatsPerBar: newValue })
    triggerNumeratorAnimation()
  }

  // Cycle to next denominator (wraps around)
  const incrementDenominator = () => {
    const currentIndex = VALID_DENOMINATORS.indexOf(
      timeSignature.beatUnit as ValidDenominator
    )
    const nextIndex = (currentIndex + 1) % VALID_DENOMINATORS.length
    updateTimeSignature({ beatUnit: VALID_DENOMINATORS[nextIndex] })
    triggerDenominatorAnimation()
  }

  // Cycle to previous denominator (wraps around)
  const decrementDenominator = () => {
    const currentIndex = VALID_DENOMINATORS.indexOf(
      timeSignature.beatUnit as ValidDenominator
    )
    const prevIndex =
      currentIndex === 0 ? VALID_DENOMINATORS.length - 1 : currentIndex - 1
    updateTimeSignature({ beatUnit: VALID_DENOMINATORS[prevIndex] })
    triggerDenominatorAnimation()
  }

  // Handle keyboard navigation for numerator
  const handleNumeratorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      incrementNumerator()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      decrementNumerator()
    }
  }

  // Handle keyboard navigation for denominator
  const handleDenominatorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      incrementDenominator()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      decrementDenominator()
    }
  }

  // Tap tempo functionality
  const handleTapTempo = () => {
    const now = performance.now()
    setTapActive(true)
    setTimeout(() => setTapActive(false), 100)

    // Clear any existing reset timeout
    if (tapResetTimeoutRef.current !== null) {
      clearTimeout(tapResetTimeoutRef.current)
    }

    // Reset taps if more than 2 seconds since last tap
    setTapTimes((prevTaps) => {
      const filteredTaps =
        prevTaps.length > 0 && now - prevTaps[prevTaps.length - 1] > 2000
          ? []
          : prevTaps

      const newTaps = [...filteredTaps, now]

      // Keep only last 8 taps for calculation
      const recentTaps = newTaps.slice(-8)

      // Calculate average BPM if we have at least 2 taps
      if (recentTaps.length >= 2) {
        const intervals = []
        for (let i = 1; i < recentTaps.length; i++) {
          intervals.push(recentTaps[i] - recentTaps[i - 1])
        }
        const avgInterval =
          intervals.reduce((a, b) => a + b, 0) / intervals.length
        const calculatedBPM = Math.round(60000 / avgInterval)
        updateTempo(calculatedBPM)
      }

      return recentTaps
    })

    // Set timeout to reset taps after 2 seconds of inactivity
    tapResetTimeoutRef.current = window.setTimeout(() => {
      setTapTimes([])
    }, 2000)
  }

  // Cleanup tap timeout on unmount
  useEffect(() => {
    return () => {
      if (tapResetTimeoutRef.current !== null) {
        clearTimeout(tapResetTimeoutRef.current)
      }
    }
  }, [])

  // Handle export settings
  const handleExport = () => {
    try {
      exportSettings()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export settings')
    }
  }

  // Handle import settings
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const settings = await importSettings(file)

      // Update all state with imported settings
      setTempo(settings.tempo)
      setTimeSignature(settings.timeSignature)
      setVolume(settings.volume)
      setIsDarkMode(settings.darkMode)
      setLinkTempo(settings.linkTempo)

      // Update audio engine
      if (engineRef.current) {
        engineRef.current.setTempo(settings.tempo)
        engineRef.current.setTimeSignature(settings.timeSignature)
        engineRef.current.setVolume(settings.volume)
      }

      alert('Settings imported successfully!')
    } catch (error) {
      console.error('Import failed:', error)
      alert(
        error instanceof Error ? error.message : 'Failed to import settings'
      )
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Determine if this is a compound time signature
  const isCompound =
    timeSignature.beatsPerBar > 3 &&
    timeSignature.beatsPerBar % 3 === 0 &&
    timeSignature.beatUnit === 8

  // Group beats into sets of 3 for compound time signatures
  const renderBeatIndicators = () => {
    const beats = Array.from({ length: timeSignature.beatsPerBar }, (_, i) => {
      const isActive = isPlaying && currentBeat === i + 1
      let colorClass = 'bg-gray-300'

      if (isActive) {
        if (currentAccentType === 'primary') {
          colorClass = 'scale-150 bg-red-500 shadow-lg shadow-red-500/50'
        } else if (currentAccentType === 'secondary') {
          colorClass = 'scale-150 bg-green-500 shadow-lg shadow-green-500/50'
        } else {
          colorClass = 'scale-150 bg-blue-500 shadow-lg shadow-blue-500/50'
        }
      }

      return (
        <div
          key={i}
          className={`h-4 w-4 rounded-full transition-all duration-150 ease-out ${colorClass}`}
          style={
            isActive
              ? {
                  animation: 'beat-pulse 100ms ease-out',
                }
              : undefined
          }
        />
      )
    })

    // For compound time signatures, group beats into sets of 3
    if (isCompound) {
      const groups = []
      for (let i = 0; i < beats.length; i += 3) {
        groups.push(
          <div key={`group-${i}`} className="flex gap-2">
            {beats.slice(i, i + 3)}
          </div>
        )
      }
      return groups
    }

    // For simple time signatures, show all beats in a row
    return beats
  }

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center p-4 transition-colors duration-300 ${
        isDarkMode
          ? 'bg-linear-to-br from-gray-900 to-gray-800'
          : 'bg-linear-to-br from-blue-50 to-indigo-100'
      }`}
    >
      {/* Audio Interruption Notification */}
      {interruptionMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-lg bg-yellow-500 p-4 text-white shadow-2xl animate-slide-in max-w-2xl mx-auto">
          <div className="flex items-center gap-3 flex-1">
            <svg
              className="h-6 w-6 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="font-semibold text-sm">Audio Interrupted</p>
              <p className="text-xs mt-1 opacity-90">{interruptionMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setInterruptionMessage(null)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-yellow-600 transition-colors flex-shrink-0"
            aria-label="Dismiss notification"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
      <div
        className={`relative w-full max-w-md space-y-6 rounded-2xl p-8 shadow-2xl transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Dark Mode Toggle */}
        <button
          onClick={() => {
            const newDarkMode = !isDarkMode
            setIsDarkMode(newDarkMode)
            saveDarkModeToStorage(newDarkMode)
          }}
          className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110 ${
            isDarkMode
              ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
              : 'bg-gray-800 text-yellow-300 hover:bg-gray-700'
          }`}
          aria-label="Toggle dark mode"
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? (
            <svg
              className="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
        {/* Beat Indicator */}
        <div className="flex flex-wrap justify-center gap-4 py-8">
          {renderBeatIndicators()}
        </div>

        {/* Tempo Control */}
        <div className="space-y-3">
          <label
            className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Tempo
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateTempo(tempo - 1)}
              className={`flex h-12 w-12 items-center justify-center rounded-lg font-bold transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 active:bg-gray-500'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
              }`}
              aria-label="Decrease tempo"
            >
              −
            </button>
            <div className="flex-1">
              <div
                className={`text-center text-3xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
              >
                {tempo}
              </div>
              <div
                className={`text-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                BPM
              </div>
            </div>
            <button
              onClick={() => updateTempo(tempo + 1)}
              className={`flex h-12 w-12 items-center justify-center rounded-lg font-bold transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 active:bg-gray-500'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
              }`}
              aria-label="Increase tempo"
            >
              +
            </button>
          </div>
          <input
            type="range"
            min="30"
            max="600"
            value={tempo}
            onChange={(e) => updateTempo(Number(e.target.value))}
            className={`h-2 w-full cursor-pointer appearance-none rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
          />
          <div
            className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            <span>30</span>
            <span>600</span>
          </div>
          {/* Tap Tempo Button */}
          <button
            onClick={handleTapTempo}
            className={`w-full rounded-lg px-4 py-3 font-semibold transition-all ${
              tapActive
                ? isDarkMode
                  ? 'scale-95 bg-purple-600 text-white shadow-lg'
                  : 'scale-95 bg-purple-500 text-white shadow-lg'
                : isDarkMode
                  ? 'bg-purple-700 text-white hover:bg-purple-600 active:scale-95'
                  : 'bg-purple-600 text-white hover:bg-purple-500 active:scale-95'
            }`}
            aria-label="Tap to set tempo"
            title="Tap repeatedly to set tempo"
          >
            {tapTimes.length === 0
              ? 'Tap Tempo'
              : tapTimes.length === 1
                ? 'Tap again...'
                : `Tap ${tapTimes.length}/8`}
          </button>
        </div>

        {/* Time Signature Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Time Signature
            </label>
            <button
              onClick={() => {
                const newLinkTempo = !linkTempo
                setLinkTempo(newLinkTempo)
                saveLinkTempoToStorage(newLinkTempo)
              }}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                linkTempo
                  ? isDarkMode
                    ? 'bg-blue-900 text-blue-300 ring-2 ring-blue-500'
                    : 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-label="Toggle link tempo to time signature changes"
              title={
                linkTempo
                  ? 'BPM will adjust when beat unit changes'
                  : 'BPM stays constant when beat unit changes'
              }
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {linkTempo ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1M6 18h.01M18 6h.01"
                  />
                )}
              </svg>
              <span>{linkTempo ? 'Link BPM' : 'Link BPM'}</span>
            </button>
          </div>
          <div className="flex items-center justify-center gap-6">
            {/* Treble Clef Icon (decorative) */}
            <div
              className={`text-4xl ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
            >
              𝄞
            </div>

            {/* Time Signature Display - Button-based */}
            <div className="relative flex flex-col items-center">
              {/* Numerator */}
              <div className="flex items-center gap-2">
                {/* Decrement button - touch-friendly size (44x44px minimum) */}
                <button
                  onClick={decrementNumerator}
                  onKeyDown={handleNumeratorKeyDown}
                  className={`flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
                  }`}
                  aria-label="Decrease beats per bar"
                  tabIndex={0}
                >
                  −
                </button>

                {/* Value display with animation */}
                <div
                  className={`flex h-16 w-20 items-center justify-center rounded-lg border-2 transition-colors ${
                    isDarkMode
                      ? 'border-gray-600 bg-gray-700'
                      : 'border-gray-300 bg-white'
                  } ${animateNumerator ? 'value-animate' : ''}`}
                  role="status"
                  aria-live="polite"
                  aria-label={`Beats per bar: ${timeSignature.beatsPerBar}`}
                >
                  <span
                    className={`text-3xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
                  >
                    {timeSignature.beatsPerBar}
                  </span>
                </div>

                {/* Increment button */}
                <button
                  onClick={incrementNumerator}
                  onKeyDown={handleNumeratorKeyDown}
                  className={`flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
                  }`}
                  aria-label="Increase beats per bar"
                  tabIndex={0}
                >
                  +
                </button>
              </div>

              {/* Horizontal line separator */}
              <div
                className={`my-1 h-0.5 w-20 ${isDarkMode ? 'bg-gray-400' : 'bg-gray-800'}`}
              ></div>

              {/* Denominator */}
              <div className="flex items-center gap-2">
                {/* Decrement button - touch-friendly size (44x44px minimum) */}
                <button
                  onClick={decrementDenominator}
                  onKeyDown={handleDenominatorKeyDown}
                  className={`flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
                  }`}
                  aria-label="Decrease beat unit (cycle through 64, 32, 16, 8, 4, 2, 1)"
                  tabIndex={0}
                >
                  −
                </button>

                {/* Value display with animation */}
                <div
                  className={`flex h-16 w-20 items-center justify-center rounded-lg border-2 transition-colors ${
                    isDarkMode
                      ? 'border-gray-600 bg-gray-700'
                      : 'border-gray-300 bg-white'
                  } ${animateDenominator ? 'value-animate' : ''}`}
                  role="status"
                  aria-live="polite"
                  aria-label={`Beat unit: ${timeSignature.beatUnit}`}
                >
                  <span
                    className={`text-3xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
                  >
                    {timeSignature.beatUnit}
                  </span>
                </div>

                {/* Increment button */}
                <button
                  onClick={incrementDenominator}
                  onKeyDown={handleDenominatorKeyDown}
                  className={`flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
                  }`}
                  aria-label="Increase beat unit (cycle through 1, 2, 4, 8, 16, 32, 64)"
                  tabIndex={0}
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <p
            className={`text-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            {timeSignature.beatsPerBar} beats per bar, {timeSignature.beatUnit}{' '}
            note gets the beat
          </p>
        </div>

        {/* Volume Control */}
        <div className="space-y-3">
          <label
            className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Volume
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateVolume(0)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              aria-label="Mute"
              title="Mute"
            >
              {volume === 0 ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              ) : volume < 0.5 ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => updateVolume(Number(e.target.value))}
              className={`h-2 flex-1 cursor-pointer appearance-none rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
            />
            <span
              className={`w-12 text-right text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        {/* Start/Stop Button */}
        <button
          onClick={handleStartStop}
          className={`w-full rounded-lg px-8 py-4 text-xl font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${
            isPlaying
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isPlaying ? 'Stop' : 'Start'}
        </button>

        {!isInitialized && (
          <p
            className={`text-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Click Start to initialize audio (requires user interaction)
          </p>
        )}

        {/* Export/Import Settings */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleExport}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label="Export settings"
            title="Export settings to JSON file"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export Settings
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label="Import settings"
            title="Import settings from JSON file"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import Settings
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}

export default App
