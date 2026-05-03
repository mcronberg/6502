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
      const v = memory[pc + 1];
      operandStr = `#${toHexByte(v)}`;
      newCpu.A = v;
      newCpu.flags = updateZeroNegativeFlags(v, newCpu.flags);
      instrStr = `LDA ${operandStr}`;
      notes = `A = ${toHexByte(v)}`;
      newCpu.PC = pc + 2;
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
