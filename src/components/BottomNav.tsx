import React from 'react';
import { Home, PlusCircle, History, BarChart3 } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'transaksi' as TabType, label: 'Transaksi', icon: PlusCircle },
    { id: 'riwayat' as TabType, label: 'Riwayat', icon: History },
    { id: 'laporan' as TabType, label: 'Laporan', icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-xl">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="flex flex-col items-center justify-center w-full h-full group outline-none cursor-pointer py-1"
            >
              <div
                className={`p-2 rounded-2xl transition-all duration-300 transform ${
                  isActive
                    ? 'bg-amber-500 text-white scale-110 -translate-y-1 shadow-md shadow-amber-500/30'
                    : 'text-slate-400 group-hover:text-slate-700 group-hover:scale-105'
                }`}
              >
                <Icon size={20} className="transition-transform duration-300" />
              </div>
              <span
                className={`text-[10px] tracking-tight transition-all duration-300 mt-0.5 ${
                  isActive ? 'font-bold text-amber-600 scale-105' : 'font-medium text-slate-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
