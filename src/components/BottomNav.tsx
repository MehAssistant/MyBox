import React from 'react';
import { Home, Activity, History, BarChart3, Plus } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenTransactionModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenTransactionModal
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-xl">
      <div className="max-w-md mx-auto flex items-center justify-between h-16 px-3 relative">
        {/* 1. Tab Home */}
        <button
          onClick={() => onSelectTab('home')}
          className="flex flex-col items-center justify-center w-16 h-full group outline-none cursor-pointer py-1"
        >
          <div
            className={`p-1.5 rounded-xl transition-all duration-300 transform ${
              activeTab === 'home'
                ? 'bg-amber-500 text-white scale-105 shadow-sm shadow-amber-500/30'
                : 'text-slate-400 group-hover:text-slate-700'
            }`}
          >
            <Home size={19} />
          </div>
          <span
            className={`text-[10px] tracking-tight transition-all duration-300 mt-0.5 ${
              activeTab === 'home' ? 'font-bold text-amber-600' : 'font-medium text-slate-500'
            }`}
          >
            Home
          </span>
        </button>

        {/* 2. Tab Aktivitas */}
        <button
          onClick={() => onSelectTab('aktivitas')}
          className="flex flex-col items-center justify-center w-16 h-full group outline-none cursor-pointer py-1"
        >
          <div
            className={`p-1.5 rounded-xl transition-all duration-300 transform ${
              activeTab === 'aktivitas'
                ? 'bg-amber-500 text-white scale-105 shadow-sm shadow-amber-500/30'
                : 'text-slate-400 group-hover:text-slate-700'
            }`}
          >
            <Activity size={19} />
          </div>
          <span
            className={`text-[10px] tracking-tight transition-all duration-300 mt-0.5 ${
              activeTab === 'aktivitas' ? 'font-bold text-amber-600' : 'font-medium text-slate-500'
            }`}
          >
            Aktivitas
          </span>
        </button>

        {/* 3. Center Floating FAB: Transaksi (Hanya Ikon, Tanpa Label, Bulat Sedikit Float) */}
        <div className="relative -top-5 flex flex-col items-center justify-center">
          <button
            onClick={onOpenTransactionModal}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-500 via-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/40 flex items-center justify-center border-4 border-white active:scale-95 hover:scale-105 hover:shadow-xl hover:shadow-amber-500/50 transition-all cursor-pointer outline-none"
            title="Catat Transaksi"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>

        {/* 4. Tab Riwayat */}
        <button
          onClick={() => onSelectTab('riwayat')}
          className="flex flex-col items-center justify-center w-16 h-full group outline-none cursor-pointer py-1"
        >
          <div
            className={`p-1.5 rounded-xl transition-all duration-300 transform ${
              activeTab === 'riwayat'
                ? 'bg-amber-500 text-white scale-105 shadow-sm shadow-amber-500/30'
                : 'text-slate-400 group-hover:text-slate-700'
            }`}
          >
            <History size={19} />
          </div>
          <span
            className={`text-[10px] tracking-tight transition-all duration-300 mt-0.5 ${
              activeTab === 'riwayat' ? 'font-bold text-amber-600' : 'font-medium text-slate-500'
            }`}
          >
            Riwayat
          </span>
        </button>

        {/* 5. Tab Laporan */}
        <button
          onClick={() => onSelectTab('laporan')}
          className="flex flex-col items-center justify-center w-16 h-full group outline-none cursor-pointer py-1"
        >
          <div
            className={`p-1.5 rounded-xl transition-all duration-300 transform ${
              activeTab === 'laporan'
                ? 'bg-amber-500 text-white scale-105 shadow-sm shadow-amber-500/30'
                : 'text-slate-400 group-hover:text-slate-700'
            }`}
          >
            <BarChart3 size={19} />
          </div>
          <span
            className={`text-[10px] tracking-tight transition-all duration-300 mt-0.5 ${
              activeTab === 'laporan' ? 'font-bold text-amber-600' : 'font-medium text-slate-500'
            }`}
          >
            Laporan
          </span>
        </button>
      </div>
    </nav>
  );
};
