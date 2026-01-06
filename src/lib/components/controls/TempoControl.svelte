<script lang="ts">
	import IncrementButton from '$lib/components/ui/IncrementButton.svelte';
	import ValueDisplay from '$lib/components/ui/ValueDisplay.svelte';
	import RangeSlider from '$lib/components/ui/RangeSlider.svelte';
	import ActionButton from '$lib/components/ui/ActionButton.svelte';
	import { useThemeContext } from '$lib/contexts/theme.svelte';

	interface Props {
		tempo: number;
		onTempoChange: (newTempo: number) => void;
		onTapTempo: () => void;
		tapTimes: number[];
		tapActive: boolean;
	}

	let { tempo, onTempoChange, onTapTempo, tapTimes, tapActive }: Props = $props();

	const theme = useThemeContext();

	const tapLabel = $derived(() => {
		if (tapTimes.length === 0) return 'Tap Tempo';
		if (tapTimes.length === 1) return 'Tap again...';
		return `Tap ${tapTimes.length}/8`;
	});
</script>

<div class="space-y-1">
	<div class="flex items-center gap-2">
		<IncrementButton
			direction="decrement"
			onClick={() => onTempoChange(tempo - 1)}
			ariaLabel="Decrease tempo"
		/>

		<ValueDisplay value={tempo} label="BPM" />

		<IncrementButton
			direction="increment"
			onClick={() => onTempoChange(tempo + 1)}
			ariaLabel="Increase tempo"
		/>
	</div>

	<RangeSlider value={tempo} min={30} max={600} onChange={onTempoChange} showLabels={false} />

	<ActionButton variant="secondary" onClick={onTapTempo} isActive={tapActive}>
		{#snippet children()}
			{tapLabel()}
		{/snippet}
	</ActionButton>
</div>
