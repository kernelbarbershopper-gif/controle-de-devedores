/**
 * Calcula os dias de atraso baseado em uma data de vencimento (Formato AAAA-MM-DD).
 * Se a data for hoje ou futura, retorna 0.
 */
export function getDaysOverdue(dueDateStr: string): number {
  if (!dueDateStr) return 0;
  
  const parts = dueDateStr.split('-');
  if (parts.length !== 3) return 0;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const dueDate = new Date(year, month, day, 12, 0, 0);
  
  const now = new Date();
  const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  
  const diffTime = currentDate.getTime() - dueDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Formata um valor numérico para Moeda Real (R$)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Converte data AAAA-MM-DD para DD/MM/AAAA
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Obtém a data atual no formato AAAA-MM-DD local
 */
export function getTodayStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
