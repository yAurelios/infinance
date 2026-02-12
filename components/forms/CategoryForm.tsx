import React, { useState } from 'react';
import { Category } from '../../types';
import { COLORS } from '../../constants';

interface CategoryFormProps {
  editingItem: Category | null;
  onSave: (data: Partial<Category>) => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ editingItem, onSave }) => {
  const [name, setName] = useState(editingItem?.name || '');
  const [type, setType] = useState<'entrada' | 'gasto'>(editingItem?.type || 'gasto');
  const [color, setColor] = useState(editingItem?.color || COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, type, color });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Nome da Categoria</label>
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Ex: Assinaturas, Freelance..." 
          required 
          className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl dark:text-white outline-none transition-all shadow-inner"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Tipo</label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setType('gasto')}
            className={`py-3 rounded-xl text-sm font-bold transition-all ${type === 'gasto' ? 'bg-white dark:bg-gray-700 text-red-500 shadow-md' : 'text-gray-500'}`}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => setType('entrada')}
            className={`py-3 rounded-xl text-sm font-bold transition-all ${type === 'entrada' ? 'bg-white dark:bg-gray-700 text-green-500 shadow-md' : 'text-gray-500'}`}
          >
            Entrada
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Cor da Identidade</label>
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

      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl shadow-xl transition-all transform active:scale-95">
        Salvar Categoria
      </button>
    </form>
  );
};