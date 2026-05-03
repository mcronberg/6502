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
                        <ChipVisual />
                    </div>
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

function ChipVisual() {
    return (
        <div className="relative border-2 border-green-700 rounded-lg w-20 h-16 flex items-center justify-center bg-[#0a1410] shadow-lg shadow-green-950/50">
            <div className="absolute -top-[5px] left-3 right-3 flex justify-around">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="w-[3px] h-[5px] bg-green-800" />
                ))}
            </div>
            <div className="absolute -bottom-[5px] left-3 right-3 flex justify-around">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="w-[3px] h-[5px] bg-green-800" />
                ))}
            </div>
            <div className="text-center">
                <div className="font-mono text-green-400 text-sm font-bold leading-tight">6502</div>
                <div className="font-mono text-green-700 text-[9px] leading-tight">CPU</div>
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
