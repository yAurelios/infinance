export type TransactionType = 'entrada' | 'gasto' | 'investimento';

export interface Category {
  id: string;
  name: string;
  color: string;
  type: 'entrada' | 'gasto';
}

export interface Investment {
  id: string;
  name: string;
  description: string;
  color: string;
  goalValue: number;
  currentValue: number;
}

export interface Transaction {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  description: string;
  value: number;
  type: TransactionType;
  categoryId?: string; // Links to Category if entry/expense
  investmentId?: string; // Links to Investment if investment or resgate
  isResgate?: boolean; // If true, it is an expense withdrawn from an investment
}

export interface BackupData {
  transactions: Transaction[];
  categories: Category[];
  investments: Investment[];
  theme: 'light' | 'dark';
}

export interface ChartConfig {
  startDate: string;
  endDate: string;
  chartType: 'pie' | 'bar';
  dataType: 'gasto' | 'investimento' | 'both';
}

export interface PDFExportConfig {
  title: string;
  startDate: string;
  endDate: string;
  includeChart: boolean;
  chartType: 'pie' | 'bar';
  sortBy: 'date' | 'value' | 'name' | 'category';
  filterType: 'all' | 'gasto' | 'investimento' | 'entrada';
}