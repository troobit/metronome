<script lang="ts">
	import { useThemeContext } from '$lib/contexts/theme.svelte';

	interface Props {
		linkTempo: boolean;
		onLinkTempoChange: (newValue: boolean) => void;
	}

	let { linkTempo, onLinkTempoChange }: Props = $props();

	const theme = useThemeContext();
</script>

<div class="space-y-3">
	<label
		class={`text-sm font-medium ${theme.isDark ? 'text-[rgb(var(--color-text-tertiary))]' : 'text-[rgb(var(--color-text-secondary))]'}`}
	>
		Link BPM to Time Signature
	</label>

	<button
		onclick={() => onLinkTempoChange(!linkTempo)}
		class={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
			linkTempo
				? theme.isDark
					? 'bg-[rgb(var(--color-accent-primary))]/20 text-[rgb(var(--color-accent-primary))] ring-2 ring-[rgb(var(--color-accent-primary))]'
					: 'bg-[rgb(var(--color-accent-primary))]/10 text-[rgb(var(--color-accent-primary))] ring-2 ring-[rgb(var(--color-accent-primary))]'
				: theme.isDark
					? 'bg-[rgb(var(--color-surface-secondary))] text-[rgb(var(--color-text-tertiary))] hover:bg-[rgb(var(--color-surface-tertiary))]'
					: 'bg-[rgb(var(--color-surface-tertiary))] text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-secondary))]'
		}`}
		aria-label="Toggle link tempo to time signature changes"
		title={linkTempo
			? 'BPM will adjust when beat unit changes'
			: 'BPM stays constant when beat unit changes'}
	>
		<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			{#if linkTempo}
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width={2}
					d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
				/>
			{:else}
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width={2}
					d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1M6 18h.01M18 6h.01"
				/>
			{/if}
		</svg>
		<span>{linkTempo ? 'Linked' : 'Not Linked'}</span>
	</button>

	<p
		class={`text-center text-xs ${theme.isDark ? 'text-[rgb(var(--color-text-quaternary))]' : 'text-[rgb(var(--color-text-tertiary))]'}`}
	>
		{linkTempo
			? 'BPM will adjust when beat unit changes'
			: 'BPM stays constant when beat unit changes'}
	</p>
</div>
