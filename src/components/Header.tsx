export default function Header() {
    return (
        <header className="flex items-center gap-3 px-5 py-3 bg-[#0a0c10] border-b border-[#1e2128]">
            <div className="flex items-center gap-2 flex-1">
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
            <a
                href="https://github.com/mcronberg/6502"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-200 transition-colors"
                title="View on GitHub"
            >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
            </a>
        </header>
    );
}
