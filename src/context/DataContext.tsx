import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, getCurrentUser } from '../services/authService';
import {
  getTransacoes,
  getCategorias,
  getInvestimentos,
  saveTransacao,
  updateTransacao,
  deleteTransacao,
  saveCategoria,
  updateCategoria,
  deleteCategoria,
  saveInvestimento,
  updateInvestimento,
  deleteInvestimento,
  saveBackupJSON
} from '../services/firestoreService';
import type { Transaction, Category, Investment, BackupData } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

interface DataContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  useCloudSync: boolean;
  setUseCloudSync: (value: boolean) => void;

  transactions: Transaction[];
  categories: Category[];
  investments: Investment[];

  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransactionData: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransactionData: (id: string) => Promise<void>;

  addCategory: (c: Omit<Category, 'id'>) => Promise<void>;
  updateCategoryData: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategoryData: (id: string) => Promise<void>;

  addInvestment: (i: Omit<Investment, 'id'>) => Promise<void>;
  updateInvestmentData: (id: string, data: Partial<Investment>) => Promise<void>;
  deleteInvestmentData: (id: string) => Promise<void>;

  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useCloudSync, setUseCloudSync] = useState(() => {
    const saved = localStorage.getItem('infinance_useCloudSync');
    return saved ? JSON.parse(saved) : true;
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [investments, setInvestments] = useState<Investment[]>([]);

  // Monitorar autenticação
  useEffect(() => {
    const unsubscribe = onAuthChange(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && useCloudSync) {
        try {
          await loadFromCloudData();
        } catch (error) {
          console.error('Erro ao carregar dados da nuvem:', error);
          loadFromLocalStorage();
        }
      } else if (!currentUser) {
        loadFromLocalStorage();
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, [useCloudSync]);

  // Salvar no localStorage sempre
  useEffect(() => {
    const data: BackupData = {
      transactions,
      categories,
      investments,
      theme: localStorage.getItem('infinance_theme') || 'light'
    };
    localStorage.setItem('infinance_data', JSON.stringify(data));
  }, [transactions, categories, investments]);

  // Carregar do localStorage
  const loadFromLocalStorage = useCallback(() => {
    const stored = localStorage.getItem('infinance_data');
    if (stored) {
      try {
        const data: BackupData = JSON.parse(stored);
        setTransactions(data.transactions || []);
        setCategories(data.categories || DEFAULT_CATEGORIES);
        setInvestments(data.investments || []);
      } catch (error) {
        console.error('Erro ao carregar dados locais:', error);
      }
    }
  }, []);

  // Carregar da nuvem
  const loadFromCloudData = useCallback(async () => {
    try {
      const [trans, cats, invs] = await Promise.all([
        getTransacoes(),
        getCategorias(),
        getInvestimentos()
      ]);
      
      setTransactions(trans);
      setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES);
      setInvestimentos(invs);
    } catch (error) {
      console.error('Erro ao carregar dados da nuvem:', error);
      throw error;
    }
  }, []);

  // Transações
  const addTransaction = useCallback(async (t: Omit<Transaction, 'id'>) => {
    if (useCloudSync && user) {
      await saveTransacao(t);
      const updated = await getTransacoes();
      setTransactions(updated);
    } else {
      const newId = `transacao_${Date.now()}`;
      setTransactions(prev => [...prev, { ...t, id: newId } as Transaction]);
    }
  }, [user, useCloudSync]);

  const updateTransactionData = useCallback(async (id: string, data: Partial<Transaction>) => {
    if (useCloudSync && user) {
      await updateTransacao(id, data);
      const updated = await getTransacoes();
      setTransactions(updated);
    } else {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    }
  }, [user, useCloudSync]);

  const deleteTransactionData = useCallback(async (id: string) => {
    if (useCloudSync && user) {
      await deleteTransacao(id);
      const updated = await getTransacoes();
      setTransactions(updated);
    } else {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  }, [user, useCloudSync]);

  // Categorias
  const addCategory = useCallback(async (c: Omit<Category, 'id'>) => {
    if (useCloudSync && user) {
      await saveCategoria(c);
      const updated = await getCategorias();
      setCategories(updated.length > 0 ? updated : DEFAULT_CATEGORIES);
    } else {
      const newId = `categoria_${Date.now()}`;
      setCategories(prev => [...prev, { ...c, id: newId } as Category]);
    }
  }, [user, useCloudSync]);

  const updateCategoryData = useCallback(async (id: string, data: Partial<Category>) => {
    if (useCloudSync && user) {
      await updateCategoria(id, data);
      const updated = await getCategorias();
      setCategories(updated.length > 0 ? updated : DEFAULT_CATEGORIES);
    } else {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    }
  }, [user, useCloudSync]);

  const deleteCategoryData = useCallback(async (id: string) => {
    if (useCloudSync && user) {
      await deleteCategoria(id);
      const updated = await getCategorias();
      setCategories(updated.length > 0 ? updated : DEFAULT_CATEGORIES);
    } else {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  }, [user, useCloudSync]);

  // Investimentos
  const addInvestment = useCallback(async (i: Omit<Investment, 'id'>) => {
    if (useCloudSync && user) {
      await saveInvestimento(i);
      const updated = await getInvestimentos();
      setInvestimentos(updated);
    } else {
      const newId = `investimento_${Date.now()}`;
      setInvestimentos(prev => [...prev, { ...i, id: newId } as Investment]);
    }
  }, [user, useCloudSync]);

  const updateInvestmentData = useCallback(async (id: string, data: Partial<Investment>) => {
    if (useCloudSync && user) {
      await updateInvestimento(id, data);
      const updated = await getInvestimentos();
      setInvestimentos(updated);
    } else {
      setInvestimentos(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
    }
  }, [user, useCloudSync]);

  const deleteInvestmentData = useCallback(async (id: string) => {
    if (useCloudSync && user) {
      await deleteInvestimento(id);
      const updated = await getInvestimentos();
      setInvestimentos(updated);
    } else {
      setInvestimentos(prev => prev.filter(i => i.id !== id));
    }
  }, [user, useCloudSync]);

  // Sincronização
  const syncToCloud = useCallback(async () => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const backup: BackupData = {
      transactions,
      categories,
      investments,
      theme: localStorage.getItem('infinance_theme') || 'light'
    };

    await saveBackupJSON(`backup_${new Date().toISOString()}`, backup);
  }, [user, transactions, categories, investments]);

  const loadFromCloud = useCallback(async () => {
    if (!user) throw new Error('Usuário não autenticado');
    await loadFromCloudData();
  }, [user, loadFromCloudData]);

  const value: DataContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    useCloudSync,
    setUseCloudSync: (val) => {
      setUseCloudSync(val);
      localStorage.setItem('infinance_useCloudSync', JSON.stringify(val));
    },
    transactions,
    categories,
    investments,
    addTransaction,
    updateTransactionData,
    deleteTransactionData,
    addCategory,
    updateCategoryData,
    deleteCategoryData,
    addInvestment,
    updateInvestmentData,
    deleteInvestmentData,
    syncToCloud,
    loadFromCloud
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = React.useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de DataProvider');
  }
  return context;
};
