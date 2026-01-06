<script lang="ts">
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import { useThemeContext } from '$lib/contexts/theme.svelte';
	import { saveDarkMode } from '$lib/../utils/storage';

	interface Props {
		absolute?: boolean;
	}

	let { absolute = true }: Props = $props();

	const theme = useThemeContext();

	function handleToggle() {
		const newDarkMode = !theme.isDark;
		theme.set(newDarkMode);
		saveDarkMode(newDarkMode);
	}
</script>

{#snippet sunIcon()}
	<svg
		class="h-6 w-6"
		fill="currentColor"
		viewBox="0 0 20 20"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			fill-rule="evenodd"
			d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
			clip-rule="evenodd"
		/>
	</svg>
{/snippet}

{#snippet moonIcon()}
	<svg
		class="h-6 w-6"
		fill="currentColor"
		viewBox="0 0 20 20"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
	</svg>
{/snippet}

{#if absolute}
	<div class="absolute right-4 top-4">
		<IconButton
			icon={theme.isDark ? sunIcon : moonIcon}
			onClick={handleToggle}
			variant={theme.isDark ? 'theme-light' : 'theme-dark'}
			ariaLabel="Toggle dark mode"
			title={theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
		/>
	</div>
{:else}
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<label
				class={`text-sm font-medium ${theme.isDark ? 'text-[rgb(var(--color-text-tertiary))]' : 'text-[rgb(var(--color-text-secondary))]'}`}
			>
				Theme
			</label>
			<IconButton
				icon={theme.isDark ? sunIcon : moonIcon}
				onClick={handleToggle}
				variant={theme.isDark ? 'theme-light' : 'theme-dark'}
				ariaLabel="Toggle dark mode"
				title={theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
			/>
		</div>
	</div>
{/if}
