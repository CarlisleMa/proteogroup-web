'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

function getPageContext(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);

  if (parts[0] === 'methods' && parts[1]) {
    const method = decodeURIComponent(parts[1]);
    return `Tell me about the ${method} proteogroup discovery method`;
  }
  if (parts[0] === 'proteogroups' && parts[1] && parts[2]) {
    const method = decodeURIComponent(parts[1]);
    return `Tell me about ${method} group ${parts[2]}`;
  }
  if (parts[0] === 'proteins' && parts[1]) {
    const protein = decodeURIComponent(parts[1]);
    return `Tell me about the protein ${protein}`;
  }
  if (parts[0] === 'visualize') {
    return 'Explain the proteogroup discovery visualizations';
  }
  if (parts[0] === 'methods') {
    return 'What are the different proteogroup discovery methods?';
  }
  if (parts[0] === 'proteins') {
    return 'How are proteins assigned to proteogroups?';
  }
  return 'What is proteogroup discovery?';
}

export default function LearnFAB() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  // Don't show on the learn page itself
  if (pathname.startsWith('/learn')) return null;

  const context = getPageContext(pathname);
  const href = `/learn?context=${encodeURIComponent(context)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3">
      {/* Tooltip */}
      {isHovered && (
        <div className="bg-slate-900 text-white text-xs rounded-xl px-3.5 py-2.5 max-w-[200px] shadow-xl animate-scale-in">
          <p className="font-semibold mb-0.5">Ask the Learn Agent</p>
          <p className="text-slate-300 text-[10px] leading-tight">{context}</p>
        </div>
      )}

      {/* FAB button */}
      <Link
        href={href}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-13 h-13 bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 rounded-2xl shadow-lg hover:shadow-glow-indigo flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        title="Ask the Learn Agent"
        style={{ width: '52px', height: '52px' }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </Link>
    </div>
  );
}
