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
      setInvestments(invs);
    } catch (error) {
      console.error('Erro ao carregar dados da nuvem:', error);
      throw error;
    }
  }, []);

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
  }, [useCloudSync, loadFromCloudData]);

  // Salvar no localStorage sempre
  useEffect(() => {
    const data: BackupData = {
      transactions,
      categories,
      investments,
      theme: (localStorage.getItem('infinance_theme') || 'light') as 'light' | 'dark'
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

  // Transações
  const addTransaction = useCallback(async (t: Omit<Transaction, 'id'>) => {
    if (useCloudSync && user) {
      await saveTransacao(t);
      const updated = await getTransacoes();
      setTransactions(updated);
    } else {
      const newId = `transacao_${Date.now()}`;
      const newTransaction = { ...t, id: newId } as Transaction;
      setTransactions(prev => {
        const updated = [...prev, newTransaction];
        // Salvar imediatamente no localStorage
        const data: BackupData = {
          transactions: updated,
          categories,
          investments,
          theme: (localStorage.getItem('infinance_theme') || 'light') as 'light' | 'dark'
        };
        localStorage.setItem('infinance_data', JSON.stringify(data));
        return updated;
      });
    }
  }, [user, useCloudSync, categories, investments]);

  const updateTransactionData = useCallback(async (id: string, data: Partial<Transaction>) => {
    if (useCloudSync && user) {
      await updateTransacao(id, data);
      const updated = await getTransacoes();
      setTransactions(updated);
    } else {
      setTransactions(prev => {
        const updated = prev.map(t => t.id === id ? { ...t, ...data } : t);
        // Salvar imediatamente no localStorage
        const backupData: BackupData = {
          transactions: updated,
          categories,
          investments,
          theme: (localStorage.getItem('infinance_theme') || 'light') as 'light' | 'dark'
        };
        localStorage.setItem('infinance_data', JSON.stringify(backupData));
        return updated;
      });
    }
  }, [user, useCloudSync, categories, investments]);

  const deleteTransactionData = useCallback(async (id: string) => {
    if (useCloudSync && user) {
      await deleteTransacao(id);
      const updated = await getTransacoes();
      setTransactions(updated);
    } else {
      setTransactions(prev => {
        const updated = prev.filter(t => t.id !== id);
        // Salvar imediatamente no localStorage
        const backupData: BackupData = {
          transactions: updated,
          categories,
          investments,
          theme: (localStorage.getItem('infinance_theme') || 'light') as 'light' | 'dark'
        };
        localStorage.setItem('infinance_data', JSON.stringify(backupData));
        return updated;
      });
    }
  }, [user, useCloudSync, categories, investments]);

  // Categorias
  const addCategory = useCallback(async (c: Omit<Category, 'id'>) => {
    if (useCloudSync && user) {
      await saveCategoria(c);
      const updated = await getCategorias();
      setCategories(updated.length > 0 ? updated : DEFAULT_CATEGORIES);
    } else {
      const newId = `categoria_${Date.now()}`;
      setCategories(prev => {
        const updated = [...prev, { ...c, id: newId } as Category];
        const backupData: BackupData = {
          transactions,
          categories: updated,
          investments,
          theme: (localStorage.getItem('infinance_theme') || 'light') as 'light' | 'dark'
        };
        localStorage.setItem('infinance_data', JSON.stringify(backupData));
        return updated;
      });
    }
  }, [user, useCloudSync, transactions, investments]);

  const updateCategoryData = useCallback(async (id: string, data: Partial<Category>) => {
    if (useCloudSync && user) {
      await updateCategoria(id, data);
      const updated = await getCategorias();
      setCategories(updated.length > 0 ? updated : DEFAULT_CATEGORIES);
    } else {
      setCategories(prev => {
        const updated = prev.map(c => c.id === id ? { ...c, ...data } : c);
        const backupData: BackupData = {
          transactions,
          categories: updated,
          investments,
          theme: (localStorage.getItem('infinance_theme') || 'light') as 'light' | 'dark'
        };
        localStorage.setItem('infinance_data', JSON.stringify(backupData));
        return updated;
      });
    }
  }, [user, useCloudSync, transactions, investments]);

  const deleteCategoryData = useCallback(async (id: string) => {
    if (useCloudSync && user) {
      await deleteCategoria(id);
      const updated = await getCategorias();
      setCategories(updated.length > 0 ? updated : DEFAULT_CATEGORIES);
    } else {
      setCategories(prev => {
        const updated = prev.filter(c => c.id !== id);
        const backupData: BackupData = {
          transactions,
          categories: updated,
          investments,
          theme: (localStorage.getItem('infinance_theme') || 'light') as 'light' | 'dark'
        };
        localStorage.setItem('infinance_data', JSON.stringify(backupData));
        return updated;
      });
    }
  }, [user, useCloudSync, transactions, investments]);

  // Investimentos
  const addInvestment = useCallback(async (i: Omit<Investment, 'id'>) => {
    if (useCloudSync && user) {
      await saveInvestimento(i);
      const updated = await getInvestimentos();
      setInvestments(updated);
    } else {
      const newId = `investimento_${Date.now()}`;
      setInvestments((prev: Investment[]) => {
        const updated = [...prev, { ...i, id: newId } as Investment];
        const backupData: BackupData = {
          transactions,
          categories,
          investments: updated,
          theme: (localStorage.getItem('infinance_theme') || 'light') as 'light' | 'dark'
        };
        localStorage.setItem('infinance_data', JSON.stringify(backupData));
        return updated;
      });
    }
  }, [user, useCloudSync, transactions, categories]);

  const updateInvestmentData = useCallback(async (id: string, data: Partial<Investment>) => {
    if (useCloudSync && user) {
      await updateInvestimento(id, data);
      const updated = await getInvestimentos();
      setInvestments(updated);
    } else {
      setInvestments((prev: Investment[]) => {
        const updated = prev.map((i: Investment) => i.id === id ? { ...i, ...data } : i);
        const backupData: BackupData = {
          transactions,
          categories,
          investments: updated,
          theme: (localStorage.getItem('infinance_theme') || 'light') as 'light' | 'dark'
        };
        localStorage.setItem('infinance_data', JSON.stringify(backupData));
        return updated;
      });
    }
  }, [user, useCloudSync, transactions, categories]);

  const deleteInvestmentData = useCallback(async (id: string) => {
    if (useCloudSync && user) {
      await deleteInvestimento(id);
      const updated = await getInvestimentos();
      setInvestments(updated);
    } else {
      setInvestments((prev: Investment[]) => {
        const updated = prev.filter((i: Investment) => i.id !== id);
        const backupData: BackupData = {
          transactions,
          categories,
          investments: updated,
          theme: (localStorage.getItem('infinance_theme') || 'light') as 'light' | 'dark'
        };
        localStorage.setItem('infinance_data', JSON.stringify(backupData));
        return updated;
      });
    }
  }, [user, useCloudSync, transactions, categories]);

  // Sincronização
  const syncToCloud = useCallback(async () => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const backup: BackupData = {
      transactions,
      categories,
      investments,
      theme: (localStorage.getItem('infinance_theme') || 'light') as 'light' | 'dark'
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
