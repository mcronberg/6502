import type { AssemblyResult, AssembledInstruction } from './types';
import { OPCODE_TABLE } from './instructions';
import { buildExplanation } from './instructions';
import { toHexByte, toHexWord, toSigned8 } from './formatting';

const CODE_START = 0x0600;

// ─── Tokeniser ─────────────────────────────────────────────────────────────────

type Token = {
  lineIndex: number; // 0-based source line
  label?: string;
  mnemonic?: string;
  operand?: string;
};

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const lines = source.split('\n');

  for (let i = 0; i < lines.length; i++) {
    // Strip comments
    const stripped = lines[i].split(';')[0].trim();
    if (!stripped) continue;

    // Skip pseudo-ops we don't process for code emission
    if (/^\.(ORG|RES)\b/i.test(stripped)) continue;

    let rest = stripped;
    let label: string | undefined;

    // Label: ends with ':'
    const labelMatch = rest.match(/^([A-Za-z_][A-Za-z0-9_]*):/);
    if (labelMatch) {
      label = labelMatch[1].toLowerCase();
      rest = rest.slice(labelMatch[0].length).trim();
    }

    let mnemonic: string | undefined;
    let operand: string | undefined;

    if (rest) {
      const parts = rest.match(/^([A-Za-z]{2,3})\s*(.*)/);
      if (parts) {
        mnemonic = parts[1].toUpperCase();
        operand = parts[2].trim() || undefined;
      }
    }

    tokens.push({ lineIndex: i, label, mnemonic, operand });
  }

  return tokens;
}

// ─── Operand parsing ───────────────────────────────────────────────────────────────

type OperandKind =
  | { kind: 'immediate'; value: number; str: string }
  | { kind: 'absolute'; value: number; str: string }
  | { kind: 'label'; name: string }
  | { kind: 'none' };

function parseOperand(operand: string | undefined): OperandKind {
  if (!operand) return { kind: 'none' };

  // Immediate: #$nn or #nn
  const immHex = operand.match(/^#\$([0-9A-Fa-f]{1,2})$/);
  if (immHex) {
    const value = parseInt(immHex[1], 16);
    return { kind: 'immediate', value, str: toHexByte(value) };
  }
  const immDec = operand.match(/^#(\d+)$/);
  if (immDec) {
    const value = parseInt(immDec[1], 10);
    return { kind: 'immediate', value, str: toHexByte(value) };
  }

  // Absolute: $hhhh or $hh
  const absHex = operand.match(/^\$([0-9A-Fa-f]{1,4})$/);
  if (absHex) {
    const value = parseInt(absHex[1], 16);
    return { kind: 'absolute', value, str: toHexWord(value) };
  }

  // Label (branch / JMP target)
  const labelRef = operand.match(/^([A-Za-z_][A-Za-z0-9_]*)$/);
  if (labelRef) {
    return { kind: 'label', name: labelRef[1].toLowerCase() };
  }

  return { kind: 'none' };
}

// ─── Assembler ───────────────────────────────────────────────────────────────────

export function assemble(source: string): AssemblyResult {
  const errors: string[] = [];
  const instructions: AssembledInstruction[] = [];
  const addressToSourceLine: Record<number, number> = {};
  const sourceLineToAddress: Record<number, number> = {};

  const tokens = tokenize(source);

  // ── Pass 1: assign addresses and collect labels ───────────────────────────────────────
  const labels: Record<string, number> = {};
  let pc = CODE_START;

  for (const tok of tokens) {
    if (tok.label) {
      labels[tok.label] = pc;
    }
    if (!tok.mnemonic) continue;

    const mode = detectMode(tok.mnemonic, tok.operand);
    const key = `${tok.mnemonic} ${mode}`;
    const entry = OPCODE_TABLE[key];
    if (!entry) {
      continue;
    }
    pc += entry.size;
  }

  // ── Pass 2: emit bytes ──────────────────────────────────────────────────────────────────
  pc = CODE_START;

  for (const tok of tokens) {
    if (!tok.mnemonic) continue;

    const mode = detectMode(tok.mnemonic, tok.operand);
    const key = `${tok.mnemonic} ${mode}`;
    const entry = OPCODE_TABLE[key];

    if (!entry) {
      errors.push(
        `Line ${tok.lineIndex + 1}: Unknown or unsupported instruction: ${tok.mnemonic}${tok.operand ? ' ' + tok.operand : ''}`
      );
      continue;
    }

    const parsed = parseOperand(tok.operand);
    const bytes: number[] = [entry.opcode];
    let operandStr: string | undefined;
    let operandValue: number | undefined;

    if (entry.mode === 'immediate') {
      if (parsed.kind !== 'immediate') {
        errors.push(`Line ${tok.lineIndex + 1}: Expected immediate operand for ${tok.mnemonic}`);
        continue;
      }
      bytes.push(parsed.value & 0xff);
      operandStr = parsed.str;
      operandValue = parsed.value;
    } else if (entry.mode === 'absolute') {
      let addr: number;
      if (parsed.kind === 'absolute') {
        addr = parsed.value;
        operandStr = parsed.str;
      } else if (parsed.kind === 'label') {
        addr = labels[parsed.name] ?? 0;
        operandStr = toHexWord(addr);
        if (labels[parsed.name] === undefined) {
          errors.push(`Line ${tok.lineIndex + 1}: Undefined label: ${parsed.name}`);
          continue;
        }
      } else {
        errors.push(`Line ${tok.lineIndex + 1}: Expected absolute address for ${tok.mnemonic}`);
        continue;
      }
      operandValue = addr;
      bytes.push(addr & 0xff);
      bytes.push((addr >> 8) & 0xff);
    } else if (entry.mode === 'relative') {
      let targetAddr: number;
      if (parsed.kind === 'label') {
        if (labels[parsed.name] === undefined) {
          errors.push(`Line ${tok.lineIndex + 1}: Undefined label: ${parsed.name}`);
          continue;
        }
        targetAddr = labels[parsed.name];
        operandStr = toHexWord(targetAddr);
      } else if (parsed.kind === 'absolute') {
        targetAddr = parsed.value;
        operandStr = parsed.str;
      } else {
        errors.push(`Line ${tok.lineIndex + 1}: Branch needs a label or address`);
        continue;
      }
      const offset = targetAddr - (pc + 2);
      if (offset < -128 || offset > 127) {
        errors.push(`Line ${tok.lineIndex + 1}: Branch offset ${offset} out of range (-128..127)`);
        continue;
      }
      const relByte = toSigned8(offset) < 0 ? (offset + 256) & 0xff : offset & 0xff;
      bytes.push(relByte);
      operandValue = toSigned8(relByte);
      operandStr = `${toHexByte(relByte)} (${operandValue >= 0 ? '+' : ''}${operandValue})`;
    }

    const explanation = buildExplanation(tok.mnemonic, operandStr, operandValue);

    const instr: AssembledInstruction = {
      address: pc,
      sourceLine: tok.lineIndex,
      label: tok.label,
      mnemonic: tok.mnemonic,
      operand: tok.operand,
      bytes,
      size: entry.size,
      explanation,
    };

    instructions.push(instr);
    addressToSourceLine[pc] = tok.lineIndex;
    sourceLineToAddress[tok.lineIndex] = pc;

    pc += entry.size;
  }

  const flatBytes: number[] = [];
  for (const instr of instructions) {
    const offset = instr.address - CODE_START;
    for (let i = 0; i < instr.bytes.length; i++) {
      flatBytes[offset + i] = instr.bytes[i];
    }
  }

  const programSize = instructions.reduce((s, i) => s + i.size, 0);

  return {
    bytes: flatBytes,
    instructions,
    addressToSourceLine,
    sourceLineToAddress,
    errors,
    programSize,
  };
}

// ─── Mode detection ──────────────────────────────────────────────────────────────────

function detectMode(mnemonic: string, operand: string | undefined): string {
  if (!operand) return 'implied';
  if (/^#/.test(operand)) return 'immediate';
  if (['BNE', 'BEQ'].includes(mnemonic)) return 'relative';
  if (mnemonic === 'JMP') return 'absolute';
  if (/^\$[0-9A-Fa-f]{1,4}$/.test(operand) || /^[A-Za-z_]/.test(operand)) {
    return 'absolute';
  }
  return 'implied';
}

// ─── Disassembler (for UI display) ────────────────────────────────────────────────────

export type DisassemblyLine = {
  address: number;
  mnemonic: string;
  operandStr: string;
  bytes: number[];
  explanation: string;
};

export function disassemble(
  memory: Uint8Array,
  startAddress: number,
  count: number
): DisassemblyLine[] {
  const lines: DisassemblyLine[] = [];
  let addr = startAddress;

  for (let i = 0; i < count && addr < 0x10000; i++) {
    const opcode = memory[addr];
    const entry = Object.values(OPCODE_TABLE).find((e) => e.opcode === opcode);

    if (!entry) {
      lines.push({
        address: addr,
        mnemonic: '???',
        operandStr: toHexByte(opcode),
        bytes: [opcode],
        explanation: 'Unknown opcode',
      });
      addr++;
      continue;
    }

    const bytes: number[] = [opcode];
    let operandStr = '';
    let operandValue: number | undefined;

    if (entry.mode === 'immediate') {
      const v = memory[addr + 1] ?? 0;
      bytes.push(v);
      operandStr = `#${toHexByte(v)}`;
      operandValue = v;
    } else if (entry.mode === 'absolute') {
      const lo = memory[addr + 1] ?? 0;
      const hi = memory[addr + 2] ?? 0;
      const v = lo | (hi << 8);
      bytes.push(lo, hi);
      operandStr = toHexWord(v);
      operandValue = v;
    } else if (entry.mode === 'relative') {
      const rel = memory[addr + 1] ?? 0;
      bytes.push(rel);
      const signed = toSigned8(rel);
      const target = addr + 2 + signed;
      operandStr = `${toHexWord(target)}`;
      operandValue = signed;
    }

    lines.push({
      address: addr,
      mnemonic: entry.mnemonic,
      operandStr,
      bytes,
      explanation: buildExplanation(entry.mnemonic, operandStr, operandValue),
    });

    addr += entry.size;
  }

  return lines;
}
