import React from 'react';
import { useData } from './context/DataContext';
import { LoginRegister } from './components/Auth/LoginRegister';
import AppContent from './AppContent';

export default function App() {
  const { isAuthenticated, isLoading } = useData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center space-y-4">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-semibold">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginRegister />;
  }

  return <AppContent />;
}
