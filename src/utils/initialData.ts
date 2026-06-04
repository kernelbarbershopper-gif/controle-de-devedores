import { Debtor, Debt } from '../types';

export function getInitialData(): { debtors: Debtor[]; debts: Debt[] } {
  const now = new Date();
  
  const formatDateOffset = (daysOffset: number): string => {
    const d = new Date();
    d.setDate(now.getDate() + daysOffset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const debtors: Debtor[] = [
    { id: '1', name: 'João Silva', phone: '(11) 98765-4321', creditLimit: 1500 },
    { id: '2', name: 'Maria Souza', phone: '(21) 99988-7766', creditLimit: 800 },
    { id: '3', name: 'Carlos Santos', phone: '(31) 98888-1111', creditLimit: 2500 },
    { id: '4', name: 'Ana Oliveira', phone: '(19) 97777-2222', creditLimit: 500 },
  ];

  const debts: Debt[] = [
    {
      id: 'd1',
      debtorId: '1',
      description: 'Manutenção do Carro',
      amount: 450,
      issueDate: formatDateOffset(-20),
      dueDate: formatDateOffset(-10), // atrasado por 10 dias
      status: 'pending',
    },
    {
      id: 'd2',
      debtorId: '1',
      description: 'Ferramentas de Trabalho',
      amount: 250,
      issueDate: formatDateOffset(-15),
      dueDate: formatDateOffset(-5), // atrasado por 5 dias
      status: 'pending',
    },
    {
      id: 'd3',
      debtorId: '1',
      description: 'Aluguel de Equipamentos',
      amount: 300,
      issueDate: formatDateOffset(-30),
      dueDate: formatDateOffset(-15),
      status: 'paid',
      paidDate: formatDateOffset(-15),
    },
    {
      id: 'd4',
      debtorId: '2',
      description: 'Roupas para Revenda',
      amount: 720,
      issueDate: formatDateOffset(-8),
      dueDate: formatDateOffset(-3), // atrasado por 3 dias
      status: 'pending',
    },
    {
      id: 'd5',
      debtorId: '3',
      description: 'Instalação Elétrica',
      amount: 1800,
      issueDate: formatDateOffset(-5),
      dueDate: formatDateOffset(12), // não vencido (futuro)
      status: 'pending',
    },
    {
      id: 'd6',
      debtorId: '4',
      description: 'Celular Usado',
      amount: 580, // Estourou limite de R$ 500!
      issueDate: formatDateOffset(-12),
      dueDate: formatDateOffset(-4), // atrasado por 4 dias
      status: 'pending',
    }
  ];

  return { debtors, debts };
}
