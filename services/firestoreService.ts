import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  Firestore
} from 'firebase/firestore';
import { auth } from './authService';
import type { Transaction, Category, Investment } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo-app-id',
};

let app: any = null;
let db: any = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.warn('Firebase Firestore not initialized:', error);
}

// ===== TRANSAÇÕES =====
export const saveTransacao = async (transacao: Omit<Transaction, 'id'>) => {
  if (!db) throw new Error('Firestore não inicializado');
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const transacaoId = `transacao_${Date.now()}`;
  const transacaoRef = doc(db, 'users', user.uid, 'transacoes', transacaoId);
  
  return setDoc(transacaoRef, {
    ...transacao,
    id: transacaoId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
};

export const updateTransacao = async (transacaoId: string, data: Partial<Transaction>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const transacaoRef = doc(db, 'users', user.uid, 'transacoes', transacaoId);
  return updateDoc(transacaoRef, {
    ...data,
    updatedAt: Timestamp.now()
  });
};

export const deleteTransacao = async (transacaoId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const transacaoRef = doc(db, 'users', user.uid, 'transacoes', transacaoId);
  return deleteDoc(transacaoRef);
};

export const getTransacoes = async (): Promise<Transaction[]> => {
  if (!db) return [];
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const transacoesRef = collection(db, 'users', user.uid, 'transacoes');
    const q = query(transacoesRef, orderBy('date', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Transaction[];
  } catch (error) {
    console.error('Erro ao carregar transações:', error);
    return [];
  }
};

// ===== CATEGORIAS =====
export const saveCategoria = async (categoria: Omit<Category, 'id'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const categoriaId = `categoria_${Date.now()}`;
  const categoriaRef = doc(db, 'users', user.uid, 'categorias', categoriaId);
  
  return setDoc(categoriaRef, {
    ...categoria,
    id: categoriaId,
    createdAt: Timestamp.now()
  });
};

export const updateCategoria = async (categoriaId: string, data: Partial<Category>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const categoriaRef = doc(db, 'users', user.uid, 'categorias', categoriaId);
  return updateDoc(categoriaRef, {
    ...data,
    updatedAt: Timestamp.now()
  });
};

export const deleteCategoria = async (categoriaId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const categoriaRef = doc(db, 'users', user.uid, 'categorias', categoriaId);
  return deleteDoc(categoriaRef);
};

export const getCategorias = async (): Promise<Category[]> => {
  if (!db) return [];
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const categoriasRef = collection(db, 'users', user.uid, 'categorias');
    const snapshot = await getDocs(categoriasRef);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Category[];
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    return [];
  }
};

// ===== INVESTIMENTOS =====
export const saveInvestimento = async (investimento: Omit<Investment, 'id'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const investimentoId = `investimento_${Date.now()}`;
  const investimentoRef = doc(db, 'users', user.uid, 'investimentos', investimentoId);
  
  return setDoc(investimentoRef, {
    ...investimento,
    id: investimentoId,
    createdAt: Timestamp.now()
  });
};

export const updateInvestimento = async (investimentoId: string, data: Partial<Investment>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const investimentoRef = doc(db, 'users', user.uid, 'investimentos', investimentoId);
  return updateDoc(investimentoRef, {
    ...data,
    updatedAt: Timestamp.now()
  });
};

export const deleteInvestimento = async (investimentoId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const investimentoRef = doc(db, 'users', user.uid, 'investimentos', investimentoId);
  return deleteDoc(investimentoRef);
};

export const getInvestimentos = async (): Promise<Investment[]> => {
  if (!db) return [];
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const investimentosRef = collection(db, 'users', user.uid, 'investimentos');
    const snapshot = await getDocs(investimentosRef);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Investment[];
  } catch (error) {
    console.error('Erro ao carregar investimentos:', error);
    return [];
  }
};

// ===== BACKUP JSON =====
export const saveBackupJSON = async (backupName: string, data: any) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const backupRef = doc(db, 'users', user.uid, 'backups', backupName);
  return setDoc(backupRef, {
    ...data,
    createdAt: Timestamp.now()
  });
};

export const getBackupJSON = async (backupName: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const backupRef = doc(db, 'users', user.uid, 'backups', backupName);
  const snapshot = await getDoc(backupRef);
  
  return snapshot.exists() ? snapshot.data() : null;
};

export const listBackups = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const backupsRef = collection(db, 'users', user.uid, 'backups');
  const snapshot = await getDocs(backupsRef);
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  }));
};
