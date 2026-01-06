<script lang="ts">
	import { useThemeContext } from '$lib/contexts/theme.svelte';

	interface Props {
		value: number;
		min: number;
		max: number;
		step?: number | 'any';
		onChange: (value: number) => void;
		showLabels?: boolean;
		onInteractionStart?: () => void;
		onInteractionEnd?: () => void;
	}

	let {
		value,
		min,
		max,
		step = 1,
		onChange,
		showLabels = true,
		onInteractionStart,
		onInteractionEnd
	}: Props = $props();

	const theme = useThemeContext();

	function handleInput(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		onChange(Number(target.value));
	}

	function handleInteractionStart() {
		onInteractionStart?.();
	}

	function handleInteractionEnd() {
		onInteractionEnd?.();
	}

	const sliderClasses = $derived.by(() => {
		const baseClasses = 'h-2 w-full cursor-pointer appearance-none rounded-lg';
		return theme.isDark
			? `${baseClasses} bg-[rgb(var(--color-surface-secondary))]`
			: `${baseClasses} bg-[rgb(var(--color-surface-secondary))]`;
	});
</script>

<div class="space-y-2">
	<input
		type="range"
		{min}
		{max}
		{step}
		{value}
		oninput={handleInput}
		onmousedown={handleInteractionStart}
		onmouseup={handleInteractionEnd}
		ontouchstart={handleInteractionStart}
		ontouchend={handleInteractionEnd}
		class={sliderClasses}
	/>

	{#if showLabels}
		<div
			class={`flex justify-between text-xs ${theme.isDark ? 'text-[rgb(var(--color-text-quaternary))]' : 'text-[rgb(var(--color-text-tertiary))]'}`}
		>
			<span>{min}</span>
			<span>{max}</span>
		</div>
	{/if}
</div>
