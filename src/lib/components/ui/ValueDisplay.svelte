<script lang="ts">
	import { useThemeContext } from '$lib/contexts/theme.svelte';

	interface Props {
		value: number | string;
		label: string;
		size?: 'sm' | 'md' | 'lg';
	}

	let { value, label, size = 'lg' }: Props = $props();

	const theme = useThemeContext();

	const valueSizeClass = $derived(() => {
		if (size === 'sm') return 'text-xl';
		if (size === 'md') return 'text-2xl';
		return 'text-3xl';
	});
</script>

<div class="flex-1">
	<div
		class={`text-center font-bold ${valueSizeClass()} ${theme.isDark ? 'text-[rgb(var(--color-text-primary))]' : 'text-[rgb(var(--color-text-primary))]'}`}
	>
		{value}
	</div>
	<div
		class={`text-center text-xs ${theme.isDark ? 'text-[rgb(var(--color-text-quaternary))]' : 'text-[rgb(var(--color-text-tertiary))]'}`}
	>
		{label}
	</div>
</div>
