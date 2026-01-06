<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useThemeContext } from '$lib/contexts/theme.svelte';

	interface Props {
		variant: 'primary' | 'secondary' | 'success' | 'danger';
		onClick: () => void;
		isActive?: boolean;
		children: Snippet;
	}

	let { variant, onClick, isActive = false, children }: Props = $props();

	const theme = useThemeContext();

	const buttonClasses = $derived(() => {
		const baseClasses =
			'w-full rounded-lg px-4 py-3 font-semibold transition-all hover:scale-105 active:scale-95';

		// Start/Stop button
		if (variant === 'success') {
			return `${baseClasses} bg-[rgb(var(--color-success))] text-white hover:bg-[rgb(var(--color-success-hover))] shadow-lg`;
		}

		if (variant === 'danger') {
			return `${baseClasses} bg-[rgb(var(--color-danger))] text-white hover:bg-[rgb(var(--color-danger-hover))] shadow-lg`;
		}

		// Tap tempo button
		if (variant === 'secondary') {
			if (isActive) {
				return theme.isDark
					? `${baseClasses} scale-95 bg-[rgb(var(--color-accent-secondary-hover))] text-white shadow-lg`
					: `${baseClasses} scale-95 bg-[rgb(var(--color-accent-secondary))] text-white shadow-lg`;
			} else {
				return theme.isDark
					? `${baseClasses} bg-[rgb(var(--color-accent-secondary))] text-white hover:bg-[rgb(var(--color-accent-secondary-hover))]`
					: `${baseClasses} bg-[rgb(var(--color-accent-secondary))] text-white hover:bg-[rgb(var(--color-accent-secondary-hover))]`;
			}
		}

		// Default primary
		return `${baseClasses} bg-[rgb(var(--color-accent-primary))] text-white hover:bg-[rgb(var(--color-accent-primary-hover))]`;
	});
</script>

<button class={buttonClasses()} onclick={onClick}>
	{@render children()}
</button>
