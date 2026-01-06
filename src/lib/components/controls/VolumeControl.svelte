<script lang="ts">
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import RangeSlider from '$lib/components/ui/RangeSlider.svelte';
	import { useThemeContext } from '$lib/contexts/theme.svelte';

	interface Props {
		volume: number;
		onVolumeChange: (newVolume: number) => void;
		compact?: boolean;
	}

	let { volume, onVolumeChange, compact = false }: Props = $props();

	const theme = useThemeContext();
	let isInteracting = $state(false);

	// Derive which icon to show based on volume
	const currentIcon = $derived.by(() => {
		if (volume === 0) return mutedIcon;
		if (volume < 0.5) return lowVolumeIcon;
		return highVolumeIcon;
	});
</script>

{#snippet mutedIcon()}
	<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width={2}
			d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
		/>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width={2}
			d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
		/>
	</svg>
{/snippet}

{#snippet lowVolumeIcon()}
	<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width={2}
			d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
		/>
	</svg>
{/snippet}

{#snippet highVolumeIcon()}
	<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width={2}
			d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
		/>
	</svg>
{/snippet}

<div class={compact ? '' : 'space-y-3'}>
	{#if !compact}
		<div
			class={`text-sm font-medium ${theme.isDark ? 'text-[rgb(var(--color-text-tertiary))]' : 'text-[rgb(var(--color-text-secondary))]'}`}
		>
			Volume
		</div>
	{/if}

	<div class="flex items-center gap-3">
		<IconButton
			icon={currentIcon}
			onClick={() => onVolumeChange(0)}
			variant="volume"
			ariaLabel="Mute"
		/>

		<div class="relative flex-1">
			<RangeSlider
				value={volume}
				min={0}
				max={1}
				step={0.01}
				onChange={onVolumeChange}
				showLabels={false}
				onInteractionStart={() => (isInteracting = true)}
				onInteractionEnd={() => (isInteracting = false)}
			/>
		</div>

		<!-- Percentage display - animated in/out on interaction -->
		<div class="relative w-12 overflow-hidden">
			<span
				class={`absolute right-0 text-right text-sm font-medium transition-all duration-300 ${
					isInteracting
						? 'opacity-100 translate-x-0'
						: 'opacity-0 translate-x-4 pointer-events-none'
				} ${theme.isDark ? 'text-[rgb(var(--color-text-tertiary))]' : 'text-[rgb(var(--color-text-secondary))]'}`}
			>
				{Math.round(volume * 100)}%
			</span>
		</div>
	</div>
</div>
