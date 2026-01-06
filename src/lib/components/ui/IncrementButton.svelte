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

	const buttonClasses = $derived.by(() => {
		const baseClasses =
			'relative flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent-primary))] overflow-hidden';

		if (theme.isDark) {
			return `${baseClasses} bg-[rgb(var(--color-surface-secondary))] text-[rgb(var(--color-text-tertiary))] hover:bg-[rgb(var(--color-surface-tertiary))] hover:scale-105 active:bg-[rgb(var(--color-border))] active:scale-95`;
		} else {
			return `${baseClasses} bg-[rgb(var(--color-surface-secondary))] text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-tertiary))] hover:scale-105 active:bg-[rgb(var(--color-border))] active:scale-95`;
		}
	});
</script>

<button
	class={buttonClasses}
	onclick={onClick}
	onkeydown={onKeyDown}
	aria-label={ariaLabel}
	{tabindex}
>
	<!-- Shimmer effect overlay -->
	<div class="absolute inset-0 animate-shimmer pointer-events-none"></div>

	<!-- Button content -->
	<span class="relative z-10">
		{direction === 'increment' ? '+' : '−'}
	</span>
</button>
