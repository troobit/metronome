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
    saveLinkTempo as saveLinkTempoToStorage,
    exportSettings,
    importSettings,
  } from './utils/storage'
  import { createThemeContext } from './lib/contexts/theme.svelte'
  import AppLayout from './lib/components/layout/AppLayout.svelte'
  import MetronomeCard from './lib/components/layout/MetronomeCard.svelte'
  import BeatDisplay from './lib/components/controls/BeatDisplay.svelte'
  import TempoControl from './lib/components/controls/TempoControl.svelte'
  import TimeSignatureControl from './lib/components/controls/TimeSignatureControl.svelte'
  import VolumeControl from './lib/components/controls/VolumeControl.svelte'
  import SettingsPanel from './lib/components/sections/SettingsPanel.svelte'
  import ActionButton from './lib/components/ui/ActionButton.svelte'
  import HamburgerButton from './lib/components/ui/HamburgerButton.svelte'
  import MobileSettingsOverlay from './lib/components/ui/MobileSettingsOverlay.svelte'
  import LinkTempoToggle from './lib/components/controls/LinkTempoToggle.svelte'
  import ThemeToggle from './lib/components/controls/ThemeToggle.svelte'

  // Non-reactive references
  let engineRef: AudioEngine | null = null
  let tapResetTimeoutId: number | null = null
  let fileInputElement: HTMLInputElement

  // Reactive state
  let isInitialized = $state(false)
  let isPlaying = $state(false)
  let isMobileMenuOpen = $state(false)

  // Initialize theme context
  const theme = createThemeContext(loadSettings().darkMode)

  // Load settings with IIFE
  let tempo = $state(loadSettings().tempo)
  let timeSignature = $state<TimeSignature>(loadSettings().timeSignature)
  let volume = $state(loadSettings().volume)
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
      theme.set(settings.darkMode)
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

</script>

<AppLayout
  notificationMessage={interruptionMessage}
  onNotificationDismiss={() => (interruptionMessage = null)}
>
  <MetronomeCard>
    <!-- Hamburger button - visible only on mobile -->
    <div class="mb-4 flex justify-end md:hidden">
      <HamburgerButton isOpen={isMobileMenuOpen} onClick={() => (isMobileMenuOpen = !isMobileMenuOpen)} />
    </div>

    <BeatDisplay
      beatsPerBar={timeSignature.beatsPerBar}
      currentBeat={currentBeat}
      isPlaying={isPlaying}
      accentType={currentAccentType}
      isCompound={isCompound}
    />

    <TempoControl
      tempo={tempo}
      onTempoChange={updateTempo}
      onTapTempo={handleTapTempo}
      tapTimes={tapTimes}
      tapActive={tapActive}
    />

    <TimeSignatureControl
      timeSignature={timeSignature}
      onTimeSignatureChange={updateTimeSignature}
      animateNumerator={animateNumerator}
      animateDenominator={animateDenominator}
      onNumeratorIncrement={incrementNumerator}
      onNumeratorDecrement={decrementNumerator}
      onDenominatorIncrement={incrementDenominator}
      onDenominatorDecrement={decrementDenominator}
      onNumeratorKeyDown={handleNumeratorKeyDown}
      onDenominatorKeyDown={handleDenominatorKeyDown}
    />

    <!-- Volume control - hidden on mobile, visible on desktop -->
    <div class="hidden md:block">
      <VolumeControl volume={volume} onVolumeChange={updateVolume} />
    </div>

    <ActionButton variant={isPlaying ? 'danger' : 'success'} onClick={handleStartStop}>
      {#snippet children()}
        <span class="text-xl">{isPlaying ? 'Stop' : 'Start'}</span>
      {/snippet}
    </ActionButton>

    <!-- Link BPM toggle - hidden on mobile, visible on desktop -->
    <div class="hidden md:block">
      <LinkTempoToggle
        linkTempo={linkTempo}
        onLinkTempoChange={(newValue) => {
          linkTempo = newValue
          saveLinkTempoToStorage(newValue)
        }}
      />
    </div>

    <!-- Settings panel - hidden on mobile, visible on desktop -->
    <div class="hidden md:block">
      <SettingsPanel
        onExport={handleExport}
        onImport={handleImport}
        bind:fileInputElement={fileInputElement}
      />
    </div>
  </MetronomeCard>

  <!-- Mobile settings overlay -->
  <MobileSettingsOverlay isOpen={isMobileMenuOpen} onClose={() => (isMobileMenuOpen = false)}>
    {#snippet children()}
      <ThemeToggle absolute={false} />
      <LinkTempoToggle
        linkTempo={linkTempo}
        onLinkTempoChange={(newValue) => {
          linkTempo = newValue
          saveLinkTempoToStorage(newValue)
        }}
      />
      <VolumeControl volume={volume} onVolumeChange={updateVolume} />
      <SettingsPanel
        onExport={handleExport}
        onImport={handleImport}
        bind:fileInputElement={fileInputElement}
      />
    {/snippet}
  </MobileSettingsOverlay>
</AppLayout>
