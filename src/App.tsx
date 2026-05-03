import { useState, useRef, useCallback, useEffect } from 'react';

import type { CpuState, CpuFlags, TraceEntry, RunStatus, AssemblyResult } from './emulator/types';
import { EXAMPLE_PROGRAMS } from './emulator/examples';
import { assemble } from './emulator/assembler';
import { initialCpuState, loadProgram, stepCpu, CODE_START } from './emulator/cpu';

import Header from './components/Header';
import Toolbar from './components/Toolbar';
import AssemblyEditor from './components/AssemblyEditor';
import CpuPanel from './components/CpuPanel';
import CurrentInstructionPanel from './components/CurrentInstructionPanel';
import MemoryPanel from './components/MemoryPanel';
import ExecutionLog from './components/ExecutionLog';
import StatusFooter from './components/StatusFooter';

const RUN_INTERVAL_MS = 200;
const RUN_SAFETY_LIMIT = 10_000;

function freshMemory(): Uint8Array {
    return new Uint8Array(65536);
}

export default function App() {
    const [selectedExampleId, setSelectedExampleId] = useState(EXAMPLE_PROGRAMS[0].id);
    const [source, setSource] = useState('');

    const [assembled, setAssembled] = useState<AssemblyResult | null>(null);
    const [assembleErrors, setAssembleErrors] = useState<string[]>([]);

    const [cpu, setCpu] = useState<CpuState>(initialCpuState());
    const [prevFlags, setPrevFlags] = useState<CpuFlags | undefined>(undefined);
    const [memory, setMemory] = useState<Uint8Array>(freshMemory());
    const [lastWrittenAddress, setLastWrittenAddress] = useState<number | undefined>(undefined);

    const [trace, setTrace] = useState<TraceEntry[]>([]);
    const stepCounterRef = useRef(1);

    const [runStatus, setRunStatus] = useState<RunStatus>('stopped');
    const runIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const cpuRef = useRef(cpu);
    const memoryRef = useRef(memory);
    const assembledRef = useRef(assembled);
    cpuRef.current = cpu;
    memoryRef.current = memory;
    assembledRef.current = assembled;

    const stopRunLoop = useCallback(() => {
        if (runIntervalRef.current !== null) {
            clearInterval(runIntervalRef.current);
            runIntervalRef.current = null;
        }
    }, []);

    const doStep = useCallback((
        currentCpu: CpuState,
        currentMemory: Uint8Array,
        currentAssembled: AssemblyResult
    ): CpuState => {
        const result = stepCpu(
            currentCpu,
            currentMemory,
            stepCounterRef.current,
            currentAssembled
        );
        if (!result) return currentCpu;

        stepCounterRef.current += 1;

        setPrevFlags(currentCpu.flags);
        setCpu(result.cpu);
        if (result.memory !== currentMemory) {
            setMemory(result.memory);
            memoryRef.current = result.memory;
        }
        setLastWrittenAddress(result.lastWrittenAddress);
        setTrace((t) => [...t, result.trace]);

        return result.cpu;
    }, []);

    const handleSelectExample = (id: string) => {
        setSelectedExampleId(id);
    };

    const handleLoad = useCallback(() => {
        const prog = EXAMPLE_PROGRAMS.find((p) => p.id === selectedExampleId);
        if (!prog) return;
        stopRunLoop();
        setSource(prog.source);
        setAssembleErrors([]);
        setAssembled(null);
        assembledRef.current = null;
        const fresh = initialCpuState();
        setCpu(fresh);
        cpuRef.current = fresh;
        setPrevFlags(undefined);
        const freshMem = freshMemory();
        setMemory(freshMem);
        memoryRef.current = freshMem;
        setTrace([]);
        stepCounterRef.current = 1;
        setLastWrittenAddress(undefined);
        setRunStatus('stopped');
    }, [selectedExampleId, stopRunLoop]);

    const handleClear = useCallback(() => {
        stopRunLoop();
        setSource('');
        setAssembleErrors([]);
        setAssembled(null);
        assembledRef.current = null;
        const fresh = initialCpuState();
        setCpu(fresh);
        cpuRef.current = fresh;
        setPrevFlags(undefined);
        const freshMem = freshMemory();
        setMemory(freshMem);
        memoryRef.current = freshMem;
        setTrace([]);
        stepCounterRef.current = 1;
        setLastWrittenAddress(undefined);
        setRunStatus('stopped');
    }, [stopRunLoop]);

    const handleAssemble = useCallback(() => {
        stopRunLoop();
        const result = assemble(source);
        setAssembleErrors(result.errors);
        if (result.errors.length > 0) {
            setRunStatus('error');
            return;
        }
        const mem = loadProgram(freshMemory(), result);
        setAssembled(result);
        assembledRef.current = result;
        setMemory(mem);
        memoryRef.current = mem;
        const fresh = initialCpuState();
        setCpu(fresh);
        cpuRef.current = fresh;
        setTrace([]);
        stepCounterRef.current = 1;
        setLastWrittenAddress(undefined);
        setRunStatus('stopped');
    }, [source, stopRunLoop]);

    const handleStep = useCallback(() => {
        if (!assembledRef.current) return;
        if (cpuRef.current.stopped) return;
        const nextCpu = doStep(cpuRef.current, memoryRef.current, assembledRef.current);
        if (nextCpu.stopped) {
            setRunStatus('finished');
        }
    }, [doStep]);

    const handleRun = useCallback(() => {
        if (!assembledRef.current) return;
        if (cpuRef.current.stopped) return;
        setRunStatus('running');

        let safetyCount = 0;
        runIntervalRef.current = setInterval(() => {
            safetyCount++;
            if (safetyCount > RUN_SAFETY_LIMIT) {
                stopRunLoop();
                setRunStatus('stopped');
                return;
            }
            const nextCpu = doStep(cpuRef.current, memoryRef.current, assembledRef.current!);
            if (nextCpu.stopped) {
                stopRunLoop();
                setRunStatus('finished');
            }
        }, RUN_INTERVAL_MS);
    }, [doStep, stopRunLoop]);

    const handleReset = useCallback(() => {
        stopRunLoop();
        const fresh = initialCpuState();
        setCpu(fresh);
        cpuRef.current = fresh;
        setPrevFlags(undefined);
        setTrace([]);
        stepCounterRef.current = 1;
        setLastWrittenAddress(undefined);
        setRunStatus('stopped');
        if (assembledRef.current) {
            const mem = loadProgram(freshMemory(), assembledRef.current);
            setMemory(mem);
            memoryRef.current = mem;
        }
    }, [stopRunLoop]);

    useEffect(() => () => stopRunLoop(), [stopRunLoop]);

    const currentSourceLine = assembled
        ? (assembled.addressToSourceLine[cpu.PC] ?? null)
        : null;

    return (
        <div className="h-screen flex flex-col bg-[#0f1117] text-gray-200 overflow-hidden">
            <Header />
            <Toolbar
                selectedExampleId={selectedExampleId}
                onSelectExample={handleSelectExample}
                onLoad={handleLoad}
                onAssemble={handleAssemble}
                onStep={handleStep}
                onRun={handleRun}
                onReset={handleReset}
                onClear={handleClear}
                runStatus={runStatus}
                isAssembled={assembled !== null && assembleErrors.length === 0}
            />

            <div className="flex flex-1 min-h-0">
                <div className="flex flex-col flex-[2] min-w-0 min-h-0 border-r border-[#1e2128]">
                    <div className="flex-[3] min-h-0 flex flex-col overflow-hidden">
                        <AssemblyEditor
                            source={source}
                            onChange={setSource}
                            currentSourceLine={currentSourceLine}
                            programSize={assembled?.programSize ?? 0}
                            entryPoint={CODE_START}
                            errors={assembleErrors}
                        />
                    </div>
                    <div className="flex-[2] min-h-0 flex flex-col overflow-hidden">
                        <CurrentInstructionPanel
                            pc={cpu.PC}
                            assembled={assembled}
                            memory={memory}
                        />
                    </div>
                </div>

                <div className="flex flex-[5] min-w-0 min-h-0">
                    <div className="flex flex-col flex-[2] min-w-0 overflow-y-auto border-r border-[#1e2128] gap-2 p-2">
                        <CpuPanel cpu={cpu} prevFlags={prevFlags} />
                        <MemoryPanel
                            memory={memory}
                            pc={cpu.PC}
                            lastWrittenAddress={lastWrittenAddress}
                        />
                    </div>

                    <div className="flex flex-col flex-[3] min-w-0 min-h-0">
                        <ExecutionLog trace={trace} />
                    </div>
                </div>
            </div>

            <StatusFooter />
        </div>
    );
}
