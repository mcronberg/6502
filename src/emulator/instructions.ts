/**
 * Opcode table for the supported 6502 instruction subset.
 * Each entry: [opcode, byteSize, addressingMode]
 */

export type AddressingMode =
  | 'immediate'   // #$nn
  | 'absolute'    // $hhhh
  | 'zeropage'    // $nn  (address 0x00–0xFF)
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
  // Register transfers
  'TAX implied':   { opcode: 0xaa, size: 1, mode: 'implied',   mnemonic: 'TAX' },
  'TAY implied':   { opcode: 0xa8, size: 1, mode: 'implied',   mnemonic: 'TAY' },
  'TXA implied':   { opcode: 0x8a, size: 1, mode: 'implied',   mnemonic: 'TXA' },
  'TYA implied':   { opcode: 0x98, size: 1, mode: 'implied',   mnemonic: 'TYA' },
  // Carry flag
  'CLC implied':   { opcode: 0x18, size: 1, mode: 'implied',   mnemonic: 'CLC' },
  'SEC implied':   { opcode: 0x38, size: 1, mode: 'implied',   mnemonic: 'SEC' },
  // Arithmetic
  'ADC immediate': { opcode: 0x69, size: 2, mode: 'immediate', mnemonic: 'ADC' },
  'SBC immediate': { opcode: 0xe9, size: 2, mode: 'immediate', mnemonic: 'SBC' },
  // Zero page memory
  'LDA zeropage':  { opcode: 0xa5, size: 2, mode: 'zeropage',  mnemonic: 'LDA' },
  'STA zeropage':  { opcode: 0x85, size: 2, mode: 'zeropage',  mnemonic: 'STA' },
  // Extra branches
  'BCC relative':  { opcode: 0x90, size: 2, mode: 'relative',  mnemonic: 'BCC' },
  'BCS relative':  { opcode: 0xb0, size: 2, mode: 'relative',  mnemonic: 'BCS' },
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
    case 'LDA': return op.startsWith('#') ? `Load the value ${op} into A` : `Load A from memory at ${op}`;
    case 'LDX': return `Load the value ${op} into X`;
    case 'LDY': return `Load the value ${op} into Y`;
    case 'STA': return `Store A at memory ${op}`;
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
    case 'TAX': return 'Copy A to X';
    case 'TAY': return 'Copy A to Y';
    case 'TXA': return 'Copy X to A';
    case 'TYA': return 'Copy Y to A';
    case 'CLC': return 'Clear carry flag (C = 0)';
    case 'SEC': return 'Set carry flag (C = 1)';
    case 'ADC': return `Add ${op} to A with carry`;
    case 'SBC': return `Subtract ${op} from A with borrow`;
    case 'BCC': {
      const offset = val >= 0 ? `+${val}` : `${val}`;
      return `If C flag = 0, add offset ${offset} to PC`;
    }
    case 'BCS': {
      const offset = val >= 0 ? `+${val}` : `${val}`;
      return `If C flag = 1, add offset ${offset} to PC`;
    }
    default:    return `Execute ${mnemonic}`;
  }
}
