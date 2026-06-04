import { useState, useEffect, FormEvent } from 'react';
import { X, Calendar, DollarSign, FileText, User, AlertCircle } from 'lucide-react';
import { Debtor, Debt } from '../types';
import { formatCurrency, getTodayStr } from '../utils/helpers';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtors: Debtor[];
  initialDebtorId: string | null;
  debts: Debt[];
  onSave: (debtorId: string, description: string, amount: number, issueDate: string, dueDate: string) => void;
}

export function AddDebtModal({
  isOpen,
  onClose,
  debtors,
  initialDebtorId,
  debts,
  onSave,
}: AddDebtModalProps) {
  const [debtorId, setDebtorId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDebtorId(initialDebtorId || (debtors[0]?.id || ''));
      setDescription('');
      setAmount('');
      setIssueDate(getTodayStr());
      setDueDate(getTodayStr());
      setError('');
    }
  }, [isOpen, initialDebtorId, debtors]);

  if (!isOpen) return null;

  // Encontra o devedor selecionado
  const selectedDebtor = debtors.find((d) => d.id === debtorId);

  // Calcula o valor atual acumulado de pendências deste devedor
  const currentPendingAmount = debts
    .filter((d) => d.debtorId === debtorId && d.status === 'pending')
    .reduce((sum, d) => sum + d.amount, 0);

  // Verifica se o acréscimo ultrapassará o limite
  const parsedAmount = parseFloat(amount) || 0;
  const isOverLimit = selectedDebtor
    ? currentPendingAmount + parsedAmount > selectedDebtor.creditLimit
    : false;

  const excessAmount = selectedDebtor
    ? currentPendingAmount + parsedAmount - selectedDebtor.creditLimit
    : 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!debtorId) {
      setError('Selecione um devedor.');
      return;
    }
    if (!description.trim()) {
      setError('A descrição é obrigatória.');
      return;
    }
    if (parsedAmount <= 0) {
      setError('O valor da dívida deve ser maior que zero.');
      return;
    }
    if (!dueDate) {
      setError('A data de vencimento é obrigatória.');
      return;
    }
    if (!issueDate) {
      setError('A data de emissão é obrigatória.');
      return;
    }

    onSave(debtorId, description.trim(), parsedAmount, issueDate, dueDate);
    onClose();
  };

  return (
    <div id="debt-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2 text-slate-800">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold tracking-tight">Nova Dívida</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {/* Selecionar Devedor */}
          <div className="space-y-1.5 animate-pulse-once">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Devedor *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={debtorId}
                onChange={(e) => setDebtorId(e.target.value)}
                disabled={initialDebtorId !== null}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800 transition-all cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                required
              >
                <option value="">Selecione um devedor...</option>
                {debtors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} (Crédito Limit: {formatCurrency(d.creditLimit)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Descrição / Item da Dívida *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Empréstimo, Compra de Celular, Serviço"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800 transition-all placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          {/* Valor */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Valor (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800 transition-all placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          {/* Alerta de Limite */}
          {selectedDebtor && parsedAmount > 0 && (
            <div className={`p-3 rounded-xl border flex gap-3 text-xs ${
              isOverLimit 
                ? 'bg-red-50 text-red-700 border-red-200' 
                : 'bg-indigo-50 text-indigo-700 border-indigo-100'
            }`}>
              <AlertCircle className={`w-5 h-5 shrink-0 ${isOverLimit ? 'text-red-500' : 'text-indigo-500'}`} />
              <div className="space-y-1">
                <span className="font-bold block">Consumo de Crédito:</span>
                <p>
                  Hoje deve: <strong className="font-semibold">{formatCurrency(currentPendingAmount)}</strong> de 
                  um limite total de <strong className="font-semibold">{formatCurrency(selectedDebtor.creditLimit)}</strong>.
                </p>
                {isOverLimit ? (
                  <p className="font-bold underline text-red-600 animate-pulse">
                    Aviso: O lançamento excederá o limite do devedor em {formatCurrency(excessAmount)} !
                  </p>
                ) : (
                  <p>
                    Limite disponível após esta dívida: <strong className="font-semibold">{formatCurrency(selectedDebtor.creditLimit - currentPendingAmount - parsedAmount)}</strong>.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Data Emissão *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800 transition-all cursor-pointer"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Vencimento *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800 transition-all cursor-pointer"
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-sm rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-all shadow-xs hover:shadow-md shadow-indigo-200"
            >
              Lançar Dívida
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
