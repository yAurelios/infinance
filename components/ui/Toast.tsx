import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Bell, Info } from 'lucide-react';

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'celebrate' | 'transaction';
}

interface ToastProps {
  notification: ToastNotification;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000); 
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const bgColors = {
    success: 'bg-white dark:bg-gray-800 border-green-500 text-gray-800 dark:text-gray-100',
    info: 'bg-white dark:bg-gray-800 border-blue-500 text-gray-800 dark:text-gray-100',
    celebrate: 'bg-white dark:bg-gray-800 border-gold-500 text-gray-800 dark:text-gray-100',
    transaction: 'bg-white dark:bg-gray-800 border-indigo-500 text-gray-800 dark:text-gray-100',
  };

  const icons = {
    success: <CheckCircle size={20} className="text-green-500 flex-shrink-0" />,
    info: <AlertCircle size={20} className="text-blue-500 flex-shrink-0" />,
    celebrate: <Bell size={20} className="text-gold-500 animate-bounce flex-shrink-0" />,
    transaction: <Info size={20} className="text-indigo-500 flex-shrink-0" />,
  };

  return (
    <div className={`flex items-center gap-4 px-4 py-3 rounded-2xl shadow-2xl border-l-4 ${bgColors[notification.type]} mb-3 animate-fade-in pointer-events-auto min-w-[300px] max-w-sm backdrop-blur-md bg-opacity-95`}>
      <div className="flex-shrink-0">{icons[notification.type]}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold leading-tight">{notification.message}</p>
      </div>
      <button onClick={() => onClose(notification.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0">
        <X size={14} className="text-gray-400" />
      </button>
    </div>
  );
};