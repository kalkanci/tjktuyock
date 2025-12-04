
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  language: 'python' | 'dart';
  filename: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, language, filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-gray-700 bg-[#1e1e1e] shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${language === 'python' ? 'bg-blue-500' : 'bg-cyan-500'}`}></div>
          <span className="text-sm text-gray-300 font-mono font-bold">{filename}</span>
        </div>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-gray-700/50 px-2 py-1 rounded"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? 'Kopyalandı' : 'Kopyala'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-xs sm:text-sm font-mono leading-relaxed text-gray-300">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
