import React, { useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'syncing' | 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number; // thời gian hiển thị (ms), mặc định 3500ms
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none print:hidden">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    // Không tự động tắt nếu đang ở trạng thái 'syncing' (chờ hoàn tất tác vụ)
    if (toast.type !== 'syncing') {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration || 3500);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  const config = {
    syncing: {
      icon: <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />,
      bg: 'bg-white/95 backdrop-blur border-blue-200 shadow-blue-100/50',
      text: 'text-slate-800',
      badge: 'text-blue-700 bg-blue-50 border-blue-200',
      label: 'Đang đồng bộ',
    },
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
      bg: 'bg-white/95 backdrop-blur border-emerald-200 shadow-emerald-100/50',
      text: 'text-slate-800',
      badge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      label: 'Thành công',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
      bg: 'bg-white/95 backdrop-blur border-rose-200 shadow-rose-100/50',
      text: 'text-slate-800',
      badge: 'text-rose-700 bg-rose-50 border-rose-200',
      label: 'Cảnh báo',
    },
    info: {
      icon: <Info className="w-5 h-5 text-indigo-500 flex-shrink-0" />,
      bg: 'bg-white/95 backdrop-blur border-indigo-200 shadow-indigo-100/50',
      text: 'text-slate-800',
      badge: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      label: 'Thông báo',
    },
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all duration-300 ${config.bg}`}
      role="alert"
    >
      <div className="pt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wider ${config.badge}`}>
            {config.label}
          </span>
        </div>
        <p className={`text-xs font-semibold ${config.text} leading-snug`}>{toast.message}</p>
        {toast.description && (
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
        title="Đóng"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

/**
 * Hook quản lý trạng thái Toast thông báo
 */
export function useToast() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = (type: ToastType, message: string, description?: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => {
      // Nếu là syncing, xóa syncing cũ để không bị lặp nhiều spinner
      const filtered = type === 'syncing' ? prev.filter((t) => t.type !== 'syncing') : prev;
      return [...filtered, { id, type, message, description, duration }];
    });
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const removeSyncingToasts = () => {
    setToasts((prev) => prev.filter((t) => t.type !== 'syncing'));
  };

  return { toasts, addToast, removeToast, removeSyncingToasts };
}
