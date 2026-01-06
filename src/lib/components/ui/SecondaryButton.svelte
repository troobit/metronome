<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useThemeContext } from '$lib/contexts/theme.svelte';

	interface Props {
		icon: Snippet;
		label: string;
		onClick: () => void;
		ariaLabel?: string;
	}

	let { icon, label, onClick, ariaLabel }: Props = $props();

	const theme = useThemeContext();

	const buttonClasses = $derived(() => {
		const baseClasses =
			'flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors';

		if (theme.isDark) {
			return `${baseClasses} bg-[rgb(var(--color-surface-secondary))] text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-tertiary))]`;
		} else {
			return `${baseClasses} bg-[rgb(var(--color-surface-secondary))] text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-tertiary))]`;
		}
	});
</script>

<button
	class={buttonClasses()}
	onclick={onClick}
	aria-label={ariaLabel || label}
>
	{@render icon()}
	{label}
</button>
