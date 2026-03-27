'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { label: 'Dashboard', href: '/' },
  { label: 'Methods', href: '/methods' },
  { label: 'Proteins', href: '/proteins' },
  { label: 'Visualize', href: '/visualize' },
  { label: 'Learn', href: '/learn' },
  { label: 'Review', href: '/review' },
] as const;

export default function Navbar() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm group-hover:shadow-glow-blue transition-shadow duration-300">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="5" cy="5" r="2.5" fill="white" opacity="0.9" />
                <circle cx="11" cy="5" r="2.5" fill="white" opacity="0.7" />
                <circle cx="8" cy="11" r="2.5" fill="white" opacity="0.8" />
                <line x1="5" y1="5" x2="11" y2="5" stroke="white" strokeWidth="1" opacity="0.4" />
                <line x1="5" y1="5" x2="8" y2="11" stroke="white" strokeWidth="1" opacity="0.4" />
                <line x1="11" y1="5" x2="8" y2="11" stroke="white" strokeWidth="1" opacity="0.4" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-gradient">
              Proteogroup
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-0.5">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(href)
                    ? 'text-blue-700 bg-blue-50/80 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
