import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Category, Investment, PDFExportConfig } from '../types';

export const generatePDF = (
  transactions: Transaction[],
  categories: Category[],
  investments: Investment[],
  config: PDFExportConfig,
  chartImageURI?: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Filter Data
  let filtered = transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00'); // Fix timezone offset issues
    const start = new Date(config.startDate + 'T00:00:00');
    const end = new Date(config.endDate + 'T00:00:00');
    return d >= start && d <= end;
  });

  if (config.filterType !== 'all') {
    filtered = filtered.filter(t => t.type === config.filterType);
  }

  // Sort Data
  filtered.sort((a, b) => {
    if (config.sortBy === 'date') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (config.sortBy === 'value') return b.value - a.value;
    if (config.sortBy === 'name') return a.description.localeCompare(b.description);
    return 0;
  });

  // Title
  doc.setFontSize(18);
  doc.text(config.title || 'Relatório Financeiro', 14, 22);
  doc.setFontSize(11);
  doc.text(`Período: ${config.startDate} até ${config.endDate}`, 14, 30);

  let yPos = 40;

  // Chart
  if (config.includeChart && chartImageURI) {
    const imgProps = doc.getImageProperties(chartImageURI);
    const pdfWidth = pageWidth - 28;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    doc.addImage(chartImageURI, 'PNG', 14, yPos, pdfWidth, pdfHeight);
    yPos += pdfHeight + 10;
  }

  // Table
  const tableData = filtered.map(t => {
    let catName = '-';
    if (t.categoryId) catName = categories.find(c => c.id === t.categoryId)?.name || 'N/A';
    if (t.investmentId) catName = investments.find(i => i.id === t.investmentId)?.name || 'Inv.';

    return [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.description,
      t.type.toUpperCase(),
      catName,
      t.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Data', 'Descrição', 'Tipo', 'Categoria/Inv', 'Valor']],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save('relatorio-infinance.pdf');
};