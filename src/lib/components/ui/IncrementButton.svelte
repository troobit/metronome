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

	const buttonClasses = $derived(() => {
		const baseClasses =
			'flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent-primary))]';

		if (theme.isDark) {
			return `${baseClasses} bg-[rgb(var(--color-surface-secondary))] text-[rgb(var(--color-text-tertiary))] hover:bg-[rgb(var(--color-surface-tertiary))] active:bg-[rgb(var(--color-border))]`;
		} else {
			return `${baseClasses} bg-[rgb(var(--color-surface-secondary))] text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-tertiary))] active:bg-[rgb(var(--color-border))]`;
		}
	});
</script>

<button
	class={buttonClasses()}
	onclick={onClick}
	onkeydown={onKeyDown}
	aria-label={ariaLabel}
	{tabindex}
>
	{direction === 'increment' ? '+' : '−'}
</button>
