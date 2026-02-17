import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DataProvider } from './context/DataContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
      <DataProvider>
        <App />
      </DataProvider>
    </React.StrictMode>
  );
} catch (error) {
  console.error('Error rendering app:', error);
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #f3f4f6; font-family: sans-serif;">
      <div style="text-align: center;">
        <h1 style="color: #1f2937; margin: 0 0 10px 0;">Erro ao inicializar aplicação</h1>
        <p style="color: #6b7280; margin: 0;">${error instanceof Error ? error.message : 'Erro desconhecido'}</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">Abra o console (F12) para mais detalhes</p>
      </div>
    </div>
  `;
}