type Props = {
    source: string;
    onChange: (src: string) => void;
    currentSourceLine: number | null;
    programSize: number;
    entryPoint: number;
    errors: string[];
    editorMode: 'asm' | 'c';
    onSetMode: (mode: 'asm' | 'c') => void;
    generatedAsm: string;
};

export default function AssemblyEditor({
    source,
    onChange,
    currentSourceLine,
    programSize,
    entryPoint,
    errors,
    editorMode,
    onSetMode,
    generatedAsm,
}: Props) {
    const lines = source.split('\n');

    return (
        <div className="flex flex-col flex-1 bg-[#0d0f14] min-w-0">
            {/* Panel header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1e2128]">
                <h2 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {editorMode === 'asm' ? <>&lt;/&gt; Assembly Editor</> : <>&#123;&#125; C Editor</>}
                </h2>
                <div className="flex rounded overflow-hidden border border-[#2a2d35]">
                    <button
                        onClick={() => onSetMode('asm')}
                        className={`px-2.5 py-0.5 font-mono text-[10px] font-bold transition-colors ${
                            editorMode === 'asm'
                                ? 'bg-green-900/60 text-green-300'
                                : 'bg-[#1a1d24] text-gray-500 hover:text-gray-300'
                        }`}
                    >ASM</button>
                    <button
                        onClick={() => onSetMode('c')}
                        className={`px-2.5 py-0.5 font-mono text-[10px] font-bold border-l border-[#2a2d35] transition-colors ${
                            editorMode === 'c'
                                ? 'bg-amber-900/60 text-amber-300'
                                : 'bg-[#1a1d24] text-gray-500 hover:text-gray-300'
                        }`}
                    >C</button>
                </div>
            </div>

            {/* Error banner */}
            {errors.length > 0 && (
                <div className="px-3 py-2 bg-red-950/60 border-b border-red-800">
                    {errors.map((e, i) => (
                        <p key={i} className="font-mono text-xs text-red-400">
                            ✕ {e}
                        </p>
                    ))}
                </div>
            )}

            {/* Editor: line numbers + textarea overlay */}
            <div className="flex flex-1 overflow-auto font-mono text-xs leading-5 relative">
                {/* Line numbers */}
                <div
                    className="select-none text-right pr-3 pt-2 pb-2 text-gray-600 bg-[#0a0c10] border-r border-[#1e2128] min-w-[2.5rem]"
                    aria-hidden="true"
                >
                    {lines.map((_, i) => (
                        <div
                            key={i}
                            className={`px-2 ${currentSourceLine === i ? 'text-green-500' : ''}`}
                        >
                            {i + 1}
                        </div>
                    ))}
                </div>

                {/* Highlight layer behind the textarea */}
                <div className="absolute left-[2.5rem] right-0 top-0 pointer-events-none pt-2 pb-2">
                    {lines.map((_, i) => (
                        <div
                            key={i}
                            className={`leading-5 ${currentSourceLine === i
                                    ? 'bg-green-950/50 border-l-2 border-green-600'
                                    : ''
                                }`}
                        >
                            &nbsp;
                        </div>
                    ))}
                </div>

                {/* Actual textarea */}
                <textarea
                    value={source}
                    onChange={(e) => onChange(e.target.value)}
                    spellCheck={false}
                    className="
            flex-1 bg-transparent text-gray-200 resize-none outline-none
            pt-2 pb-2 pl-3 pr-3
            caret-green-400
            z-10 relative
          "
                    style={{ lineHeight: '1.25rem', minHeight: '100%' }}
                />
            </div>

            {/* Generated ASM panel — only in C mode after compiling */}
            {editorMode === 'c' && generatedAsm && (
                <div className="border-t border-[#1e2128] flex flex-col max-h-48">
                    <div className="px-3 py-1 border-b border-[#1e2128] flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                            ↓ Generated Assembly
                        </span>
                    </div>
                    <pre className="font-mono text-xs text-gray-300 p-3 overflow-auto bg-[#0a0c10] leading-5">
                        {generatedAsm}
                    </pre>
                </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-center px-3 py-1.5 border-t border-[#1e2128] text-xs font-mono text-gray-500">
                <span>
                    Entry Point: <span className="text-green-400">${entryPoint.toString(16).toUpperCase().padStart(4, '0')}</span>
                </span>
                <span>
                    {programSize > 0 ? (
                        <span className="text-green-400">{programSize} bytes</span>
                    ) : (
                        <span className="text-gray-600">not assembled</span>
                    )}
                </span>
            </div>
        </div>
    );
}
