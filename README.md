# 6502 CPU Simulator

**Live demo:** https://mcronberg.github.io/6502/

Created by Michell Cronberg in collaboration with Claude for use in teaching and presentations.

An educational single-page app that simulates the MOS 6502 processor — built with React, TypeScript, and Tailwind CSS.

## Features

- Assemble and run 6502 assembly programs in the browser
- Step through one instruction at a time
- Watch CPU registers (A, X, Y, PC, SP) and status flags update in real-time
- Memory viewer showing both the code ($0600) and data ($0200) regions
- Full execution trace / log
- Four built-in example programs:
  - **Hello Flags** — see how the status flags change
  - **Hello Memory** — write values to the data region
  - **Hello Registers** — load values into A, X, Y
  - **Loop to 5** — count from 1 to 5 using a loop

## Supported instructions

| Mnemonic | Mode      | Opcode | Bytes | Description |
|----------|-----------|--------|-------|-------------|
| `LDA`    | immediate | `$A9`  | 2     | Load value into A |
| `LDX`    | immediate | `$A2`  | 2     | Load value into X |
| `LDY`    | immediate | `$A0`  | 2     | Load value into Y |
| `STA`    | absolute  | `$8D`  | 3     | Store A at address |
| `STX`    | absolute  | `$8E`  | 3     | Store X at address |
| `STY`    | absolute  | `$8C`  | 3     | Store Y at address |
| `INX`    | implied   | `$E8`  | 1     | Increment X by 1 |
| `INY`    | implied   | `$C8`  | 1     | Increment Y by 1 |
| `DEX`    | implied   | `$CA`  | 1     | Decrement X by 1 |
| `DEY`    | implied   | `$88`  | 1     | Decrement Y by 1 |
| `CPX`    | immediate | `$E0`  | 2     | Compare X with value, update flags |
| `CPY`    | immediate | `$C0`  | 2     | Compare Y with value, update flags |
| `CMP`    | immediate | `$C9`  | 2     | Compare A with value, update flags |
| `JMP`    | absolute  | `$4C`  | 3     | Jump to address |
| `BNE`    | relative  | `$D0`  | 2     | Branch if Z = 0 |
| `BEQ`    | relative  | `$F0`  | 2     | Branch if Z = 1 |
| `NOP`    | implied   | `$EA`  | 1     | No operation |
| `BRK`    | implied   | `$00`  | 1     | Break / stop execution |

Programs load at `$0600`. Relative branch offset = target − (PC + 2), range −128..+127.

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
