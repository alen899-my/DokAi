import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const bgColors = {
    success: 'bg-green-400',
    error: 'bg-red-400',
    info: 'bg-blue-400'
  };

  const icons = {
    success: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    ),
    error: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    )
  };

  return (
    <div className="fixed bottom-6 right-6 z-[120] animate-in slide-in-from-bottom-8 fade-in duration-200">
      <div className={`flex items-center gap-4 px-5 py-4 border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${bgColors[type]} text-black`}>
        <div className="shrink-0 bg-white border-2 border-black p-1.5 rounded-full shadow-[2px_2px_0px_0px_#000]">
          {icons[type]}
        </div>
        <p className="font-black text-[13px] tracking-wide uppercase">{message}</p>
        <button 
          onClick={onClose} 
          className="ml-4 shrink-0 hover:scale-110 transition-transform outline-none focus:ring-2 focus:ring-black bg-black text-white p-1 rounded-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}
