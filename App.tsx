import React, { useState } from 'react';
import { useData } from './context/DataContext';
import { LoginRegister } from './components/Auth/LoginRegister';
import AppContent from './AppContent';

export default function App() {
  try {
    const { isAuthenticated, isLoading } = useData();
    const [showLoginModal, setShowLoginModal] = useState(false);

    if (isLoading) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="text-center space-y-4">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-semibold">Carregando...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated && !showLoginModal) {
      return <LoginRegister onAuthenticated={() => setShowLoginModal(false)} />;
    }

    if (showLoginModal) {
      return <LoginRegister onAuthenticated={() => setShowLoginModal(false)} />;
    }

    return <AppContent onRequestLogin={() => setShowLoginModal(true)} />;
  } catch (error) {
    console.error('App error:', error);
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f3f4f6',
        fontFamily: 'sans-serif',
        flexDirection: 'column'
      }}>
        <h1 style={{ color: '#1f2937', margin: '0 0 10px 0' }}>Erro na Aplicação</h1>
        <p style={{ color: '#6b7280', margin: '0' }}>{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
        <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '20px' }}>Verifique o console (F12) para detalhes</p>
      </div>
    );
  }
}
