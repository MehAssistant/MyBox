import React, { useState } from 'react';
import { Envelope } from '../types';
import { formatCurrency } from '../utils/dateHelper';
import { getSmartRecommendation } from '../utils/budgetLogic';
import { IconHelper } from './IconHelper';
import { Wallet, Sparkles, Plus, RefreshCw, Settings, ArrowUpCircle, CheckCircle2, X } from 'lucide-react';

interface DashboardViewProps {
  envelopes: Envelope[];
  onOpenEnvelopeModal: (envelope?: Envelope) => void;
  onNavigateToTransaction: (envelopeId?: string) => void;
  onTopUpEnvelope?: (envelopeId: string) => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  envelopes,
  onOpenEnvelopeModal,
  onNavigateToTransaction,
  onTopUpEnvelope
}) => {
  // State for Top Up Feature
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState<string | null>(null);
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);
  const [successAlertData, setSuccessAlertData] = useState<{
    isOpen: boolean;
    envelopeName: string;
    amount: number;
    newBalance: number;
  } | null>(null);

  // Total Saldo Keseluruhan diukur berdasarkan total uang di alokasi bulan itu (Active Balance + Reserve Balance)
  const totalOverallBalance = envelopes.reduce(
    (sum, env) => sum + (env.active_balance || 0) + (env.reserve_balance || 0),
    0
  );

  const today = new Date();
  const currentDate = today.getDate();

  // Handle Top Up Execution
  const handleProcessTopUp = async () => {
    if (!selectedEnvelopeId) return;
    const targetEnv = envelopes.find(e => (e.$id === selectedEnvelopeId || e.id === selectedEnvelopeId));
    if (!targetEnv) return;

    const topUpAmount = targetEnv.target_monthly || 0;
    const newBalance = (targetEnv.active_balance || 0) + topUpAmount;

    setIsProcessingTopUp(true);
    try {
      if (onTopUpEnvelope) {
        await onTopUpEnvelope(selectedEnvelopeId);
      }
      setIsTopUpModalOpen(false);
      setSuccessAlertData({
        isOpen: true,
        envelopeName: targetEnv.name,
        amount: topUpAmount,
        newBalance
      });
    } catch (err) {
      console.error('Failed to top up:', err);
    } finally {
      setIsProcessingTopUp(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 pt-2 px-4 max-w-md mx-auto">
      {/* 1. Dashboard Total Saldo Keseluruhan Banner */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 opacity-15 pointer-events-none">
          <Wallet size={140} />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-100/90 flex items-center gap-1.5">
              <Wallet size={14} /> Total Saldo Keseluruhan
            </span>
            <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-md">
              Tgl {currentDate}
            </span>
          </div>

          <div className="text-3xl font-extrabold tracking-tight">
            {formatCurrency(totalOverallBalance)}
          </div>

          {/* Tombol Top Up di bawah Total Saldo */}
          <div className="pt-2">
            <button
              onClick={() => {
                if (envelopes.length > 0) {
                  setSelectedEnvelopeId(envelopes[0].$id || envelopes[0].id || '');
                }
                setIsTopUpModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 active:scale-95 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl backdrop-blur-md transition-all shadow-xs border border-white/25 cursor-pointer"
            >
              <ArrowUpCircle size={15} />
              <span>Top Up</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quick Actions Header */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
          <span>Daftar Amplop</span>
          <span className="text-xs font-normal text-slate-500">({envelopes.length})</span>
        </h2>
        <button
          onClick={() => onOpenEnvelopeModal()}
          className="text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
        >
          <Plus size={14} /> Tambah Amplop
        </button>
      </div>

      {/* 3. Envelopes List Grid */}
      {envelopes.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center border border-dashed border-slate-300 space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <p className="text-sm text-slate-600 font-medium">Belum ada amplop dibuat.</p>
          <button
            onClick={() => onOpenEnvelopeModal()}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold shadow hover:bg-amber-600 transition-all"
          >
            Buat Amplop Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {envelopes.map(env => {
            const smartRec = getSmartRecommendation(env.active_balance || 0, today);
            const dailyFormatted = formatCurrency(smartRec.dailyLimit);

            return (
              <div
                key={env.$id || env.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all space-y-3 relative overflow-hidden"
              >
                {/* Accent line on left */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: env.color || '#f59e0b' }}
                />

                <div className="flex items-start justify-between pl-1">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm font-bold"
                      style={{ backgroundColor: env.color || '#f59e0b' }}
                    >
                      <IconHelper name={env.icon} size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-tight flex items-center gap-1.5">
                        {env.name}
                        {env.is_auto_debt && (
                          <span title="Auto Debt Active" className="text-blue-500">
                            <RefreshCw size={12} />
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Target: {formatCurrency(env.target_monthly)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-extrabold text-slate-800">
                      {formatCurrency(env.active_balance)}
                    </div>
                    <div className="text-[11px] text-slate-500">Saldo Aktif</div>
                  </div>
                </div>

                {/* Smart Recommendation Chip */}
                {env.is_smart_rec && (
                  <div className="bg-amber-50/70 border border-amber-100/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 text-amber-900 font-medium">
                      <Sparkles size={14} className="text-amber-500 shrink-0" />
                      <span>Saran Hari Ini</span>
                    </div>
                    <div className="font-bold text-amber-800">
                      {dailyFormatted} <span className="text-[10px] font-normal text-amber-700">/hari</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 pl-1">
                  <div className="flex items-center space-x-2">
                    <span>Mingguan: {formatCurrency(env.weekly_allowance)}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onOpenEnvelopeModal(env)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Edit Amplop"
                    >
                      <Settings size={15} />
                    </button>
                    <button
                      onClick={() => onNavigateToTransaction(env.$id || env.id)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                    >
                      + Catat
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Top Up Selection Popup (Flatlist Amplop) */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsTopUpModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative z-10 bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[85vh] p-5 shadow-2xl space-y-4 flex flex-col transform transition-all animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <ArrowUpCircle size={18} className="text-amber-500" />
                  <span>Top Up Amplop</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih amplop untuk top up saldo sesuai target bulanan
                </p>
              </div>
              <button
                onClick={() => setIsTopUpModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Flatlist Daftar Amplop */}
            <div className="overflow-y-auto max-h-72 space-y-2 py-1 pr-1">
              {envelopes.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Belum ada amplop tersedia. Silakan tambahkan amplop terlebih dahulu.
                </div>
              ) : (
                envelopes.map(env => {
                  const isSelected = selectedEnvelopeId === (env.$id || env.id);

                  return (
                    <div
                      key={env.$id || env.id}
                      onClick={() => setSelectedEnvelopeId(env.$id || env.id || '')}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/80 shadow-xs ring-2 ring-amber-400/40 text-amber-950 font-medium'
                          : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50/90 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs font-bold shrink-0"
                          style={{ backgroundColor: env.color || '#f59e0b' }}
                        >
                          <IconHelper name={env.icon} size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-800">{env.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>Target: <strong className="text-slate-700 font-semibold">{formatCurrency(env.target_monthly || 0)}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Selected State Indicator */}
                      <div className="flex items-center pl-2">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-xs">
                            <CheckCircle2 size={15} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Action Buttons */}
            <div className="flex gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsTopUpModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!selectedEnvelopeId || envelopes.length === 0 || isProcessingTopUp}
                onClick={handleProcessTopUp}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isProcessingTopUp ? 'Memproses...' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Dynamic SweetAlert-Style Success Popup */}
      {successAlertData?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl text-center space-y-4 transform animate-in zoom-in-95 duration-200 border border-slate-100">
            {/* Animated SweetAlert Success Checkmark Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center ring-8 ring-emerald-50">
              <CheckCircle2 size={38} className="animate-bounce" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-800">Top Up Berhasil!</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Saldo amplop <strong className="text-slate-800 font-bold">{successAlertData.envelopeName}</strong> berhasil ditambahkan sebesar{' '}
                <span className="text-emerald-600 font-bold">{formatCurrency(successAlertData.amount)}</span>.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Saldo Baru:</span>
                <span className="font-extrabold text-slate-800 text-sm">
                  {formatCurrency(successAlertData.newBalance)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSuccessAlertData(null)}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-bold rounded-xl shadow-md text-xs transition-all cursor-pointer"
            >
              OK, Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
