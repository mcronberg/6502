export default function StatusFooter() {
    return (
        <footer className="px-4 py-1.5 bg-[#0a0c10] border-t border-[#1e2128] flex items-center justify-between">
            <p className="font-mono text-[10px] text-gray-600">
                🎓 <span className="text-gray-500">Educational mode:</span> Step through
                one instruction at a time.
            </p>
            <button
                className="font-mono text-[10px] text-gray-600 hover:text-gray-400 border border-[#1e2128] rounded px-2 py-0.5"
                title="About this simulator"
                aria-label="Help"
            >
                ?
            </button>
        </footer>
    );
}
