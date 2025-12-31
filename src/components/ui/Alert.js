'use client';

export default function Alert({ type = 'success', message, onClose }) {
  if (!message) return null;
  
  const styles = {
    success: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    error: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <div className={`mb-6 p-4 rounded-lg flex justify-between items-center ${styles[type]}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="hover:opacity-70">✕</button>
      )}
    </div>
  );
}
