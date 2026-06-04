import { useState, useEffect, FormEvent } from 'react';
import { X, UserPlus, CreditCard, Phone, User } from 'lucide-react';
import { Debtor } from '../types';

interface DebtorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, phone: string, limit: number, editId?: string) => void;
  editDebtor: Debtor | null;
}

export function DebtorModal({ isOpen, onClose, onSave, editDebtor }: DebtorModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [limit, setLimit] = useState<string>('1000');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editDebtor) {
      setName(editDebtor.name);
      setPhone(editDebtor.phone || '');
      setLimit(editDebtor.creditLimit.toString());
    } else {
      setName('');
      setPhone('');
      setLimit('1000');
    }
    setError('');
  }, [editDebtor, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome é obrigatório.');
      return;
    }
    const parsedLimit = parseFloat(limit);
    if (isNaN(parsedLimit) || parsedLimit < 0) {
      setError('O limite de crédito deve ser um número válido maior ou igual a zero.');
      return;
    }

    onSave(name.trim(), phone.trim(), parsedLimit, editDebtor?.id);
    onClose();
  };

  return (
    <div id="debtor-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2 text-slate-800">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold tracking-tight">
              {editDebtor ? 'Editar Devedor' : 'Novo Devedor'}
            </h3>
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

          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Nome Completo *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800 transition-all placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          {/* Telefone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Telefone / Contato (Opcional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: (11) 98765-4321"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Limite de Crédito */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Limite de Crédito Disponível (R$) *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="Ex: 1500.00"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800 transition-all placeholder:text-slate-400"
                required
              />
            </div>
            <p className="text-xs text-slate-400">
              O limite de crédito define o valor máximo acumulado de dívidas pendentes que esta pessoa pode ter.
            </p>
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
              {editDebtor ? 'Salvar Alterações' : 'Cadastrar devedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
