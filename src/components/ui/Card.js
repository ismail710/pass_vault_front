'use client';

export default function Card({ children, className = '', ...props }) {
  return (
    <div 
      className={`rounded-xl border border-zinc-200 dark:border-zinc-800 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}
