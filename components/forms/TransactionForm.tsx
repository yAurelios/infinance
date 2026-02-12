import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import { Transaction, TransactionType, Category, Investment } from '../../types';

interface TransactionFormProps {
  editingItem: Transaction | null;
  categories: Category[];
  investments: Investment[];
  currentBalance: number;
  onSave: (data: Partial<Transaction>) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
  editingItem, 
  categories, 
  investments, 
  currentBalance, 
  onSave 
}) => {
  const [type, setType] = useState<TransactionType>(editingItem?.type || 'entrada');
  const [isResgate, setIsResgate] = useState(editingItem?.isResgate || false);
  const [desc, setDesc] = useState(editingItem?.description || '');
  const [val, setVal] = useState(editingItem?.value.toString() || '');
  const [date, setDate] = useState(editingItem?.date || new Date().toISOString().split('T')[0]);
  
  const initialCatId = editingItem?.categoryId || (type === 'gasto' ? 'cat_7' : '');
  const [catId, setCatId] = useState(initialCatId);
  const [invId, setInvId] = useState(editingItem?.investmentId || '');

  useEffect(() => {
    if (type === 'gasto' && !isResgate && !editingItem) {
      setCatId('cat_7');
    } else if (type === 'entrada' && !editingItem) {
      setCatId('');
    }
  }, [type, isResgate, editingItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
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
        <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
          Descrição {type === 'investimento' && <span className="text-[10px] lowercase font-normal opacity-70">(opcional)</span>}
        </label>
        <input 
          required={type !== 'investimento'} 
          type="text" 
          value={desc} 
          onChange={e => setDesc(e.target.value)} 
          className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
          placeholder={type === 'investimento' ? "Ex: Aporte Mensal (Opcional)" : "Ex: Compras Supermercado"} 
        />
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