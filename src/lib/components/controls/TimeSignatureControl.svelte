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

	const containerClasses = $derived((isNumerator: boolean) => {
		const baseClasses =
			'flex h-16 w-20 items-center justify-center rounded-lg border-2 transition-colors';
		const animateClass = isNumerator ? (animateNumerator ? 'animate-value-change' : '') : (animateDenominator ? 'animate-value-change' : '');

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

<div class="space-y-3">

	<div class="flex items-center justify-center gap-6">
		<!-- Treble Clef Icon -->
		<div
			class={`text-4xl ${theme.isDark ? 'text-[rgb(var(--color-text-quaternary))]' : 'text-[rgb(var(--color-text-quaternary))]'}`}
		>
			𝄞
		</div>

		<!-- Time Signature Display -->
		<div class="relative flex flex-col items-center">
			<!-- Numerator -->
			<div class="flex items-center gap-2">
				<IncrementButton
					direction="decrement"
					onClick={onNumeratorDecrement}
					onKeyDown={onNumeratorKeyDown}
					ariaLabel="Decrease beats per bar"
				/>

				<div
					class={containerClasses(true)}
					role="status"
					aria-live="polite"
					aria-label={`Beats per bar: ${timeSignature.beatsPerBar}`}
				>
					<span class={valueClasses()}>
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

			<!-- Horizontal line -->
			<div
				class={`my-1 h-0.5 w-20 ${theme.isDark ? 'bg-[rgb(var(--color-text-quaternary))]' : 'bg-[rgb(var(--color-text-primary))]'}`}
			></div>

			<!-- Denominator -->
			<div class="flex items-center gap-2">
				<IncrementButton
					direction="decrement"
					onClick={onDenominatorDecrement}
					onKeyDown={onDenominatorKeyDown}
					ariaLabel="Decrease beat unit (cycle through 64, 32, 16, 8, 4, 2, 1)"
				/>

				<div
					class={containerClasses(false)}
					role="status"
					aria-live="polite"
					aria-label={`Beat unit: ${timeSignature.beatUnit}`}
				>
					<span class={valueClasses()}>
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

	<p
		class={`text-center text-xs ${theme.isDark ? 'text-[rgb(var(--color-text-quaternary))]' : 'text-[rgb(var(--color-text-tertiary))]'}`}
	>
		{timeSignature.beatsPerBar} beats per bar, {timeSignature.beatUnit} note gets the beat
	</p>
</div>
