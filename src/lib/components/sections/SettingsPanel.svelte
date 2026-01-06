<script lang="ts">
	import SecondaryButton from '$lib/components/ui/SecondaryButton.svelte';
	import { useThemeContext } from '$lib/contexts/theme.svelte';

	interface Props {
		onExport: () => void;
		onImport: (event: Event) => void;
		fileInputElement: HTMLInputElement | undefined;
	}

	let { onExport, onImport, fileInputElement = $bindable() }: Props = $props();

	const theme = useThemeContext();
</script>

{#snippet exportIcon()}
	<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width={2}
			d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
		/>
	</svg>
{/snippet}

{#snippet importIcon()}
	<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width={2}
			d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
		/>
	</svg>
{/snippet}

<div
	class={`flex gap-3 pt-4 border-t ${theme.isDark ? 'border-[rgb(var(--color-border))]' : 'border-[rgb(var(--color-border))]'}`}
>
	<SecondaryButton
		icon={exportIcon}
		label="Export Settings"
		onClick={onExport}
		ariaLabel="Export settings"
	/>

	<SecondaryButton
		icon={importIcon}
		label="Import Settings"
		onClick={() => fileInputElement?.click()}
		ariaLabel="Import settings"
	/>

	<input
		bind:this={fileInputElement}
		type="file"
		accept="application/json,.json"
		onchange={onImport}
		class="hidden"
	/>
</div>
