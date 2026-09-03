import React, { useState } from 'react';
import { Activity } from '../types';
import { formatCurrency, formatLongDateIndo, formatTimeStr } from '../utils/dateHelper';
import { 
  Activity as ActivityIcon, 
  ArrowUpCircle, 
  RefreshCw, 
  Settings, 
  Sparkles, 
  Wallet, 
  Clock, 
  Filter,
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface AktivitasViewProps {
  activities: Activity[];
  onClearActivities?: () => void;
}

export const AktivitasView: React.FC<AktivitasViewProps> = ({
  activities,
  onClearActivities
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredActivities = activities.filter(act => {
    if (filterType === 'all') return true;
    return act.type === filterType;
  });

  const getBadgeConfig = (type: string) => {
    switch (type) {
      case 'top_up':
        return {
          icon: ArrowUpCircle,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          badgeText: 'Top Up'
        };
      case 'auto_debt':
        return {
          icon: RefreshCw,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          badgeText: 'Auto Debt'
        };
      case 'setting_change':
        return {
          icon: Settings,
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          badgeText: 'Pengaturan'
        };
      default:
        return {
          icon: Clock,
          color: 'text-slate-600',
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          badgeText: 'Sistem'
        };
    }
  };

  return (
    <div className="space-y-4 pb-24 pt-2 px-4 max-w-md mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ActivityIcon size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-base">Aktivitas Sistem & Top Up</h2>
            <p className="text-xs text-slate-500">Log riwayat auto debt, top up amplop, dan pengaturan</p>
          </div>
        </div>

        {activities.length > 0 && onClearActivities && (
          <button
            onClick={onClearActivities}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Bersihkan log aktivitas"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* 2. Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
        {[
          { id: 'all', label: 'Semua' },
          { id: 'top_up', label: 'Top Up' },
          { id: 'auto_debt', label: 'Auto Debt' },
          { id: 'setting_change', label: 'Pengaturan' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
              filterType === tab.id
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Activity Flatlist */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center border border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
            <ActivityIcon size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-700">Belum Ada Catatan Aktivitas</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Aktivitas seperti Top Up manual, auto-debt tambalan mingguan, dan pergantian pengaturan akan tercatat otomatis di sini.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredActivities.map((act, index) => {
            const config = getBadgeConfig(act.type);
            const Icon = config.icon;
            const dateDisplay = act.timestamp ? formatLongDateIndo(act.timestamp) : 'Baru saja';
            const timeDisplay = act.timestamp ? formatTimeStr(act.timestamp) : '';

            return (
              <div
                key={act.$id || act.id || `act-${index}`}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-amber-200 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2.5 rounded-xl ${config.bg} ${config.color} shrink-0 mt-0.5`}>
                      <Icon size={18} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{act.title}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${config.bg} ${config.color} border ${config.border}`}>
                          {config.badgeText}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{act.description}</p>
                    </div>
                  </div>

                  {act.amount !== undefined && act.amount > 0 && (
                    <div className="text-right shrink-0">
                      <span className="font-bold text-sm text-emerald-600">
                        +{formatCurrency(act.amount)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Detailed Breakdown Pill (Especially for Auto Debt tambalan dari sisa minggu lalu) */}
                {act.details && Object.keys(act.details).length > 0 && (
                  <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 text-[11px] text-slate-600 grid grid-cols-2 gap-2">
                    {act.details.tambalan_dari_cadangan !== undefined && (
                      <div>
                        <span className="text-slate-400 block">Besaran Tambalan:</span>
                        <strong className="text-blue-600 font-bold">{formatCurrency(act.details.tambalan_dari_cadangan)}</strong>
                      </div>
                    )}
                    {act.details.sisa_minggu_sebelumnya !== undefined && (
                      <div>
                        <span className="text-slate-400 block">Sisa Minggu Lalu:</span>
                        <strong className="text-slate-700 font-semibold">{formatCurrency(act.details.sisa_minggu_sebelumnya)}</strong>
                      </div>
                    )}
                    {act.details.target_mingguan !== undefined && (
                      <div>
                        <span className="text-slate-400 block">Target Mingguan:</span>
                        <strong className="text-slate-700 font-semibold">{formatCurrency(act.details.target_mingguan)}</strong>
                      </div>
                    )}
                    {act.details.sisa_cadangan !== undefined && (
                      <div>
                        <span className="text-slate-400 block">Sisa Cadangan:</span>
                        <strong className="text-slate-700 font-semibold">{formatCurrency(act.details.sisa_cadangan)}</strong>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-50">
                  <span>{dateDisplay} {timeDisplay && `• ${timeDisplay}`}</span>
                  {act.envelope_name && (
                    <span className="font-medium text-slate-500 flex items-center gap-1">
                      <Wallet size={12} /> {act.envelope_name}
                    </span>
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
