import type { CpuFlags } from './types';

/** Format a byte as "$00"–"$FF" */
export function toHexByte(value: number): string {
  return '$' + (value & 0xff).toString(16).toUpperCase().padStart(2, '0');
}

/** Format a 16-bit word as "$0000"–"$FFFF" */
export function toHexWord(value: number): string {
  return '$' + (value & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

/** Format a byte as two uppercase hex chars (no prefix) */
export function toHex2(value: number): string {
  return (value & 0xff).toString(16).toUpperCase().padStart(2, '0');
}

/**
 * Format flags as a compact 7-char string.
 * Each flag is its letter (uppercase) if set, '.' if clear.
 * Order: N V B D I Z C
 */
export function formatFlags(flags: CpuFlags): string {
  return [
    flags.N ? 'N' : '.',
    flags.V ? 'V' : '.',
    flags.B ? 'B' : '.',
    flags.D ? 'D' : '.',
    flags.I ? 'I' : '.',
    flags.Z ? 'Z' : '.',
    flags.C ? 'C' : '.',
  ].join('');
}

/** Update the N (negative) and Z (zero) flags based on an 8-bit result */
export function updateZeroNegativeFlags(
  value: number,
  flags: CpuFlags
): CpuFlags {
  return {
    ...flags,
    Z: (value & 0xff) === 0,
    N: (value & 0x80) !== 0,
  };
}

/** Clamp a number to an unsigned 8-bit value */
export function toUint8(value: number): number {
  return value & 0xff;
}

/** Convert an unsigned byte to a signed int8 */
export function toSigned8(value: number): number {
  const v = value & 0xff;
  return v >= 0x80 ? v - 0x100 : v;
}
