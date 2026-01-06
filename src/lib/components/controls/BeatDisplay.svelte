<script lang="ts">
	import BeatIndicator from '$lib/components/ui/BeatIndicator.svelte';
	import type { AccentType } from '$lib/../types/audio';

	interface Props {
		beatsPerBar: number;
		currentBeat: number;
		isPlaying: boolean;
		accentType: AccentType;
		isCompound: boolean;
	}

	let { beatsPerBar, currentBeat, isPlaying, accentType, isCompound }: Props = $props();

	// Generate beat indicators with their state
	const beats = $derived(() => {
		return Array.from({ length: beatsPerBar }, (_, i) => {
			const isActive = isPlaying && currentBeat === i + 1;
			return {
				index: i,
				isActive,
				accentType: isActive ? accentType : 'none' as AccentType,
			};
		});
	});

	// Group beats for compound time signatures
	const beatGroups = $derived(() => {
		if (!isCompound) {
			return [beats()];
		}

		const groups: typeof beats[][] = [];
		const beatArray = beats();
		for (let i = 0; i < beatArray.length; i += 3) {
			groups.push(beatArray.slice(i, i + 3));
		}
		return groups;
	});
</script>

<div class="flex flex-wrap justify-center gap-4 py-8">
	{#each beatGroups() as group}
		<div class="flex gap-2">
			{#each group as beat (beat.index)}
				<BeatIndicator isActive={beat.isActive} accentType={beat.accentType} />
			{/each}
		</div>
	{/each}
</div>
