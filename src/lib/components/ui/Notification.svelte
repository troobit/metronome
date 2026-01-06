<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		message: string;
		type?: 'info' | 'warning' | 'error';
		onDismiss: () => void;
		icon?: Snippet;
	}

	let { message, type = 'warning', onDismiss, icon }: Props = $props();

	const notificationClasses = $derived(() => {
		const baseClasses =
			'fixed top-4 left-4 right-4 z-50 rounded-lg p-4 text-white shadow-2xl animate-slide-in max-w-2xl mx-auto';

		if (type === 'error') {
			return `${baseClasses} bg-[rgb(var(--color-danger))]`;
		}

		if (type === 'info') {
			return `${baseClasses} bg-[rgb(var(--color-accent-primary))]`;
		}

		// Warning (default)
		return `${baseClasses} bg-[rgb(var(--color-warning))]`;
	});
</script>

<div class={notificationClasses()}>
	<div class="flex items-start gap-3">
		{#if icon}
			{@render icon()}
		{:else}
			<!-- Default warning icon -->
			<svg class="h-6 w-6 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width={2}
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
		{/if}

		<div class="flex-1 min-w-0">
			<p class="font-semibold text-sm">
				{type === 'warning' ? 'Audio Interrupted' : type === 'error' ? 'Error' : 'Information'}
			</p>
			<p class="text-xs mt-1 opacity-90">{message}</p>
			{#if type === 'warning'}
				<p class="text-xs mt-2 opacity-90 font-medium">
					Tap "Start" below to resume the metronome
				</p>
			{/if}
		</div>

		<button
			onclick={onDismiss}
			class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[rgb(var(--color-warning-hover))] transition-colors shrink-0"
			aria-label="Dismiss notification"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width={2}
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</button>
	</div>
</div>
