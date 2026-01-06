<script lang="ts">
	import IncrementButton from './IncrementButton.svelte';
	import { useThemeContext } from '$lib/contexts/theme.svelte';

	interface Props {
		value: number;
		onIncrement: () => void;
		onDecrement: () => void;
		ariaLabel: string;
		animate?: boolean;
		onKeyDown?: (e: KeyboardEvent) => void;
	}

	let { value, onIncrement, onDecrement, ariaLabel, animate = false, onKeyDown }: Props = $props();

	const theme = useThemeContext();

	const containerClasses = $derived(() => {
		const baseClasses =
			'flex h-16 w-20 items-center justify-center rounded-lg border-2 transition-colors';

		const animateClass = animate ? 'animate-value-change' : '';

		if (theme.isDark) {
			return `${baseClasses} border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-secondary))] ${animateClass}`;
		} else {
			return `${baseClasses} border-[rgb(var(--color-border))] bg-white ${animateClass}`;
		}
	});

	const valueClasses = $derived(() => {
		return theme.isDark
			? 'text-3xl font-bold text-[rgb(var(--color-text-primary))]'
			: 'text-3xl font-bold text-[rgb(var(--color-text-primary))]';
	});
</script>

<div class="flex items-center gap-2">
	<IncrementButton
		direction="decrement"
		onClick={onDecrement}
		ariaLabel={`Decrease ${ariaLabel}`}
		{onKeyDown}
	/>

	<div class={containerClasses()} role="status" aria-live="polite" aria-label={`${ariaLabel}: ${value}`}>
		<span class={valueClasses()}>
			{value}
		</span>
	</div>

	<IncrementButton
		direction="increment"
		onClick={onIncrement}
		ariaLabel={`Increase ${ariaLabel}`}
		{onKeyDown}
	/>
</div>
