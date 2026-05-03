import type { RunStatus } from '../emulator/types';
import { EXAMPLE_PROGRAMS } from '../emulator/examples';

type Props = {
    selectedExampleId: string;
    onSelectExample: (id: string) => void;
    onLoad: () => void;
    onAssemble: () => void;
    onStep: () => void;
    onRun: () => void;
    onReset: () => void;
    onClear: () => void;
    runStatus: RunStatus;
    isAssembled: boolean;
};

const STATUS_STYLES: Record<RunStatus, string> = {
    stopped: 'bg-amber-900/60 text-amber-300 border-amber-600',
    running: 'bg-green-900/60 text-green-300 border-green-600',
    finished: 'bg-blue-900/60  text-blue-300  border-blue-600',
    error: 'bg-red-900/60   text-red-300   border-red-600',
};

const STATUS_LABELS: Record<RunStatus, string> = {
    stopped: '■ Stopped',
    running: '▶ Running',
    finished: '✓ Finished',
    error: '✕ Error',
};

export default function Toolbar({
    selectedExampleId,
    onSelectExample,
    onLoad,
    onAssemble,
    onStep,
    onRun,
    onReset,
    onClear,
    runStatus,
    isAssembled,
}: Props) {
    const isRunning = runStatus === 'running';

    return (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-[#0d0f14] border-b border-[#1e2128]">
            {/* Example selector */}
            <select
                className="bg-[#1a1d24] border border-[#2a2d35] text-gray-200 font-mono text-xs px-2 py-1.5 rounded focus:outline-none focus:border-green-600"
                value={selectedExampleId}
                onChange={(e) => onSelectExample(e.target.value)}
            >
                {EXAMPLE_PROGRAMS.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                ))}
            </select>

            <button
                onClick={onLoad}
                disabled={isRunning}
                className="toolbar-btn bg-[#1a1d24] border-[#3a3d45] text-gray-200 hover:border-green-600 hover:text-green-300"
            >
                ⬇ Load
            </button>

            <div className="h-5 w-px bg-[#2a2d35] mx-1" />

            <button
                onClick={onAssemble}
                disabled={isRunning}
                className="toolbar-btn bg-[#1a1d24] border-[#3a3d45] text-gray-200 hover:border-green-600 hover:text-green-300"
            >
                ⚙ Assemble
            </button>

            <button
                onClick={onStep}
                disabled={isRunning || !isAssembled}
                className="toolbar-btn bg-[#1a1d24] border-[#3a3d45] text-gray-200 hover:border-green-600 hover:text-green-300 disabled:opacity-40"
            >
                ▶▌Step
            </button>

            <button
                onClick={onRun}
                disabled={isRunning || !isAssembled}
                className="toolbar-btn bg-green-900/40 border-green-700 text-green-300 hover:bg-green-800/50 disabled:opacity-40"
            >
                ▶ Run
            </button>

            <button
                onClick={onReset}
                disabled={!isAssembled}
                className="toolbar-btn bg-[#1a1d24] border-[#3a3d45] text-gray-200 hover:border-amber-500 hover:text-amber-300 disabled:opacity-40"
                title="Restart from the beginning (keeps assembled code)"
            >
                ↺ Reset
            </button>

            <div className="h-5 w-px bg-[#2a2d35] mx-1" />

            <button
                onClick={onClear}
                disabled={isRunning}
                className="toolbar-btn bg-[#1a1d24] border-[#3a3d45] text-gray-500 hover:border-red-700 hover:text-red-400"
                title="Clear everything — source, bytes, trace"
            >
                ✕ Clear
            </button>

            {/* Status pill */}
            <div className={`ml-auto font-mono text-xs px-3 py-1 rounded border font-semibold ${STATUS_STYLES[runStatus]}`}>
                {STATUS_LABELS[runStatus]}
            </div>
        </div>
    );
}
