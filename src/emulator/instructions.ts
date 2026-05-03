/**
 * Opcode table for the supported 6502 instruction subset.
 * Each entry: [opcode, byteSize, addressingMode]
 */

export type AddressingMode =
  | 'immediate'   // #$nn
  | 'absolute'    // $hhhh
  | 'implied'     // no operand
  | 'relative';   // branch offset

export type OpcodeEntry = {
  opcode: number;
  size: number; // total bytes including opcode
  mode: AddressingMode;
  mnemonic: string;
};

// Map: "MNEMONIC MODE" -> OpcodeEntry
export const OPCODE_TABLE: Record<string, OpcodeEntry> = {
  'LDA immediate': { opcode: 0xa9, size: 2, mode: 'immediate', mnemonic: 'LDA' },
  'LDX immediate': { opcode: 0xa2, size: 2, mode: 'immediate', mnemonic: 'LDX' },
  'LDY immediate': { opcode: 0xa0, size: 2, mode: 'immediate', mnemonic: 'LDY' },
  'STA absolute':  { opcode: 0x8d, size: 3, mode: 'absolute',  mnemonic: 'STA' },
  'STX absolute':  { opcode: 0x8e, size: 3, mode: 'absolute',  mnemonic: 'STX' },
  'STY absolute':  { opcode: 0x8c, size: 3, mode: 'absolute',  mnemonic: 'STY' },
  'INX implied':   { opcode: 0xe8, size: 1, mode: 'implied',   mnemonic: 'INX' },
  'INY implied':   { opcode: 0xc8, size: 1, mode: 'implied',   mnemonic: 'INY' },
  'DEX implied':   { opcode: 0xca, size: 1, mode: 'implied',   mnemonic: 'DEX' },
  'DEY implied':   { opcode: 0x88, size: 1, mode: 'implied',   mnemonic: 'DEY' },
  'CPX immediate': { opcode: 0xe0, size: 2, mode: 'immediate', mnemonic: 'CPX' },
  'CPY immediate': { opcode: 0xc0, size: 2, mode: 'immediate', mnemonic: 'CPY' },
  'CMP immediate': { opcode: 0xc9, size: 2, mode: 'immediate', mnemonic: 'CMP' },
  'JMP absolute':  { opcode: 0x4c, size: 3, mode: 'absolute',  mnemonic: 'JMP' },
  'BNE relative':  { opcode: 0xd0, size: 2, mode: 'relative',  mnemonic: 'BNE' },
  'BEQ relative':  { opcode: 0xf0, size: 2, mode: 'relative',  mnemonic: 'BEQ' },
  'NOP implied':   { opcode: 0xea, size: 1, mode: 'implied',   mnemonic: 'NOP' },
  'BRK implied':   { opcode: 0x00, size: 1, mode: 'implied',   mnemonic: 'BRK' },
};

/** Decode opcode byte → entry (or undefined if unknown) */
export function decodeOpcode(opcode: number): OpcodeEntry | undefined {
  return Object.values(OPCODE_TABLE).find((e) => e.opcode === opcode);
}

/** Human-readable explanation for a decoded instruction */
export function buildExplanation(
  mnemonic: string,
  operandStr: string | undefined,
  operandValue: number | undefined
): string {
  const op = operandStr ?? '';
  const val = operandValue !== undefined ? operandValue : 0;
  switch (mnemonic) {
    case 'LDA': return `Load the value ${op} into A`;
    case 'LDX': return `Load the value ${op} into X`;
    case 'LDY': return `Load the value ${op} into Y`;
    case 'STA': return `Store A in memory at ${op}`;
    case 'STX': return `Store X in memory at ${op}`;
    case 'STY': return `Store Y in memory at ${op}`;
    case 'INX': return 'Increase X by 1';
    case 'INY': return 'Increase Y by 1';
    case 'DEX': return 'Decrease X by 1';
    case 'DEY': return 'Decrease Y by 1';
    case 'CPX': return `Compare X with ${op} and update flags`;
    case 'CPY': return `Compare Y with ${op} and update flags`;
    case 'CMP': return `Compare A with ${op} and update flags`;
    case 'JMP': return `Jump to address ${op}`;
    case 'BNE': {
      const offset = val >= 0 ? `+${val}` : `${val}`;
      return `If Z flag = 0, add offset ${offset} to PC`;
    }
    case 'BEQ': {
      const offset = val >= 0 ? `+${val}` : `${val}`;
      return `If Z flag = 1, add offset ${offset} to PC`;
    }
    case 'NOP': return 'No operation — do nothing';
    case 'BRK': return 'Force Break / Stop program execution';
    default:    return `Execute ${mnemonic}`;
  }
}
