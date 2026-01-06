<script lang="ts">
	import type { Snippet } from 'svelte';
	import Notification from '$lib/components/ui/Notification.svelte';
	import { useThemeContext } from '$lib/contexts/theme.svelte';

	interface Props {
		children: Snippet;
		notificationMessage?: string | null;
		onNotificationDismiss?: () => void;
	}

	let { children, notificationMessage = null, onNotificationDismiss }: Props = $props();

	const theme = useThemeContext();
</script>

<div
	class={`flex min-h-screen flex-col items-center justify-center p-4 transition-colors duration-300 ${theme.isDark ? 'bg-linear-to-br from-gray-900 to-gray-800' : 'bg-linear-to-br from-blue-50 to-indigo-100'}`}
>
	{#if notificationMessage && onNotificationDismiss}
		<Notification message={notificationMessage} type="warning" onDismiss={onNotificationDismiss} />
	{/if}

	{@render children()}
</div>
