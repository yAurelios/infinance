import React, { useState } from 'react';
import { Investment } from '../../types';
import { COLORS } from '../../constants';
import { DollarSign } from 'lucide-react';

interface InvestmentFormProps {
  editingItem: Investment | null;
  onSave: (data: Partial<Investment>) => void;
}

export const InvestmentForm: React.FC<InvestmentFormProps> = ({ editingItem, onSave }) => {
  const [name, setName] = useState(editingItem?.name || '');
  const [goalValue, setGoalValue] = useState(editingItem?.goalValue.toString() || '');
  const [color, setColor] = useState(editingItem?.color || COLORS[2]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, goalValue: Number(goalValue), color });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Nome do Investimento/Meta</label>
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Ex: Reserva de Emergência, Carro novo..." 
          required 
          className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl dark:text-white outline-none transition-all shadow-inner"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Valor da Meta</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
          <input 
            type="number" 
            step="0.01" 
            value={goalValue} 
            onChange={(e) => setGoalValue(e.target.value)} 
            placeholder="0,00" 
            required 
            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl dark:text-white outline-none transition-all shadow-inner font-mono text-lg"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Cor da Meta</label>
        <div className="grid grid-cols-6 gap-3">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-gray-500 dark:border-white shadow-lg scale-110' : 'border-gray-200 dark:border-gray-700'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="relative w-10 h-10">
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div 
              className={`w-10 h-10 rounded-full border-4 border-dashed flex items-center justify-center text-xl font-bold transition-transform ${!COLORS.includes(color) ? 'border-gray-400 scale-110' : 'border-gray-200 opacity-50'}`}
              style={{ backgroundColor: !COLORS.includes(color) ? color : 'transparent' }}
            >
            </div>
          </div>
        </div>
      </div>

      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-4 rounded-2xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2">
        <DollarSign size={20} /> Salvar Meta de Investimento
      </button>
    </form>
  );
};