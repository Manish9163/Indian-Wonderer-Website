import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onRemove: (id: string) => void;
  darkMode?: boolean;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove, darkMode = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleRemove = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [onRemove, toast.id]);

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 50);
    
    let removeTimer: NodeJS.Timeout;
    if (toast.duration && toast.duration > 0) {
      removeTimer = setTimeout(() => {
        handleRemove();
      }, toast.duration);
    }
    
    return () => {
      clearTimeout(showTimer);
      if (removeTimer) clearTimeout(removeTimer);
    };
  }, [toast.duration, handleRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getColorClasses = () => {
    const base = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    let border = '';
    
    switch (toast.type) {
      case 'success':
        border = 'border-l-green-500';
        break;
      case 'error':
        border = 'border-l-red-500';
        break;
      case 'warning':
        border = 'border-l-yellow-500';
        break;
      case 'info':
        border = 'border-l-blue-500';
        break;
    }
    
    return `${base} ${border}`;
  };

  return (
    <div
      className={`
        mb-3 border-l-4 rounded-lg shadow-xl p-4 max-w-md
        transition-all duration-300 ease-in-out transform
        ${getColorClasses()}
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {getIcon()}
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{toast.title}</h4>
            <p className="text-sm opacity-90 mt-1">{toast.message}</p>
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="ml-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
  darkMode?: boolean;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove, darkMode = false }) => {
  
  if (toasts.length === 0) {
    return null;
  }

  const getGradient = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-600';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-pink-600';
      case 'warning':
        return 'bg-gradient-to-r from-orange-500 to-amber-600';
      case 'info':
        return 'bg-gradient-to-r from-blue-500 to-cyan-600';
      default:
        return 'bg-gradient-to-r from-purple-500 to-pink-600';
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-white animate-scale-in" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-white animate-scale-in" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-white animate-scale-in" />;
      case 'info':
        return <Info className="w-6 h-6 text-white animate-scale-in" />;
      default:
        return <Info className="w-6 h-6 text-white animate-scale-in" />;
    }
  };
  
  return (
    <div 
      className="fixed top-4 right-4 z-[99999] max-w-md space-y-3"
      style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 99999 }}
    >
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`
            ${getGradient(toast.type)} 
            text-white p-4 rounded-xl shadow-2xl 
            border border-white/20 backdrop-blur-lg
            animate-slide-in-right
            transition-all duration-300 hover:scale-[1.02]
            min-w-[320px]
          `}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1 pr-2">
              <h4 className="font-bold text-base mb-1">{toast.title}</h4>
              <p className="text-sm opacity-95 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className="flex-shrink-0 text-white hover:text-gray-200 hover:bg-white/10 rounded-lg p-1.5 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const newToast: ToastData = {
      ...toast,
      id,
      duration: toast.duration || 3000
    };
    
    
    setToasts(prev => {
      const newToasts = [...prev, newToast];
      return newToasts;
    });
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (title: string, message: string, duration?: number) => {
    const result = addToast({ type: 'success', title, message, duration });
    return result;
  };

  const showError = (title: string, message: string, duration?: number) => {
    return addToast({ type: 'error', title, message, duration });
  };

  const showWarning = (title: string, message: string, duration?: number) => {
    return addToast({ type: 'warning', title, message, duration });
  };

  const showInfo = (title: string, message: string, duration?: number) => {
    return addToast({ type: 'info', title, message, duration });
  };

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default Toast;
