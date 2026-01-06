<script lang="ts">
	import type { Snippet } from 'svelte';
	import ThemeToggle from '$lib/components/controls/ThemeToggle.svelte';
	import { useThemeContext } from '$lib/contexts/theme.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const theme = useThemeContext();
</script>

<div
	class={`relative w-full max-w-md space-y-6 rounded-2xl p-8 shadow-2xl transition-colors duration-300 ${theme.isDark ? 'bg-gray-800' : 'bg-white'}`}
>
	<!-- Theme toggle - visible only on desktop -->
	<div class="hidden md:block">
		<ThemeToggle />
	</div>
	{@render children()}
</div>
