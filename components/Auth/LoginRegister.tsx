import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Wallet, AlertCircle } from 'lucide-react';
import { registerUser, loginUser } from '../../services/authService';

interface LoginRegisterProps {
  onAuthenticated?: () => void;
}

export const LoginRegister: React.FC<LoginRegisterProps> = ({ onAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const handleDemoMode = () => {
    // Demo mode: use localStorage without Firebase
    localStorage.setItem('infinance_demoUser', JSON.stringify({
      uid: 'demo_' + Date.now(),
      email: 'demo@infinance.local',
      name: 'Usuário Demo'
    }));
    setDemoMode(true);
    if (onAuthenticated) {
      setTimeout(onAuthenticated, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        if (password !== passwordConfirm) {
          setError('As senhas não coincidem');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('A senha deve ter no mínimo 6 caracteres');
          setLoading(false);
          return;
        }
        await registerUser(email, password);
      }
      
      setEmail('');
      setPassword('');
      setPasswordConfirm('');
      
      if (onAuthenticated) {
        onAuthenticated();
      }
    } catch (err: any) {
      console.error('Erro de autenticação:', err?.code, err?.message);
      
      // Mapear erros específicos
      let errorMessage = '';
      
      if (err?.code === 'auth/api-key-not-valid') {
        errorMessage = '❌ Chave API do Firebase inválida ou revogada. Verifique o console.firebase.google.com';
      } else if (err?.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está registrado';
      } else if (err?.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (err?.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado';
      } else if (err?.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta';
      } else if (err?.code === 'auth/network-request-failed') {
        errorMessage = '❌ Erro de conexão. Verifique sua internet ou a disponibilidade do Firebase';
      } else if (err?.code?.includes('firebase')) {
        errorMessage = `❌ Erro Firebase: ${err.code}. O projeto pode ter sido deletado.`;
      } else {
        errorMessage = err.message || 'Erro ao processar';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-blue-600 p-4 rounded-2xl">
              <Wallet className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-black dark:text-white tracking-tight">InFinance</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Gestão Inteligente de Finanças</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all ${
                isLogin
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <LogIn size={16} className="inline mr-2" />
              Entrar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all ${
                !isLogin
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <UserPlus size={16} className="inline mr-2" />
              Criar
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Password Confirm */}
            {!isLogin && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirme a senha"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processando...
                </>
              ) : (
                <>
                  {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                  {isLogin ? 'Entrar' : 'Criar Conta'}
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="ml-1 text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              {isLogin ? 'Criar agora' : 'Entrar agora'}
            </button>
          </div>

          {/* Alert: Firebase Credentials Issue */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg space-y-3">
            <div className="flex gap-2">
              <AlertCircle className="text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <div className="text-sm">
                <p className="font-bold text-red-800 dark:text-red-200 mb-1">⚠️ Erro na Autenticação Firebase</p>
                <p className="text-red-700 dark:text-red-300 text-xs mb-3">
                  A API Key do Firebase está inválida ou o projeto foi deletado.
                </p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleDemoMode}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-all"
                  >
                    🔓 Modo Demo (Sem Login)
                  </button>
                  <details className="text-[10px] text-red-700 dark:text-red-400 mt-2">
                    <summary className="cursor-pointer font-bold">✏️ Como corrigir?</summary>
                    <div className="mt-2 space-y-1 pl-2">
                      <p>1. Acesse: <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">console.firebase.google.com</a></p>
                      <p>2. Verifique se o projeto "infinance-web" ainda existe</p>
                      <p>3. Se deletado, crie um novo projeto</p>
                      <p>4. Copie as credenciais de um app Web</p>
                      <p>5. Atualize o arquivo <code className="bg-red-200 dark:bg-red-800 px-1">.env.local</code></p>
                      <p>6. Reinicie o servidor: <code className="bg-red-200 dark:bg-red-800 px-1">npm run dev</code></p>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 dark:text-gray-400 text-xs mt-6">
          Seus dados são salvos localmente e na nuvem com segurança.
        </p>
      </div>
    </div>
  );
};
