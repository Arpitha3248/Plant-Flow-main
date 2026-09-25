import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import type { ToastMessage } from '../../types/plant';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let bgColor = 'bg-slate-900 text-white border-slate-700';
        let icon = <Info className="w-5 h-5 text-sky-400 flex-shrink-0" />;

        if (toast.type === 'error') {
          bgColor = 'bg-red-900/95 text-red-50 border-red-700';
          icon = <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />;
        } else if (toast.type === 'success') {
          bgColor = 'bg-emerald-900/95 text-emerald-50 border-emerald-700';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
        } else if (toast.type === 'warning') {
          bgColor = 'bg-amber-900/95 text-amber-50 border-amber-700';
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 duration-200 ${bgColor}`}
          >
            {icon}
            <div className="flex-1 text-xs font-medium leading-relaxed">{toast.message}</div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
