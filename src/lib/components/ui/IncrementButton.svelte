<script lang="ts">
	import { useThemeContext } from '$lib/contexts/theme.svelte';

	interface Props {
		direction: 'increment' | 'decrement';
		onClick: () => void;
		ariaLabel: string;
		onKeyDown?: (e: KeyboardEvent) => void;
		tabindex?: number;
	}

	let { direction, onClick, ariaLabel, onKeyDown, tabindex = 0 }: Props = $props();

	const theme = useThemeContext();
	let isHovered = $state(false);
	let longPressTimer: number | null = null;
	let repeatIntervalId: number | null = null;

	const buttonClasses = $derived.by(() => {
		const baseClasses =
			'relative flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent-primary))] overflow-hidden touch-manipulation';

		if (theme.isDark) {
			return `${baseClasses} bg-[rgb(var(--color-surface-secondary))] text-[rgb(var(--color-text-tertiary))] hover:bg-[rgb(var(--color-surface-tertiary))] hover:scale-105 active:bg-[rgb(var(--color-border))] active:scale-95`;
		} else {
			return `${baseClasses} bg-[rgb(var(--color-surface-secondary))] text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-tertiary))] hover:scale-105 active:bg-[rgb(var(--color-border))] active:scale-95`;
		}
	});

	const shimmerClasses = $derived.by(() => {
		const base = 'absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300';
		const shimmerClass = theme.isDark ? 'animate-shimmer-dark' : 'animate-shimmer-light';
		const visibilityClass = isHovered ? 'opacity-100' : '';
		return `${base} ${shimmerClass} ${visibilityClass}`;
	});

	function startLongPress(e: MouseEvent | TouchEvent) {
		// Prevent default to avoid context menu and zoom on mobile
		e.preventDefault();

		// Initial click
		onClick();

		// Start long press timer
		longPressTimer = window.setTimeout(() => {
			// After 500ms, start repeating
			repeatIntervalId = window.setInterval(() => {
				onClick();
			}, 100); // Repeat every 100ms (linear, not exponential)
		}, 500);
	}

	function stopLongPress() {
		if (longPressTimer !== null) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
		if (repeatIntervalId !== null) {
			clearInterval(repeatIntervalId);
			repeatIntervalId = null;
		}
	}

	// Cleanup on component unmount
	$effect(() => {
		return () => {
			stopLongPress();
		};
	});
</script>

<button
	class={buttonClasses}
	onmousedown={startLongPress}
	onmouseup={stopLongPress}
	onmouseleave={() => {
		stopLongPress();
		isHovered = false;
	}}
	ontouchstart={startLongPress}
	ontouchend={stopLongPress}
	ontouchcancel={stopLongPress}
	onkeydown={onKeyDown}
	onmouseenter={() => (isHovered = true)}
	aria-label={ariaLabel}
	{tabindex}
>
	<!-- Shimmer effect overlay - only visible on hover -->
	<div class={shimmerClasses}></div>

	<!-- Button content -->
	<span class="relative z-10">
		{direction === 'increment' ? '+' : '−'}
	</span>
</button>
