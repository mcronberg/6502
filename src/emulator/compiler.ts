/**
 * Mini C subset compiler → 6502 assembly text.
 *
 * Supported syntax:
 *   byte x = 5;                // declaration + initialisation (literal)
 *   x = 3;                     // assignment (literal)
 *   x = x + 2;  x = x - 2;    // arithmetic with literal
 *   x++;  x--;                 // increment / decrement
 *   mem[0x0200] = x;           // store variable to memory address
 *   mem[0x0200] = 42;          // store literal to memory address
 *   while (x != 0) { ... }     // loop  (ops: == != < >=)
 *   if (x == 3) { ... }        // conditional
 *
 * Variable allocation:
 *   1st variable → X register
 *   2nd variable → Y register
 *   3rd+ variables → zero page $00, $01, …
 *
 * Restrictions:
 *   - All values are unsigned bytes (0–255)
 *   - Condition RHS must be a literal (not a variable)
 *   - Opening brace must be on the same line as while/if
 *   - No function calls, no arrays, no multi-variable arithmetic
 */

export type CompileResult = {
  asm: string;
  errors: string[];
};

type VarLoc =
  | { kind: 'reg'; reg: 'X' | 'Y' }
  | { kind: 'zp'; addr: number };

class Compiler {
  private errors: string[] = [];
  private lines: string[] = [];
  private pos = 0;
  private vars = new Map<string, VarLoc>();
  private labelCounter = 0;
  private out: string[] = [];

  compile(source: string): CompileResult {
    this.errors = [];
    this.out = [];
    this.vars = new Map();
    this.labelCounter = 0;
    this.lines = source
      .split('\n')
      .map((l) => l.replace(/\/\/.*/, '').trim())
      .filter((l) => l.length > 0);
    this.pos = 0;

    this.parseBlock(false);

    if (this.errors.length === 0) {
      this.emit('BRK');
    }
    return { asm: this.out.join('\n'), errors: this.errors };
  }

  // ─── helpers ─────────────────────────────────────────────────────────────

  private emit(line: string) {
    this.out.push(line);
  }

  private newLabel(): string {
    return `_l${this.labelCounter++}`;
  }

  private hex2(n: number): string {
    return `$${(n & 0xff).toString(16).padStart(2, '0').toUpperCase()}`;
  }

  private hex4(n: number): string {
    return `$${(n & 0xffff).toString(16).padStart(4, '0').toUpperCase()}`;
  }

  private parseLit(s: string): number {
    return parseInt(s, s.startsWith('0x') || s.startsWith('0X') ? 16 : 10) & 0xff;
  }

  private allocVar(name: string): VarLoc {
    if (this.vars.has(name)) return this.vars.get(name)!;
    const regCount = [...this.vars.values()].filter((v) => v.kind === 'reg').length;
    let loc: VarLoc;
    if (regCount === 0) {
      loc = { kind: 'reg', reg: 'X' };
    } else if (regCount === 1) {
      loc = { kind: 'reg', reg: 'Y' };
    } else {
      const zpCount = [...this.vars.values()].filter((v) => v.kind === 'zp').length;
      loc = { kind: 'zp', addr: zpCount };
    }
    this.vars.set(name, loc);
    return loc;
  }

  private getVar(name: string): VarLoc | undefined {
    return this.vars.get(name);
  }

  /** Move variable value into A */
  private loadToA(name: string, hint: string) {
    const loc = this.getVar(name);
    if (!loc) { this.errors.push(`Undefined variable '${name}' (in: ${hint})`); return; }
    if (loc.kind === 'reg') {
      this.emit(loc.reg === 'X' ? 'TXA' : 'TYA');
    } else {
      this.emit(`LDA ${this.hex2(loc.addr)}`);
    }
  }

  /** Store A into variable */
  private storeFromA(name: string) {
    const loc = this.getVar(name)!;
    if (loc.kind === 'reg') {
      this.emit(loc.reg === 'X' ? 'TAX' : 'TAY');
    } else {
      this.emit(`STA ${this.hex2(loc.addr)}`);
    }
  }

  /** Emit CPX / CPY / LDA+CMP for variable vs literal */
  private emitCmp(varName: string, rhs: number, hint: string) {
    const loc = this.getVar(varName);
    if (!loc) { this.errors.push(`Undefined variable '${varName}' (in: ${hint})`); return; }
    const hexN = `#${this.hex2(rhs)}`;
    if (loc.kind === 'reg') {
      this.emit(loc.reg === 'X' ? `CPX ${hexN}` : `CPY ${hexN}`);
    } else {
      this.emit(`LDA ${this.hex2(loc.addr)}`);
      this.emit(`CMP ${hexN}`);
    }
  }

  /** Branch past body when loop/if condition is FALSE */
  private branchIfFalse(op: string, skipLabel: string) {
    switch (op) {
      case '==': this.emit(`BNE ${skipLabel}`); break;
      case '!=': this.emit(`BEQ ${skipLabel}`); break;
      case '<':  this.emit(`BCS ${skipLabel}`); break; // C=1 → X >= rhs → condition false
      case '>=': this.emit(`BCC ${skipLabel}`); break; // C=0 → X < rhs  → condition false
    }
  }

  // ─── parser ──────────────────────────────────────────────────────────────

  private parseBlock(needBrace: boolean): void {
    while (this.pos < this.lines.length) {
      const line = this.lines[this.pos];
      if (line === '}') {
        if (needBrace) { this.pos++; return; }
        this.errors.push(`Unexpected '}'`);
        this.pos++;
        return;
      }
      this.parseStatement();
    }
    if (needBrace) this.errors.push('Missing closing }');
  }

  private parseStatement(): void {
    const line = this.lines[this.pos++];

    // ── byte x = 5;  or  byte x = 0x05; ──────────────────────────────────
    const decl = line.match(
      /^byte\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(0x[0-9a-fA-F]+|\d+)\s*;$/
    );
    if (decl) {
      const name = decl[1];
      const val = this.parseLit(decl[2]);
      const loc = this.allocVar(name);
      const hexVal = `#${this.hex2(val)}`;
      if (loc.kind === 'reg') {
        this.emit(`LD${loc.reg} ${hexVal}`);
      } else {
        this.emit(`LDA ${hexVal}`);
        this.emit(`STA ${this.hex2(loc.addr)}`);
      }
      return;
    }

    // ── x++; ─────────────────────────────────────────────────────────────
    const inc = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\+\+\s*;$/);
    if (inc) {
      const loc = this.getVar(inc[1]);
      if (!loc) { this.errors.push(`Undefined variable '${inc[1]}'`); return; }
      if (loc.kind === 'reg') {
        this.emit(loc.reg === 'X' ? 'INX' : 'INY');
      } else {
        this.emit(`LDA ${this.hex2(loc.addr)}`);
        this.emit('CLC');
        this.emit('ADC #$01');
        this.emit(`STA ${this.hex2(loc.addr)}`);
      }
      return;
    }

    // ── x--; ─────────────────────────────────────────────────────────────
    const dec = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*--\s*;$/);
    if (dec) {
      const loc = this.getVar(dec[1]);
      if (!loc) { this.errors.push(`Undefined variable '${dec[1]}'`); return; }
      if (loc.kind === 'reg') {
        this.emit(loc.reg === 'X' ? 'DEX' : 'DEY');
      } else {
        this.emit(`LDA ${this.hex2(loc.addr)}`);
        this.emit('SEC');
        this.emit('SBC #$01');
        this.emit(`STA ${this.hex2(loc.addr)}`);
      }
      return;
    }

    // ── mem[addr] = x;  or  mem[addr] = 42; ─────────────────────────────
    const memStore = line.match(
      /^mem\s*\[\s*(0x[0-9a-fA-F]+|\d+)\s*\]\s*=\s*([A-Za-z_][A-Za-z0-9_]*|0x[0-9a-fA-F]+|\d+)\s*;$/
    );
    if (memStore) {
      const addr = parseInt(memStore[1], memStore[1].startsWith('0x') ? 16 : 10);
      const rhs = memStore[2];
      if (/^(0x[0-9a-fA-F]+|\d+)$/.test(rhs)) {
        this.emit(`LDA #${this.hex2(parseInt(rhs, rhs.startsWith('0x') ? 16 : 10))}`);
      } else {
        this.loadToA(rhs, line);
      }
      this.emit(`STA ${this.hex4(addr)}`);
      return;
    }

    // ── x = rhs; ─────────────────────────────────────────────────────────
    const assign = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)\s*;$/);
    if (assign) {
      const name = assign[1];
      const rhs = assign[2].trim();
      if (!this.getVar(name)) {
        this.errors.push(`Undeclared variable '${name}' — use 'byte ${name} = ...' first`);
        return;
      }

      // literal
      const lit = rhs.match(/^(0x[0-9a-fA-F]+|\d+)$/);
      if (lit) {
        const val = this.parseLit(lit[1]);
        const hexVal = `#${this.hex2(val)}`;
        const loc = this.getVar(name)!;
        if (loc.kind === 'reg') { this.emit(`LD${loc.reg} ${hexVal}`); }
        else { this.emit(`LDA ${hexVal}`); this.emit(`STA ${this.hex2(loc.addr)}`); }
        return;
      }

      // variable copy
      const varCopy = rhs.match(/^([A-Za-z_][A-Za-z0-9_]*)$/);
      if (varCopy) {
        this.loadToA(varCopy[1], line);
        this.storeFromA(name);
        return;
      }

      // var +/- literal  (e.g.  x = x + 3)
      const binop = rhs.match(
        /^([A-Za-z_][A-Za-z0-9_]*)\s*([+\-])\s*(0x[0-9a-fA-F]+|\d+)$/
      );
      if (binop) {
        const amount = this.parseLit(binop[3]);
        const hexAmt = `#${this.hex2(amount)}`;
        this.loadToA(binop[1], line);
        if (binop[2] === '+') { this.emit('CLC'); this.emit(`ADC ${hexAmt}`); }
        else                  { this.emit('SEC'); this.emit(`SBC ${hexAmt}`); }
        this.storeFromA(name);
        return;
      }

      this.errors.push(`Unsupported expression: '${rhs}'`);
      return;
    }

    // ── while (x op n) { ─────────────────────────────────────────────────
    const whileStmt = line.match(
      /^while\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*(==|!=|<|>=)\s*(0x[0-9a-fA-F]+|\d+)\s*\)\s*\{$/
    );
    if (whileStmt) {
      const varName = whileStmt[1];
      const op = whileStmt[2];
      const rhs = this.parseLit(whileStmt[3]);
      const loopL = this.newLabel();
      const endL  = this.newLabel();
      this.emit(`${loopL}:`);
      this.emitCmp(varName, rhs, line);
      this.branchIfFalse(op, endL);
      this.parseBlock(true);
      this.emit(`JMP ${loopL}`);
      this.emit(`${endL}:`);
      return;
    }

    // ── if (x op n) { ────────────────────────────────────────────────────
    const ifStmt = line.match(
      /^if\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*(==|!=|<|>=)\s*(0x[0-9a-fA-F]+|\d+)\s*\)\s*\{$/
    );
    if (ifStmt) {
      const varName = ifStmt[1];
      const op = ifStmt[2];
      const rhs = this.parseLit(ifStmt[3]);
      const skipL = this.newLabel();
      this.emitCmp(varName, rhs, line);
      this.branchIfFalse(op, skipL);
      this.parseBlock(true);
      this.emit(`${skipL}:`);
      return;
    }

    this.errors.push(`Unknown statement: '${line}'`);
  }
}

export function compileC(source: string): CompileResult {
  return new Compiler().compile(source);
}
