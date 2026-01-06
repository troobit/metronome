/**
 * Color Bounce Context API
 * Manages animated color cycling state using Svelte 5 runes and Context API
 * This provides a global state for synchronized color bouncing animations
 */

import { getContext, setContext } from 'svelte'

const COLOR_BOUNCE_CONTEXT_KEY = Symbol('colorBounce')

interface ColorBounceState {
  hue: number
  isActive: boolean
}

/**
 * Color bounce context class that manages animated color state
 */
class ColorBounceContext {
  private state = $state<ColorBounceState>({ hue: 0, isActive: false })
  private animationFrameId: number | null = null
  private lastTimestamp = 0

  /**
   * Get the current hue value (0-360)
   */
  get hue(): number {
    return this.state.hue
  }

  /**
   * Get whether color bounce animation is active
   */
  get isActive(): boolean {
    return this.state.isActive
  }

  /**
   * Get the current color as an HSL string
   */
  get color(): string {
    return `hsl(${this.state.hue}, 70%, 60%)`
  }

  /**
   * Get the current color as RGB values for CSS custom properties
   */
  get rgbColor(): string {
    const h = this.state.hue / 360
    const s = 0.7
    const l = 0.6

    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
    const m = l - c / 2

    let r = 0, g = 0, b = 0

    if (h < 1 / 6) {
      r = c; g = x; b = 0
    } else if (h < 2 / 6) {
      r = x; g = c; b = 0
    } else if (h < 3 / 6) {
      r = 0; g = c; b = x
    } else if (h < 4 / 6) {
      r = 0; g = x; b = c
    } else if (h < 5 / 6) {
      r = x; g = 0; b = c
    } else {
      r = c; g = 0; b = x
    }

    const red = Math.round((r + m) * 255)
    const green = Math.round((g + m) * 255)
    const blue = Math.round((b + m) * 255)

    return `${red} ${green} ${blue}`
  }

  /**
   * Start the color bounce animation
   */
  start(): void {
    if (this.state.isActive) return

    this.state.isActive = true
    this.lastTimestamp = performance.now()
    this.animate(this.lastTimestamp)
  }

  /**
   * Stop the color bounce animation
   */
  stop(): void {
    this.state.isActive = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * Toggle the color bounce animation
   */
  toggle(): void {
    if (this.state.isActive) {
      this.stop()
    } else {
      this.start()
    }
  }

  /**
   * Reset the hue to 0
   */
  reset(): void {
    this.state.hue = 0
  }

  /**
   * Animation loop - cycles through hue values
   */
  private animate(timestamp: number): void {
    if (!this.state.isActive) return

    const elapsed = timestamp - this.lastTimestamp
    this.lastTimestamp = timestamp

    // Cycle through 360 degrees over 10 seconds (36 degrees per second)
    const hueIncrement = (elapsed / 1000) * 36
    this.state.hue = (this.state.hue + hueIncrement) % 360

    this.animationFrameId = requestAnimationFrame((ts) => this.animate(ts))
  }
}

/**
 * Create and set a new color bounce context
 * Call this in the root component
 *
 * @returns The created color bounce context
 */
export function createColorBounceContext(): ColorBounceContext {
  const context = new ColorBounceContext()
  setContext(COLOR_BOUNCE_CONTEXT_KEY, context)
  return context
}

/**
 * Get the color bounce context from the nearest parent
 * Throws an error if called outside of a color bounce context provider
 *
 * @returns The color bounce context
 */
export function useColorBounceContext(): ColorBounceContext {
  const context = getContext<ColorBounceContext>(COLOR_BOUNCE_CONTEXT_KEY)
  if (!context) {
    throw new Error(
      'useColorBounceContext must be used within a component that has ColorBounceContext'
    )
  }
  return context
}
