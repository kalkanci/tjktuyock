
import React, { useEffect, useRef } from 'react';
import { AgentLog } from '../types';
import { Terminal } from 'lucide-react';

interface TerminalLogProps {
  logs: AgentLog[];
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-black border border-green-900/50 rounded-lg p-4 font-mono text-xs h-64 overflow-y-auto shadow-[0_0_15px_rgba(0,255,0,0.1)] relative">
      <div className="absolute top-2 right-2 opacity-50">
        <Terminal className="text-green-500" size={16} />
      </div>
      <div className="space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 animate-fade-in">
            <span className="text-gray-500">[{log.timestamp}]</span>
            <span className={`
              ${log.type === 'success' ? 'text-green-400 font-bold' : ''}
              ${log.type === 'warning' ? 'text-yellow-400' : ''}
              ${log.type === 'info' ? 'text-blue-300' : ''}
            `}>
              {">"} {log.message}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-gray-600 italic">Ajan bekleniyor... (API Key girin ve başlatın)</div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
