import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ShieldCheck } from 'lucide-react';

interface TerminalLogsProps {
  logs: string[];
  onComplete?: () => void;
  speedMs?: number;
}

export const TerminalLogs: React.FC<TerminalLogsProps> = ({ 
  logs, 
  onComplete, 
  speedMs = 1200 
}) => {
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentIndex < logs.length) {
      const timer = setTimeout(() => {
        setDisplayedLogs(prev => [...prev, logs[currentIndex]]);
        setCurrentIndex(prev => prev + 1);
      }, speedMs);
      return () => clearTimeout(timer);
    } else if (currentIndex === logs.length && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, logs, speedMs, onComplete]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedLogs]);

  return (
    <div className="w-full max-w-3xl mx-auto rounded-xl border border-cyberCyan/20 bg-black/95 shadow-glow overflow-hidden font-mono text-left">
      {/* Terminal Header */}
      <div className="bg-darkCard px-4 py-2 flex items-center justify-between border-b border-cyberCyan/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">
          <Terminal className="h-3 w-3 text-cyberCyan" />
          Somnia AI Agent Logs
        </div>
        <div className="w-10"></div>
      </div>

      {/* Terminal Screen */}
      <div 
        ref={containerRef}
        className="p-5 h-72 overflow-y-auto space-y-2.5 text-sm leading-relaxed scroll-smooth"
      >
        {displayedLogs.map((log, index) => {
          const isDone = log.includes("completed successfully") || log.includes("complete. Scoring Dashboard updated");
          return (
            <div key={index} className="flex items-start gap-2">
              <span className="text-cyberBlue shrink-0 font-bold select-none">&gt;&gt;</span>
              <span className={isDone ? "text-successGreen font-semibold flex items-center gap-2" : "text-gray-300"}>
                {log}
                {isDone && <ShieldCheck className="h-4 w-4 animate-bounce" />}
              </span>
            </div>
          );
        })}

        {currentIndex < logs.length && (
          <div className="flex items-center gap-2 text-cyberCyan animate-pulse">
            <span className="text-cyberBlue shrink-0 font-bold select-none">&gt;&gt;</span>
            <span className="terminal-cursor">Processing agent task...</span>
          </div>
        )}
      </div>
    </div>
  );
};
