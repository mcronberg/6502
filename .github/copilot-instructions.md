# Copilot Instructions — 6502 CPU Simulator

This is a **single-page educational React app** that simulates the MOS 6502 processor.  
All logic is pure TypeScript in `src/emulator/`. All UI is React + Tailwind CSS in `src/components/`.  
There is **no backend, no router, no external UI library**.

---

## Codebase map

```
src/
  emulator/           Pure TS — no React imports, no side-effects, fully unit-testable
    types.ts          All shared types: CpuState, CpuFlags, AssemblyResult, TraceEntry, …
    formatting.ts     Pure helpers: toHexByte, toHexWord, toHex2, formatFlags, updateZeroNegativeFlags
    instructions.ts   OPCODE_TABLE (Record<"MNEMONIC MODE", OpcodeEntry>), decodeOpcode, buildExplanation
    examples.ts       EXAMPLE_PROGRAMS: ExampleProgram[]
    assembler.ts      assemble(source): AssemblyResult  |  disassemble(memory, start, count): DisassemblyLine[]
    cpu.ts            initialCpuState(), loadProgram(), stepCpu(): StepResult | null

  components/         React functional components, props-only (no internal fetch/effects except scroll)
    Header.tsx
    Toolbar.tsx
    AssemblyEditor.tsx
    CpuPanel.tsx
    CurrentInstructionPanel.tsx
    MemoryPanel.tsx
    ExecutionLog.tsx
    StatusFooter.tsx

  App.tsx             Single root component — all useState/useRef/useEffect live here
  main.tsx            createRoot entry point
  style.css           @tailwind base/components/utilities + .toolbar-btn
  vite-env.d.ts       /// <reference types="vite/client" />
```

---

## Core type contracts

### `CpuState`
```ts
{ A: number; X: number; Y: number; PC: number; SP: number;
  flags: CpuFlags; stopped: boolean }
```
All register values are **unsigned 8-bit (0–255)** except PC which is **16-bit (0–65535)**.  
Never mutate a `CpuState` — always return a new object: `{ ...cpu, X: newX }`.

### `CpuFlags`
```ts
{ N: boolean; V: boolean; B: boolean; D: boolean; I: boolean; Z: boolean; C: boolean }
```

### `AssemblyResult`
```ts
{ bytes: number[]; instructions: AssembledInstruction[];
  addressToSourceLine: Record<number, number>;
  sourceLineToAddress: Record<number, number>;
  errors: string[]; programSize: number }
```
Programs always load at **`CODE_START = 0x0600`**.

### `TraceEntry`
```ts
{ step: number; pc: number; instruction: string;
  A: number; X: number; Y: number; SP: number;
  flags: CpuFlags; notes: string }
```

### `RunStatus`
```ts
'stopped' | 'running' | 'finished' | 'error'
```

---

## Emulator conventions

### Adding an instruction to `OPCODE_TABLE` (instructions.ts)
Keys are `"MNEMONIC MODE"` — e.g. `"LDA immediate"`, `"STX absolute"`, `"INX implied"`.  
Valid modes: `'immediate' | 'absolute' | 'implied' | 'relative'`.

```ts
'TAX implied': { opcode: 0xaa, size: 1, mode: 'implied', mnemonic: 'TAX' },
```

Also add a `case 'TAX':` in `buildExplanation()`.

### Adding execution logic to `stepCpu()` (cpu.ts)
Match on `entry.mnemonic` (not the raw opcode number) inside the big switch.  
Pattern:
```ts
case 'TAX': {
  const next: CpuState = { ...cpu, X: cpu.A, PC: pc + entry.size };
  const flags = updateZeroNegativeFlags(next.X, next.flags);
  return makeTrace({ ...next, flags }, memory, stepNumber, 'X = A', assembled);
}
```
- Always return `makeTrace(...)` — never build the `StepResult` manually.
- Never mutate `memory` for register-only operations.
- For store instructions: `const nextMem = new Uint8Array(memory); nextMem[addr] = value;`

### Assembler (assembler.ts)
- `assemble()` is a two-pass assembler. Pass 1 computes addresses and labels. Pass 2 emits bytes.
- `detectMode()` infers addressing mode from the operand string — update it when adding new modes.
- Relative branch offset: `offset = target - (pc + 2)`, must fit in `−128..127`.
- Errors are non-fatal: push to `errors[]`, continue assembling so the user gets all errors at once.

---

## React conventions

### Component props pattern
Every component receives **plain data props** — no context, no store.  
Callbacks are named `onXxx`. Example:
```ts
type Props = {
  source: string;
  onChange: (s: string) => void;
  currentSourceLine: number | null;
};
```

### All state lives in App.tsx
Components are purely presentational. Do **not** add `useState` to leaf components unless it is strictly local UI state (e.g. tooltip hover).

### Mutable refs for the run loop
The `setInterval` run-loop in App.tsx reads from refs, not state:
```ts
const cpuRef      = useRef(cpu);
const memoryRef   = useRef(memory);
const assembledRef = useRef(assembled);
```
Whenever you update `cpu`, `memory`, or `assembled` state, also update the corresponding ref:
```ts
setCpu(next); cpuRef.current = next;
```

### Run loop constraints
- Interval: **200 ms** per step.
- Safety cap: **`RUN_SAFETY_LIMIT = 10_000`** steps then auto-stop with status `'error'`.
- Stop conditions: `cpu.stopped === true` (BRK or unknown opcode), safety cap reached.
- Always call `clearInterval(runIntervalRef.current)` before starting a new interval.

---

## Styling conventions

### Tailwind utility classes
- Dark background: `bg-[#0d0f14]` (body) / `bg-[#0a0c10]` (panels)
- Green accent (active/set): `text-green-400`, `border-green-600`, `bg-green-950/40`
- Amber accent (warnings/writes): `text-amber-400`, `border-amber-600`
- Muted text: `text-gray-500`, `text-gray-700`
- Panels use `border border-[#2a2d35] rounded-lg p-3`

### Flag rendering rules
- **Primary flags** `['N', 'Z', 'C']`: render green (`text-green-300 border-green-500 bg-green-900/60`) when set.
- **Secondary flags** `['V', 'B', 'D', 'I']`: render muted gray (`text-gray-400 border-gray-600 bg-gray-800/40`) when set.
- Both sets: render dim (`text-gray-700 border-gray-800 bg-transparent`) when clear.

### Custom component class
`.toolbar-btn` is defined in `style.css` via `@layer components`. Use it for toolbar buttons:
```html
<button class="toolbar-btn ...overrides">Label</button>
```
Do **not** inline all toolbar-button styles; keep them in the component class.

### Memory panel highlighting
- **PC cell**: `bg-green-900/70 text-green-200 font-bold`
- **Last-written cell**: `bg-amber-900/60 text-amber-300 font-bold`
- **Zero byte**: `text-gray-700`
- **Non-zero byte**: `text-gray-300`

---

## Formatting helpers (formatting.ts)

| Function | Example output |
|---|---|
| `toHexByte(0x0a)` | `"$0A"` |
| `toHexWord(0x0600)` | `"$0600"` |
| `toHex2(0x0a)` | `"0A"` (no `$` prefix, used in memory grid) |
| `formatFlags(flags)` | `"..B..Z."` (7 chars, uppercase if set, `.` if clear) |

Flag string order: **N V B D I Z C** (bit 7 → bit 0, B is in position 4).

---

## What NOT to do

- **Do not** add `axios`, `fetch`, or any network calls — there is no backend.
- **Do not** add React Router, Redux, Zustand, or any state library.
- **Do not** import Tailwind classes from JavaScript — use template literals with static strings only, so Tailwind's class scanner picks them up.
- **Do not** mutate `CpuState` or `Uint8Array` in-place — always copy first.
- **Do not** put emulator logic (flag calculations, byte encoding) inside React components.
- **Do not** add `console.log` to production paths — use the execution trace for debugging.
- **Do not** change `CODE_START = 0x0600` without updating both `assembler.ts` and `cpu.ts`.

---

## Memory layout

| Range | Purpose |
|---|---|
| `$0000–$00FF` | Zero page |
| `$0100–$01FF` | Stack (SP starts at `$FF`, grows down) |
| `$0200–$02FF` | Data output (conventional for this sim) |
| `$0600–$06FF` | Code segment (programs load here) |

---

## Extending the simulator — checklist

### New instruction
- [ ] Add to `OPCODE_TABLE` in `instructions.ts`
- [ ] Add `case` to `buildExplanation()` in `instructions.ts`
- [ ] Add `case` to `stepCpu()` switch in `cpu.ts`
- [ ] If new addressing mode: update `detectMode()` in `assembler.ts`
- [ ] If new operand syntax: update `parseOperand()` in `assembler.ts`

### New example program
- [ ] Add entry to `EXAMPLE_PROGRAMS` in `examples.ts`
- [ ] Use only instructions already in `OPCODE_TABLE`, or add them first
- [ ] Set `comingSoon: true` if the example needs unimplemented features

### New UI panel
- [ ] Create `src/components/MyPanel.tsx` — props-only, no internal state except scroll refs
- [ ] Add props to `App.tsx` state if new data is needed
- [ ] Import and render in `App.tsx` — do not add routing

---

## Running and building

```bash
npm run dev        # Vite dev server with HMR
npx tsc --noEmit   # Type-check only (CI gate)
npm run build      # tsc + vite build → dist/
npm run preview    # Serve dist/ locally
```

TypeScript must compile with **zero errors** before any commit.  
`tsconfig.json` enforces `strict: true`, `noUnusedLocals: false`, `noUnusedParameters: false`.
