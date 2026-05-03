import { useEffect, useRef } from 'react';
import type { TraceEntry } from '../emulator/types';
import { toHexWord, toHexByte, formatFlags } from '../emulator/formatting';

type Props = {
    trace: TraceEntry[];
};

export default function ExecutionLog({ trace }: Props) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [trace.length]);

    return (
        <div className="bg-[#0d0f14] flex flex-col h-full min-h-0">
            <div className="px-3 py-1.5 border-b border-[#1e2128] shrink-0">
                <h2 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest">
                    ☰ Execution Log (Trace)
                </h2>
            </div>

            <div className="overflow-auto flex-1">
                {trace.length === 0 ? (
                    <p className="font-mono text-xs text-gray-600 px-3 py-2">
                        No instructions executed yet. Assemble then press Step or Run.
                    </p>
                ) : (
                    <table className="font-mono text-xs w-full border-separate border-spacing-0">
                        <thead className="sticky top-0 bg-[#0d0f14] z-10">
                            <tr className="text-gray-600 border-b border-[#1e2128]">
                                <th className="text-left px-2 py-1 w-12">Step</th>
                                <th className="text-left px-2 py-1 w-16">PC</th>
                                <th className="text-left px-2 py-1 w-36">Instruction</th>
                                <th className="text-right px-2 py-1 w-10">A</th>
                                <th className="text-right px-2 py-1 w-10">X</th>
                                <th className="text-right px-2 py-1 w-10">Y</th>
                                <th className="text-left px-2 py-1 w-20">Flags</th>
                                <th className="text-left px-2 py-1">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trace.map((entry, idx) => {
                                const isLatest = idx === trace.length - 1;
                                return (
                                    <tr
                                        key={entry.step}
                                        className={
                                            isLatest
                                                ? 'bg-green-950/30 text-green-300'
                                                : idx % 2 === 0
                                                    ? 'bg-[#0a0c10] text-gray-400'
                                                    : 'bg-[#0d0f14] text-gray-400'
                                        }
                                    >
                                        <td className="px-2 py-0.5 text-gray-600">
                                            {isLatest && <span className="text-green-500 mr-1">▶</span>}
                                            {String(entry.step).padStart(4, '0')}
                                        </td>
                                        <td className="px-2 py-0.5 text-green-500">{toHexWord(entry.pc)}</td>
                                        <td className="px-2 py-0.5 font-semibold">{entry.instruction}</td>
                                        <td className="px-2 py-0.5 text-right tabular-nums">{toHexByte(entry.A)}</td>
                                        <td className="px-2 py-0.5 text-right tabular-nums">{toHexByte(entry.X)}</td>
                                        <td className="px-2 py-0.5 text-right tabular-nums">{toHexByte(entry.Y)}</td>
                                        <td className="px-2 py-0.5 text-gray-500 tracking-widest">
                                            {formatFlags(entry.flags)}
                                        </td>
                                        <td className="px-2 py-0.5 text-gray-500 truncate max-w-xs">{entry.notes}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
