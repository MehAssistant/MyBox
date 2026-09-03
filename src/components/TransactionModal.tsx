import React, { useState, useEffect } from 'react';
import { Envelope } from '../types';
import { formatCurrency } from '../utils/dateHelper';
import { PlusCircle, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  envelopes: Envelope[];
  preselectedEnvelopeId?: string;
  onAddTransaction: (envelopeId: string, amount: number, note: string, dateIso: string) => Promise<void>;
  onNavigateToRiwayat?: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  envelopes,
  preselectedEnvelopeId = '',
  onAddTransaction,
  onNavigateToRiwayat
}) => {
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState<string>(
    preselectedEnvelopeId || (envelopes[0]?.$id || envelopes[0]?.id || '')
  );
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (preselectedEnvelopeId) {
      setSelectedEnvelopeId(preselectedEnvelopeId);
    } else if (envelopes.length > 0 && !selectedEnvelopeId) {
      setSelectedEnvelopeId(envelopes[0].$id || envelopes[0].id || '');
    }
  }, [preselectedEnvelopeId, envelopes]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const numAmount = Number(amount);
    if (!selectedEnvelopeId) {
      setErrorMsg('Pilih amplop terlebih dahulu.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Masukkan nominal transaksi yang valid (> 0).');
      return;
    }

    setIsSubmitting(true);
    try {
      const dateIso = new Date(dateStr).toISOString();
      await onAddTransaction(selectedEnvelopeId, numAmount, note.trim(), dateIso);

      setSuccessMsg(`Transaksi Rp ${numAmount.toLocaleString('id-ID')} berhasil dicatat!`);
      setAmount('');
      setNote('');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-Up Bottom Sheet / Modal Dialog */}
      <div className="relative z-10 bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl space-y-4 transform transition-all animate-in slide-in-from-bottom duration-200">
        {/* Mobile Drag Indicator Pill */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto -mt-2 mb-1 sm:hidden"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <PlusCircle size={18} className="text-amber-500" />
            <span>Catat Transaksi Pengeluaran</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-2 border border-emerald-100 animate-in zoom-in-95">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium flex items-center gap-2 border border-red-100">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {envelopes.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            Belum ada amplop tersedia. Silakan buat amplop baru terlebih dahulu.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Pilih Amplop *</label>
              <select
                value={selectedEnvelopeId}
                onChange={e => setSelectedEnvelopeId(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none font-medium text-xs sm:text-sm"
              >
                {envelopes.map(env => (
                  <option key={env.$id || env.id} value={env.$id || env.id}>
                    {env.name} (Saldo: {formatCurrency(env.active_balance || 0)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nominal Pengeluaran (Rp) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-10 pr-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-800 text-base"
                  autoFocus
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal & Waktu</label>
                <input
                  type="datetime-local"
                  required
                  value={dateStr}
                  onChange={e => setDateStr(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Catatan (Opsional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Contoh: Makan Siang Nasi Padang"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
