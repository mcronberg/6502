import { EXAMPLE_PROGRAMS } from '../emulator/examples';

type Props = {
    selectedId: string;
    onSelect: (id: string) => void;
};

export default function ExampleSidebar({ selectedId, onSelect }: Props) {
    return (
        <aside className="flex flex-col gap-2 p-3 bg-[#0d0f14] border-r border-[#1e2128] overflow-y-auto w-48 shrink-0">
            <h2 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                &lt;/&gt; Example Programs
            </h2>

            {EXAMPLE_PROGRAMS.map((prog) => {
                const isSelected = prog.id === selectedId;
                return (
                    <button
                        key={prog.id}
                        onClick={() => onSelect(prog.id)}
                        className={[
                            'relative text-left p-2.5 rounded border transition-colors',
                            isSelected
                                ? 'border-green-600 bg-green-950/40 text-green-300'
                                : 'border-[#2a2d35] bg-[#12141a] text-gray-300 hover:border-[#3a4040] hover:bg-[#161820]',
                        ].join(' ')}
                    >
                        <div className="flex items-start gap-2">
                            <span className="text-base leading-none mt-0.5 w-5 shrink-0 text-center">
                                {prog.icon}
                            </span>
                            <div>
                                <div className="font-mono text-xs font-semibold leading-tight">
                                    {prog.title}
                                </div>
                                <div className="font-mono text-[10px] text-gray-500 mt-0.5 leading-snug">
                                    {prog.description}
                                </div>
                            </div>
                        </div>

                        {prog.comingSoon && (
                            <span className="absolute top-1.5 right-1.5 text-[9px] font-mono bg-amber-900/60 text-amber-400 border border-amber-700 px-1 py-0.5 rounded">
                                SOON
                            </span>
                        )}
                    </button>
                );
            })}

            {/* Tip box */}
            <div className="mt-auto pt-3 border-t border-[#1e2128]">
                <p className="font-mono text-[10px] text-gray-500 leading-relaxed">
                    <span className="text-green-600">⚡</span> Tip: Load an example,
                    assemble it, then step through each instruction to see how the CPU
                    works.
                </p>
            </div>
        </aside>
    );
}
