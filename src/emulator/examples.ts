import type { ExampleProgram } from './types';

export const EXAMPLE_PROGRAMS: ExampleProgram[] = [
  {
    id: 'hello-flags',
    title: 'Hello Flags',
    description: 'See how the status flags change',
    icon: '⚑',
    source: `LDX #$00        ; X = 0  → Z=1 (zero)
CPX #$00        ; 0 == 0 → Z=1
INX             ; X = 1  → Z=0
CPX #$FF        ; 1 < 255 → N=0, C=0
INX             ; X = 2
LDA #$80        ; A = 128 → N=1 (negative bit)
BRK             ; Stop`,
  },
  {
    id: 'hello-memory',
    title: 'Hello Memory',
    description: 'Write values to the data region',
    icon: '▦',
    source: `LDA #$11        ; A = $11
STA $0200       ; Store at $0200
LDA #$22        ; A = $22
STA $0201       ; Store at $0201
LDA #$33
STA $0202
LDA #$44
STA $0203
LDA #$55
STA $0204
LDA #$66
STA $0205
LDA #$77
STA $0206
LDA #$88
STA $0207
BRK             ; Stop`,
  },
  {
    id: 'hello-registers',
    title: 'Hello Registers',
    description: 'Load values into A, X, Y and store to memory',
    icon: '⊞',
    source: `LDA #$41        ; A = $41
LDX #$42        ; X = $42
LDY #$43        ; Y = $43
STA $0200       ; Store A → $0200
STX $0201       ; Store X → $0201
STY $0202       ; Store Y → $0202
INX             ; X = $43
INY             ; Y = $44
STX $0203       ; Store X → $0203
STY $0204       ; Store Y → $0204
BRK             ; Stop`,
  },
  {
    id: 'loop-to-5',
    title: 'Loop to 5',
    description: 'Count from 1 to 5 using a loop',
    icon: '↺',
    source: `LDX #$00        ; X = 0 (counter)

loop:
  INX             ; X = X + 1
  CPX #$05        ; Are we at 5?
  BNE loop        ; Loop if not equal
  STX $0200       ; Store result
  BRK             ; Stop`,
  },
];
