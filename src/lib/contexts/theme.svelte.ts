/**
 * Theme Context API
 * Manages dark mode state using Svelte 5 runes and Context API
 */

import { getContext, setContext } from 'svelte'

const THEME_CONTEXT_KEY = Symbol('theme')

interface ThemeState {
  isDark: boolean
}

/**
 * Theme context class that manages dark mode state
 */
class ThemeContext {
  private state = $state<ThemeState>({ isDark: false })

  /**
   * Get whether dark mode is currently enabled
   */
  get isDark(): boolean {
    return this.state.isDark
  }

  /**
   * Toggle between dark and light mode
   */
  toggle(): void {
    this.state.isDark = !this.state.isDark
    this.updateDOM()
  }

  /**
   * Set dark mode on or off
   */
  set(isDark: boolean): void {
    this.state.isDark = isDark
    this.updateDOM()
  }

  /**
   * Update the DOM to reflect the current theme
   * Adds/removes 'dark' class on document element
   */
  private updateDOM(): void {
    if (this.state.isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  /**
   * Initialize the theme context with a starting value
   * Should be called once when the app mounts
   */
  initialize(initialValue: boolean): void {
    this.set(initialValue)
  }
}

/**
 * Create and set a new theme context
 * Call this in the root component
 *
 * @param initialDark - Initial dark mode state (typically loaded from storage)
 * @returns The created theme context
 */
export function createThemeContext(initialDark = false): ThemeContext {
  const context = new ThemeContext()
  context.initialize(initialDark)
  setContext(THEME_CONTEXT_KEY, context)
  return context
}

/**
 * Get the theme context from the nearest parent
 * Throws an error if called outside of a theme context provider
 *
 * @returns The theme context
 */
export function useThemeContext(): ThemeContext {
  const context = getContext<ThemeContext>(THEME_CONTEXT_KEY)
  if (!context) {
    throw new Error(
      'useThemeContext must be used within a component that has ThemeContext'
    )
  }
  return context
}
