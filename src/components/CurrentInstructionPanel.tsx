import { useEffect, useRef } from 'react';
import type { AssemblyResult } from '../emulator/types';
import { toHexWord, toHex2 } from '../emulator/formatting';

type Props = {
    pc: number;
    assembled: AssemblyResult | null;
    memory: Uint8Array;
};

export default function CurrentInstructionPanel({ pc, assembled }: Props) {
    const currentRowRef = useRef<HTMLTableRowElement>(null);

    useEffect(() => {
        currentRowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [pc]);

    if (!assembled || assembled.instructions.length === 0) {
        return (
            <div className="flex-1 bg-[#0d0f14] border-t border-[#1e2128] flex flex-col p-3 gap-1">
                <h2 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Program Listing
                </h2>
                <p className="font-mono text-xs text-gray-600 mt-1">Not assembled yet. Press Assemble.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[#0d0f14] border-t border-[#1e2128] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1e2128] shrink-0">
                <h2 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Program Listing
                </h2>
                <span className="font-mono text-[10px] text-gray-600">
                    {assembled.instructions.length} instr · {assembled.programSize}B
                </span>
            </div>

            <div className="grid grid-cols-2 px-2 py-0.5 border-b border-[#1e2128] bg-[#0a0c10] shrink-0">
                <span className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">Assembly</span>
                <span className="font-mono text-[10px] text-gray-600 uppercase tracking-widest pl-2 border-l border-[#1e2128]">Bytes</span>
            </div>

            <div className="overflow-y-auto">
                <table className="w-full border-separate border-spacing-0 font-mono text-xs">
                    <tbody>
                        {assembled.instructions.map((instr) => {
                            const isCurrent = instr.address === pc;
                            return (
                                <tr
                                    key={instr.address}
                                    ref={isCurrent ? currentRowRef : undefined}
                                    className={isCurrent ? 'bg-green-950/50' : 'hover:bg-[#0f1117]'}
                                >
                                    <td className="px-2 py-0.5 w-1/2">
                                        <span className={isCurrent ? 'text-green-600' : 'text-transparent'}>▶</span>
                                        <span className={`ml-1 ${isCurrent ? 'text-green-500' : 'text-gray-700'}`}>
                                            {toHexWord(instr.address)}
                                        </span>
                                        <span className={`ml-2 font-semibold ${isCurrent ? 'text-green-300' : 'text-gray-300'}`}>
                                            {instr.mnemonic}
                                        </span>
                                        {instr.operand && (
                                            <span className={`ml-1 ${isCurrent ? 'text-green-400' : 'text-gray-500'}`}>
                                                {instr.operand}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-2 py-0.5 w-1/2 border-l border-[#1e2128]">
                                        <span className={isCurrent ? 'text-green-600' : 'text-gray-700'}>
                                            {instr.bytes.map(toHex2).join(' ')}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
