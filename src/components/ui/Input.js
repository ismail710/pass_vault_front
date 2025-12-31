'use client';

export default function Input({ 
  label, 
  className = '', 
  required,
  ...props 
}) {
  return (
    <div>
      {label && (
        <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
          {label}{required && ' *'}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 ${className}`}
        required={required}
        {...props}
      />
    </div>
  );
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
          {label}
        </label>
      )}
      <select
        className={`w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function Textarea({ label, className = '', ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 resize-none ${className}`}
        {...props}
      />
    </div>
  );
}
