<script lang="ts">
	import type { AccentType } from '$lib/../types/audio';
	import { useColorBounceContext } from '$lib/contexts/colorBounce.svelte';

	interface Props {
		isActive: boolean;
		accentType: AccentType;
		useColorBounce?: boolean;
	}

	let { isActive, accentType, useColorBounce = false }: Props = $props();

	// Get color bounce context (will only be used if useColorBounce is true)
	let colorBounce: ReturnType<typeof useColorBounceContext> | null = null;
	try {
		colorBounce = useColorBounceContext();
	} catch {
		// Context not available, that's fine
	}

	// Determine the color class based on activity and accent type
	const colorClass = $derived.by(() => {
		if (!isActive) {
			return 'bg-[rgb(var(--color-beat-inactive))]';
		}

		// Use color bounce if enabled and context is available
		if (useColorBounce && colorBounce?.isActive) {
			return 'scale-150 shadow-lg';
		}

		if (accentType === 'primary') {
			return 'scale-150 bg-[rgb(var(--color-beat-primary))] shadow-lg shadow-[rgb(var(--shadow-beat-primary))]/50';
		} else if (accentType === 'secondary') {
			return 'scale-150 bg-[rgb(var(--color-beat-secondary))] shadow-lg shadow-[rgb(var(--shadow-beat-secondary))]/50';
		} else {
			return 'scale-150 bg-[rgb(var(--color-beat-regular))] shadow-lg shadow-[rgb(var(--shadow-beat-regular))]/50';
		}
	});

	// Get dynamic color style
	const dynamicStyle = $derived.by(() => {
		let style = isActive ? 'animation: beat-pulse var(--animation-beat-duration, 100ms) ease-out;' : '';

		// Add color bounce style if enabled and active
		if (isActive && useColorBounce && colorBounce?.isActive) {
			style += ` background-color: ${colorBounce.color};`;
		}

		return style;
	});
</script>

<div
	class={`h-4 w-4 rounded-full transition-all duration-150 ease-out ${colorClass}`}
	style={dynamicStyle}
></div>
