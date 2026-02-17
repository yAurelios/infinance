import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, PieChart, Download, Save, Upload, Sun, Moon, 
  Trash2, Edit2, TrendingUp, DollarSign, Wallet, ArrowDown, ArrowUp, Menu, X, Filter, Search, Bell, CheckCircle, AlertCircle, LayoutGrid, Calendar, Home
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell 
} from 'recharts';
import { Transaction, Category, Investment, BackupData, ChartConfig, PDFExportConfig } from './types';
import { DEFAULT_CATEGORIES, COLORS } from './constants';
import Fireworks from './components/Fireworks';
import { generatePDF } from './services/pdfService';
import html2canvas from 'html2canvas';

// Components
import { Modal, ConfirmModal } from './components/ui/Modal';
import { Toast, ToastNotification } from './components/ui/Toast';
import { TransactionForm } from './components/forms/TransactionForm';
import { CategoryForm } from './components/forms/CategoryForm';
import { InvestmentForm } from './components/forms/InvestmentForm';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 shadow-xl rounded-xl z-50">
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

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  
  const [showGraph, setShowGraph] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'main' | 'summary'>('main');

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false);
  const [isInvestmentManagerOpen, setIsInvestmentManagerOpen] = useState(false);
  const [isInvestmentEditorOpen, setIsInvestmentEditorOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<{type: 'transaction'|'category'|'investment', id: string} | null>(null);

  const [fireworksActive, setFireworksActive] = useState(false);

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
    const data: BackupData = { transactions, categories, investments, theme: darkMode ? 'dark' : 'light' };
    localStorage.setItem('infinance_data', JSON.stringify(data));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [transactions, categories, investments, darkMode]);

  const { totalIncome, totalExpenses, totalInvestedFlow, investmentStats } = useMemo(() => {
    let income = 0; let expenses = 0; let investedFlow = 0;
    const stats: Record<string, { invested: number; rescued: number }> = {};
    for (const t of transactions) {
      if (t.type === 'entrada') income += t.value;
      else if (t.type === 'gasto') {
        if (!t.isResgate) expenses += t.value;
        else if (t.investmentId) {
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

  const addToast = (message: string, type: 'success' | 'info' | 'celebrate' | 'transaction' = 'info') => {
    setToasts(prev => [...prev, { id: crypto.randomUUID(), message, type }]);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleDelete = (type: 'transaction'|'category'|'investment', id: string) => {
    setDeletingItem({ type, id });
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingItem) return;
    if (deletingItem.type === 'transaction') setTransactions(prev => prev.filter(t => t.id !== deletingItem.id));
    else if (deletingItem.type === 'category') setCategories(prev => prev.filter(c => c.id !== deletingItem.id));
    else if (deletingItem.type === 'investment') setInvestments(prev => prev.filter(i => i.id !== deletingItem.id));
    setIsConfirmOpen(false);
    setDeletingItem(null);
    addToast("Item excluído com sucesso", 'info');
  };

  const handleSaveTransaction = (data: Partial<Transaction>) => {
    if (data.type === 'gasto' && !data.isResgate && (data.value || 0) > currentBalance) {
        alert("Erro: O saldo atual não comporta este gasto.");
        return;
    }
    
    if (data.type === 'investimento' && data.investmentId) {
      const inv = investmentBalances.find(i => i.id === data.investmentId);
      if (inv && (inv.calculatedValue + (data.value || 0)) >= inv.goalValue && inv.calculatedValue < inv.goalValue) {
        setFireworksActive(true);
        addToast(`Meta atingida de investimento: ${inv.name}!`, 'celebrate');
      }
    }

    if (editingItem) {
      setTransactions(prev => prev.map(t => t.id === editingItem.id ? { ...t, ...data } as Transaction : t));
      addToast(`Lançamento "${data.description || 'S/D'}" atualizado`, 'transaction');
    } else {
      setTransactions(prev => [...prev, { ...data, id: crypto.randomUUID() } as Transaction]);
      addToast(`Novo lançamento "${data.description || 'S/D'}" registrado`, 'transaction');
    }
    
    setIsTransactionModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveCategory = (data: Partial<Category>) => {
    if (editingItem) {
      setCategories(prev => prev.map(c => c.id === editingItem.id ? { ...c, ...data } as Category : c));
      addToast(`Categoria "${data.name}" atualizada`, 'success');
    } else {
      setCategories(prev => [...prev, { ...data, id: crypto.randomUUID() } as Category]);
      addToast(`Categoria "${data.name}" criada`, 'success');
    }
    setIsCategoryEditorOpen(false);
    setEditingItem(null);
  };

  const handleSaveInvestment = (data: Partial<Investment>) => {
    if (editingItem) {
      setInvestments(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...data } as Investment : i));
      addToast(`Meta "${data.name}" atualizada`, 'success');
    } else {
      setInvestments(prev => [...prev, { ...data, id: crypto.randomUUID(), currentValue: 0 } as Investment]);
      addToast(`Nova meta "${data.name}" definida`, 'success');
    }
    setIsInvestmentEditorOpen(false);
    setEditingItem(null);
  };

  const exportBackup = () => {
    const data = JSON.stringify({ transactions, categories, investments, theme: darkMode ? 'dark' : 'light' });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `backup-infinance.json`; a.click();
    addToast("Backup gerado com sucesso", 'info');
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setTransactions(data.transactions || []); 
        setCategories(data.categories || DEFAULT_CATEGORIES); 
        setInvestments(data.investments || []);
        addToast("Backup restaurado!", 'success');
      } catch (err) { alert("Erro ao importar."); }
    };
    reader.readAsText(file);
    // Reset file input value to allow re-importing same file if needed
    e.target.value = '';
  };

  const handleExportPDF = async () => {
    let chartUri = undefined;
    if (pdfConfig.includeChart && chartRef.current) {
        // Ensure graph is visible (it is currently the only view if modal is open, but just in case)
        const canvas = await html2canvas(chartRef.current);
        chartUri = canvas.toDataURL('image/png');
    }
    generatePDF(transactions, categories, investments, pdfConfig, chartUri);
    setIsPDFModalOpen(false);
    addToast("PDF exportado com sucesso", 'success');
  };

  const groupedTransactions = useMemo(() => {
    const filtered = transactions.filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const grouped: Record<string, Transaction[]> = {};
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).forEach(t => {
      const monthYear = new Date(t.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      if (!grouped[monthYear]) grouped[monthYear] = [];
      grouped[monthYear].push(t);
    });
    return grouped;
  }, [transactions, searchTerm]);

  const chartData = useMemo(() => {
    const filtered = transactions.filter(t => t.date >= chartConfig.startDate && t.date <= chartConfig.endDate);
    if (chartConfig.chartType === 'pie') {
        const dataMap: Record<string, number> = {};
        filtered.forEach(t => {
            if (chartConfig.dataType === 'both' || t.type === (chartConfig.dataType === 'gasto' ? 'gasto' : 'investimento')) {
                 if(t.type === 'entrada') return;
                 const key = t.type === 'gasto' ? categories.find(c => c.id === t.categoryId)?.name || 'Outros' : investments.find(i => i.id === t.investmentId)?.name || 'Inv.';
                 dataMap[key] = (dataMap[key] || 0) + t.value;
            }
        });
        return Object.keys(dataMap).map(name => ({ name, value: dataMap[name] }));
    } else {
        const dataMap: Record<string, { dateStr: string, name: string, gasto: number, investimento: number, timestamp: number }> = {};
        filtered.forEach(t => {
             const dateKey = t.date; 
             if (!dataMap[dateKey]) {
                 // Creating date object with time to avoid timezone issues when converting to string
                 const d = new Date(t.date + 'T12:00:00');
                 dataMap[dateKey] = { 
                     dateStr: dateKey,
                     name: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), 
                     gasto: 0, 
                     investimento: 0,
                     timestamp: d.getTime()
                 };
             }
             if (t.type === 'gasto') dataMap[dateKey].gasto += t.value;
             if (t.type === 'investimento') dataMap[dateKey].investimento += t.value;
        });
        return Object.values(dataMap).sort((a, b) => a.timestamp - b.timestamp);
    }
  }, [transactions, categories, investments, chartConfig]);

  return (
    <div className={`flex flex-col h-full overflow-hidden ${darkMode ? 'dark' : ''}`}>
      <Fireworks active={fireworksActive} onComplete={() => setFireworksActive(false)} />
      
      {/* Pop-ups de alerta no canto inferior esquerdo */}
      <div className="fixed bottom-4 left-4 z-[100] flex flex-col items-start pointer-events-none">
        {toasts.map(toast => <Toast key={toast.id} notification={toast} onClose={removeToast} />)}
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end" role="dialog">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity opacity-100" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative w-72 h-full bg-white dark:bg-gray-900 shadow-2xl p-6 flex flex-col animate-slide-left border-l dark:border-gray-800">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2 text-blue-600 font-extrabold text-xl">
                   <Wallet size={24} /> <span>Menu</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500"><X size={20}/></button>
             </div>
             
             <div className="space-y-4 flex-1">
                <button onClick={() => { setIsPDFModalOpen(true); setMobileMenuOpen(false); }} className="flex items-center gap-3 w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-bold text-gray-600 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                   <Download size={20} /> Exportar Relatório
                </button>
                <button onClick={exportBackup} className="flex items-center gap-3 w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-bold text-gray-600 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                   <Save size={20} /> Salvar Backup
                </button>
                <label className="flex items-center gap-3 w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-bold text-gray-600 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                   <Upload size={20} /> Restaurar Backup
                   <input type="file" onChange={importBackup} className="hidden" accept=".json" />
                </label>
                <button onClick={() => setDarkMode(!darkMode)} className="flex items-center gap-3 w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-bold text-gray-600 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                   {darkMode ? <Sun size={20} /> : <Moon size={20} />} Alternar Tema
                </button>
             </div>

             <div className="text-center text-xs text-gray-400 font-bold mt-4">
                InFinance v1.0
             </div>
          </div>
        </div>
      )}

      <div className="md:hidden h-16 bg-white dark:bg-gray-900 border-b dark:border-gray-800 flex items-center justify-between px-4 z-20">
        <h1 className="font-extrabold text-xl tracking-tight text-blue-600 flex items-center gap-2"><Wallet size={24} /> InFinance</h1>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><Menu className="dark:text-white" /></button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-800 p-6 gap-2 z-10 shadow-xl">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="bg-blue-600 p-2 rounded-xl"><Wallet className="text-white" size={24} /></div>
            <h1 className="font-bold text-2xl dark:text-white">InFinance</h1>
          </div>
          <button onClick={() => { setEditingItem(null); setIsTransactionModalOpen(true); }} className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all mb-6 shadow-lg shadow-blue-500/20 active:scale-95">+ Novo Lançamento</button>
          <nav className="space-y-2 flex-1">
            <button onClick={() => setIsCategoryManagerOpen(true)} className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all font-bold group"><TrendingUp size={20} className="group-hover:text-blue-500 transition-colors" /> Categorias</button>
            <button onClick={() => setIsInvestmentManagerOpen(true)} className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all font-bold group"><DollarSign size={20} className="group-hover:text-blue-500 transition-colors" /> Metas de Inv.</button>
            <button onClick={() => setShowGraph(!showGraph)} className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all font-bold group ${showGraph ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}><PieChart size={20} className="group-hover:text-blue-500 transition-colors" /> Análise Visual</button>
          </nav>
          <div className="mt-auto border-t dark:border-gray-800 pt-4 space-y-1">
             <button onClick={() => setIsPDFModalOpen(true)} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"><Download size={18}/> Exportar PDF</button>
             <button onClick={exportBackup} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"><Save size={18}/> Salvar Backup</button>
             <label className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
               <Upload size={18}/> 
               <span>Restaurar Backup</span>
               <input type="file" onChange={importBackup} className="hidden" accept=".json" />
             </label>
             <button onClick={() => setDarkMode(!darkMode)} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">{darkMode ? <Sun size={18}/> : <Moon size={18}/>} Tema</button>
          </div>
        </aside>

        <main className={`flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-gray-950 p-4 md:p-6 pb-24 md:pb-6 ${activeMobileTab === 'main' ? 'block' : 'hidden md:block'}`}>
          {showGraph ? (
             <div className="flex flex-col h-full animate-fade-in space-y-4">
                <div className="flex justify-between items-center mb-2">
                   <h2 className="text-2xl font-extrabold dark:text-white tracking-tight flex items-center gap-2">
                      <PieChart className="text-blue-500" size={28}/> Análise Visual
                   </h2>
                   <button onClick={() => setShowGraph(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                     <X size={24} className="text-gray-500 dark:text-gray-400" />
                   </button>
                </div>
                
                <div ref={chartRef} className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-[32px] border dark:border-gray-800 shadow-xl flex-1 flex flex-col overflow-hidden relative">
                    <div className="flex flex-wrap gap-4 mb-6 items-center justify-between z-10">
                        {/* Filters */}
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
                          <button 
                            onClick={() => setChartConfig(p => ({...p, chartType: 'bar'}))}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${chartConfig.chartType === 'bar' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                          >
                            <LayoutGrid size={16} /> Colunas
                          </button>
                          <button 
                            onClick={() => setChartConfig(p => ({...p, chartType: 'pie'}))}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${chartConfig.chartType === 'pie' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                          >
                            <PieChart size={16} /> Setores
                          </button>
                        </div>
                        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
                           <div className="flex items-center gap-2 px-2">
                             <Calendar size={14} className="text-gray-400"/>
                             <input type="date" value={chartConfig.startDate} onChange={e=>setChartConfig(p=>({...p, startDate:e.target.value}))} className="text-xs bg-transparent border-none outline-none dark:text-white font-bold w-24"/>
                           </div>
                           <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                           <div className="flex items-center gap-2 px-2">
                             <input type="date" value={chartConfig.endDate} onChange={e=>setChartConfig(p=>({...p, endDate:e.target.value}))} className="text-xs bg-transparent border-none outline-none dark:text-white font-bold w-24"/>
                           </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        {chartConfig.chartType === 'pie' ? (
                          <RePieChart><Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={4}>
                                {chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />)}
                             </Pie><Tooltip content={<CustomTooltip />} /></RePieChart>
                        ) : (
                          <BarChart data={chartData} barSize={60} margin={{top: 20, right: 10, left: 0, bottom: 20}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} stroke="#9CA3AF"/>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#9CA3AF'}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#9CA3AF'}} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: darkMode ? '#1f2937' : '#f3f4f6', opacity: 0.5, radius: 8}} />
                            <Bar dataKey="gasto" name="Gastos" fill="#EF4444" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="investimento" name="Investimentos" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                </div>
             </div>
          ) : (
             <>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                   <h2 className="text-2xl font-extrabold dark:text-white tracking-tight">Transações Recentes</h2>
                   <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input type="text" placeholder="Filtrar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"/>
                   </div>
                </div>
                
                <div className="space-y-6 pb-20">
                  {Object.keys(groupedTransactions).map(month => (
                    <div key={month} className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-gray-50 dark:border-gray-800 overflow-hidden shadow-sm">
                      <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-b-2 border-gray-50 dark:border-gray-800 font-extrabold text-gray-400 uppercase text-xs tracking-widest">{month}</div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800/50">
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4">Descrição</th>
                            <th className="px-6 py-4 text-right">Valor</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                          {groupedTransactions[month].map(t => (
                            <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 group transition-colors">
                              <td className="px-6 py-5 whitespace-nowrap text-gray-400 font-bold text-xs">{new Date(t.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}</td>
                              <td className="px-6 py-5">
                                <p className="font-bold dark:text-white group-hover:text-blue-600 transition-colors">{t.description || <span className="italic opacity-40">Sem descrição</span>}</p>
                                <p className="text-[10px] uppercase font-extrabold tracking-tighter text-gray-400">
                                   {t.type === 'investimento' ? 'Investimento' : (categories.find(c => c.id === t.categoryId)?.name || 'Outros')}
                                </p>
                              </td>
                              <td className="px-6 py-5 font-black text-right whitespace-nowrap text-base" style={{color: t.type === 'gasto' ? '#EF4444' : t.type === 'investimento' ? '#3B82F6' : '#10B981'}}>
                                {t.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                              <td className="px-6 py-5 text-center">
                                <div className="flex justify-center items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setEditingItem(t); setIsTransactionModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"><Edit2 size={16}/></button>
                                  <button onClick={() => handleDelete('transaction', t.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"><Trash2 size={16}/></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                  {Object.keys(groupedTransactions).length === 0 && (
                    <div className="py-20 text-center space-y-6 animate-fade-in">
                      <div className="bg-gray-100 dark:bg-gray-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-4">
                        <LayoutGrid size={48} strokeWidth={1.5} />
                      </div>
                      <div className="space-y-2">
                         <h3 className="text-xl font-bold dark:text-white">Nenhuma transação registrada</h3>
                         <p className="text-gray-400">Comece adicionando seus ganhos e gastos para ver a mágica acontecer.</p>
                      </div>
                      <button 
                        onClick={() => { setEditingItem(null); setIsTransactionModalOpen(true); }} 
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-2 mx-auto"
                      >
                        <Plus size={20} />
                        Criar primeiro lançamento
                      </button>
                    </div>
                  )}
                </div>
             </>
          )}
        </main>

        <aside className="md:flex flex-col w-full md:w-80 bg-white dark:bg-gray-900 border-l dark:border-gray-800 p-6 gap-6 overflow-y-auto custom-scrollbar md:static absolute inset-0 z-10 hidden">
           <div className="space-y-6">
              <h2 className="text-xl font-black dark:text-white tracking-tight">Resumo Geral</h2>
              <div className="p-8 rounded-[32px] bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-2xl shadow-gold-500/30 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                <h3 className="text-xs opacity-90 font-black uppercase tracking-widest mb-2">Saldo em Conta</h3>
                <p className="text-3xl font-black">{currentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 <div className="p-6 bg-white dark:bg-gray-800 border-2 border-gray-50 dark:border-gray-800 rounded-[24px] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Entradas</h3>
                    <p className="text-xl font-black text-green-600">{totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                 </div>
                 <div className="p-6 bg-white dark:bg-gray-800 border-2 border-gray-50 dark:border-gray-800 rounded-[24px] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gastos</h3>
                    <p className="text-xl font-black text-red-600">{totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                 </div>
                 <div className="p-6 bg-white dark:bg-gray-800 border-2 border-gray-50 dark:border-gray-800 rounded-[24px] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total em Metas</h3>
                    <p className="text-xl font-black text-blue-600">{totalInvestedCurrent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                 </div>
              </div>
           </div>
           <div className="mt-2 space-y-6">
             <div className="flex justify-between items-center">
               <h2 className="text-xl font-black dark:text-white tracking-tight">Suas Metas</h2>
               <button onClick={() => setIsInvestmentManagerOpen(true)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-blue-600"><Plus size={16} /></button>
             </div>
             <div className="space-y-5">
                {investmentBalances.map(inv => {
                   const percent = Math.min(100, (inv.calculatedValue / inv.goalValue) * 100);
                   return (
                     <div key={inv.id} className="bg-white dark:bg-gray-800 p-5 rounded-[24px] border-2 border-gray-50 dark:border-gray-800 shadow-sm group hover:border-blue-200 dark:hover:border-blue-900 transition-all">
                        <div className="flex justify-between text-xs mb-3 font-black dark:text-white uppercase tracking-tighter">
                          <span>{inv.name}</span>
                          <span className="text-blue-500">{Math.round(percent)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                           <div className="h-full bg-blue-500 transition-all duration-1000 ease-out" style={{ width: `${percent}%`, backgroundColor: inv.color }}></div>
                        </div>
                        <div className="mt-3 flex justify-between text-[10px] font-bold text-gray-400">
                          <span>{inv.calculatedValue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                          <span>Meta: {inv.goalValue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                        </div>
                     </div>
                   );
                })}
                {investmentBalances.length === 0 && <p className="text-center text-gray-400 text-xs font-bold py-10">Crie metas para monitorar seu progresso!</p>}
             </div>
           </div>
        </aside>
      </div>

      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-between items-end px-2 py-4 z-50 h-auto">
        <button 
          onClick={() => setShowGraph(false)} 
          className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 ${!showGraph ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
        >
          <Home size={!showGraph ? 24 : 22} strokeWidth={!showGraph ? 2.5 : 2} />
          <span className={`text-[10px] font-bold mt-1 ${!showGraph ? 'block' : 'hidden'}`}>Início</span>
        </button>

        <button 
          onClick={() => setShowGraph(true)} 
          className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 ${showGraph ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
        >
          <PieChart size={showGraph ? 24 : 22} strokeWidth={showGraph ? 2.5 : 2} />
          <span className={`text-[10px] font-bold mt-1 ${showGraph ? 'block' : 'hidden'}`}>Análise</span>
        </button>

        <div className="relative top-8">
          <button 
            onClick={() => { setEditingItem(null); setIsTransactionModalOpen(true); }} 
            className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl shadow-blue-600/30 transform transition-transform active:scale-95 border-4 border-gray-50 dark:border-gray-950"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        </div>

        <button 
          onClick={() => setIsInvestmentManagerOpen(true)} 
          className="flex flex-col items-center justify-center w-16 h-14 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        >
          <DollarSign size={22} />
          <span className="text-[10px] font-medium mt-1">Metas</span>
        </button>

        <button 
          onClick={() => setIsCategoryManagerOpen(true)} 
          className="flex flex-col items-center justify-center w-16 h-14 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        >
          <TrendingUp size={22} />
          <span className="text-[10px] font-medium mt-1">Categ.</span>
        </button>
      </footer>

      {/* MODALS */}
      <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title={editingItem ? "Editar Lançamento" : "Novo Lançamento"}>
         <TransactionForm 
            editingItem={editingItem} 
            categories={categories} 
            investments={investments} 
            currentBalance={currentBalance} 
            onSave={handleSaveTransaction} 
          />
      </Modal>

      <Modal isOpen={isCategoryManagerOpen} onClose={() => setIsCategoryManagerOpen(false)} title="Gerenciar Categorias">
         <div className="space-y-4">
             <button onClick={() => { setEditingItem(null); setIsCategoryEditorOpen(true); }} className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-blue-600 hover:border-blue-500 transition-all font-bold">+ Criar Nova Categoria</button>
             <div className="max-h-[50vh] overflow-y-auto space-y-2 custom-scrollbar">
                {categories.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-transparent hover:border-blue-100 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full shadow-sm" style={{backgroundColor: c.color}}></div>
                      <span className="font-bold dark:text-gray-200">{c.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingItem(c); setIsCategoryEditorOpen(true); }} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-white rounded-xl transition-all"><Edit2 size={16}/></button>
                      <button onClick={() => handleDelete('category', c.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
             </div>
         </div>
      </Modal>

      <Modal isOpen={isCategoryEditorOpen} onClose={() => setIsCategoryEditorOpen(false)} title={editingItem ? 'Editar Categoria' : 'Nova Categoria'} zIndex={60}>
         <CategoryForm editingItem={editingItem} onSave={handleSaveCategory} />
      </Modal>

      <Modal isOpen={isInvestmentManagerOpen} onClose={() => setIsInvestmentManagerOpen(false)} title="Gerenciar Metas">
        <div className="space-y-4">
            <button onClick={() => { setEditingItem(null); setIsInvestmentEditorOpen(true); }} className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-indigo-600 hover:border-indigo-500 transition-all font-bold">+ Definir Nova Meta</button>
            <div className="max-h-[50vh] overflow-y-auto space-y-2 custom-scrollbar">
                {investments.map(i => (
                  <div key={i.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-transparent hover:border-indigo-100 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full shadow-sm" style={{backgroundColor: i.color}}></div>
                      <span className="font-bold dark:text-gray-200">{i.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingItem(i); setIsInvestmentEditorOpen(true); }} className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-white rounded-xl transition-all"><Edit2 size={16}/></button>
                      <button onClick={() => handleDelete('investment', i.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
            </div>
        </div>
      </Modal>

      <Modal isOpen={isInvestmentEditorOpen} onClose={() => setIsInvestmentEditorOpen(false)} title={editingItem ? 'Editar Meta' : 'Nova Meta de Investimento'} zIndex={60}>
         <InvestmentForm editingItem={editingItem} onSave={handleSaveInvestment} />
      </Modal>

      <Modal isOpen={isPDFModalOpen} onClose={() => setIsPDFModalOpen(false)} title="Exportar Relatório PDF">
        <div className="space-y-5">
           <div className="space-y-2">
             <label className="text-xs font-black uppercase text-gray-400">Título Personalizado</label>
             <input type="text" value={pdfConfig.title} onChange={e=>setPdfConfig(p=>({...p, title:e.target.value}))} className="w-full p-4 border-2 rounded-2xl dark:bg-gray-800 dark:text-white dark:border-gray-700 outline-none focus:border-blue-500"/>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400">Data Início</label>
                <input type="date" value={pdfConfig.startDate} onChange={e=>setPdfConfig(p=>({...p, startDate:e.target.value}))} className="w-full p-4 border-2 rounded-2xl dark:bg-gray-800 dark:text-white dark:border-gray-700 outline-none"/>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400">Data Fim</label>
                <input type="date" value={pdfConfig.endDate} onChange={e=>setPdfConfig(p=>({...p, endDate:e.target.value}))} className="w-full p-4 border-2 rounded-2xl dark:bg-gray-800 dark:text-white dark:border-gray-700 outline-none"/>
              </div>
           </div>
           <button onClick={handleExportPDF} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2">
             <Download size={20} /> Baixar Relatório PDF
           </button>
        </div>
      </Modal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete} message="Deseja realmente excluir este item? Essa ação não pode ser desfeita." />
    </div>
  );
}