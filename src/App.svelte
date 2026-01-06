<script lang="ts">
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

  // Non-reactive references
  let engineRef: AudioEngine | null = null
  let tapResetTimeoutId: number | null = null
  let fileInputElement: HTMLInputElement

  // Reactive state
  let isInitialized = $state(false)
  let isPlaying = $state(false)

  // Load settings with IIFE
  let tempo = $state(loadSettings().tempo)
  let timeSignature = $state<TimeSignature>(loadSettings().timeSignature)
  let volume = $state(loadSettings().volume)
  let isDarkMode = $state(loadSettings().darkMode)
  let linkTempo = $state(loadSettings().linkTempo)

  let currentBeat = $state(0)
  let currentAccentType = $state<AccentType>('none')
  let animateNumerator = $state(false)
  let animateDenominator = $state(false)
  let tapTimes = $state<number[]>([])
  let tapActive = $state(false)
  let interruptionMessage = $state<string | null>(null)

  // Valid denominators for time signatures (powers of 2)
  const VALID_DENOMINATORS = [1, 2, 4, 8, 16, 32, 64] as const
  type ValidDenominator = (typeof VALID_DENOMINATORS)[number]

  // Derived state - compute compound time signature flag
  let isCompound = $derived(
    timeSignature.beatsPerBar > 3 &&
      timeSignature.beatsPerBar % 3 === 0 &&
      timeSignature.beatUnit === 8
  )

  // Initialization effect
  $effect(() => {
    // Load settings once on mount
    const settings = loadSettings()

    // Create engine with saved values
    engineRef = createAudioEngine({
      tempo: settings.tempo,
      timeSignature: settings.timeSignature,
    })

    // Set initial volume
    if (engineRef) {
      engineRef.setVolume(settings.volume)
    }

    // Set up beat callback
    engineRef.onBeat((beatNumber, accentType) => {
      currentBeat = beatNumber
      currentAccentType = accentType
      const accentLabel =
        accentType === 'primary'
          ? ' (PRIMARY ACCENT)'
          : accentType === 'secondary'
            ? ' (SECONDARY ACCENT)'
            : ''
      console.log(`Beat ${beatNumber}${accentLabel}`)
    })

    // Set up state change callback for iOS interruption handling
    engineRef.onStateChange((isPlayingNew, reason) => {
      console.log(
        `State change from audio engine: isPlaying=${isPlayingNew}, reason=${reason}`
      )

      // Update UI state to match audio engine state
      isPlaying = isPlayingNew

      if (!isPlayingNew) {
        // Audio was stopped externally
        currentBeat = 0
        currentAccentType = 'none'

        // Show notification
        interruptionMessage = reason

        // Auto-dismiss after 8 seconds
        setTimeout(() => {
          interruptionMessage = null
        }, 8000)
      }
    })

    // Cleanup on unmount
    return () => {
      if (engineRef) {
        engineRef.dispose()
      }
    }
  })

  // Timeout cleanup effect
  $effect(() => {
    return () => {
      if (tapResetTimeoutId !== null) {
        clearTimeout(tapResetTimeoutId)
      }
    }
  })

  // Functions
  async function handleInitialize() {
    if (engineRef && !isInitialized) {
      await engineRef.init()
      isInitialized = true
    }
  }

  async function handleStartStop() {
    if (!engineRef) return

    if (!isInitialized) {
      await handleInitialize()
    }

    if (isPlaying) {
      engineRef.stop()
      isPlaying = false
      currentBeat = 0
      currentAccentType = 'none'
    } else {
      try {
        const resumed = await engineRef.resumeIfSuspended()
        if (!resumed) {
          interruptionMessage =
            'Unable to resume audio. Please refresh the page and try again.'
          return
        }
      } catch (error) {
        console.error('Failed to resume AudioContext:', error)
        interruptionMessage =
          'Audio system error. Please refresh the page and try again.'
        return
      }

      engineRef.start()
      isPlaying = true
      interruptionMessage = null
    }
  }

  function updateTempo(newTempo: number) {
    const clampedTempo = clampBPM(newTempo, 30, 600)
    tempo = clampedTempo
    saveTempoToStorage(clampedTempo)
    if (engineRef) {
      engineRef.setTempo(clampedTempo)
    }
  }

  function updateVolume(newVolume: number) {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    volume = clampedVolume
    saveVolumeToStorage(clampedVolume)
    if (engineRef) {
      engineRef.setVolume(clampedVolume)
    }
  }

  function updateTimeSignature(updates: Partial<TimeSignature>) {
    const oldTimeSignature = timeSignature
    const newTimeSignature = { ...timeSignature, ...updates }

    newTimeSignature.beatsPerBar = Math.max(
      1,
      Math.min(99, newTimeSignature.beatsPerBar)
    )

    const isValidDenominator = (value: number): value is ValidDenominator => {
      return VALID_DENOMINATORS.includes(value as ValidDenominator)
    }

    if (!isValidDenominator(newTimeSignature.beatUnit)) {
      newTimeSignature.beatUnit = 4
    }

    timeSignature = newTimeSignature
    saveTimeSignatureToStorage(newTimeSignature)

    if (engineRef) {
      engineRef.setTimeSignature(newTimeSignature)
    }

    // Link tempo adjustment logic
    if (linkTempo && oldTimeSignature.beatUnit !== newTimeSignature.beatUnit) {
      const newBPM = convertBPM(tempo, oldTimeSignature, newTimeSignature)
      const clampedBPM = clampBPM(newBPM, 30, 600)
      updateTempo(clampedBPM)

      if (clampedBPM !== Math.round(newBPM)) {
        console.log(
          `BPM adjusted from ${Math.round(newBPM)} to ${clampedBPM} (clamped to valid range)`
        )
      }
    }
  }

  // Animation trigger functions
  function triggerNumeratorAnimation() {
    animateNumerator = true
    setTimeout(() => (animateNumerator = false), 150)
  }

  function triggerDenominatorAnimation() {
    animateDenominator = true
    setTimeout(() => (animateDenominator = false), 150)
  }

  // Increment/decrement functions
  function incrementNumerator() {
    const newValue =
      timeSignature.beatsPerBar >= 99 ? 1 : timeSignature.beatsPerBar + 1
    updateTimeSignature({ beatsPerBar: newValue })
    triggerNumeratorAnimation()
  }

  function decrementNumerator() {
    const newValue =
      timeSignature.beatsPerBar <= 1 ? 99 : timeSignature.beatsPerBar - 1
    updateTimeSignature({ beatsPerBar: newValue })
    triggerNumeratorAnimation()
  }

  function incrementDenominator() {
    const currentIndex = VALID_DENOMINATORS.indexOf(
      timeSignature.beatUnit as ValidDenominator
    )
    const nextIndex = (currentIndex + 1) % VALID_DENOMINATORS.length
    updateTimeSignature({ beatUnit: VALID_DENOMINATORS[nextIndex] })
    triggerDenominatorAnimation()
  }

  function decrementDenominator() {
    const currentIndex = VALID_DENOMINATORS.indexOf(
      timeSignature.beatUnit as ValidDenominator
    )
    const prevIndex =
      currentIndex === 0 ? VALID_DENOMINATORS.length - 1 : currentIndex - 1
    updateTimeSignature({ beatUnit: VALID_DENOMINATORS[prevIndex] })
    triggerDenominatorAnimation()
  }

  // Keyboard handlers
  function handleNumeratorKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      incrementNumerator()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      decrementNumerator()
    }
  }

  function handleDenominatorKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      incrementDenominator()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      decrementDenominator()
    }
  }

  // Tap tempo handler
  function handleTapTempo() {
    const now = performance.now()
    tapActive = true
    setTimeout(() => (tapActive = false), 100)

    if (tapResetTimeoutId !== null) {
      clearTimeout(tapResetTimeoutId)
    }

    // Filter old taps
    const filteredTaps =
      tapTimes.length > 0 && now - tapTimes[tapTimes.length - 1] > 2000
        ? []
        : tapTimes

    const newTaps = [...filteredTaps, now]
    const recentTaps = newTaps.slice(-8)

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

    tapTimes = recentTaps

    tapResetTimeoutId = window.setTimeout(() => {
      tapTimes = []
    }, 2000)
  }

  // Export/Import handlers
  function handleExport() {
    try {
      exportSettings()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export settings')
    }
  }

  async function handleImport(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    try {
      const settings = await importSettings(file)

      // Update all state
      tempo = settings.tempo
      timeSignature = settings.timeSignature
      volume = settings.volume
      isDarkMode = settings.darkMode
      linkTempo = settings.linkTempo

      // Update audio engine
      if (engineRef) {
        engineRef.setTempo(settings.tempo)
        engineRef.setTimeSignature(settings.timeSignature)
        engineRef.setVolume(settings.volume)
      }

      alert('Settings imported successfully!')
    } catch (error) {
      console.error('Import failed:', error)
      alert(error instanceof Error ? error.message : 'Failed to import settings')
    } finally {
      // Reset file input
      if (fileInputElement) {
        fileInputElement.value = ''
      }
    }
  }

  // Render beat indicators helper
  function renderBeatIndicators() {
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

      return {
        index: i,
        colorClass,
        isActive,
      }
    })

    if (isCompound) {
      const groups = []
      for (let i = 0; i < beats.length; i += 3) {
        groups.push(beats.slice(i, i + 3))
      }
      return groups
    }

    return [beats]
  }
</script>

<div
  class={`flex min-h-screen flex-col items-center justify-center p-4 transition-colors duration-300 ${
    isDarkMode
      ? 'bg-linear-to-br from-gray-900 to-gray-800'
      : 'bg-linear-to-br from-blue-50 to-indigo-100'
  }`}
>
  <!-- Audio Interruption Notification -->
  {#if interruptionMessage}
    <div
      class="fixed top-4 left-4 right-4 z-50 rounded-lg bg-yellow-500 p-4 text-white shadow-2xl animate-slide-in max-w-2xl mx-auto"
    >
      <div class="flex items-start gap-3">
        <svg
          class="h-6 w-6 shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm">Audio Interrupted</p>
          <p class="text-xs mt-1 opacity-90">{interruptionMessage}</p>
          <p class="text-xs mt-2 opacity-90 font-medium">
            Tap "Start" below to resume the metronome
          </p>
        </div>
        <button
          on:click={() => (interruptionMessage = null)}
          class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-yellow-600 transition-colors shrink-0"
          aria-label="Dismiss notification"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  {/if}

  <div
    class={`relative w-full max-w-md space-y-6 rounded-2xl p-8 shadow-2xl transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}
  >
    <!-- Dark Mode Toggle -->
    <button
      on:click={() => {
        const newDarkMode = !isDarkMode
        isDarkMode = newDarkMode
        saveDarkModeToStorage(newDarkMode)
      }}
      class={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110 ${
        isDarkMode
          ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
          : 'bg-gray-800 text-yellow-300 hover:bg-gray-700'
      }`}
      aria-label="Toggle dark mode"
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {#if isDarkMode}
        <svg
          class="h-6 w-6"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clip-rule="evenodd"
          />
        </svg>
      {:else}
        <svg
          class="h-6 w-6"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
          />
        </svg>
      {/if}
    </button>

    <!-- Beat Indicator -->
    <div class="flex flex-wrap justify-center gap-4 py-8">
      {#each renderBeatIndicators() as group}
        <div class="flex gap-2">
          {#each group as beat}
            <div
              class={`h-4 w-4 rounded-full transition-all duration-150 ease-out ${beat.colorClass}`}
              style={beat.isActive
                ? 'animation: beat-pulse 100ms ease-out'
                : ''}
            />
          {/each}
        </div>
      {/each}
    </div>

    <!-- Tempo Control -->
    <div class="space-y-3">
      <label
        class={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
      >
        Tempo
      </label>
      <div class="flex items-center gap-3">
        <button
          on:click={() => updateTempo(tempo - 1)}
          class={`flex h-12 w-12 items-center justify-center rounded-lg font-bold transition-colors ${
            isDarkMode
              ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 active:bg-gray-500'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
          }`}
          aria-label="Decrease tempo"
        >
          −
        </button>
        <div class="flex-1">
          <div
            class={`text-center text-3xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
          >
            {tempo}
          </div>
          <div
            class={`text-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            BPM
          </div>
        </div>
        <button
          on:click={() => updateTempo(tempo + 1)}
          class={`flex h-12 w-12 items-center justify-center rounded-lg font-bold transition-colors ${
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
        on:input={(e) => updateTempo(Number(e.currentTarget.value))}
        class={`h-2 w-full cursor-pointer appearance-none rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
      />
      <div
        class={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
      >
        <span>30</span>
        <span>600</span>
      </div>

      <!-- Tap Tempo Button -->
      <button
        on:click={handleTapTempo}
        class={`w-full rounded-lg px-4 py-3 font-semibold transition-all ${
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

    <!-- Time Signature Control -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <label
          class={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Time Signature
        </label>
        <button
          on:click={() => {
            const newLinkTempo = !linkTempo
            linkTempo = newLinkTempo
            saveLinkTempoToStorage(newLinkTempo)
          }}
          class={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
            linkTempo
              ? isDarkMode
                ? 'bg-blue-900 text-blue-300 ring-2 ring-blue-500'
                : 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
              : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          aria-label="Toggle link tempo to time signature changes"
          title={linkTempo
            ? 'BPM will adjust when beat unit changes'
            : 'BPM stays constant when beat unit changes'}
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {#if linkTempo}
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            {:else}
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1M6 18h.01M18 6h.01"
              />
            {/if}
          </svg>
          <span>{linkTempo ? 'Link BPM' : 'Link BPM'}</span>
        </button>
      </div>
      <div class="flex items-center justify-center gap-6">
        <!-- Treble Clef Icon -->
        <div
          class={`text-4xl ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
        >
          𝄞
        </div>

        <!-- Time Signature Display -->
        <div class="relative flex flex-col items-center">
          <!-- Numerator -->
          <div class="flex items-center gap-2">
            <button
              on:click={decrementNumerator}
              on:keydown={handleNumeratorKeyDown}
              class={`flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
              }`}
              aria-label="Decrease beats per bar"
              tabindex={0}
            >
              −
            </button>

            <div
              class={`flex h-16 w-20 items-center justify-center rounded-lg border-2 transition-colors ${
                isDarkMode
                  ? 'border-gray-600 bg-gray-700'
                  : 'border-gray-300 bg-white'
              } ${animateNumerator ? 'value-animate' : ''}`}
              role="status"
              aria-live="polite"
              aria-label={`Beats per bar: ${timeSignature.beatsPerBar}`}
            >
              <span
                class={`text-3xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
              >
                {timeSignature.beatsPerBar}
              </span>
            </div>

            <button
              on:click={incrementNumerator}
              on:keydown={handleNumeratorKeyDown}
              class={`flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
              }`}
              aria-label="Increase beats per bar"
              tabindex={0}
            >
              +
            </button>
          </div>

          <!-- Horizontal line -->
          <div
            class={`my-1 h-0.5 w-20 ${isDarkMode ? 'bg-gray-400' : 'bg-gray-800'}`}
          ></div>

          <!-- Denominator -->
          <div class="flex items-center gap-2">
            <button
              on:click={decrementDenominator}
              on:keydown={handleDenominatorKeyDown}
              class={`flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
              }`}
              aria-label="Decrease beat unit (cycle through 64, 32, 16, 8, 4, 2, 1)"
              tabindex={0}
            >
              −
            </button>

            <div
              class={`flex h-16 w-20 items-center justify-center rounded-lg border-2 transition-colors ${
                isDarkMode
                  ? 'border-gray-600 bg-gray-700'
                  : 'border-gray-300 bg-white'
              } ${animateDenominator ? 'value-animate' : ''}`}
              role="status"
              aria-live="polite"
              aria-label={`Beat unit: ${timeSignature.beatUnit}`}
            >
              <span
                class={`text-3xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
              >
                {timeSignature.beatUnit}
              </span>
            </div>

            <button
              on:click={incrementDenominator}
              on:keydown={handleDenominatorKeyDown}
              class={`flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
              }`}
              aria-label="Increase beat unit (cycle through 1, 2, 4, 8, 16, 32, 64)"
              tabindex={0}
            >
              +
            </button>
          </div>
        </div>
      </div>
      <p
        class={`text-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
      >
        {timeSignature.beatsPerBar} beats per bar, {timeSignature.beatUnit} note
        gets the beat
      </p>
    </div>

    <!-- Volume Control -->
    <div class="space-y-3">
      <label
        class={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
      >
        Volume
      </label>
      <div class="flex items-center gap-3">
        <button
          on:click={() => updateVolume(0)}
          class={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          aria-label="Mute"
          title="Mute"
        >
          {#if volume === 0}
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={2}
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          {:else if volume < 0.5}
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={2}
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
          {:else}
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={2}
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
          {/if}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          on:input={(e) => updateVolume(Number(e.currentTarget.value))}
          class={`h-2 flex-1 cursor-pointer appearance-none rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
        />
        <span
          class={`w-12 text-right text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>

    <!-- Start/Stop Button -->
    <button
      on:click={handleStartStop}
      class={`w-full rounded-lg px-8 py-4 text-xl font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${
        isPlaying
          ? 'bg-red-600 hover:bg-red-700'
          : 'bg-green-600 hover:bg-green-700'
      }`}
    >
      {isPlaying ? 'Stop' : 'Start'}
    </button>

    {#if !isInitialized}
      <p
        class={`text-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
      >
        Click Start to initialize audio (requires user interaction)
      </p>
    {/if}

    <!-- Export/Import Settings -->
    <div
      class="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
    >
      <button
        on:click={handleExport}
        class={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          isDarkMode
            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        aria-label="Export settings"
        title="Export settings to JSON file"
      >
        <svg
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Export Settings
      </button>
      <button
        on:click={() => fileInputElement?.click()}
        class={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          isDarkMode
            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        aria-label="Import settings"
        title="Import settings from JSON file"
      >
        <svg
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
        Import Settings
      </button>
      <input
        bind:this={fileInputElement}
        type="file"
        accept="application/json,.json"
        on:change={handleImport}
        class="hidden"
      />
    </div>
  </div>
</div>
