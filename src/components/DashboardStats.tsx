import { Debt, Debtor } from '../types';
import { formatCurrency, getDaysOverdue } from '../utils/helpers';
import { TrendingUp, CheckCircle, Users, AlertTriangle } from 'lucide-react';

interface DashboardStatsProps {
  debtors: Debtor[];
  debts: Debt[];
}

export function DashboardStats({ debtors, debts }: DashboardStatsProps) {
  // Total Devido: soma de todas as dívidas 'pending'
  const totalPending = debts
    .filter((d) => d.status === 'pending')
    .reduce((sum, d) => sum + d.amount, 0);

  // Total Pago: soma de todas as dívidas 'paid'
  const totalPaid = debts
    .filter((d) => d.status === 'paid')
    .reduce((sum, d) => sum + d.amount, 0);

  // Devedores Ativos: devedores que têm pelo menos 1 dívida pending
  const activeDebtorsCount = debtors.filter((debtor) =>
    debts.some((d) => d.debtorId === debtor.id && d.status === 'pending')
  ).length;

  // Dívidas em Atraso: devedores com dívidas com dias vencidos de atraso
  const overdueDebtsCount = debts.filter(
    (d) => d.status === 'pending' && getDaysOverdue(d.dueDate) > 0
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* CARD 1: Total Pendente */}
      <div id="stat-pending" className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center space-x-4 transition-all hover:shadow-md">
        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Pendente</p>
          <p className="text-2xl font-bold text-slate-800 tracking-tight">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* CARD 2: Total Pago */}
      <div id="stat-paid" className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center space-x-4 transition-all hover:shadow-md">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Recebido</p>
          <p className="text-2xl font-bold text-slate-800 tracking-tight">{formatCurrency(totalPaid)}</p>
        </div>
      </div>

      {/* CARD 3: Devedores Ativos */}
      <div id="stat-debtors" className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center space-x-4 transition-all hover:shadow-md">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Devedores Ativos</p>
          <p className="text-2xl font-bold text-slate-800 tracking-tight">
            {activeDebtorsCount} <span className="text-xs font-normal text-slate-400"> / {debtors.length}</span>
          </p>
        </div>
      </div>

      {/* CARD 4: Dívidas em Atraso */}
      <div id="stat-overdue" className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center space-x-4 transition-all hover:shadow-md">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contas em Atraso</p>
          <p className="text-2xl font-bold text-slate-800 tracking-tight">{overdueDebtsCount}</p>
        </div>
      </div>
    </div>
  );
}
