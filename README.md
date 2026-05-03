# 6502 CPU Simulator

**Live demo:** https://mcronberg.github.io/6502/

Created by Michell Cronberg in collaboration with Claude for use in teaching and presentations.

An educational single-page app that simulates the MOS 6502 processor — built with React, TypeScript, and Tailwind CSS.

## Features

- Assemble and run 6502 assembly programs in the browser
- **Mini C compiler** — write a C subset that compiles to 6502 assembly on the fly
- Step through one instruction at a time
- Watch CPU registers (A, X, Y, PC, SP) and status flags update in real-time
- Memory viewer showing both the code ($0600) and data ($0200) regions
- Full execution trace / log
- Built-in example programs (assembly and C):
  - **Hello Flags** — see how the status flags change
  - **Hello Memory** — write values to the data region
  - **Hello Registers** — load values into A, X, Y
  - **Loop to 5** — count from 1 to 5 using a loop
  - **Countdown (C)** — byte variable counting down to zero
  - **Multiply by 3 (C)** — repeated addition using a while loop

## Supported instructions

| Mnemonic | Mode      | Opcode | Bytes | Description |
|----------|-----------|--------|-------|-------------|
| `LDA`    | immediate | `$A9`  | 2     | Load value into A |
| `LDA`    | zeropage  | `$A5`  | 2     | Load A from zero-page address |
| `LDX`    | immediate | `$A2`  | 2     | Load value into X |
| `LDY`    | immediate | `$A0`  | 2     | Load value into Y |
| `STA`    | absolute  | `$8D`  | 3     | Store A at address |
| `STA`    | zeropage  | `$85`  | 2     | Store A at zero-page address |
| `STX`    | absolute  | `$8E`  | 3     | Store X at address |
| `STY`    | absolute  | `$8C`  | 3     | Store Y at address |
| `TAX`    | implied   | `$AA`  | 1     | Copy A to X |
| `TAY`    | implied   | `$A8`  | 1     | Copy A to Y |
| `TXA`    | implied   | `$8A`  | 1     | Copy X to A |
| `TYA`    | implied   | `$98`  | 1     | Copy Y to A |
| `INX`    | implied   | `$E8`  | 1     | Increment X by 1 |
| `INY`    | implied   | `$C8`  | 1     | Increment Y by 1 |
| `DEX`    | implied   | `$CA`  | 1     | Decrement X by 1 |
| `DEY`    | implied   | `$88`  | 1     | Decrement Y by 1 |
| `CLC`    | implied   | `$18`  | 1     | Clear carry flag |
| `SEC`    | implied   | `$38`  | 1     | Set carry flag |
| `ADC`    | immediate | `$69`  | 2     | Add with carry |
| `SBC`    | immediate | `$E9`  | 2     | Subtract with borrow |
| `CPX`    | immediate | `$E0`  | 2     | Compare X with value, update flags |
| `CPY`    | immediate | `$C0`  | 2     | Compare Y with value, update flags |
| `CMP`    | immediate | `$C9`  | 2     | Compare A with value, update flags |
| `JMP`    | absolute  | `$4C`  | 3     | Jump to address |
| `BNE`    | relative  | `$D0`  | 2     | Branch if Z = 0 |
| `BEQ`    | relative  | `$F0`  | 2     | Branch if Z = 1 |
| `BCC`    | relative  | `$90`  | 2     | Branch if C = 0 |
| `BCS`    | relative  | `$B0`  | 2     | Branch if C = 1 |
| `NOP`    | implied   | `$EA`  | 1     | No operation |
| `BRK`    | implied   | `$00`  | 1     | Break / stop execution |

Programs load at `$0600`. Relative branch offset = target − (PC + 2), range −128..+127.

## Mini C compiler

Switch the editor to **C mode** using the toggle in the top-left corner.  
The supported C subset:

```c
byte x = 5;          // declare a byte variable (initial value 0–255)
x++;                 // increment
x--;                 // decrement
x = x + 3;          // add literal
x = x - 2;          // subtract literal
mem[0x0200] = x;     // store variable to memory address

while (x != 0) { … } // loop  (operators: == != < >=)
if (x == 3) { … }    // conditional
```

Variables are mapped to 6502 registers (first → X, second → Y) or zero-page addresses ($00, $01, …) for additional variables.  
Clicking **Compile** converts the C source to 6502 assembly, shows it in a read-only panel, then assembles it automatically.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:5173/ in your browser.

## Building

```bash
npm run build
```

Output in `dist/`. Set `base: '/6502/'` in `vite.config.ts` for GitHub Pages deployment.

## Tech stack

- [React 19](https://react.dev/) + TypeScript
- [Vite](https://vitejs.dev/) (build tool)
- [Tailwind CSS v3](https://tailwindcss.com/)
- No backend, no router, no external UI library
