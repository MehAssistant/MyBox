import React, { useState } from 'react';
import { Envelope } from '../types';
import { formatCurrency } from '../utils/dateHelper';
import { PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TransactionViewProps {
  envelopes: Envelope[];
  preselectedEnvelopeId?: string;
  onAddTransaction: (envelopeId: string, amount: number, note: string, dateIso: string) => Promise<void>;
  onNavigateToRiwayat?: () => void;
}

export const TransactionView: React.FC<TransactionViewProps> = ({
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
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 pt-2 px-4 max-w-md mx-auto">
      {/* Transaction Quick Input Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
        <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
          <PlusCircle size={18} className="text-amber-500" />
          <span>Catat Transaksi Pengeluaran</span>
        </h2>

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-2 border border-emerald-100">
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
            Belum ada amplop tersedia. Silakan buat amplop baru terlebih dahulu melalui menu header.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Pilih Amplop *</label>
              <select
                value={selectedEnvelopeId}
                onChange={e => setSelectedEnvelopeId(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none font-medium"
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
                  min="100"
                  step="1000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-10 pr-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-800 text-base"
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm mt-2"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
