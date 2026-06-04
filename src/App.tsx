/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Check, 
  Edit, 
  AlertTriangle, 
  Phone, 
  Calendar, 
  CreditCard,
  UserCheck,
  RotateCcw,
  BookOpen,
  Filter,
  UserX,
  PlusCircle,
  X,
  FileCheck,
  Info,
  DollarSign
} from 'lucide-react';
import { Debtor, Debt } from './types';
import { getInitialData } from './utils/initialData';
import { formatCurrency, formatDate, getDaysOverdue, getTodayStr } from './utils/helpers';
import { DashboardStats } from './components/DashboardStats';
import { DebtorModal } from './components/DebtorModal';
import { AddDebtModal } from './components/AddDebtModal';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';

export default function App() {
  const [session, setSession] = useState<unknown>(null);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) loadData();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        loadData();
      } else {
        setDebtors([]);
        setDebts([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const { data: debtorsData } = await supabase.from('debtors').select('*');
    const { data: debtsData } = await supabase.from('debts').select('*');
    if (debtorsData) setDebtors(debtorsData as Debtor[]);
    if (debtsData) setDebts(debtsData as Debt[]);
    setIsLoading(false);
  }

  if (!session) {
    return <Auth />;
  }

  const [selectedDebtorId, setSelectedDebtorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'delayed' | 'overlimit'>('all');
  const [debtsTab, setDebtsTab] = useState<'pending' | 'paid'>('pending');

  // Modais de Cadastro
  const [isDebtorModalOpen, setIsDebtorModalOpen] = useState(false);
  const [selectedEditDebtor, setSelectedEditDebtor] = useState<Debtor | null>(null);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);

  // Estados de confirmação secundária (Prevenção de Cliques Acidentais)
  const [confirmDeleteDebtorId, setConfirmDeleteDebtorId] = useState<string | null>(null);
  const [confirmDeleteDebtId, setConfirmDeleteDebtId] = useState<string | null>(null);
  const [payingDebtId, setPayingDebtId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payDate, setPayDate] = useState<string>('');

  // Auxiliares: Resgatar o Devedor Selecionado
  const activeDebtor = debtors.find((d) => d.id === selectedDebtorId) || null;

  // Handler: Cadastrar ou Editar Devedor
  const handleSaveDebtor = async (name: string, phone: string, limit: number, editId?: string) => {
    if (editId) {
      const { data } = await supabase.from('debtors').update({ name, phone: phone || null, creditLimit: limit }).eq('id', editId).select();
      if (data) {
        setDebtors((prev) =>
          prev.map((d) => (d.id === editId ? (data[0] as Debtor) : d))
        );
      }
    } else {
      const newDebtor: Debtor = {
        id: 'debtor-' + Date.now().toString(),
        name,
        phone: phone || undefined,
        creditLimit: limit,
      };
      const { data } = await supabase.from('debtors').insert(newDebtor).select();
      if (data) {
        setDebtors((prev) => [...prev, data[0] as Debtor]);
        setSelectedDebtorId(data[0].id);
      }
    }
  };

  // Handler: Excluir Devedor e todas as suas dívidas
  const handleDeleteDebtor = async (id: string) => {
    const { error } = await supabase.from('debtors').delete().eq('id', id);
    if (!error) {
      setDebtors((prev) => prev.filter((d) => d.id !== id));
      setDebts((prev) => prev.filter((d) => d.debtorId !== id));
      if (selectedDebtorId === id) {
        setSelectedDebtorId(null);
      }
    }
    setConfirmDeleteDebtorId(null);
  };

  // Handler: Cadastrar nova dívida
  const handleSaveDebt = async (
    debtorId: string,
    description: string,
    amount: number,
    issueDate: string,
    dueDate: string
  ) => {
    const newDebt: Debt = {
      id: 'debt-' + Date.now().toString(),
      debtorId,
      description,
      amount,
      issueDate,
      dueDate,
      status: 'pending',
    };
    const { data } = await supabase.from('debts').insert(newDebt).select();
    if (data) {
      setDebts((prev) => [data[0] as Debt, ...prev]);
    }
  };

  // Handler: Alterar Estado da Dívida (Pagar / Reabrir)
  const handleToggleDebtStatus = async (debtId: string, paidAmount?: number, payDateStr?: string) => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;
    const isPending = debt.status === 'pending';
    const updates: Record<string, unknown> = {
      status: isPending ? 'paid' : 'pending',
      paidDate: isPending ? (payDateStr ?? getTodayStr()) : null,
      paidAmount: isPending ? (paidAmount ?? null) : null,
      amount: isPending ? 0 : (debt.amount + (debt.paidAmount || 0)),
    };
    const { data } = await supabase.from('debts').update(updates).eq('id', debtId).select();
    if (data) {
      setDebts((prev) =>
        prev.map((d) => (d.id === debtId ? (data[0] as Debt) : d))
      );
    }
  };

  const handleStartPay = (debt: Debt) => {
    setPayingDebtId(debt.id);
    setPayAmount(debt.amount.toString());
    setPayDate(getTodayStr());
  };

  const handleConfirmPay = async (debtId: string) => {
    const parsed = parseFloat(payAmount);
    if (isNaN(parsed) || parsed <= 0) return;
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;
    const cumulativePaid = (debt.paidAmount || 0) + parsed;
    const originalAmount = debt.amount + (debt.paidAmount || 0);
    if (cumulativePaid >= originalAmount) {
      await handleToggleDebtStatus(debtId, cumulativePaid, payDate);
    } else {
      const remaining = originalAmount - cumulativePaid;
      const updates = { amount: remaining, paidAmount: cumulativePaid, paidDate: payDate || null };
      const { data } = await supabase.from('debts').update(updates).eq('id', debtId).select();
      if (data) {
        setDebts((prev) =>
          prev.map((d) => (d.id === debtId ? (data[0] as Debt) : d))
        );
      }
    }
    setPayingDebtId(null);
    setPayAmount('');
  };

  const handleCancelPay = () => {
    setPayingDebtId(null);
    setPayAmount('');
    setPayDate('');
  };

  // Handler: Excluir Dívida
  const handleDeleteDebt = async (debtId: string) => {
    const { error } = await supabase.from('debts').delete().eq('id', debtId);
    if (!error) {
      setDebts((prev) => prev.filter((d) => d.id !== debtId));
    }
    setConfirmDeleteDebtId(null);
  };

  // Restaurar dados padrão de demonstração
  const handleResetDemoData = async () => {
    if (window.confirm('Deseja realmente restaurar os dados de exemplo do sistema? Isso substituirá as suas alterações atuais.')) {
      await supabase.from('debts').delete().neq('id', '0');
      await supabase.from('debtors').delete().neq('id', '0');
      const demo = getInitialData();
      const { data: debtorsData } = await supabase.from('debtors').insert(demo.debtors).select();
      const { data: debtsData } = await supabase.from('debts').insert(demo.debts).select();
      if (debtorsData) setDebtors(debtorsData as Debtor[]);
      if (debtsData) setDebts(debtsData as Debt[]);
      setSelectedDebtorId(debtorsData?.[0]?.id || null);
      setSearchQuery('');
      setFilterType('all');
    }
  };

  // Limpar todos os dados (Começar do zero)
  const handleClearAllData = async () => {
    if (window.confirm('Deseja limpar todos os registros? Isso apagará permanentemente todos os devedores e suas dívidas.')) {
      await supabase.from('debts').delete().neq('id', '0');
      await supabase.from('debtors').delete().neq('id', '0');
      setDebtors([]);
      setDebts([]);
      setSelectedDebtorId(null);
    }
  };

  // Filtragem Dinâmica de Devedores para o Painel Esquerdo
  const searchedDebtors = debtors.filter((debtor) => {
    const matchesSearch =
      debtor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (debtor.phone && debtor.phone.includes(searchQuery));

    if (!matchesSearch) return false;

    // Calcula dívidas ativas
    const debtorDebts = debts.filter((d) => d.debtorId === debtor.id && d.status === 'pending');
    const totalPending = debtorDebts.reduce((sum, d) => sum + d.amount, 0);

    const isOverLimit = totalPending > debtor.creditLimit;
    const hasDelay = debtorDebts.some((d) => getDaysOverdue(d.dueDate) > 0);

    if (filterType === 'delayed') return hasDelay;
    if (filterType === 'overlimit') return isOverLimit;

    return true;
  });

  // Lista global de Dívidas Vencidas Atuais (para exibir quando nenhum devedor está selecionado)
  const currentOverdueDebts = debts
    .filter((d) => d.status === 'pending' && getDaysOverdue(d.dueDate) > 0)
    .map((d) => {
      const debtor = debtors.find((deb) => deb.id === d.debtorId);
      return {
        ...d,
        debtorName: debtor ? debtor.name : 'Devedor Desconhecido',
        daysLate: getDaysOverdue(d.dueDate),
      };
    })
    .sort((a, b) => b.daysLate - a.daysLate);

  // Calcula valores do devedor ativo
  const activeDebtorPendingDebts = debts.filter((d) => d.debtorId === selectedDebtorId && d.status === 'pending');
  const activeDebtorPaidDebts = debts.filter((d) => d.debtorId === selectedDebtorId && d.status === 'paid');
  
  const activeDebtorTotalPending = activeDebtorPendingDebts.reduce((sum, d) => sum + d.amount, 0);
  const activeDebtorTotalPaid = activeDebtorPaidDebts.reduce((sum, d) => sum + d.amount, 0);
  const activeDebtorLimitProgress = activeDebtor 
    ? (activeDebtorTotalPending / activeDebtor.creditLimit) * 100 
    : 0;

  // Maior quantidade de dias atrasados deste devedor específico
  const activeDebtorMaxOverdueDays = activeDebtorPendingDebts.reduce((max, d) => {
    const days = getDaysOverdue(d.dueDate);
    return days > max ? days : max;
  }, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 antialiased pb-12">
      {/* HEADER PRINCIPAL */}
      <header id="main-header" className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-md shadow-indigo-200">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">Controle de Devedores</h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Gestão de Limites e Dias de Atraso</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleResetDemoData}
              title="Restaurar banco de dados de teste"
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-100 transition-all flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restaurar Exemplo</span>
            </button>
            <button
              onClick={handleClearAllData}
              title="Limpar todos os registros"
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50/50 hover:border-red-100 transition-all flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpar Tudo</span>
            </button>
            <button
              onClick={() => {
                setSelectedEditDebtor(null);
                setIsDebtorModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-xs hover:shadow-md shadow-indigo-100 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Devedor</span>
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
              title="Sair"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* CONTAINER DO CONTEÚDO */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* STATS DEL SISTEMA */}
        <DashboardStats debtors={debtors} debts={debts} />

        {/* LAYOUT PRINCIPAL: MASTER-DETAIL EM DUAS COLUNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUNA ESQUERDA: LISTA DE DEVEDORES (4 colunas) */}
          <div id="sidebar-debtors" className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            
            {/* Cabeçalho da Lista / Caixa de Pesquisa */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Seus Devedores ({searchedDebtors.length})</span>
                </span>
              </div>

              {/* Input Pesquisar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar por nome ou contato..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-xs"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtros por Categoria de Alerta */}
              <div className="flex gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1 ${
                    filterType === 'all'
                      ? 'bg-indigo-100 text-indigo-700 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <span>Todos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('delayed')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1 ${
                    filterType === 'delayed'
                      ? 'bg-amber-100 text-amber-800 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Em Atraso</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('overlimit')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1 ${
                    filterType === 'overlimit'
                      ? 'bg-red-100 text-red-700 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>Estourados</span>
                </button>
              </div>
            </div>

            {/* Lista dos Devedores */}
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              <AnimatePresence initial={false}>
                {searchedDebtors.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-8 text-center"
                  >
                    <UserX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-400">Nenhum devedor encontrado</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
                      Tente alterar a sua busca ou filtros nas opções acima.
                    </p>
                  </motion.div>
                ) : (
                  searchedDebtors.map((debtor) => {
                    const debtorDebts = debts.filter((d) => d.debtorId === debtor.id && d.status === 'pending');
                    const totalPendingAmount = debtorDebts.reduce((sum, d) => sum + d.amount, 0);
                    const isOverLimit = totalPendingAmount > debtor.creditLimit;
                    const isNearLimit = !isOverLimit && (totalPendingAmount >= debtor.creditLimit * 0.8) && totalPendingAmount > 0;
                    
                    // Calcula dias máximos de atraso
                    const maxDelay = debtorDebts.reduce((max, d) => {
                      const days = getDaysOverdue(d.dueDate);
                      return days > max ? days : max;
                    }, 0);

                    const isSelected = debtor.id === selectedDebtorId;

                    return (
                      <motion.div
                        key={debtor.id}
                        layoutId={`debtor-card-${debtor.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50/50 border-l-4 border-indigo-600'
                            : 'hover:bg-slate-50'
                        }`}
                        onClick={() => {
                          setSelectedDebtorId(debtor.id);
                          setDebtsTab('pending'); // Reset do tab das dívidas ao alternar
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{debtor.name}</h4>
                            {debtor.phone ? (
                              <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-300" />
                                <span>{debtor.phone}</span>
                              </p>
                            ) : (
                              <p className="text-xs text-slate-300 italic">Sem contato registrado</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-slate-900 block font-mono">
                              {formatCurrency(totalPendingAmount)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              de lim: {formatCurrency(debtor.creditLimit)}
                            </span>
                          </div>
                        </div>

                        {/* Barra de Progresso do Limite de Crédito */}
                        <div className="mt-2.5">
                          <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="text-slate-400">Limite Utilizado</span>
                            <span className={`font-mono font-bold ${
                              isOverLimit ? 'text-red-500' : isNearLimit ? 'text-amber-500' : 'text-slate-500'
                            }`}>
                              {Math.min(Math.round((totalPendingAmount / debtor.creditLimit) * 100), 1000)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min((totalPendingAmount / debtor.creditLimit) * 100, 100)}%` }}
                              className={`h-full transition-all duration-300 ${
                                isOverLimit
                                  ? 'bg-red-500'
                                  : isNearLimit
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Badges de alerta de vencimento/limite */}
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {isOverLimit && (
                            <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-[9px] font-bold border border-red-100 flex items-center space-x-1 leading-none">
                              <CreditCard className="w-2.5 h-2.5" />
                              <span>Limite Ultrapassado</span>
                            </span>
                          )}
                          {isNearLimit && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[9px] font-bold border border-amber-100 flex items-center space-x-1 leading-none">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>Crédito Crítico</span>
                            </span>
                          )}
                          {maxDelay > 0 ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[9px] font-extrabold border border-amber-200/50 flex items-center space-x-1 leading-none animate-pulse">
                              <Calendar className="w-2.5 h-2.5" />
                              <span>⚠️ {maxDelay} dias atrasado</span>
                            </span>
                          ) : (
                            !isOverLimit && !isNearLimit && totalPendingAmount > 0 && (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-bold border border-emerald-100 flex items-center space-x-1 leading-none">
                                <UserCheck className="w-2.5 h-2.5" />
                                <span>Em Dia</span>
                              </span>
                            )
                          )}
                          {totalPendingAmount === 0 && (
                            <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md text-[9px] font-bold border border-slate-100 flex items-center space-x-1 leading-none">
                              <Check className="w-2.5 h-2.5" />
                              <span>Zero Pendências</span>
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* COLUNA DIREITA: DETALHE DO SELECIONADO OU COBRANÇA GERAL (7 colunas) */}
          <div id="main-content-panel" className="lg:col-span-7 space-y-6">
            <AnimatePresence mode="wait">
              {activeDebtor ? (
                // VIEW 1: DETALHES DO DEVEDOR SELECIONADO
                <motion.div
                  key={`detail-${activeDebtor.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden"
                >
                  {/* Banner superior com Info */}
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{activeDebtor.name}</h2>
                        {activeDebtorMaxOverdueDays > 0 && (
                          <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-bounce">
                            ⚠️ Atrasado
                          </span>
                        )}
                      </div>
                      
                      {activeDebtor.phone ? (
                        <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
                          <Phone className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-semibold">{activeDebtor.phone}</span>
                          <span className="text-slate-350">|</span>
                          <a 
                            href={`https://wa.me/55${activeDebtor.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            referrerPolicy="no-referrer"
                            className="text-xs text-indigo-600 hover:underline hover:text-indigo-700 font-bold leading-none inline-block pl-0.5"
                          >
                            Mandar mensagem
                          </a>
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic mt-1">Nenhum telefone de contato cadastrado</p>
                      )}
                    </div>

                    {/* Ações de Edição e Exclusão do Devedor */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedEditDebtor(activeDebtor);
                          setIsDebtorModalOpen(true);
                        }}
                        className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-all"
                        title="Editar devedor"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {confirmDeleteDebtorId === activeDebtor.id ? (
                        <div className="flex items-center space-x-1.5 bg-red-50 border border-red-200 p-1 rounded-xl animate-fade-in shadow-xs">
                          <span className="text-[10px] text-red-600 font-bold px-1.5 uppercase tracking-wide">Confirmar?</span>
                          <button
                            onClick={() => handleDeleteDebtor(activeDebtor.id)}
                            className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-lg text-xs font-bold transition-all"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setConfirmDeleteDebtorId(null)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-1 rounded-lg text-xs font-bold transition-all"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteDebtorId(activeDebtor.id)}
                          className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Excluir devedor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => setIsDebtModalOpen(true)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-xs shadow-indigo-100"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Lançar Dívida</span>
                      </button>
                    </div>
                  </div>

                  {/* Detalhes de Limite e Painel Financeiro */}
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Extrato Geral de Crédito</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Limite de Crédito */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 block uppercase">Limite Autorizado</span>
                        <span className="text-lg font-bold text-slate-800 font-mono block">
                          {formatCurrency(activeDebtor.creditLimit)}
                        </span>
                      </div>

                      {/* Consumido */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 block uppercase">Dívida Pendente</span>
                        <span className={`text-lg font-extrabold font-mono block ${
                          activeDebtorTotalPending > activeDebtor.creditLimit ? 'text-red-600' : 'text-slate-800'
                        }`}>
                          {formatCurrency(activeDebtorTotalPending)}
                        </span>
                      </div>

                      {/* Disponível */}
                      <div className={`p-3.5 rounded-xl border space-y-1 ${
                        activeDebtorTotalPending > activeDebtor.creditLimit
                          ? 'bg-red-50/50 border-red-100 text-red-800'
                          : 'bg-indigo-50/30 border-indigo-50/50 text-indigo-900'
                      }`}>
                        <span className="text-[10px] font-semibold block uppercase opacity-75">Crédito Disponível</span>
                        <span className="text-lg font-bold font-mono block">
                          {formatCurrency(activeDebtor.creditLimit - activeDebtorTotalPending)}
                        </span>
                      </div>
                    </div>

                    {/* Barra integrada de preenchimento */}
                    <div className="mt-4">
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                        <div
                          style={{ width: `${Math.min(activeDebtorLimitProgress, 100)}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            activeDebtorTotalPending > activeDebtor.creditLimit ? 'bg-red-500' : 'bg-indigo-600'
                          }`}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5">
                        <span>Totalmente Disponível (0%)</span>
                        <span>Limite Atingido (100%)</span>
                      </div>
                    </div>
                  </div>

                  {/* LISTAGEM DE DÍVIDAS ATIVAS / HISTÓRICAS */}
                  <div className="p-6">
                    {/* Tabs de Seleção de Estado (Pendente vs Pagas) */}
                    <div className="flex rounded-lg bg-slate-100 p-1 mb-4 max-w-xs">
                      <button
                        onClick={() => setDebtsTab('pending')}
                        className={`flex-1 py-1 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1 ${
                          debtsTab === 'pending'
                            ? 'bg-white text-slate-800 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <span>Pendentes</span>
                        <span className={`px-1.5 py-0.2 ml-1 text-[10px] rounded-full inline-block ${
                          debtsTab === 'pending' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {activeDebtorPendingDebts.length}
                        </span>
                      </button>
                      <button
                        onClick={() => setDebtsTab('paid')}
                        className={`flex-1 py-1 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1 ${
                          debtsTab === 'paid'
                            ? 'bg-white text-slate-800 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <span>Pagas</span>
                        <span className={`px-1.5 py-0.2 ml-1 text-[10px] rounded-full inline-block ${
                          debtsTab === 'paid' ? 'bg-slate-200 text-slate-600' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {activeDebtorPaidDebts.length}
                        </span>
                      </button>
                    </div>

                    {/* Dívidas do Tab Selecionado */}
                    <div className="space-y-3">
                      {debtsTab === 'pending' ? (
                        activeDebtorPendingDebts.length === 0 ? (
                          <div className="py-12 text-center bg-slate-50 border border-slate-100 rounded-xl">
                            <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                            <p className="text-xs font-bold text-slate-500">Sem dívidas pendentes!</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Este devedor está com sua ficha totalmente limpa.</p>
                          </div>
                        ) : (
                          activeDebtorPendingDebts.map((debt) => {
                            const delayDays = getDaysOverdue(debt.dueDate);
                            
                            return (
                              <div
                                key={debt.id}
                                className={`p-4 border rounded-xl flex justify-between items-center transition-all ${
                                  delayDays > 0
                                    ? 'border-red-100 bg-red-50/10 hover:border-red-200'
                                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                                }`}
                              >
                                <div className="space-y-1">
                                  <h4 className="font-bold text-slate-800 text-sm leading-snug">{debt.description}</h4>
                                  <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-400">
                                    <span className="flex items-center space-x-1">
                                      <Calendar className="w-3.5 h-3.5 text-slate-300" />
                                      <span>Emissão: {formatDate(debt.issueDate)}</span>
                                    </span>
                                    <span>•</span>
                                    <span className="font-semibold text-slate-600 flex items-center space-x-1">
                                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                      <span>Vencimento: {formatDate(debt.dueDate)}</span>
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                  <div className="text-right">
                                    <span className="text-base font-extrabold text-slate-900 block font-mono">
                                      {formatCurrency(debt.amount)}
                                    </span>
                                    {debt.paidAmount != null ? (
                                      <span className="inline-block px-2 py-0.5 mt-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md">
                                        Restante de {formatCurrency(debt.paidAmount + debt.amount)}
                                      </span>
                                    ) : delayDays > 0 ? (
                                      <span className="inline-block px-2 py-0.5 mt-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-md animate-pulse">
                                        ⚠️ {delayDays} dias de atraso
                                      </span>
                                    ) : (
                                      <span className="inline-block px-2 py-0.5 mt-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md">
                                        Em dia
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center space-x-1.5 border-l border-slate-150 pl-3">
                                    {payingDebtId === debt.id ? (
                                      <div className="flex items-center space-x-1 animate-fade-in">
                                        <input
                                          type="date"
                                          value={payDate}
                                          onChange={(e) => setPayDate(e.target.value)}
                                          className="w-28 px-1.5 py-1 text-[10px] border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        />
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0.01"
                                          value={payAmount}
                                          onChange={(e) => setPayAmount(e.target.value)}
                                          className="w-16 px-1.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-right font-mono"
                                          placeholder="Valor"
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => handleConfirmPay(debt.id)}
                                          className="p-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-all"
                                          title="Confirmar pagamento"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={handleCancelPay}
                                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                          title="Cancelar"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleStartPay(debt)}
                                        className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                                        title="Marcar como recebido/pago"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                    )}

                                    {/* Deletar Individual */}
                                    {confirmDeleteDebtId === debt.id ? (
                                      <div className="flex items-center bg-red-100 rounded-lg p-0.5 space-x-1 animate-fade-in">
                                        <button
                                          onClick={() => handleDeleteDebt(debt.id)}
                                          className="px-1.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-[10px] font-bold"
                                        >
                                          Sim
                                        </button>
                                        <button
                                          onClick={() => setConfirmDeleteDebtId(null)}
                                          className="px-1.5 py-1 bg-slate-200 text-slate-600 rounded-md text-[10px] font-bold animate-fade-in"
                                        >
                                          X
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setConfirmDeleteDebtId(debt.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Excluir dívida"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )
                      ) : (
                        // TAB: PAGAS (HISTÓRICO)
                        activeDebtorPaidDebts.length === 0 ? (
                          <div className="py-12 text-center bg-slate-50 border border-slate-100 rounded-xl">
                            <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                            <p className="text-xs font-bold text-slate-500">Nenhum pagamento registrado</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Dívidas quitadas aparecerão listadas neste painel.</p>
                          </div>
                        ) : (
                          activeDebtorPaidDebts.map((debt) => (
                            <div
                              key={debt.id}
                              className="p-4 border border-slate-100 bg-emerald-50/10 rounded-xl flex justify-between items-center hover:bg-emerald-50/20"
                            >
                              <div className="space-y-0.5">
                                <h4 className="font-bold text-emerald-900 text-sm">{debt.description}</h4>
                                <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-emerald-700/70">
                                  <span>Pago em: {formatDate(debt.paidDate || '')}</span>
                                  <span>•</span>
                                  <span>Vencia em: {formatDate(debt.dueDate)}</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3">
                                <div className="text-right">
                                  <span className="text-sm font-extrabold text-emerald-800 block font-mono">
                                    {formatCurrency(debt.paidAmount ?? debt.amount)}
                                  </span>
                                  {debt.paidAmount != null && debt.amount > 0 ? (
                                    <span className="inline-block px-1.5 py-0.2 text-emerald-600 text-[9px] font-bold rounded-sm">
                                      Pago {formatCurrency(debt.paidAmount)} de {formatCurrency(debt.paidAmount + debt.amount)}
                                    </span>
                                  ) : (
                                    <span className="inline-block px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-sm">
                                      Quitada
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center space-x-1.5 border-l border-emerald-100/50 pl-3">
                                  {/* Botão Reabrir */}
                                  <button
                                    onClick={() => handleToggleDebtStatus(debt.id)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                    title="Tornar pendente novamente"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Botão Excluir */}
                                  {confirmDeleteDebtId === debt.id ? (
                                    <div className="flex items-center bg-red-100 rounded-lg p-0.5 space-x-1 animate-fade-in">
                                      <button
                                        onClick={() => handleDeleteDebt(debt.id)}
                                        className="px-1.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-[10px] font-bold"
                                      >
                                        Sim
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteDebtId(null)}
                                        className="px-1.5 py-1 bg-slate-200 text-slate-600 rounded-md text-[10px] font-bold"
                                      >
                                        X
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeleteDebtId(debt.id)}
                                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                      title="Excluir do histórico"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                // VIEW 2: SEM SELEÇÃO - MOSTRA ALERTAS GERAIS DE VENCIMENTO DO SISTEMA
                <motion.div
                  key="overview-dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6"
                >
                  <div className="text-center py-6 bg-indigo-50/20 rounded-2xl border border-indigo-50/50">
                    <Info className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                    <h3 className="text-base font-extrabold text-indigo-900 tracking-tight">Curinga de Cobrança Geral</h3>
                    <p className="text-xs text-indigo-700 max-w-md mx-auto mt-1">
                      Crie um devedor para começar! Ou visualize os maiores atrasos ativos no sistema listados abaixo para controle.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Maiores Atrasados Ordenados Maiores - Menores</span>
                      <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        {currentOverdueDebts.length} no Total
                      </span>
                    </div>

                    {currentOverdueDebts.length === 0 ? (
                      <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        <UserCheck className="w-10 h-10 text-emerald-400 mx-auto mb-1.5" />
                        <h4 className="font-bold text-slate-600 text-sm">Opa! Zero atrasos no momento!</h4>
                        <p className="text-xs text-slate-400">
                          Todos os devedores cadastrados estão dentro do prazo de vencimento.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentOverdueDebts.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 border border-red-100 bg-red-50/10 rounded-xl flex items-center justify-between hover:bg-red-50/20 cursor-pointer transition-all"
                            onClick={() => setSelectedDebtorId(item.debtorId)}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-800 text-sm">{item.debtorName}</span>
                                <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 text-[9px] font-extrabold rounded-md">
                                  Ver Devedor
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-600">Motivo: {item.description}</p>
                              <p className="text-[10px] text-slate-400">Venceu em: {formatDate(item.dueDate)}</p>
                            </div>

                            <div className="text-right flex items-center space-x-4">
                              <div>
                                <span className="text-sm font-extrabold text-slate-900 font-mono block">
                                  {formatCurrency(item.amount)}
                                </span>
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-extrabold rounded-md inline-block mt-0.5">
                                  ⚠️ {item.daysLate} dias de atraso
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* MODAL DE DEVEDOR (Novo/Editar devedor) */}
      <DebtorModal
        isOpen={isDebtorModalOpen}
        onClose={() => {
          setIsDebtorModalOpen(false);
          setSelectedEditDebtor(null);
        }}
        onSave={handleSaveDebtor}
        editDebtor={selectedEditDebtor}
      />

      {/* MODAL DE ADICIONAR LOTE DE DÍVIDAS */}
      <AddDebtModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        debtors={debtors}
        initialDebtorId={selectedDebtorId}
        debts={debts}
        onSave={handleSaveDebt}
      />
    </div>
  );
}
