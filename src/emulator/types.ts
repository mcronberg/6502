// ─── Core CPU types ───────────────────────────────────────────────────────────

export type CpuFlags = {
  N: boolean; // Negative
  V: boolean; // Overflow
  B: boolean; // Break
  D: boolean; // Decimal (not used in this sim)
  I: boolean; // Interrupt disable
  Z: boolean; // Zero
  C: boolean; // Carry
};

export type CpuState = {
  A: number;   // Accumulator  0–255
  X: number;   // Index X      0–255
  Y: number;   // Index Y      0–255
  PC: number;  // Program counter 0–65535
  SP: number;  // Stack pointer   0–255
  flags: CpuFlags;
  stopped: boolean;
};

// ─── Assembler types ──────────────────────────────────────────────────────────

export type AssembledInstruction = {
  address: number;
  sourceLine: number; // 0-based
  label?: string;
  mnemonic: string;
  operand?: string;
  bytes: number[];
  size: number;
  explanation: string;
};

export type AssemblyResult = {
  bytes: number[];
  instructions: AssembledInstruction[];
  addressToSourceLine: Record<number, number>;
  sourceLineToAddress: Record<number, number>;
  errors: string[];
  programSize: number;
};

// ─── Execution trace ──────────────────────────────────────────────────────────

export type TraceEntry = {
  step: number;
  pc: number;
  instruction: string; // e.g. "LDX #$00"
  A: number;
  X: number;
  Y: number;
  SP: number;
  flags: CpuFlags;
  notes: string;
};

// ─── Examples ─────────────────────────────────────────────────────────────────

export type ExampleProgram = {
  id: string;
  title: string;
  description: string;
  icon: string;       // Unicode/text symbol
  source: string;
  language?: 'asm' | 'c'; // defaults to 'asm'
  comingSoon?: boolean;
};

// ─── App status ───────────────────────────────────────────────────────────────

export type RunStatus = 'stopped' | 'running' | 'finished' | 'error';
