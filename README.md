# 6502 CPU Simulator

An educational single-page app that simulates the MOS 6502 processor — built with React, TypeScript, and Tailwind CSS.

**Live demo:** https://mcronberg.github.io/6502/

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

`LDA` `LDX` `LDY` `STA` `STX` `STY` `INX` `INY` `DEX` `DEY`  
`CPX` `CPY` `CMP` `JMP` `BNE` `BEQ` `NOP` `BRK`

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
