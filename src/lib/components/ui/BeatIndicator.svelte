<script lang="ts">
	import type { AccentType } from '$lib/../types/audio';

	interface Props {
		isActive: boolean;
		accentType: AccentType;
	}

	let { isActive, accentType }: Props = $props();

	// Determine the color class based on activity and accent type
	const colorClass = $derived(() => {
		if (!isActive) {
			return 'bg-[rgb(var(--color-beat-inactive))]';
		}

		if (accentType === 'primary') {
			return 'scale-150 bg-[rgb(var(--color-beat-primary))] shadow-lg shadow-[rgb(var(--shadow-beat-primary))]/50';
		} else if (accentType === 'secondary') {
			return 'scale-150 bg-[rgb(var(--color-beat-secondary))] shadow-lg shadow-[rgb(var(--shadow-beat-secondary))]/50';
		} else {
			return 'scale-150 bg-[rgb(var(--color-beat-regular))] shadow-lg shadow-[rgb(var(--shadow-beat-regular))]/50';
		}
	});
</script>

<div
	class={`h-4 w-4 rounded-full transition-all duration-150 ease-out ${colorClass()}`}
	style={isActive ? 'animation: beat-pulse var(--animation-beat-duration, 100ms) ease-out' : ''}
></div>
