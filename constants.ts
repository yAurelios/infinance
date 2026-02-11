import { Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Salário', color: '#10B981', type: 'entrada' },
  { id: 'cat_2', name: 'Freelance', color: '#34D399', type: 'entrada' },
  { id: 'cat_3', name: 'Alimentação', color: '#EF4444', type: 'gasto' },
  { id: 'cat_4', name: 'Transporte', color: '#F59E0B', type: 'gasto' },
  { id: 'cat_5', name: 'Moradia', color: '#6366F1', type: 'gasto' },
  { id: 'cat_6', name: 'Lazer', color: '#EC4899', type: 'gasto' },
  { id: 'cat_7', name: 'Outras Despesas', color: '#9CA3AF', type: 'gasto' },
];

export const COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#D946EF', // Fuchsia
];