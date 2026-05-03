import type { CpuState, CpuFlags, TraceEntry } from './types';
import type { AssemblyResult } from './types';
import { decodeOpcode } from './instructions';
import { buildExplanation } from './instructions';
import { toHexByte, toHexWord, toSigned8, updateZeroNegativeFlags } from './formatting';

export const CODE_START = 0x0600;

export function initialCpuState(): CpuState {
  return {
    A: 0, X: 0, Y: 0,
    PC: CODE_START,
    SP: 0xff,
    flags: { N: false, V: false, B: false, D: false, I: false, Z: false, C: false },
    stopped: false,
  };
}

export function loadProgram(memory: Uint8Array, assembled: AssemblyResult): Uint8Array {
  const next = new Uint8Array(memory);
  for (let i = 0; i < assembled.bytes.length; i++) {
    if (assembled.bytes[i] !== undefined) {
      next[CODE_START + i] = assembled.bytes[i];
    }
  }
  return next;
}

export type StepResult = {
  cpu: CpuState;
  memory: Uint8Array;
  trace: TraceEntry;
  lastWrittenAddress?: number;
};

export function stepCpu(
  cpu: CpuState,
  memory: Uint8Array,
  stepNumber: number,
  assembled: AssemblyResult
): StepResult | null {
  if (cpu.stopped) return null;

  const pc = cpu.PC;
  const opcode = memory[pc];
  const entry = decodeOpcode(opcode);

  if (!entry) {
    return {
      cpu: { ...cpu, stopped: true },
      memory,
      trace: makeTrace(stepNumber, pc, '???', cpu, 'Unknown opcode — halted'),
    };
  }

  let newCpu: CpuState = { ...cpu, flags: { ...cpu.flags } };
  let newMemory = memory;
  let lastWrittenAddress: number | undefined;
  let instrStr = entry.mnemonic;
  let notes = '';
  let operandStr: string | undefined;
  let operandValue: number | undefined;

  switch (entry.mnemonic) {
    case 'LDA': {
      if (entry.mode === 'zeropage') {
        const zpAddr = memory[pc + 1];
        const v = memory[zpAddr];
        const zpStr = `$${zpAddr.toString(16).padStart(2, '0').toUpperCase()}`;
        operandStr = zpStr;
        newCpu.A = v;
        newCpu.flags = updateZeroNegativeFlags(v, newCpu.flags);
        instrStr = `LDA ${zpStr}`;
        notes = `A = mem[${zpStr}] = ${toHexByte(v)}`;
        newCpu.PC = pc + 2;
      } else {
        const v = memory[pc + 1];
        operandStr = `#${toHexByte(v)}`;
        newCpu.A = v;
        newCpu.flags = updateZeroNegativeFlags(v, newCpu.flags);
        instrStr = `LDA ${operandStr}`;
        notes = `A = ${toHexByte(v)}`;
        newCpu.PC = pc + 2;
      }
      break;
    }
    case 'LDX': {
      const v = memory[pc + 1];
      operandStr = `#${toHexByte(v)}`;
      newCpu.X = v;
      newCpu.flags = updateZeroNegativeFlags(v, newCpu.flags);
      instrStr = `LDX ${operandStr}`;
      notes = `X = ${toHexByte(v)}`;
      newCpu.PC = pc + 2;
      break;
    }
    case 'LDY': {
      const v = memory[pc + 1];
      operandStr = `#${toHexByte(v)}`;
      newCpu.Y = v;
      newCpu.flags = updateZeroNegativeFlags(v, newCpu.flags);
      instrStr = `LDY ${operandStr}`;
      notes = `Y = ${toHexByte(v)}`;
      newCpu.PC = pc + 2;
      break;
    }
    case 'STA': {
      if (entry.mode === 'zeropage') {
        const zpAddr = memory[pc + 1];
        const zpStr = `$${zpAddr.toString(16).padStart(2, '0').toUpperCase()}`;
        operandStr = zpStr;
        const nextMem = new Uint8Array(newMemory);
        nextMem[zpAddr] = newCpu.A;
        newMemory = nextMem;
        lastWrittenAddress = zpAddr;
        instrStr = `STA ${zpStr}`;
        notes = `Wrote ${toHexByte(newCpu.A)} → mem[${zpStr}]`;
        newCpu.PC = pc + 2;
      } else {
        const lo = memory[pc + 1]; const hi = memory[pc + 2];
        const addr = lo | (hi << 8);
        operandStr = toHexWord(addr);
        const nextMem = new Uint8Array(newMemory);
        nextMem[addr] = newCpu.A;
        newMemory = nextMem;
        lastWrittenAddress = addr;
        instrStr = `STA ${operandStr}`;
        notes = `Wrote ${toHexByte(newCpu.A)} → ${operandStr}`;
        newCpu.PC = pc + 3;
      }
      break;
    }
    case 'STX': {
      const lo = memory[pc + 1]; const hi = memory[pc + 2];
      const addr = lo | (hi << 8);
      operandStr = toHexWord(addr);
      const nextMem = new Uint8Array(newMemory);
      nextMem[addr] = newCpu.X;
      newMemory = nextMem;
      lastWrittenAddress = addr;
      instrStr = `STX ${operandStr}`;
      notes = `Wrote ${toHexByte(newCpu.X)} → ${operandStr}`;
      newCpu.PC = pc + 3;
      break;
    }
    case 'STY': {
      const lo = memory[pc + 1]; const hi = memory[pc + 2];
      const addr = lo | (hi << 8);
      operandStr = toHexWord(addr);
      const nextMem = new Uint8Array(newMemory);
      nextMem[addr] = newCpu.Y;
      newMemory = nextMem;
      lastWrittenAddress = addr;
      instrStr = `STY ${operandStr}`;
      notes = `Wrote ${toHexByte(newCpu.Y)} → ${operandStr}`;
      newCpu.PC = pc + 3;
      break;
    }
    case 'INX': {
      newCpu.X = (newCpu.X + 1) & 0xff;
      newCpu.flags = updateZeroNegativeFlags(newCpu.X, newCpu.flags);
      instrStr = 'INX'; notes = `X = ${newCpu.X}`;
      newCpu.PC = pc + 1; break;
    }
    case 'INY': {
      newCpu.Y = (newCpu.Y + 1) & 0xff;
      newCpu.flags = updateZeroNegativeFlags(newCpu.Y, newCpu.flags);
      instrStr = 'INY'; notes = `Y = ${newCpu.Y}`;
      newCpu.PC = pc + 1; break;
    }
    case 'DEX': {
      newCpu.X = (newCpu.X - 1) & 0xff;
      newCpu.flags = updateZeroNegativeFlags(newCpu.X, newCpu.flags);
      instrStr = 'DEX'; notes = `X = ${newCpu.X}`;
      newCpu.PC = pc + 1; break;
    }
    case 'DEY': {
      newCpu.Y = (newCpu.Y - 1) & 0xff;
      newCpu.flags = updateZeroNegativeFlags(newCpu.Y, newCpu.flags);
      instrStr = 'DEY'; notes = `Y = ${newCpu.Y}`;
      newCpu.PC = pc + 1; break;
    }
    case 'CPX': {
      const v = memory[pc + 1];
      operandStr = `#${toHexByte(v)}`;
      const diff = (newCpu.X - v) & 0xff;
      newCpu.flags = updateZeroNegativeFlags(diff, newCpu.flags);
      newCpu.flags.C = newCpu.X >= v;
      instrStr = `CPX ${operandStr}`;
      notes = `Compare X(${toHexByte(newCpu.X)}) with ${operandStr} → Z=${newCpu.flags.Z ? 1 : 0}`;
      newCpu.PC = pc + 2; break;
    }
    case 'CPY': {
      const v = memory[pc + 1];
      operandStr = `#${toHexByte(v)}`;
      const diff = (newCpu.Y - v) & 0xff;
      newCpu.flags = updateZeroNegativeFlags(diff, newCpu.flags);
      newCpu.flags.C = newCpu.Y >= v;
      instrStr = `CPY ${operandStr}`;
      notes = `Compare Y with ${operandStr}`;
      newCpu.PC = pc + 2; break;
    }
    case 'CMP': {
      const v = memory[pc + 1];
      operandStr = `#${toHexByte(v)}`;
      const diff = (newCpu.A - v) & 0xff;
      newCpu.flags = updateZeroNegativeFlags(diff, newCpu.flags);
      newCpu.flags.C = newCpu.A >= v;
      instrStr = `CMP ${operandStr}`;
      notes = `Compare A with ${operandStr}`;
      newCpu.PC = pc + 2; break;
    }
    case 'JMP': {
      const lo = memory[pc + 1]; const hi = memory[pc + 2];
      const addr = lo | (hi << 8);
      operandStr = toHexWord(addr);
      instrStr = `JMP ${operandStr}`;
      notes = `Jump to ${operandStr}`;
      newCpu.PC = addr; break;
    }
    case 'BNE': {
      const rel = memory[pc + 1];
      const signed = toSigned8(rel);
      const target = pc + 2 + signed;
      operandStr = toHexWord(target);
      const taken = !newCpu.flags.Z;
      instrStr = `BNE ${operandStr}`;
      notes = taken ? `Branch taken to ${toHexWord(target)}` : 'Branch not taken (Z=1)';
      newCpu.PC = taken ? target : pc + 2;
      operandValue = signed; break;
    }
    case 'BEQ': {
      const rel = memory[pc + 1];
      const signed = toSigned8(rel);
      const target = pc + 2 + signed;
      operandStr = toHexWord(target);
      const taken = newCpu.flags.Z;
      instrStr = `BEQ ${operandStr}`;
      notes = taken ? `Branch taken to ${toHexWord(target)}` : 'Branch not taken (Z=0)';
      newCpu.PC = taken ? target : pc + 2;
      operandValue = signed; break;
    }
    case 'NOP': {
      instrStr = 'NOP'; notes = 'No operation';
      newCpu.PC = pc + 1; break;
    }
    case 'BRK': {
      newCpu.flags.B = true;
      newCpu.stopped = true;
      instrStr = 'BRK'; notes = 'Program stopped (BRK)';
      newCpu.PC = pc + 1; break;
    }
    case 'TAX': {
      newCpu.X = newCpu.A;
      newCpu.flags = updateZeroNegativeFlags(newCpu.X, newCpu.flags);
      instrStr = 'TAX'; notes = `X = A = ${toHexByte(newCpu.X)}`;
      newCpu.PC = pc + 1; break;
    }
    case 'TAY': {
      newCpu.Y = newCpu.A;
      newCpu.flags = updateZeroNegativeFlags(newCpu.Y, newCpu.flags);
      instrStr = 'TAY'; notes = `Y = A = ${toHexByte(newCpu.Y)}`;
      newCpu.PC = pc + 1; break;
    }
    case 'TXA': {
      newCpu.A = newCpu.X;
      newCpu.flags = updateZeroNegativeFlags(newCpu.A, newCpu.flags);
      instrStr = 'TXA'; notes = `A = X = ${toHexByte(newCpu.A)}`;
      newCpu.PC = pc + 1; break;
    }
    case 'TYA': {
      newCpu.A = newCpu.Y;
      newCpu.flags = updateZeroNegativeFlags(newCpu.A, newCpu.flags);
      instrStr = 'TYA'; notes = `A = Y = ${toHexByte(newCpu.A)}`;
      newCpu.PC = pc + 1; break;
    }
    case 'CLC': {
      newCpu.flags = { ...newCpu.flags, C: false };
      instrStr = 'CLC'; notes = 'C = 0';
      newCpu.PC = pc + 1; break;
    }
    case 'SEC': {
      newCpu.flags = { ...newCpu.flags, C: true };
      instrStr = 'SEC'; notes = 'C = 1';
      newCpu.PC = pc + 1; break;
    }
    case 'ADC': {
      const v = memory[pc + 1];
      operandStr = `#${toHexByte(v)}`;
      const carry = newCpu.flags.C ? 1 : 0;
      const sum = newCpu.A + v + carry;
      const overflow = (~(newCpu.A ^ v) & (newCpu.A ^ sum)) & 0x80;
      newCpu.flags.C = sum > 0xff;
      newCpu.flags.V = overflow !== 0;
      newCpu.A = sum & 0xff;
      newCpu.flags = updateZeroNegativeFlags(newCpu.A, newCpu.flags);
      instrStr = `ADC ${operandStr}`;
      notes = `A = ${toHexByte(newCpu.A)}`;
      newCpu.PC = pc + 2; break;
    }
    case 'SBC': {
      const v = memory[pc + 1];
      operandStr = `#${toHexByte(v)}`;
      const borrow = newCpu.flags.C ? 0 : 1;
      const diff = newCpu.A - v - borrow;
      const overflow = ((newCpu.A ^ v) & (newCpu.A ^ diff)) & 0x80;
      newCpu.flags.C = diff >= 0;
      newCpu.flags.V = overflow !== 0;
      newCpu.A = diff & 0xff;
      newCpu.flags = updateZeroNegativeFlags(newCpu.A, newCpu.flags);
      instrStr = `SBC ${operandStr}`;
      notes = `A = ${toHexByte(newCpu.A)}`;
      newCpu.PC = pc + 2; break;
    }
    case 'BCC': {
      const rel = memory[pc + 1];
      const signed = toSigned8(rel);
      const target = pc + 2 + signed;
      operandStr = toHexWord(target);
      const taken = !newCpu.flags.C;
      instrStr = `BCC ${operandStr}`;
      notes = taken ? `Branch taken to ${toHexWord(target)}` : 'Branch not taken (C=1)';
      newCpu.PC = taken ? target : pc + 2;
      operandValue = signed; break;
    }
    case 'BCS': {
      const rel = memory[pc + 1];
      const signed = toSigned8(rel);
      const target = pc + 2 + signed;
      operandStr = toHexWord(target);
      const taken = newCpu.flags.C;
      instrStr = `BCS ${operandStr}`;
      notes = taken ? `Branch taken to ${toHexWord(target)}` : 'Branch not taken (C=0)';
      newCpu.PC = taken ? target : pc + 2;
      operandValue = signed; break;
    }
    default:
      newCpu.stopped = true;
      instrStr = `???`;
      notes = `Unhandled opcode ${toHexByte(opcode)}`;
  }

  const assembledInstr = assembled.instructions.find((i) => i.address === pc);
  const explanation = assembledInstr?.explanation
    ?? buildExplanation(entry.mnemonic, operandStr, operandValue);
  void explanation;

  const trace = makeTrace(stepNumber, pc, instrStr, newCpu, notes);
  return { cpu: newCpu, memory: newMemory, trace, lastWrittenAddress };
}

function makeTrace(
  step: number, pc: number, instruction: string,
  cpu: CpuState, notes: string
): TraceEntry {
  return { step, pc, instruction, A: cpu.A, X: cpu.X, Y: cpu.Y, SP: cpu.SP, flags: { ...cpu.flags }, notes };
}
