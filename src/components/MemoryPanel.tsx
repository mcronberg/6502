import { toHexWord, toHex2 } from '../emulator/formatting';

const CODE_START = 0x0600;
const DATA_START = 0x0200;
const ROWS = 4;

type Props = {
    memory: Uint8Array;
    pc: number;
    lastWrittenAddress?: number;
};

export default function MemoryPanel({ memory, pc, lastWrittenAddress }: Props) {
    return (
        <div className="bg-[#0d0f14] border border-[#1e2128] rounded-md p-3 flex flex-col gap-2">
            <h2 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest">
                Memory
            </h2>

            <div className="overflow-x-auto">
                <table className="font-mono text-xs w-full border-separate border-spacing-0">
                    <thead>
                        <tr className="text-gray-600">
                            <th className="text-left px-2 py-0.5 w-20">Region</th>
                            <th className="text-right px-2 py-0.5 w-16">Address</th>
                            {['+0', '+1', '+2', '+3', '+4', '+5', '+6', '+7'].map((h) => (
                                <th key={h} className="text-center px-1 py-0.5 w-7">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <RegionRows
                            label="Code"
                            regionStart={CODE_START}
                            memory={memory}
                            pc={pc}
                            lastWrittenAddress={lastWrittenAddress}
                            borderColor="border-green-900"
                            labelColor="text-green-700"
                            rows={ROWS}
                        />
                        <RegionRows
                            label="Data"
                            regionStart={DATA_START}
                            memory={memory}
                            pc={pc}
                            lastWrittenAddress={lastWrittenAddress}
                            borderColor="border-amber-900"
                            labelColor="text-amber-700"
                            rows={ROWS}
                        />
                    </tbody>
                </table>
            </div>

            <div className="flex flex-wrap gap-3 text-[10px] font-mono text-gray-600 border-t border-[#1e2128] pt-2">
                <LegendItem color="bg-green-900/60 border-green-700" label="PC / current instruction" />
                <LegendItem color="bg-amber-900/60 border-amber-700" label="Last written" />
                <LegendItem color="border-l-2 border-green-800" label="Code region" />
                <LegendItem color="border-l-2 border-amber-800" label="Data region" />
            </div>
        </div>
    );
}

function RegionRows({
    label,
    regionStart,
    memory,
    pc,
    lastWrittenAddress,
    borderColor,
    labelColor,
    rows,
}: {
    label: string;
    regionStart: number;
    memory: Uint8Array;
    pc: number;
    lastWrittenAddress?: number;
    borderColor: string;
    labelColor: string;
    rows: number;
}) {
    return (
        <>
            {Array.from({ length: rows }, (_, rowIdx) => {
                const rowAddr = regionStart + rowIdx * 8;
                const isFirstRow = rowIdx === 0;
                return (
                    <tr key={rowAddr} className={`border-l-2 ${borderColor}`}>
                        <td
                            className={`px-2 py-0.5 ${labelColor} font-semibold align-top`}
                            rowSpan={isFirstRow ? rows : undefined}
                            style={{ display: isFirstRow ? undefined : 'none' }}
                        >
                            {isFirstRow ? (
                                <>
                                    {label}
                                    <br />
                                    <span className="text-gray-600 font-normal">
                                        ({toHexWord(regionStart)})
                                    </span>
                                </>
                            ) : null}
                        </td>

                        <td className="text-right px-2 py-0.5 text-gray-500">
                            {pc >= rowAddr && pc < rowAddr + 8 ? (
                                <span className="text-green-500 mr-1">▶</span>
                            ) : null}
                            {toHexWord(rowAddr)}
                        </td>

                        {Array.from({ length: 8 }, (_, col) => {
                            const addr = rowAddr + col;
                            const byte = memory[addr] ?? 0;
                            const isPC = addr === pc;
                            const isLastWritten = addr === lastWrittenAddress;

                            let cellCls = 'text-center px-1 py-0.5 rounded transition-colors ';
                            if (isPC) {
                                cellCls += 'bg-green-900/70 text-green-200 font-bold';
                            } else if (isLastWritten) {
                                cellCls += 'bg-amber-900/60 text-amber-300 font-bold';
                            } else if (byte === 0) {
                                cellCls += 'text-gray-700';
                            } else {
                                cellCls += 'text-gray-300';
                            }

                            return (
                                <td key={col} className={cellCls}>
                                    {toHex2(byte)}
                                </td>
                            );
                        })}
                    </tr>
                );
            })}
        </>
    );
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <span className="flex items-center gap-1.5">
            <span className={`inline-block w-3 h-3 border ${color} rounded-sm`} />
            {label}
        </span>
    );
}
