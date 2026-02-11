import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, PieChart, Download, Save, Upload, Sun, Moon, 
  Trash2, Edit2, TrendingUp, DollarSign, Wallet, ArrowDown, ArrowUp, Menu, X, Filter, Search, Bell, CheckCircle, AlertCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell 
} from 'recharts';
import { Transaction, Category, Investment, TransactionType, BackupData, ChartConfig, PDFExportConfig } from './types';
import { DEFAULT_CATEGORIES, COLORS } from './constants';
import Fireworks from './components/Fireworks';
import { generatePDF } from './services/pdfService';
import html2canvas from 'html2canvas';

// --- Types for internal usage ---
interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'celebrate';
}

// --- Helper Components ---

const Modal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  zIndex?: number;
}> = ({ isOpen, onClose, title, children, zIndex = 50 }) => {
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

const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}> = ({ isOpen, onClose, onConfirm, message }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Confirmação" zIndex={60}>
    <p className="mb-6 text-gray-600 dark:text-gray-300 text-base leading-relaxed">{message}</p>
    <div className="flex justify-end gap-3">
      <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
      <button onClick={onConfirm} className="px-5 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-md transition-all transform hover:scale-105">Confirmar</button>
    </div>
  </Modal>
);

const Toast: React.FC<{ notification: ToastNotification; onClose: (id: string) => void }> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 6000); 
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    info: 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    celebrate: 'bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
  };

  const icons = {
    success: <CheckCircle size={18} className="text-green-500 flex-shrink-0" />,
    info: <AlertCircle size={18} className="text-blue-500 flex-shrink-0" />,
    celebrate: <Bell size={18} className="text-amber-500 animate-bounce flex-shrink-0" />,
  };

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-md border ${bgColors[notification.type]} mb-3 animate-slide-in-right transform transition-all duration-300 hover:scale-105 max-w-sm`}>
      <div className="mt-0.5">{icons[notification.type]}</div>
      <span className="text-sm font-medium leading-tight">{notification.message}</span>
      <button onClick={() => onClose(notification.id)} className="ml-auto opacity-60 hover:opacity-100 flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 shadow-xl rounded-xl">
        <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.fill || entry.color }}>
            {entry.name}: {entry.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- Main App Component ---

export default function App() {
  // --- State ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  
  // UI State
  const [showGraph, setShowGraph] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'main' | 'summary'>('main');

  // Modals State
  // Transaction
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  // Category
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false); // Nested on top of manager
  // Investment
  const [isInvestmentManagerOpen, setIsInvestmentManagerOpen] = useState(false);
  const [isInvestmentEditorOpen, setIsInvestmentEditorOpen] = useState(false); // Nested on top of manager
  // PDF
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  // Confirm
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  // Edit/Delete Context
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<{type: 'transaction'|'category'|'investment', id: string} | null>(null);

  // Fireworks
  const [fireworksActive, setFireworksActive] = useState(false);

  // PDF & Charts Config
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    chartType: 'bar',
    dataType: 'both'
  });
  
  const [pdfConfig, setPdfConfig] = useState<PDFExportConfig>({
    title: 'Relatório Financeiro',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    includeChart: true,
    chartType: 'bar',
    sortBy: 'date',
    filterType: 'all'
  });

  const chartRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  useEffect(() => {
    const stored = localStorage.getItem('infinance_data');
    if (stored) {
      const data: BackupData = JSON.parse(stored);
      setTransactions(data.transactions || []);
      setCategories(data.categories || DEFAULT_CATEGORIES);
      setInvestments(data.investments || []);
      setDarkMode(data.theme === 'dark');
    }
  }, []);

  useEffect(() => {
    const data: BackupData = {
      transactions,
      categories,
      investments,
      theme: darkMode ? 'dark' : 'light'
    };
    localStorage.setItem('infinance_data', JSON.stringify(data));
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [transactions, categories, investments, darkMode]);

  // --- Derived State (Calculations) ---

  const { totalIncome, totalExpenses, totalInvestedFlow, investmentStats } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    let investedFlow = 0;
    const stats: Record<string, { invested: number; rescued: number }> = {};

    for (const t of transactions) {
      if (t.type === 'entrada') {
        income += t.value;
      } else if (t.type === 'gasto') {
        if (!t.isResgate) {
          expenses += t.value;
        } else if (t.isResgate && t.investmentId) {
          if (!stats[t.investmentId]) stats[t.investmentId] = { invested: 0, rescued: 0 };
          stats[t.investmentId].rescued += t.value;
        }
      } else if (t.type === 'investimento') {
        investedFlow += t.value;
        if (t.investmentId) {
          if (!stats[t.investmentId]) stats[t.investmentId] = { invested: 0, rescued: 0 };
          stats[t.investmentId].invested += t.value;
        }
      }
    }
    return { totalIncome: income, totalExpenses: expenses, totalInvestedFlow: investedFlow, investmentStats: stats };
  }, [transactions]);

  const currentBalance = totalIncome - totalExpenses - totalInvestedFlow;

  const investmentBalances = useMemo(() => {
    return investments.map(inv => {
      const stat = investmentStats[inv.id] || { invested: 0, rescued: 0 };
      return { ...inv, calculatedValue: stat.invested - stat.rescued };
    });
  }, [investments, investmentStats]);

  const totalInvestedCurrent = useMemo(() => 
    investmentBalances.reduce((acc, inv) => acc + inv.calculatedValue, 0), 
  [investmentBalances]);

  // --- Actions ---

  const addToast = (message: string, type: 'success' | 'info' | 'celebrate' = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleDelete = (type: 'transaction'|'category'|'investment', id: string) => {
    setDeletingItem({ type, id });
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingItem) return;
    if (deletingItem.type === 'transaction') {
      setTransactions(prev => prev.filter(t => t.id !== deletingItem.id));
      addToast('Transação excluída.', 'info');
    } else if (deletingItem.type === 'category') {
      setCategories(prev => prev.filter(c => c.id !== deletingItem.id));
      addToast('Categoria excluída.', 'info');
    } else if (deletingItem.type === 'investment') {
      setInvestments(prev => prev.filter(i => i.id !== deletingItem.id));
      addToast('Investimento excluído.', 'info');
    }
    setIsConfirmOpen(false);
    setDeletingItem(null);
  };

  const handleSaveTransaction = (data: Partial<Transaction>) => {
    if (data.type === 'gasto' && !data.isResgate) {
      if ((data.value || 0) > currentBalance) {
        alert("Erro: O saldo atual não comporta este gasto.");
        return;
      }
    }
    
    // Check Investment Goal Hit
    if (data.type === 'investimento' && data.investmentId) {
      const inv = investmentBalances.find(i => i.id === data.investmentId);
      if (inv) {
        const newValue = inv.calculatedValue + (data.value || 0);
        if (newValue >= inv.goalValue && inv.calculatedValue < inv.goalValue) {
          setFireworksActive(true);
          const formattedValue = inv.goalValue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
          addToast(`Você conseguiu atingir a meta do seu investimento ${inv.name}, de ${formattedValue}. Parabéns!`, 'celebrate');
        }
      }
    }

    if (editingItem) {
      setTransactions(prev => prev.map(t => t.id === editingItem.id ? { ...t, ...data } as Transaction : t));
      addToast('Transação atualizada!', 'success');
    } else {
      setTransactions(prev => [...prev, { ...data, id: crypto.randomUUID() } as Transaction]);
      addToast('Transação criada com sucesso!', 'success');
    }
    setIsTransactionModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveCategory = (data: Partial<Category>) => {
    if (editingItem) {
      setCategories(prev => prev.map(c => c.id === editingItem.id ? { ...c, ...data } as Category : c));
      addToast('Categoria atualizada.', 'success');
    } else {
      setCategories(prev => [...prev, { ...data, id: crypto.randomUUID() } as Category]);
      addToast('Categoria criada.', 'success');
    }
    setIsCategoryEditorOpen(false);
    setEditingItem(null);
  };

  const handleSaveInvestment = (data: Partial<Investment>) => {
    if (editingItem) {
      setInvestments(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...data } as Investment : i));
      addToast('Investimento atualizado.', 'success');
    } else {
      setInvestments(prev => [...prev, { ...data, id: crypto.randomUUID(), currentValue: 0 } as Investment]);
      addToast('Investimento criado.', 'success');
    }
    setIsInvestmentEditorOpen(false);
    setEditingItem(null);
  };

  const exportBackup = () => {
    const data = JSON.stringify({ transactions, categories, investments, theme: darkMode ? 'dark' : 'light' });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-infinance-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    addToast('Backup salvo com sucesso!', 'success');
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.transactions) setTransactions(data.transactions);
        if (data.categories) setCategories(data.categories);
        if (data.investments) setInvestments(data.investments);
        if (data.theme) setDarkMode(data.theme === 'dark');
        addToast("Backup restaurado com sucesso!", 'success');
      } catch (err) {
        alert("Erro ao ler arquivo de backup.");
      }
    };
    reader.readAsText(file);
  };

  const handleExportPDF = async () => {
    let chartUri = undefined;
    if (pdfConfig.includeChart && chartRef.current) {
        const wasVisible = showGraph;
        if (!wasVisible) setShowGraph(true);
        await new Promise(r => setTimeout(r, 500));
        const canvas = await html2canvas(chartRef.current);
        chartUri = canvas.toDataURL('image/png');
        if (!wasVisible) setShowGraph(false);
    }
    generatePDF(transactions, categories, investments, pdfConfig, chartUri);
    setIsPDFModalOpen(false);
    addToast('PDF gerado com sucesso!', 'success');
  };

  // --- Rendering Helpers ---

  const groupedTransactions = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};
    const filtered = transactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).forEach(t => {
      const monthYear = new Date(t.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      if (!grouped[monthYear]) grouped[monthYear] = [];
      grouped[monthYear].push(t);
    });
    return grouped;
  }, [transactions, searchTerm]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    const filtered = transactions.filter(t => {
      const d = t.date;
      return d >= chartConfig.startDate && d <= chartConfig.endDate;
    });

    if (chartConfig.chartType === 'pie') {
        const dataMap: Record<string, number> = {};
        filtered.forEach(t => {
            if (chartConfig.dataType === 'both' || t.type === (chartConfig.dataType === 'gasto' ? 'gasto' : 'investimento')) {
                 if(t.type === 'entrada') return;
                 let key = 'Outros';
                 if (t.type === 'gasto' && t.categoryId) key = categories.find(c => c.id === t.categoryId)?.name || 'Outros';
                 if (t.type === 'investimento' && t.investmentId) key = investments.find(i => i.id === t.investmentId)?.name || 'Investimento';
                 dataMap[key] = (dataMap[key] || 0) + t.value;
            }
        });
        return Object.keys(dataMap).map(name => ({ name, value: dataMap[name] }));
    } else {
        const dataMap: Record<string, any> = {};
        filtered.forEach(t => {
             const date = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
             if (!dataMap[date]) dataMap[date] = { name: date, gasto: 0, investimento: 0 };
             if (t.type === 'gasto') dataMap[date].gasto += t.value;
             if (t.type === 'investimento') dataMap[date].investimento += t.value;
        });
        return Object.values(dataMap);
    }
  }, [transactions, categories, investments, chartConfig]);

  // --- Forms ---

  const TransactionForm = () => {
    const [type, setType] = useState<TransactionType>(editingItem?.type || 'entrada');
    const [isResgate, setIsResgate] = useState(editingItem?.isResgate || false);
    const [desc, setDesc] = useState(editingItem?.description || '');
    const [val, setVal] = useState(editingItem?.value || '');
    const [date, setDate] = useState(editingItem?.date || new Date().toISOString().split('T')[0]);
    
    // Default to 'cat_7' (Outras Despesas) if creating a new expense and no category selected yet
    const initialCatId = editingItem?.categoryId || (type === 'gasto' ? 'cat_7' : '');
    const [catId, setCatId] = useState(initialCatId);
    
    const [invId, setInvId] = useState(editingItem?.investmentId || '');

    useEffect(() => {
        // Reset or set default category when type changes
        if (type === 'gasto' && !isResgate && !editingItem) {
            setCatId('cat_7'); // Default 'Outras Despesas'
        } else if (type === 'entrada' && !editingItem) {
            setCatId('');
        }
    }, [type, isResgate]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSaveTransaction({
        type,
        isResgate: type === 'gasto' ? isResgate : undefined,
        description: desc,
        value: Number(val),
        date,
        categoryId: type !== 'investimento' && !isResgate ? catId : undefined,
        investmentId: type === 'investimento' || isResgate ? invId : undefined,
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex gap-2 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          {(['entrada', 'gasto', 'investimento'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setType(t); setIsResgate(false); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${type === t ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {type === 'gasto' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
            <input type="checkbox" id="resgate" checked={isResgate} onChange={e => setIsResgate(e.target.checked)} className="rounded text-red-600 focus:ring-red-500" />
            <label htmlFor="resgate" className="text-sm font-medium text-red-800 dark:text-red-300">É resgate de investimento?</label>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Valor</label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">R$</span>
            <input required type="number" step="0.01" value={val} onChange={e => setVal(e.target.value)} className="w-full pl-8 p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" placeholder="0,00" />
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Descrição</label>
          <input required type="text" value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" placeholder="Ex: Compras Supermercado" />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Data</label>
          <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
        </div>

        {(type === 'entrada' || (type === 'gasto' && !isResgate)) && (
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Categoria</label>
            <select required value={catId} onChange={e => setCatId(e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow">
              <option value="">Selecione...</option>
              {categories.filter(c => c.type === (type === 'gasto' ? 'gasto' : 'entrada')).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {(type === 'investimento' || isResgate) && (
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Investimento</label>
            <select required value={invId} onChange={e => setInvId(e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow">
              <option value="">Selecione...</option>
              {investments.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
        )}

        <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 shadow-md transition-all transform hover:scale-[1.02]">Salvar Lançamento</button>
      </form>
    );
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${darkMode ? 'dark' : ''}`}>
      <Fireworks active={fireworksActive} onComplete={() => setFireworksActive(false)} />
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col items-end pointer-events-none">
        <div className="pointer-events-auto">
          {toasts.map(toast => (
            <Toast key={toast.id} notification={toast} onClose={removeToast} />
          ))}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden h-16 bg-white dark:bg-gray-900 border-b dark:border-gray-800 flex items-center justify-between px-4 z-20 shadow-sm">
        <h1 className="font-extrabold text-xl tracking-tight text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <Wallet className="fill-blue-600 dark:fill-blue-400 text-white dark:text-gray-900" size={24} />
          InFinance
        </h1>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <Menu className="text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col p-6 animate-fade-in">
          <div className="flex justify-between mb-8 items-center">
            <h2 className="text-2xl font-bold dark:text-white">Menu</h2>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><X className="dark:text-white" /></button>
          </div>
          <div className="flex flex-col gap-4">
            <button onClick={() => { setActiveMobileTab('main'); setMobileMenuOpen(false); }} className="p-4 text-left font-medium bg-gray-50 dark:bg-gray-800 rounded-xl dark:text-white hover:bg-gray-100">Principal</button>
            <button onClick={() => { setActiveMobileTab('summary'); setMobileMenuOpen(false); }} className="p-4 text-left font-medium bg-gray-50 dark:bg-gray-800 rounded-xl dark:text-white hover:bg-gray-100">Resumo e Metas</button>
            <hr className="border-gray-100 dark:border-gray-800 my-2" />
            <button onClick={() => { setIsPDFModalOpen(true); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 text-left dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl"><Download size={20}/> Exportar PDF</button>
            <button onClick={exportBackup} className="flex items-center gap-3 p-3 text-left dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl"><Save size={20}/> Salvar Backup</button>
            <label className="flex items-center gap-3 p-3 text-left cursor-pointer dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">
              <Upload size={20}/> Importar Backup
              <input type="file" className="hidden" accept=".json" onChange={importBackup} />
            </label>
            <button onClick={() => setDarkMode(!darkMode)} className="flex items-center gap-3 p-3 text-left dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />} Alternar Tema
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Left (Desktop) */}
        <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 p-6 gap-2 z-10 shadow-xl">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="bg-blue-600 p-2 rounded-xl shadow-md">
               <Wallet className="text-white" size={24} />
            </div>
            <h1 className="font-bold text-2xl tracking-tight text-gray-800 dark:text-white">InFinance</h1>
          </div>
          
          <button onClick={() => { setEditingItem(null); setIsTransactionModalOpen(true); }} className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-md transition-all transform hover:scale-[1.02] mb-6">
            <Plus size={20} /> Novo Lançamento
          </button>
          
          <nav className="space-y-2 flex-1">
            <button onClick={() => setIsCategoryManagerOpen(true)} className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors font-medium overflow-hidden">
              <TrendingUp size={20} className="flex-shrink-0" /> <span className="truncate">Categorias</span>
            </button>
            <button onClick={() => setIsInvestmentManagerOpen(true)} className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors font-medium overflow-hidden">
              <DollarSign size={20} className="flex-shrink-0" /> <span className="truncate">Investimentos</span>
            </button>
            <button onClick={() => setShowGraph(!showGraph)} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors font-medium overflow-hidden ${showGraph ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600'}`}>
              <PieChart size={20} className="flex-shrink-0" /> <span className="truncate">Visualizar Gráficos</span>
            </button>
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800 space-y-1">
             <button onClick={() => setIsPDFModalOpen(true)} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors overflow-hidden"><Download size={18} className="flex-shrink-0"/> <span className="truncate">Exportar PDF</span></button>
             <button onClick={exportBackup} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors overflow-hidden"><Save size={18} className="flex-shrink-0"/> <span className="truncate">Salvar Backup</span></button>
             <label className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer overflow-hidden"><Upload size={18} className="flex-shrink-0"/> <span className="truncate">Importar Backup</span> <input type="file" className="hidden" onChange={importBackup}/></label>
             <button onClick={() => setDarkMode(!darkMode)} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors overflow-hidden">
                {darkMode ? <Sun size={18} className="flex-shrink-0"/> : <Moon size={18} className="flex-shrink-0"/>} <span className="truncate">Tema {darkMode ? 'Claro' : 'Escuro'}</span>
             </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-gray-950 p-4 md:p-6 ${activeMobileTab === 'main' ? 'block' : 'hidden md:block'}`}>
          {/* Charts Section */}
          {showGraph && (
            <div ref={chartRef} className="mb-8 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 animate-fade-in">
               <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2"><PieChart size={20} className="text-blue-500"/> Análise Visual</h3>
                  <div className="flex gap-2 flex-wrap">
                     <input type="date" value={chartConfig.startDate} onChange={e=>setChartConfig(p=>({...p, startDate:e.target.value}))} className="text-xs p-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"/>
                     <input type="date" value={chartConfig.endDate} onChange={e=>setChartConfig(p=>({...p, endDate:e.target.value}))} className="text-xs p-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"/>
                     <select value={chartConfig.chartType} onChange={e=>setChartConfig(p=>({...p, chartType: e.target.value as any}))} className="text-xs p-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="pie">Setores</option>
                        <option value="bar">Colunas</option>
                     </select>
                     <select value={chartConfig.dataType} onChange={e=>setChartConfig(p=>({...p, dataType: e.target.value as any}))} className="text-xs p-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="both">Ambos</option>
                        <option value="gasto">Gastos</option>
                        <option value="investimento">Investimentos</option>
                     </select>
                  </div>
               </div>
               <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartConfig.chartType === 'pie' ? (
                      <RePieChart>
                         <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
                            {chartData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                         </Pie>
                         <Tooltip content={<CustomTooltip />} />
                         <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </RePieChart>
                    ) : (
                      <BarChart data={chartData} barSize={40}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                         <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} tickFormatter={(value) => `R$${value}`} />
                         <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                         <Legend verticalAlign="top" align="right" iconType="circle" />
                         <Bar dataKey="gasto" fill="#EF4444" name="Gastos" radius={[4, 4, 0, 0]} />
                         <Bar dataKey="investimento" fill="#3B82F6" name="Investimentos" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
               </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
             <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Transações Recentes</h2>
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Pesquisar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow shadow-sm"
                />
             </div>
          </div>
          
          <div className="space-y-6 pb-20">
            {Object.keys(groupedTransactions).map(month => (
              <div key={month} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden animate-fade-in">
                <div className="px-6 py-3 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div> {month}
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                     <thead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                       <tr>
                         <th className="px-6 py-4 bg-transparent">Data</th>
                         <th className="px-6 py-4 bg-transparent">Descrição</th>
                         <th className="px-6 py-4 bg-transparent">Categoria/Inv</th>
                         <th className="px-6 py-4 bg-transparent">Tipo</th>
                         <th className="px-6 py-4 bg-transparent text-right">Valor</th>
                         <th className="px-6 py-4 bg-transparent text-center">Ações</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {groupedTransactions[month].map(t => {
                          const isExpense = t.type === 'gasto';
                          const isInv = t.type === 'investimento';
                          const catName = t.categoryId ? categories.find(c=>c.id===t.categoryId)?.name : (t.investmentId ? investments.find(i=>i.id===t.investmentId)?.name : '-');
                          return (
                            <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition duration-150 group">
                              <td className="px-6 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                              <td className="px-6 py-4 text-gray-900 dark:text-white font-medium max-w-xs truncate">{t.description}</td>
                              <td className="px-6 py-4 text-gray-500 dark:text-gray-500 max-w-xs truncate">
                                <span className="inline-block px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs truncate">{catName}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${isExpense ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' : isInv ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'}`}>
                                  {t.type === 'entrada' ? <ArrowUp size={12}/> : isExpense ? <ArrowDown size={12}/> : <TrendingUp size={12}/>}
                                  {t.type.toUpperCase()}
                                </span>
                              </td>
                              <td className={`px-6 py-4 font-bold text-right whitespace-nowrap ${isExpense ? 'text-red-600 dark:text-red-400' : isInv ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
                                {t.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setEditingItem(t); setIsTransactionModalOpen(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                  <button onClick={() => handleDelete('transaction', t.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                     </tbody>
                   </table>
                </div>
              </div>
            ))}
            {Object.keys(groupedTransactions).length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-full mb-4">
                   <Search className="text-gray-400" size={32} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhuma transação encontrada</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                   {searchTerm ? `Nenhum resultado para "${searchTerm}"` : "Comece adicionando seu primeiro lançamento financeiro."}
                </p>
                {!searchTerm && (
                   <button onClick={() => { setEditingItem(null); setIsTransactionModalOpen(true); }} className="mt-4 text-blue-600 font-semibold hover:underline">Criar Lançamento</button>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Sidebar Right */}
        <aside className={`md:flex flex-col w-full md:w-80 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 p-5 gap-5 overflow-y-auto custom-scrollbar md:static absolute inset-0 md:inset-auto z-10 ${activeMobileTab === 'summary' ? 'flex' : 'hidden'}`}>
           {/* Static Content (Summary) */}
           <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Resumo Geral</h2>
              
              <div className="p-6 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-lg transform transition hover:scale-[1.02]">
                <h3 className="text-sm opacity-90 font-medium mb-1">Saldo Atual</h3>
                <p className="text-3xl font-bold tracking-tight">{currentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                 <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                   <div className="flex justify-between items-start">
                     <div>
                       <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Entradas</h3>
                       <p className="text-xl font-bold text-green-600 dark:text-green-400">{totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                     </div>
                     <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                        <ArrowUp size={20}/>
                     </div>
                   </div>
                 </div>
                 
                 <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                   <div className="flex justify-between items-start">
                     <div>
                       <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Gastos</h3>
                       <p className="text-xl font-bold text-red-600 dark:text-red-400">{totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                     </div>
                     <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                        <ArrowDown size={20}/>
                     </div>
                   </div>
                 </div>

                 <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group col-span-2 md:col-span-1">
                   <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                   <div className="flex justify-between items-start">
                     <div>
                       <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Investido</h3>
                       <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalInvestedCurrent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                     </div>
                     <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                        <TrendingUp size={20}/>
                     </div>
                   </div>
                 </div>
              </div>
           </div>

           {/* Goals Progress Content Flowing Naturally */}
           <div className="mt-2 space-y-4 pb-4">
             <h2 className="text-xl font-bold text-gray-800 dark:text-white">Progresso de Metas</h2>
             <div className="space-y-4">
                {investmentBalances.map(inv => {
                   const percent = Math.min(100, Math.max(0, (inv.calculatedValue / inv.goalValue) * 100));
                   const isCompleted = percent >= 100;
                   return (
                     <div key={inv.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition hover:shadow-md">
                        <div className="flex justify-between text-sm mb-2">
                           <span className="font-bold text-gray-800 dark:text-white flex items-center gap-1">
                             {inv.name}
                             {isCompleted && <CheckCircle size={14} className="text-green-500" />}
                           </span>
                           <span className={`font-semibold ${isCompleted ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>{Math.round(percent)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                           <div className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-green-500' : ''}`} style={{ width: `${percent}%`, backgroundColor: isCompleted ? undefined : (inv.color || '#3B82F6') }}></div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                           <span>{inv.calculatedValue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                           <span>Meta: {inv.goalValue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                        </div>
                     </div>
                   );
                })}
                {investmentBalances.length === 0 && (
                   <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                     <p className="text-sm text-gray-500">Nenhuma meta de investimento definida.</p>
                     <button onClick={() => { setEditingItem(null); setIsInvestmentEditorOpen(true); }} className="mt-2 text-sm text-blue-600 font-semibold hover:underline">Criar Meta</button>
                   </div>
                )}
             </div>
           </div>
        </aside>
      </div>

      {/* Footer Mobile (Navigation) */}
      <footer className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-around p-2 z-20 pb-4">
         <button onClick={() => { setEditingItem(null); setIsTransactionModalOpen(true); }} className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors">
            <Plus size={24} /> <span className="text-[10px] font-medium">Novo</span>
         </button>
         <button onClick={() => setIsCategoryManagerOpen(true)} className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors">
            <TrendingUp size={24} /> <span className="text-[10px] font-medium">Categ</span>
         </button>
         <button onClick={() => setIsInvestmentManagerOpen(true)} className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors">
            <DollarSign size={24} /> <span className="text-[10px] font-medium">Inv</span>
         </button>
         <button onClick={() => setShowGraph(!showGraph)} className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors">
            <PieChart size={24} /> <span className="text-[10px] font-medium">Gráfico</span>
         </button>
      </footer>

      {/* --- MODALS --- */}

      {/* Transaction Modal */}
      <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title={editingItem ? "Editar Lançamento" : "Novo Lançamento"}>
         <TransactionForm />
      </Modal>

      {/* CATEGORY SYSTEM */}
      {/* 1. Category Manager (List) */}
      <Modal isOpen={isCategoryManagerOpen} onClose={() => setIsCategoryManagerOpen(false)} title="Gerenciar Categorias">
         <div className="space-y-4">
             <button onClick={() => { setEditingItem(null); setIsCategoryEditorOpen(true); }} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all font-medium">
               <Plus size={18} /> Criar Nova Categoria
             </button>

             <div className="max-h-[50vh] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {categories.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 overflow-hidden">
                       <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0" style={{backgroundColor: c.color + '33'}}> {/* 20% opacity */}
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: c.color}}></div>
                       </div>
                       <div className="overflow-hidden">
                         <span className="block font-semibold text-gray-800 dark:text-gray-200 truncate">{c.name}</span>
                         <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">{c.type}</span>
                       </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => { setEditingItem(c); setIsCategoryEditorOpen(true); }} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"><Edit2 size={16}/></button>
                      <button onClick={() => handleDelete('category', c.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
             </div>
         </div>
      </Modal>

      {/* 2. Category Editor (Form) - Nested on top */}
      <Modal isOpen={isCategoryEditorOpen} onClose={() => setIsCategoryEditorOpen(false)} title={editingItem ? 'Editar Categoria' : 'Nova Categoria'} zIndex={60}>
         <form onSubmit={(e) => {
             e.preventDefault();
             const formData = new FormData(e.currentTarget);
             handleSaveCategory({
               name: formData.get('name') as string,
               color: formData.get('color') as string,
               type: formData.get('type') as 'entrada'|'gasto',
             });
             e.currentTarget.reset();
         }} className="space-y-4">
             <div>
               <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Nome</label>
               <input name="name" placeholder="Ex: Educação" defaultValue={editingItem?.name} required className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:text-white dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500"/>
             </div>
             
             <div className="flex gap-4">
               <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Cor</label>
                  <div className="h-12 w-16 relative overflow-hidden rounded-xl border dark:border-gray-700">
                    <input type="color" name="color" defaultValue={editingItem?.color || '#3B82F6'} className="absolute -top-2 -left-2 w-24 h-24 cursor-pointer p-0 border-0"/>
                  </div>
               </div>
               <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Tipo</label>
                  <select name="type" defaultValue={editingItem?.type || 'gasto'} className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:text-white dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 h-12">
                    <option value="gasto">Gasto</option>
                    <option value="entrada">Entrada</option>
                  </select>
               </div>
             </div>
             <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-md transition-transform hover:scale-[1.02] mt-2">Salvar Categoria</button>
         </form>
      </Modal>


      {/* INVESTMENT SYSTEM */}
      {/* 1. Investment Manager (List) */}
      <Modal isOpen={isInvestmentManagerOpen} onClose={() => setIsInvestmentManagerOpen(false)} title="Gerenciar Investimentos">
        <div className="space-y-4">
            <button onClick={() => { setEditingItem(null); setIsInvestmentEditorOpen(true); }} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all font-medium">
               <Plus size={18} /> Criar Novo Investimento
            </button>
            
            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {investments.map(i => (
                  <div key={i.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 overflow-hidden">
                       <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0" style={{backgroundColor: i.color + '33'}}>
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: i.color}}></div>
                       </div>
                       <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-semibold dark:text-gray-200 truncate">{i.name}</span>
                          <span className="text-xs text-gray-500">Meta: {i.goalValue.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span>
                       </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => { setEditingItem(i); setIsInvestmentEditorOpen(true); }} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"><Edit2 size={16}/></button>
                      <button onClick={() => handleDelete('investment', i.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
            </div>
        </div>
      </Modal>

      {/* 2. Investment Editor (Form) - Nested */}
      <Modal isOpen={isInvestmentEditorOpen} onClose={() => setIsInvestmentEditorOpen(false)} title={editingItem ? 'Editar Investimento' : 'Novo Investimento'} zIndex={60}>
         <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSaveInvestment({
               name: formData.get('name') as string,
               description: formData.get('description') as string,
               color: formData.get('color') as string,
               goalValue: Number(formData.get('goalValue')),
            });
            e.currentTarget.reset();
         }} className="space-y-4">
            <div>
               <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Nome</label>
               <input name="name" placeholder="Ex: Reserva de Emergência" defaultValue={editingItem?.name} required className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:text-white dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
               <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Descrição</label>
               <input name="description" placeholder="Opcional" defaultValue={editingItem?.description} className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:text-white dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div className="flex gap-4">
               <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Cor</label>
                  <div className="h-12 w-16 relative overflow-hidden rounded-xl border dark:border-gray-700">
                     <input type="color" name="color" defaultValue={editingItem?.color || '#3B82F6'} className="absolute -top-2 -left-2 w-24 h-24 cursor-pointer p-0 border-0"/>
                  </div>
               </div>
               <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Meta (Valor)</label>
                  <input name="goalValue" type="number" placeholder="0,00" defaultValue={editingItem?.goalValue} required className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:text-white dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 h-12"/>
               </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-md transition-transform hover:scale-[1.02] mt-2">Salvar Investimento</button>
         </form>
      </Modal>

      <Modal isOpen={isPDFModalOpen} onClose={() => setIsPDFModalOpen(false)} title="Exportar Relatório PDF">
        <div className="space-y-4">
           <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Título do Relatório</label>
              <input type="text" value={pdfConfig.title} onChange={e=>setPdfConfig(p=>({...p, title:e.target.value}))} className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:text-white dark:border-gray-700 outline-none focus:ring-2 focus:ring-purple-500"/>
           </div>
           <div className="flex gap-4">
              <div className="flex-1">
                 <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Início</label>
                 <input type="date" value={pdfConfig.startDate} onChange={e=>setPdfConfig(p=>({...p, startDate:e.target.value}))} className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:text-white dark:border-gray-700 outline-none focus:ring-2 focus:ring-purple-500"/>
              </div>
              <div className="flex-1">
                 <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Fim</label>
                 <input type="date" value={pdfConfig.endDate} onChange={e=>setPdfConfig(p=>({...p, endDate:e.target.value}))} className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:text-white dark:border-gray-700 outline-none focus:ring-2 focus:ring-purple-500"/>
              </div>
           </div>
           
           <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30">
               <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={pdfConfig.includeChart} onChange={e=>setPdfConfig(p=>({...p, includeChart:e.target.checked}))} className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Incluir Gráfico Visual no PDF</span>
               </label>
           </div>

           <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Filtro</label>
                  <select value={pdfConfig.filterType} onChange={e=>setPdfConfig(p=>({...p, filterType: e.target.value as any}))} className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:text-white dark:border-gray-700 outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="all">Tudo</option>
                    <option value="entrada">Apenas Entradas</option>
                    <option value="gasto">Apenas Gastos</option>
                    <option value="investimento">Apenas Investimentos</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Ordenar por</label>
                  <select value={pdfConfig.sortBy} onChange={e=>setPdfConfig(p=>({...p, sortBy: e.target.value as any}))} className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:text-white dark:border-gray-700 outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="date">Data</option>
                    <option value="value">Valor</option>
                    <option value="name">Descrição</option>
                  </select>
               </div>
           </div>
           
           <button onClick={handleExportPDF} className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 shadow-md transition-transform hover:scale-[1.02] mt-2">Baixar Relatório PDF</button>
        </div>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={confirmDelete}
        message="Tem certeza que deseja excluir este item? Esta ação não poderá ser desfeita."
      />
    </div>
  );
}