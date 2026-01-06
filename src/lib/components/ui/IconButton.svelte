<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useThemeContext } from '$lib/contexts/theme.svelte';

	interface Props {
		icon: Snippet;
		onClick: () => void;
		ariaLabel: string;
		variant?: 'theme-light' | 'theme-dark' | 'volume';
	}

	let { icon, onClick, ariaLabel, variant = 'volume' }: Props = $props();

	const theme = useThemeContext();

	// Determine styling based on variant and theme
	const buttonClasses = $derived(() => {
		const baseClasses =
			'flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110';

		if (variant === 'theme-light') {
			return `${baseClasses} bg-[rgb(var(--color-theme-toggle-light))] text-[rgb(var(--color-theme-toggle-light-text))] hover:bg-[rgb(var(--color-theme-toggle-light-hover))]`;
		}

		if (variant === 'theme-dark') {
			return `${baseClasses} bg-[rgb(var(--color-theme-toggle-dark))] text-[rgb(var(--color-theme-toggle-dark-text))] hover:bg-[rgb(var(--color-theme-toggle-dark-hover))]`;
		}

		// Volume variant
		if (theme.isDark) {
			return `${baseClasses} bg-[rgb(var(--color-surface-secondary))] text-[rgb(var(--color-text-tertiary))] hover:bg-[rgb(var(--color-surface-tertiary))]`;
		} else {
			return `${baseClasses} bg-[rgb(var(--color-surface-secondary))] text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-tertiary))]`;
		}
	});
</script>

<button
	class={buttonClasses()}
	onclick={onClick}
	aria-label={ariaLabel}
>
	{@render icon()}
</button>
