<script lang="ts">
	import { useThemeContext } from '$lib/contexts/theme.svelte';

	interface Props {
		isOpen: boolean;
		onClick: () => void;
	}

	let { isOpen, onClick }: Props = $props();

	const theme = useThemeContext();
</script>

<button
	onclick={onClick}
	class={`flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg transition-all ${
		theme.isDark
			? 'bg-[rgb(var(--color-surface-secondary))] text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-surface-tertiary))]'
			: 'bg-[rgb(var(--color-surface-tertiary))] text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-surface-secondary))]'
	}`}
	aria-label={isOpen ? 'Close settings menu' : 'Open settings menu'}
	aria-expanded={isOpen}
	title={isOpen ? 'Close settings menu' : 'Open settings menu'}
>
	<span
		class={`block h-0.5 w-6 rounded-full transition-all duration-200 ${
			theme.isDark ? 'bg-[rgb(var(--color-text-primary))]' : 'bg-[rgb(var(--color-text-primary))]'
		} ${isOpen ? 'translate-y-2 rotate-45' : ''}`}
	></span>
	<span
		class={`block h-0.5 w-6 rounded-full transition-all duration-200 ${
			theme.isDark ? 'bg-[rgb(var(--color-text-primary))]' : 'bg-[rgb(var(--color-text-primary))]'
		} ${isOpen ? 'opacity-0' : ''}`}
	></span>
	<span
		class={`block h-0.5 w-6 rounded-full transition-all duration-200 ${
			theme.isDark ? 'bg-[rgb(var(--color-text-primary))]' : 'bg-[rgb(var(--color-text-primary))]'
		} ${isOpen ? '-translate-y-2 -rotate-45' : ''}`}
	></span>
</button>
