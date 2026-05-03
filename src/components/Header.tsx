export default function Header() {
    return (
        <header className="flex items-center gap-3 px-5 py-3 bg-[#0a0c10] border-b border-[#1e2128]">
            <div className="flex items-center gap-2">
                {/* Chip icon */}
                <div className="relative w-9 h-9 border-2 border-green-500 rounded flex items-center justify-center text-green-400 font-bold text-xs leading-none select-none">
                    <span className="text-[9px] font-mono leading-none text-center">65<br />02</span>
                    {/* Pin marks */}
                    <span className="absolute -left-[3px] top-1.5 w-[3px] h-[3px] bg-green-600 rounded-full" />
                    <span className="absolute -left-[3px] top-3.5 w-[3px] h-[3px] bg-green-600 rounded-full" />
                    <span className="absolute -right-[3px] top-1.5 w-[3px] h-[3px] bg-green-600 rounded-full" />
                    <span className="absolute -right-[3px] top-3.5 w-[3px] h-[3px] bg-green-600 rounded-full" />
                </div>
                <h1 className="font-mono text-xl font-bold tracking-widest text-green-400 uppercase">
                    6502 <span className="text-gray-300">CPU Simulator</span>
                </h1>
            </div>
        </header>
    );
}
