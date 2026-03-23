import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_#000] max-w-sm w-full relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-yellow-300 border-b-[3px] border-black p-4 flex justify-between items-center">
          <h3 className="font-black text-lg tracking-tight uppercase flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {title}
          </h3>
          <button 
            onClick={onCancel}
            className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-y-px hover:-translate-x-px active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="font-bold text-black/80 text-sm leading-relaxed mb-8">
            {message}
          </p>
          
          <div className="flex gap-4">
            <button 
              onClick={onCancel}
              className="flex-1 py-2.5 bg-white border-[3px] border-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_0px_#000] hover:shadow-[5px_5px_0px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-2.5 bg-red-500 text-white border-[3px] border-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_0px_#000] hover:shadow-[5px_5px_0px_0px_#000] hover:bg-red-600 hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
            >
              Delete
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
