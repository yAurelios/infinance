import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  Auth,
  User
} from 'firebase/auth';

// 🔍 DEBUG: Verificar se variáveis de ambiente foram carregadas
console.log('🔍 Variáveis de Ambiente Carregadas:');
console.log('  VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Carregada' : '❌ NÃO CARREGADA');
console.log('  VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Carregada' : '❌ NÃO CARREGADA');
console.log('  VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Carregada' : '❌ NÃO CARREGADA');

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo-app-id',
};

console.log('🔧 Configuração do Firebase:');
console.log('  apiKey:', firebaseConfig.apiKey?.substring(0, 15) + '...');
console.log('  authDomain:', firebaseConfig.authDomain);
console.log('  projectId:', firebaseConfig.projectId);

let app: any = null;
let auth: any = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log('✅ Firebase Auth inicializado com SUCESSO!');
  console.log('   App ID:', firebaseConfig.appId);
} catch (error: any) {
  console.error('❌ ERRO ao inicializar Firebase Auth:', error?.code || error?.message);
  console.error('   Detalhes:', error);
  console.error('   Configuração usada:', {
    apiKey: firebaseConfig.apiKey?.substring(0, 10) + '...',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    usando_fallback: !import.meta.env.VITE_FIREBASE_PROJECT_ID
  });
}

export { auth };export const registerUser = async (email: string, password: string): Promise<User> => {
  if (!auth) throw new Error('Firebase not initialized');
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  if (!auth) throw new Error('Firebase not initialized');
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async (): Promise<void> => {
  if (!auth) throw new Error('Firebase not initialized');
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
