import { useState } from 'react';
import type { CpuState, CpuFlags } from '../emulator/types';
import { toHexByte, toHexWord } from '../emulator/formatting';

type Props = {
    cpu: CpuState;
    prevFlags?: CpuFlags;
};

const PRIMARY_FLAGS: (keyof CpuFlags)[] = ['N', 'Z', 'C'];
const ALL_FLAGS: (keyof CpuFlags)[] = ['N', 'V', 'B', 'D', 'I', 'Z', 'C'];

export default function CpuPanel({ cpu, prevFlags }: Props) {
    const flagChanged = (f: keyof CpuFlags) =>
        prevFlags ? cpu.flags[f] !== prevFlags[f] : false;
    const [showChipDetail, setShowChipDetail] = useState(false);

    return (
        <div className="bg-[#0d0f14] border border-[#1e2128] rounded-md p-3 flex flex-col gap-3">
            <h2 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest">
                CPU
            </h2>

            <div>
                <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-1">
                    Registers
                </div>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-1.5">
                        {(['A', 'X', 'Y'] as const).map((reg) => (
                            <RegisterBox key={reg} name={reg} value={cpu[reg]}
                                title={reg === 'A' ? 'Accumulator — main arithmetic register' : `Index register ${reg}`} />
                        ))}
                    </div>
                    <div className="flex flex-col items-center">
                        <ChipVisual onClick={() => setShowChipDetail(true)} />
                    </div>
                    {showChipDetail && <ChipDetailOverlay onClose={() => setShowChipDetail(false)} />}
                    <div className="flex flex-col gap-1.5">
                        <RegisterBox name="PC" value={cpu.PC} wide
                            title="Program Counter — address of the next instruction" />
                        <RegisterBox name="SP" value={cpu.SP} muted
                            title="Stack Pointer — top of stack at $01xx, grows downward" />
                    </div>
                </div>
                <div className="flex gap-3 mt-1 text-[9px] font-mono text-gray-600">
                    <span className="text-green-700">■ A X Y — general purpose</span>
                    <span className="text-gray-600">■ PC — program counter &nbsp; SP — stack pointer</span>
                </div>
            </div>

            <div>
                <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-1">
                    Status Flags
                </div>
                <div className="flex gap-1">
                    {ALL_FLAGS.map((f) => {
                        const set = cpu.flags[f];
                        const changed = flagChanged(f);
                        const isPrimary = PRIMARY_FLAGS.includes(f);

                        let cls = 'border rounded px-1.5 py-0.5 font-mono text-xs font-bold transition-colors ';
                        if (changed && set) {
                            cls += 'bg-green-700 text-green-100 border-green-500';
                        } else if (changed && !set) {
                            cls += 'bg-[#1a1d24] text-gray-400 border-gray-500';
                        } else if (set && isPrimary) {
                            cls += 'bg-green-900/60 text-green-300 border-green-700';
                        } else if (set && !isPrimary) {
                            cls += 'bg-[#1e1f24] text-gray-400 border-gray-600';
                        } else if (!set && isPrimary) {
                            cls += 'bg-[#12141a] text-gray-600 border-[#2a2d35]';
                        } else {
                            cls += 'bg-[#12141a] text-gray-700 border-[#1e2128] opacity-60';
                        }

                        return (
                            <div key={f} className={cls} title={flagTitle(f)}>
                                <div>{f}</div>
                                <div className="text-center text-[10px]">{set ? '1' : '0'}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex gap-3 mt-1 text-[9px] font-mono text-gray-600">
                    <span className="text-green-700">■ N Z C — main flags</span>
                    <span className="text-gray-700">■ V B D I — advanced</span>
                </div>
            </div>
        </div>
    );
}

function RegisterBox({
    name,
    value,
    wide,
    muted,
    title,
}: {
    name: string;
    value: number;
    wide?: boolean;
    muted?: boolean;
    title?: string;
}) {
    const formatted = wide ? toHexWord(value) : toHexByte(value);

    return (
        <div
            title={title}
            className={[
                'flex items-center gap-2 px-2 py-1 rounded border font-mono text-xs',
                muted
                    ? 'border-[#1e2128] text-gray-600 bg-[#0a0c10]'
                    : 'border-green-900 bg-[#0f1a14] text-green-400',
            ].join(' ')}
        >
            <span className={`font-bold w-5 text-right ${muted ? 'text-gray-500' : 'text-green-600'}`}>
                {name}
            </span>
            <span className={muted ? 'text-gray-500' : 'text-green-300'}>{formatted}</span>
        </div>
    );
}

function ChipVisual({ onClick }: { onClick: () => void }) {
    const pins = Array.from({ length: 20 }, (_, i) => i);
    return (
        <div
            className="flex items-stretch h-44 cursor-pointer group"
            onClick={onClick}
            title="Klik for at se pinout"
        >
            {/* Left pins — 20 stk, top→bottom */}
            <div className="flex flex-col justify-around py-1">
                {pins.map((i) => (
                    <div key={i} className="w-2 h-[3px] bg-green-800 rounded-l" />
                ))}
            </div>
            {/* Chip body */}
            <div className="relative border-2 border-green-700 group-hover:border-green-400 rounded-sm w-14 flex flex-col items-center justify-center bg-[#0a1410] shadow-lg shadow-green-950/50 transition-colors">
                {/* IC notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-2.5 border-b-2 border-green-700 rounded-b-full bg-[#060a08]" />
                <div className="text-center">
                    <div className="font-mono text-green-400 text-sm font-bold leading-tight">6502</div>
                    <div className="font-mono text-green-700 text-[9px] leading-tight">MOS</div>
                </div>
                <div className="absolute bottom-1 text-[8px] font-mono text-green-900 group-hover:text-green-700 transition-colors">40 ben</div>
            </div>
            {/* Right pins — 20 stk, top→bottom */}
            <div className="flex flex-col justify-around py-1">
                {pins.map((i) => (
                    <div key={i} className="w-2 h-[3px] bg-green-800 rounded-r" />
                ))}
            </div>
        </div>
    );
}

const LEFT_PINS = [
    { n: 1,  label: 'VSS',  desc: 'Ground (0V)',                                         type: 'gnd'  },
    { n: 2,  label: 'RDY',  desc: 'Ready — hold low to pause CPU between cycles',         type: 'ctrl' },
    { n: 3,  label: 'φ1',   desc: 'Phase 1 clock output',                                type: 'ctrl' },
    { n: 4,  label: '/IRQ', desc: 'Interrupt Request — maskable, active low',             type: 'ctrl' },
    { n: 5,  label: '/ML',  desc: 'Memory Lock — active low during R/W cycles',           type: 'ctrl' },
    { n: 6,  label: '/NMI', desc: 'Non-Maskable Interrupt — active low',                  type: 'ctrl' },
    { n: 7,  label: 'SYNC', desc: 'High during opcode fetch cycle',                       type: 'ctrl' },
    { n: 8,  label: 'VCC',  desc: '+5V power supply',                                    type: 'pwr'  },
    { n: 9,  label: 'A0',   desc: 'Address bus bit 0 (LSB)',                              type: 'addr' },
    { n: 10, label: 'A1',   desc: 'Address bus bit 1',                                   type: 'addr' },
    { n: 11, label: 'A2',   desc: 'Address bus bit 2',                                   type: 'addr' },
    { n: 12, label: 'A3',   desc: 'Address bus bit 3',                                   type: 'addr' },
    { n: 13, label: 'A4',   desc: 'Address bus bit 4',                                   type: 'addr' },
    { n: 14, label: 'A5',   desc: 'Address bus bit 5',                                   type: 'addr' },
    { n: 15, label: 'A6',   desc: 'Address bus bit 6',                                   type: 'addr' },
    { n: 16, label: 'A7',   desc: 'Address bus bit 7',                                   type: 'addr' },
    { n: 17, label: 'A8',   desc: 'Address bus bit 8',                                   type: 'addr' },
    { n: 18, label: 'A9',   desc: 'Address bus bit 9',                                   type: 'addr' },
    { n: 19, label: 'A10',  desc: 'Address bus bit 10',                                  type: 'addr' },
    { n: 20, label: 'A11',  desc: 'Address bus bit 11',                                  type: 'addr' },
];

const RIGHT_PINS = [
    { n: 40, label: '/RES', desc: 'Reset — pull low to reset CPU, jumps to vector $FFFC', type: 'ctrl' },
    { n: 39, label: 'φ2',   desc: 'Phase 2 clock input (main system clock)',              type: 'ctrl' },
    { n: 38, label: 'SO',   desc: 'Set Overflow — forces V flag high on falling edge',    type: 'ctrl' },
    { n: 37, label: 'φ0',   desc: 'Phase 0 clock input (TTL level)',                     type: 'ctrl' },
    { n: 36, label: 'BE',   desc: 'Bus Enable — tristates address/data/R/W when low',    type: 'ctrl' },
    { n: 35, label: 'NC',   desc: 'Not connected',                                       type: 'ctrl' },
    { n: 34, label: 'R/W',  desc: 'Read/Write — high = read, low = write',               type: 'ctrl' },
    { n: 33, label: 'D0',   desc: 'Data bus bit 0 (LSB)',                                type: 'data' },
    { n: 32, label: 'D1',   desc: 'Data bus bit 1',                                      type: 'data' },
    { n: 31, label: 'D2',   desc: 'Data bus bit 2',                                      type: 'data' },
    { n: 30, label: 'D3',   desc: 'Data bus bit 3',                                      type: 'data' },
    { n: 29, label: 'D4',   desc: 'Data bus bit 4',                                      type: 'data' },
    { n: 28, label: 'D5',   desc: 'Data bus bit 5',                                      type: 'data' },
    { n: 27, label: 'D6',   desc: 'Data bus bit 6',                                      type: 'data' },
    { n: 26, label: 'D7',   desc: 'Data bus bit 7 (MSB)',                                type: 'data' },
    { n: 25, label: 'A15',  desc: 'Address bus bit 15 (MSB) — selects 32 KB bank',       type: 'addr' },
    { n: 24, label: 'A14',  desc: 'Address bus bit 14',                                  type: 'addr' },
    { n: 23, label: 'A13',  desc: 'Address bus bit 13',                                  type: 'addr' },
    { n: 22, label: 'A12',  desc: 'Address bus bit 12',                                  type: 'addr' },
    { n: 21, label: 'VSS',  desc: 'Ground (0V)',                                         type: 'gnd'  },
];

function pinColors(type: string) {
    switch (type) {
        case 'pwr':  return { row: 'bg-red-950/40',    label: 'text-red-400',    wire: 'bg-red-700'    };
        case 'gnd':  return { row: 'bg-zinc-900/60',   label: 'text-zinc-400',   wire: 'bg-zinc-600'   };
        case 'addr': return { row: 'bg-blue-950/40',   label: 'text-blue-300',   wire: 'bg-blue-700'   };
        case 'data': return { row: 'bg-amber-950/40',  label: 'text-amber-300',  wire: 'bg-amber-700'  };
        default:     return { row: '',                 label: 'text-green-400',  wire: 'bg-green-700'  };
    }
}

function ChipDetailOverlay({ onClose }: { onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div
                className="bg-[#0a0c10] border border-green-800 rounded-lg p-5 m-4 shadow-2xl shadow-green-950/60 overflow-y-auto max-h-screen"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-green-400 text-sm font-bold">MOS 6502 — DIP-40 Pinout</span>
                        <a
                            href="https://www.westerndesigncenter.com/wdc/documentation/w65c02s.pdf"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-mono text-blue-500 hover:text-blue-300 underline transition-colors"
                        >manual</a>
                        <a
                            href="https://en.wikipedia.org/wiki/MOS_Technology_6502"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-mono text-blue-500 hover:text-blue-300 underline transition-colors"
                        >wikipedia</a>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-6 text-gray-600 hover:text-gray-300 font-mono text-xs border border-[#2a2d35] hover:border-gray-500 px-2 py-0.5 rounded transition-colors"
                    >✕</button>
                </div>
                <div className="flex items-stretch gap-0">
                    {/* Left labels */}
                    <div className="flex flex-col justify-around pr-1" style={{ rowGap: 0 }}>
                        {LEFT_PINS.map(pin => {
                            const c = pinColors(pin.type);
                            return (
                            <div key={pin.n} className={`flex items-center rounded-l px-0.5 ${c.row}`} title={pin.desc}>
                                <span className="text-gray-600 font-mono text-[9px] w-5 text-right">{pin.n}</span>
                                <span className={`font-mono text-[11px] font-bold w-11 text-right pr-1 ${c.label}`}>{pin.label}</span>
                                <div className={`w-3 h-px ${c.wire}`} />
                            </div>
                            );
                        })}
                    </div>
                    {/* Chip body */}
                    <div className="relative border-2 border-green-600 w-20 flex items-center justify-center bg-[#060a08]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-3 border-b-2 border-green-600 rounded-b-full bg-[#040706]" />
                        <div className="text-center">
                            <div className="font-mono text-green-300 text-lg font-bold leading-tight">6502</div>
                            <div className="font-mono text-green-700 text-[9px] leading-tight tracking-widest">MOS 1975</div>
                        </div>
                    </div>
                    {/* Right labels */}
                    <div className="flex flex-col justify-around pl-1" style={{ rowGap: 0 }}>
                        {RIGHT_PINS.map(pin => {
                            const c = pinColors(pin.type);
                            return (
                            <div key={pin.n} className={`flex items-center rounded-r px-0.5 ${c.row}`} title={pin.desc}>
                                <div className={`w-3 h-px ${c.wire}`} />
                                <span className={`font-mono text-[11px] font-bold w-11 pl-1 ${c.label}`}>{pin.label}</span>
                                <span className="text-gray-600 font-mono text-[9px] w-5">{pin.n}</span>
                            </div>
                            );
                        })}
                    </div>
                </div>
                <div className="mt-3 flex flex-col gap-1 text-[9px] font-mono">
                    <div className="flex gap-3">
                        <span className="text-red-400">■ VCC = +5V</span>
                        <span className="text-zinc-400">■ VSS = GND (0V)</span>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-blue-300">■ A0–A15 = 16-bit adressebus</span>
                        <span className="text-amber-300">■ D0–D7 = 8-bit databus</span>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-green-600">■ ctrl = styresignaler</span>
                        <span className="text-gray-600">/ = active low</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function flagTitle(f: keyof CpuFlags): string {
    const titles: Record<keyof CpuFlags, string> = {
        N: 'Negative — set if result bit 7 = 1',
        V: 'Overflow — set on signed overflow',
        B: 'Break — set when BRK is executed',
        D: 'Decimal mode (not used here)',
        I: 'Interrupt disable',
        Z: 'Zero — set if result = 0',
        C: 'Carry — set if result > 255',
    };
    return titles[f];
}
