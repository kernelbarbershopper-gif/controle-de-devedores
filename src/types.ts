export interface Debt {
  id: string;
  debtorId: string;
  description: string;
  amount: number;
  issueDate: string; // Formato AAAA-MM-DD
  dueDate: string; // Formato AAAA-MM-DD
  status: 'pending' | 'paid';
  paidDate?: string; // Formato AAAA-MM-DD
}

export interface Debtor {
  id: string;
  name: string;
  phone?: string;
  creditLimit: number;
}
