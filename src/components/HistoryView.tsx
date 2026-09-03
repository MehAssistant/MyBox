import React, { useState } from 'react';
import { Transaction, Envelope } from '../types';
import { formatCurrency, formatLongDateIndo } from '../utils/dateHelper';
import { canRollbackTransaction } from '../utils/budgetLogic';
import { IconHelper } from './IconHelper';
import { History, Search, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';

interface HistoryViewProps {
  transactions: Transaction[];
  envelopes: Envelope[];
  onDeleteTransaction: (transactionId: string) => Promise<void>;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  transactions,
  envelopes,
  onDeleteTransaction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnvFilter, setSelectedEnvFilter] = useState('semua');

  const now = new Date();

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const env = envelopes.find(e => (e.$id || e.id) === tx.envelope_id);
    const matchesSearch =
      (tx.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (env?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEnv =
      selectedEnvFilter === 'semua' ? true : tx.envelope_id === selectedEnvFilter;

    return matchesSearch && matchesEnv;
  });

  return (
    <div className="space-y-4 pb-20 pt-2 px-4 max-w-md mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-lg space-y-2 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
            <History size={16} /> Riwayat Pengeluaran
          </span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
            Rollback &lt; 24j
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Riwayat Transaksi</h2>
        <p className="text-xs text-slate-300">
          Seluruh aktivitas transaksi tercatat murni dari database. Transaksi &lt; 24 jam dapat dibatalkan untuk mengembalikan saldo.
        </p>
      </div>

      {/* Filter and Search Card */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari catatan atau nama amplop..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 text-[11px] font-medium">Filter Amplop:</span>
          <select
            value={selectedEnvFilter}
            onChange={e => setSelectedEnvFilter(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 text-xs text-slate-700 outline-none font-medium"
          >
            <option value="semua">Semua Amplop</option>
            {envelopes.map(env => (
              <option key={env.$id || env.id} value={env.$id || env.id}>
                {env.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center border border-slate-100 space-y-2">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <History size={20} />
          </div>
          <p className="text-xs text-slate-500 font-medium">Tidak ada transaksi ditemukan di database.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map(tx => {
            const env = envelopes.find(e => (e.$id || e.id) === tx.envelope_id);
            const eligibleRollback = canRollbackTransaction(tx.timestamp, now);

            return (
              <div
                key={tx.$id || tx.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: env?.color || '#94a3b8' }}
                  >
                    <IconHelper name={env?.icon || 'Wallet'} size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">
                      {env?.name || 'Amplop'}
                    </div>
                    {tx.note && <div className="text-xs text-slate-600">{tx.note}</div>}
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock size={10} />
                      <span>{formatLongDateIndo(tx.timestamp)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center gap-3">
                  <div>
                    <div className="font-extrabold text-red-600 text-base">
                      -{formatCurrency(tx.amount)}
                    </div>
                    {eligibleRollback ? (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                        Rollback (&lt;24j)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Terkunci (&gt;24j)</span>
                    )}
                  </div>

                  {eligibleRollback && (
                    <button
                      onClick={async () => {
                        if (confirm(`Batalkan transaksi ${formatCurrency(tx.amount)} dan kembalikan ke saldo amplop ${env?.name || ''}?`)) {
                          await onDeleteTransaction(tx.$id || tx.id || '');
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Rollback (Batalkan & Kembalikan Saldo)"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
