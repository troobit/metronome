/**
 * Animation Utilities
 * Provides reusable animation logic and helpers
 */

export interface AnimationOptions {
  duration?: number
  respectReducedMotion?: boolean
}

/**
 * Trigger a temporary animation state
 * Sets a value to true, then back to false after a duration
 *
 * @param setter - Function to set the animation state
 * @param options - Animation options
 * @returns Cleanup function to cancel the animation
 *
 * @example
 * ```ts
 * let animating = $state(false);
 * const cleanup = triggerAnimation(v => animating = v, { duration: 150 });
 * // Later: cleanup() to cancel if needed
 * ```
 */
export function triggerAnimation(
  setter: (value: boolean) => void,
  options: AnimationOptions = {}
): () => void {
  const { duration = 150, respectReducedMotion = true } = options

  // Check for reduced motion preference
  if (
    respectReducedMotion &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return () => {} // No-op cleanup
  }

  setter(true)
  const timeoutId = window.setTimeout(() => setter(false), duration)

  return () => clearTimeout(timeoutId)
}

/**
 * Create a reactive animation state manager
 * Returns an object with an `active` getter, `trigger` method, and `cleanup` function
 *
 * @param duration - Animation duration in milliseconds
 * @returns Animation state manager
 *
 * @example
 * ```ts
 * const animation = createAnimationState(150);
 *
 * // Trigger animation
 * animation.trigger();
 *
 * // Use in template
 * <div class:animate={animation.active}>...</div>
 *
 * // Cleanup on unmount
 * $effect(() => {
 *   return () => animation.cleanup();
 * });
 * ```
 */
export function createAnimationState(duration = 150) {
  let animating = $state(false)
  let timeoutId: number | null = null

  const trigger = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    animating = true
    timeoutId = window.setTimeout(() => {
      animating = false
      timeoutId = null
    }, duration)
  }

  const cleanup = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return {
    get active() {
      return animating
    },
    trigger,
    cleanup,
  }
}

/**
 * Get animation duration from a CSS variable
 * Falls back to default value if variable is not set
 *
 * @param variableName - CSS variable name (with or without --)
 * @param fallback - Fallback value in milliseconds
 * @returns Duration in milliseconds
 *
 * @example
 * ```ts
 * const duration = getAnimationDuration('--animation-beat-duration', 100);
 * ```
 */
export function getAnimationDuration(
  variableName: string,
  fallback = 150
): number {
  const name = variableName.startsWith('--')
    ? variableName
    : `--${variableName}`
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()

  if (!value) {
    return fallback
  }

  // Parse value (handles 'ms' and 's' units)
  const parsed = parseFloat(value)
  if (isNaN(parsed)) {
    return fallback
  }

  // Convert seconds to milliseconds if needed
  return value.endsWith('s') && !value.endsWith('ms') ? parsed * 1000 : parsed
}

/**
 * Check if user prefers reduced motion
 * @returns true if prefers-reduced-motion: reduce is set
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
