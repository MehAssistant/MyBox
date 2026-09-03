import React from 'react';
import { Envelope } from '../types';
import { formatCurrency } from '../utils/dateHelper';
import { getSmartRecommendation } from '../utils/budgetLogic';
import { IconHelper } from './IconHelper';
import { Wallet, Sparkles, Plus, RefreshCw, Settings } from 'lucide-react';

interface DashboardViewProps {
  envelopes: Envelope[];
  onOpenEnvelopeModal: (envelope?: Envelope) => void;
  onNavigateToTransaction: (envelopeId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  envelopes,
  onOpenEnvelopeModal,
  onNavigateToTransaction
}) => {
  // Total Saldo Keseluruhan diukur berdasarkan total uang di alokasi bulan itu (Active Balance + Reserve Balance)
  const totalOverallBalance = envelopes.reduce(
    (sum, env) => sum + (env.active_balance || 0) + (env.reserve_balance || 0),
    0
  );

  const today = new Date();
  const currentDate = today.getDate();

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
                      {/* Dynamic Subtitle for Smart Recommendation */}
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        {env.is_smart_rec ? (
                          <span className="text-amber-600 font-medium flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md text-[11px]">
                            <Sparkles size={12} className="text-amber-500" />
                            {dailyFormatted}/hari <span className="text-slate-400 font-normal">({smartRec.remainingDays} hr lg)</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Standard Budget</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Active Balance Display */}
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-medium">Saldo Aktif</div>
                    <div className="font-extrabold text-slate-800 text-lg">
                      {formatCurrency(env.active_balance || 0)}
                    </div>
                  </div>
                </div>

                {/* Footer details & action buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 pl-1">
                  <div className="space-x-2 text-[11px]">
                    <span>Cadangan: <strong className="text-slate-700">{formatCurrency(env.reserve_balance || 0)}</strong></span>
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
    </div>
  );
};
