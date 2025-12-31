'use client';

import Link from 'next/link';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">PassVault</span>
    </div>
  );
}

export default function Header({ children }) {
  return (
    <header className="w-full border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {children}
        </div>
      </div>
    </header>
  );
}
