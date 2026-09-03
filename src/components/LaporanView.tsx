import React, { useState } from 'react';
import { Report, ReportDetailsPayload, ArchivedTransaction } from '../types';
import { formatCurrency, formatLongDateIndo } from '../utils/dateHelper';
import { analyzeWastefulness, WasteAnalysisCategory } from '../utils/budgetLogic';
import { IconHelper } from './IconHelper';
import {
  BarChart3,
  PiggyBank,
  Calendar,
  ArrowLeft,
  Flame,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Receipt,
  Clock,
  Info
} from 'lucide-react';

interface LaporanViewProps {
  reports: Report[];
  onTriggerEomRolloverManually?: () => Promise<void>;
}

export const LaporanView: React.FC<LaporanViewProps> = ({ reports, onTriggerEomRolloverManually }) => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Parse JSON details payload safely
  const parseDetails = (detailsStr: string): ReportDetailsPayload => {
    try {
      const parsed = JSON.parse(detailsStr);
      if (parsed && typeof parsed === 'object') {
        return {
          envelope_saved: parsed.envelope_saved || parsed || {},
          total_spent: parsed.total_spent || 0,
          total_budget: parsed.total_budget || 0,
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : []
        };
      }
    } catch (e) {
      // Fallback if plain JSON map
    }
    return { envelope_saved: {} };
  };

  // ==========================================
  // SUB-PAGE: REPORT DETAIL VIEW (NOT A MODAL)
  // ==========================================
  if (selectedReport) {
    const details = parseDetails(selectedReport.details);
    const archivedTxs = details.transactions || [];
    const wasteAnalysis: WasteAnalysisCategory[] = analyzeWastefulness(archivedTxs);

    const totalSaved = selectedReport.total_saved;
    const totalSpent = details.total_spent || 0;
    const totalBudget = details.total_budget || (totalSaved + totalSpent);

    return (
      <div className="space-y-4 pb-20 pt-2 px-4 max-w-md mx-auto animate-in fade-in duration-200">
        {/* Navigation Top Bar */}
        <button
          onClick={() => setSelectedReport(null)}
          className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 shadow-sm transition-all"
        >
          <ArrowLeft size={16} /> Kembali ke Daftar Laporan
        </button>

        {/* Title Header Card */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white p-5 rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1">
              <Calendar size={14} /> Arsip Laporan Bulanan
            </span>
            <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
              {selectedReport.month_year}
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">{selectedReport.month_year}</h2>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 text-center">
            <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/50">
              <div className="text-[10px] text-slate-400 font-medium">Total Budget</div>
              <div className="font-bold text-slate-100 text-xs mt-0.5">{formatCurrency(totalBudget)}</div>
            </div>

            <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/50">
              <div className="text-[10px] text-slate-400 font-medium">Pengeluaran</div>
              <div className="font-bold text-red-400 text-xs mt-0.5">{formatCurrency(totalSpent)}</div>
            </div>

            <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/50">
              <div className="text-[10px] text-slate-400 font-medium">Sisa Uang</div>
              <div className="font-bold text-emerald-400 text-xs mt-0.5">{formatCurrency(totalSaved)}</div>
            </div>
          </div>
        </div>

        {/* SECTION 1: ANALISA PEMBOROSAN (NOMINAL & FREKUENSI) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Flame size={16} className="text-amber-500" />
              <span>Analisa Tingkat Pemborosan</span>
            </h3>
            <span className="text-[10px] text-slate-400">Analisa Frekuensi & Nominal</span>
          </div>

          {wasteAnalysis.length === 0 ? (
            <div className="bg-white p-4 rounded-xl border border-slate-100 text-slate-400 text-xs text-center">
              Belum ada data analisa transaksi di arsip bulan ini.
            </div>
          ) : (
            <div className="space-y-2">
              {wasteAnalysis.map(item => {
                const isHigh = item.wasteRisk === 'HIGH';
                const isMed = item.wasteRisk === 'MEDIUM';

                return (
                  <div
                    key={item.envelopeName}
                    className={`bg-white rounded-2xl p-4 shadow-sm border transition-all space-y-2 ${
                      isHigh
                        ? 'border-red-200 bg-red-50/20'
                        : isMed
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800 text-sm">{item.envelopeName}</span>
                        {isHigh && (
                          <span className="text-[10px] bg-red-100 text-red-700 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle size={10} /> BOROS HIGH
                          </span>
                        )}
                        {isMed && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                            Cukup Boros
                          </span>
                        )}
                        {!isHigh && !isMed && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                            Wajar & Aman
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="font-extrabold text-slate-800 text-sm">
                          {formatCurrency(item.totalSpent)}
                        </div>
                      </div>
                    </div>

                    {/* Stats details */}
                    <div className="flex items-center space-x-3 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span>Total: <strong className="text-slate-700">{item.count}x transaksi</strong></span>
                      <span>•</span>
                      <span>Rata-rata: <strong className="text-slate-700">1x tiap {item.avgIntervalDays} hari</strong></span>
                    </div>

                    {/* Insight message */}
                    <p className="text-xs text-slate-600 leading-relaxed pt-0.5 italic">
                      {item.insight}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: RINCIAN SISA DANA PER AMPLOP */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-800 text-sm">Sisa Dana Dihemat per Amplop</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(details.envelope_saved).map(([envName, savedVal]) => (
              <div key={envName} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                <span className="font-medium text-slate-700 truncate">{envName}</span>
                <span className="font-bold text-emerald-600">{formatCurrency(savedVal)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: DAFTAR TRANSAKSI YANG DIARSIPKAN */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Receipt size={16} className="text-slate-600" />
              <span>Daftar Transaksi Bulan Ini</span>
            </h3>
            <span className="text-[11px] text-slate-400">{archivedTxs.length} transaksi</span>
          </div>

          {archivedTxs.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl text-center border border-slate-100 text-slate-400 text-xs">
              Tidak ada catatan transaksi individu di arsip laporan ini.
            </div>
          ) : (
            <div className="space-y-2">
              {archivedTxs.map((tx, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: tx.envelope_color || '#f59e0b' }}
                    >
                      <IconHelper name={tx.envelope_icon || 'Wallet'} size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-xs">{tx.envelope_name}</div>
                      {tx.note && <div className="text-[11px] text-slate-500">{tx.note}</div>}
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock size={10} />
                        <span>{formatLongDateIndo(tx.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-red-600 text-xs">
                      -{formatCurrency(tx.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN LIST VIEW: DAFTAR LAPORAN BULANAN
  // ==========================================
  return (
    <div className="space-y-4 pb-20 pt-2 px-4 max-w-md mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-lg space-y-2 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
            <BarChart3 size={16} /> Laporan & Pengarsipan Bulanan
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Arsip Laporan Bulanan</h2>
        <p className="text-xs text-slate-300">
          Klik laporan bulanan untuk melihat detail pengeluaran, sisa saldo dihemat, dan analisa pemborosan.
        </p>

        {onTriggerEomRolloverManually && (
          <div className="pt-2 border-t border-slate-700/50 flex justify-end">
            <button
              onClick={() => {
                if (confirm('Simulasikan Auto Report & Full Top-Up Tanggal 1?')) {
                  onTriggerEomRolloverManually();
                }
              }}
              className="text-xs px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg border border-amber-500/30 font-medium transition-all"
            >
              Simulasi Auto Report Tgl 1
            </button>
          </div>
        )}
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 text-sm">Riwayat Laporan Akhir Bulan</h3>

        {reports.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center border border-slate-100 space-y-2">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <PiggyBank size={20} />
            </div>
            <p className="text-xs text-slate-500 font-medium">Belum ada laporan pengarsipan bulanan.</p>
            <p className="text-[11px] text-slate-400">
              Laporan otomatis dibuat setiap tanggal 1 ketika sisa saldo bulan sebelumnya diarsipkan.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(rep => {
              const details = parseDetails(rep.details);
              const totalSpent = details.total_spent || 0;

              return (
                <div
                  key={rep.$id || rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-amber-300 hover:shadow-md cursor-pointer transition-all space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-600 font-bold group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-amber-600 transition-colors">
                          {rep.month_year}
                        </h4>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Klik untuk lihat detail & analisa boros
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-emerald-600 font-bold block">
                        + {formatCurrency(rep.total_saved)}
                      </span>
                      <span className="text-[10px] text-slate-400">Sisa Dihemat</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Pengeluaran: <strong className="text-slate-700">{formatCurrency(totalSpent)}</strong></span>
                    <span className="text-amber-600 font-semibold group-hover:translate-x-1 transition-transform">
                      Detail Laporan →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
