<script lang="ts">
	import IncrementButton from '$lib/components/ui/IncrementButton.svelte';
	import { useThemeContext } from '$lib/contexts/theme.svelte';
	import type { TimeSignature } from '$lib/../types/audio';

	interface Props {
		timeSignature: TimeSignature;
		onTimeSignatureChange: (updates: Partial<TimeSignature>) => void;
		animateNumerator: boolean;
		animateDenominator: boolean;
		onNumeratorIncrement: () => void;
		onNumeratorDecrement: () => void;
		onDenominatorIncrement: () => void;
		onDenominatorDecrement: () => void;
		onNumeratorKeyDown: (e: KeyboardEvent) => void;
		onDenominatorKeyDown: (e: KeyboardEvent) => void;
	}

	let {
		timeSignature,
		// onTimeSignatureChange is not used directly but required for prop type
		onTimeSignatureChange: _,
		animateNumerator,
		animateDenominator,
		onNumeratorIncrement,
		onNumeratorDecrement,
		onDenominatorIncrement,
		onDenominatorDecrement,
		onNumeratorKeyDown,
		onDenominatorKeyDown,
	}: Props = $props();

	const theme = useThemeContext();

	const containerClasses = (isNumerator: boolean) => {
		const animateClass = isNumerator ? (animateNumerator ? 'animate-value-change' : '') : (animateDenominator ? 'animate-value-change' : '');
		return `flex-1 ${animateClass}`;
	};

	const valueClasses = 'text-center text-3xl font-bold text-[rgb(var(--color-text-primary))]';
</script>

<div class="space-y-3">

	<div class="flex items-center justify-center gap-6">
		<!-- Time Signature Display -->
		<div class="relative flex flex-col items-center gap-1">
			<!-- Numerator -->
			<div class="flex items-center gap-4">
				<IncrementButton
					direction="decrement"
					onClick={onNumeratorDecrement}
					onKeyDown={onNumeratorKeyDown}
					ariaLabel="Decrease beats per bar"
				/>

				<div
					class={`${containerClasses(true)} min-w-12`}
					role="status"
					aria-live="polite"
					aria-label={`Beats per bar: ${timeSignature.beatsPerBar}`}
				>
					<span class={valueClasses}>
						{timeSignature.beatsPerBar}
					</span>
				</div>

				<IncrementButton
					direction="increment"
					onClick={onNumeratorIncrement}
					onKeyDown={onNumeratorKeyDown}
					ariaLabel="Increase beats per bar"
				/>
			</div>

			<!-- Horizontal line (wider and more prominent) -->
			<div
				class={`my-1 h-1 w-48 rounded-full transition-colors ${theme.isDark ? 'bg-[rgb(var(--color-text-quaternary))]' : 'bg-[rgb(var(--color-text-primary))]'}`}
			></div>

			<!-- Denominator -->
			<div class="flex items-center gap-4">
				<IncrementButton
					direction="decrement"
					onClick={onDenominatorDecrement}
					onKeyDown={onDenominatorKeyDown}
					ariaLabel="Decrease beat unit (cycle through 64, 32, 16, 8, 4, 2, 1)"
				/>

				<div
					class={`${containerClasses(false)} min-w-12`}
					role="status"
					aria-live="polite"
					aria-label={`Beat unit: ${timeSignature.beatUnit}`}
				>
					<span class={valueClasses}>
						{timeSignature.beatUnit}
					</span>
				</div>

				<IncrementButton
					direction="increment"
					onClick={onDenominatorIncrement}
					onKeyDown={onDenominatorKeyDown}
					ariaLabel="Increase beat unit (cycle through 1, 2, 4, 8, 16, 32, 64)"
				/>
			</div>
		</div>
	</div>
</div>
