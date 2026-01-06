<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useThemeContext } from '$lib/contexts/theme.svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		children: Snippet;
	}

	let { isOpen, onClose, children }: Props = $props();

	const theme = useThemeContext();

	// Handle outside click
	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	// Handle Escape key
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	// Attach/detach keyboard listener when overlay opens/closes
	$effect(() => {
		if (isOpen) {
			window.addEventListener('keydown', handleKeyDown);
			return () => {
				window.removeEventListener('keydown', handleKeyDown);
			};
		}
	});
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 transition-opacity duration-300"
		onclick={handleOverlayClick}
		onkeydown={(e) => e.key === 'Enter' && handleOverlayClick(e as unknown as MouseEvent)}
		role="dialog"
		aria-modal="true"
		aria-labelledby="mobile-settings-title"
		tabindex="-1"
	>
		<div
			class={`w-full max-h-[80vh] overflow-y-auto rounded-t-2xl p-6 shadow-2xl transition-transform duration-300 ${
				theme.isDark ? 'bg-gray-800' : 'bg-white'
			}`}
			style="animation: slide-up 300ms ease-out;"
		>
			<!-- Header -->
			<div class="mb-4 flex items-center justify-between">
				<h2
					id="mobile-settings-title"
					class={`text-lg font-semibold ${
						theme.isDark ? 'text-[rgb(var(--color-text-primary))]' : 'text-[rgb(var(--color-text-primary))]'
					}`}
				>
					Settings
				</h2>
				<button
					onclick={onClose}
					class={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
						theme.isDark
							? 'text-[rgb(var(--color-text-tertiary))] hover:bg-[rgb(var(--color-surface-secondary))]'
							: 'text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-tertiary))]'
					}`}
					aria-label="Close settings menu"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="space-y-6">
				{@render children()}
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
</style>
