# Time Signatures

**Last Updated:** 2026-01-06

## Overview

The metronome supports full time signatures with both numerator (beats per bar) and denominator (beat unit). This allows for proper support of simple, compound, and complex meters.

## Time Signature Structure

A time signature consists of two parts:

```typescript
interface TimeSignature {
  beatsPerBar: number // Numerator (1-99) - supports unconventional time signatures
  beatUnit: 1 | 2 | 4 | 8 | 16 | 32 | 64 // Denominator - all powers of 2
}
```

### Examples

- `4/4` (Common time): 4 quarter notes per bar
- `3/4` (Waltz): 3 quarter notes per bar
- `6/8`: 6 eighth notes per bar (compound duple)
- `5/4`: 5 quarter notes per bar (complex meter)
- `7/8`: 7 eighth notes per bar (complex meter)

## Simple vs Compound Time Signatures

### Simple Time Signatures

Simple time signatures have beats that divide naturally into two equal parts (binary division).

Examples:

- `2/4`, `3/4`, `4/4` - quarter note gets the beat
- `2/2`, `3/2` - half note gets the beat
- `3/8`, `5/8` - eighth note gets the beat

### Compound Time Signatures

Compound time signatures have beats that divide naturally into three equal parts (ternary division).

Examples:

- `6/8` - 2 dotted quarter note beats, each containing 3 eighth notes
- `9/8` - 3 dotted quarter note beats, each containing 3 eighth notes
- `12/8` - 4 dotted quarter note beats, each containing 3 eighth notes

### Implementation

The metronome includes secondary accents for compound time signatures:

- **Primary accent** (beat 1): 950 Hz tone with red visual indicator
- **Secondary accents**: 875 Hz tone with green visual indicator
  - `6/8`: Secondary accent on beat 4 (3+3 grouping)
  - `9/8`: Secondary accents on beats 4 and 7 (3+3+3 grouping)
  - `12/8`: Secondary accents on beats 4, 7, and 10 (3+3+3+3 grouping)
- **Regular beats**: 800 Hz tone with blue visual indicator

Simple time signatures (2/4, 3/4, 4/4, etc.) have only the primary accent on beat 1.

## Supported Beat Units

The denominator indicates which note value gets one beat. All powers of 2 from 1 to 64 are supported:

| Beat Unit | Note Value         | Description                      |
| --------- | ------------------ | -------------------------------- |
| 1         | Whole note         | Rare, used in some meters        |
| 2         | Half note          | Cut time (2/2), alla breve       |
| 4         | Quarter note       | Most common (4/4, 3/4)           |
| 8         | Eighth note        | Common in fast pieces            |
| 16        | Sixteenth note     | Very fast, less common           |
| 32        | Thirty-second note | Extremely fast, unconventional   |
| 64        | Sixty-fourth note  | Exceptionally rare, experimental |

## Unconventional Time Signatures

The application supports numerators from 1 to 99 and all power-of-2 denominators (1, 2, 4, 8, 16, 32, 64), allowing for:

- Experimental compositions (e.g., `13/8`, `17/16`, `23/4`)
- Contemporary classical music with complex meters
- Progressive rock/metal time signatures (e.g., `13/16`, `11/8`)
- Mathematical and polymetric exercises

## Common Time Signatures

Common time signatures used in traditional music:

| Signature | Name/Description | Type     |
| --------- | ---------------- | -------- |
| 2/2       | Cut time         | Simple   |
| 2/4       | March time       | Simple   |
| 3/4       | Waltz            | Simple   |
| 4/4       | Common time      | Simple   |
| 5/4       | -                | Complex  |
| 6/8       | -                | Compound |
| 7/8       | -                | Complex  |
| 9/8       | -                | Compound |
| 12/8      | -                | Compound |
| 3/8       | -                | Simple   |
| 5/8       | -                | Complex  |
| 7/4       | -                | Complex  |

## Implementation Details

### AudioEngine

The AudioEngine ([src/utils/audioEngine.ts](src/utils/audioEngine.ts)) tracks the current time signature and uses it to:

1. Determine when to wrap the beat counter back to 1
2. Schedule the correct number of beats per bar
3. Apply accent to beat 1

The tempo (BPM) always refers to the beat unit specified in the denominator. For example:

- In `4/4` at 120 BPM: 120 quarter notes per minute
- In `6/8` at 120 BPM: 120 eighth notes per minute
- In `2/2` at 120 BPM: 120 half notes per minute

### Audio Timing

The beat unit (denominator) **does not affect audio timing** - it's purely organizational. The metronome clicks at the tempo specified, once per beat, regardless of the beat unit value. The beat unit is important for:

1. Musical notation and interpretation
2. Understanding the feel of the piece (e.g., `6/8` feels different from `3/4`)
3. Future enhancements for subdivision clicks

## Future Enhancements

1. **Subdivision Clicks**: Add quieter clicks for subdivisions
   - Option to hear triplets in compound time
   - Configurable subdivision levels

2. **Custom Accent Patterns**: User-configurable accent patterns for complex meters

3. **Visual Grouping**: Enhanced UI to show beat groupings
   - Group beats visually in compound time (e.g., show `6/8` as two groups of 3)
   - Different colors for strong/weak beats

## References

- [Time Signature (Wikipedia)](https://en.wikipedia.org/wiki/Time_signature)
- [Compound vs Simple Time](https://www.musictheory.net/lessons/12)
