import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  zIndex?: number;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, zIndex = 50 }) => {
  if (!isOpen) return null;
  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300 fade-in`} style={{ zIndex }}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col border border-gray-100 dark:border-gray-800 transform scale-100">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate pr-4">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <div className="p-6">
             {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}> = ({ isOpen, onClose, onConfirm, message }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Confirmação" zIndex={60}>
    <ConfirmInner message={message} onClose={onClose} onConfirm={onConfirm} isOpen={isOpen} />
  </Modal>
);

const ConfirmInner: React.FC<{ message: string; onClose: () => void; onConfirm: () => void; isOpen: boolean }> = ({ message, onClose, onConfirm, isOpen }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onConfirm, onClose]);

  return (
    <>
      <p className="mb-6 text-gray-600 dark:text-gray-300 text-base leading-relaxed">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
        <button onClick={onConfirm} className="px-5 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-md transition-all transform hover:scale-105">Confirmar</button>
      </div>
    </>
  );
};