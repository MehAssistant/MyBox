import React, { useState, useRef, useEffect } from 'react';
import { Menu, Wallet, Camera, ClipboardList, ChevronDown, Check, Sparkles } from 'lucide-react';
import { AppMode } from '../types';

interface HeaderNavProps {
  activeMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  onOpenDrawer: () => void;
  totalActiveBalance: number;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeMode,
  onSelectMode,
  onOpenDrawer,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const modeThemes = {
    amplop: {
      bg: 'bg-amber-500',
      tagBg: 'bg-amber-600/80',
      subtitle: 'Smart Envelope Budgeting',
      subtitleColor: 'text-amber-100/90',
      icon: <Wallet size={18} />,
      badge: 'BaaS',
    },
    dailycam: {
      bg: 'bg-blue-600',
      tagBg: 'bg-blue-700/80',
      subtitle: 'Daily Photo Progress',
      subtitleColor: 'text-blue-100/90',
      icon: <Camera size={18} />,
      badge: 'CAM',
    },
    textpaste: {
      bg: 'bg-emerald-600',
      tagBg: 'bg-emerald-700/80',
      subtitle: 'Secret Vault & Fast Copy',
      subtitleColor: 'text-emerald-100/90',
      icon: <ClipboardList size={18} />,
      badge: 'VAULT',
    },
  };

  const currentTheme = modeThemes[activeMode] || modeThemes.amplop;

  const modeOptions: { mode: AppMode; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      mode: 'amplop',
      label: 'Amplop',
      desc: 'Smart Envelope Budgeting',
      icon: <Wallet size={18} className="text-amber-500" />,
      color: 'hover:bg-amber-50',
    },
    {
      mode: 'dailycam',
      label: 'DailyCam',
      desc: 'Blind Photo & Finale Snap',
      icon: <Camera size={18} className="text-blue-500" />,
      color: 'hover:bg-blue-50',
    },
    {
      mode: 'textpaste',
      label: 'TextPaste',
      desc: 'Vault Kredensial & Salin Cepat',
      icon: <ClipboardList size={18} className="text-emerald-500" />,
      color: 'hover:bg-emerald-50',
    },
  ];

  return (
    <header className={`sticky top-0 z-40 ${currentTheme.bg} text-white shadow-md transition-colors duration-300`}>
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between relative">
        {/* Left Side: Clickable Floating Dropdown Trigger */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="flex items-center space-x-2.5 text-left active:scale-98 transition-transform group focus:outline-none"
            title="Klik untuk beralih mode aplikasi"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white shadow-inner border border-white/25 group-hover:bg-white/30 transition-all">
                {currentTheme.icon}
              </div>
              <span className="absolute -bottom-1 -right-1 bg-white text-slate-800 p-0.5 rounded-full shadow-sm">
                <ChevronDown size={11} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-lg tracking-tight leading-none text-white">
                  MyBox
                </h1>
                <span className={`text-[10px] uppercase tracking-wider ${currentTheme.tagBg} text-white px-1.5 py-0.5 rounded font-semibold`}>
                  {currentTheme.badge}
                </span>
              </div>
              <p className={`text-xs ${currentTheme.subtitleColor} font-medium mt-0.5 flex items-center gap-1`}>
                <span>{currentTheme.subtitle}</span>
              </p>
            </div>
          </button>

          {/* Floating Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute left-0 top-12 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 text-slate-800 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="px-3.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-600 uppercase border-b border-slate-100 mb-1 flex items-center justify-between">
                <span>Pilih Mode Aplikasi</span>
                <Sparkles size={12} className="text-amber-500" />
              </div>

              {modeOptions.map(option => {
                const isSelected = activeMode === option.mode;
                return (
                  <button
                    key={option.mode}
                    onClick={() => {
                      onSelectMode(option.mode);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors ${option.color} ${
                      isSelected ? 'bg-slate-50 font-semibold' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shadow-xs">
                        {option.icon}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                          {option.label}
                        </div>
                        <div className="text-[11px] text-slate-600 font-normal leading-tight">
                          {option.desc}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                        <Check size={12} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Drawer menu button */}
        <button
          onClick={onOpenDrawer}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white flex items-center gap-1.5 text-xs font-medium border border-white/20 shadow-sm"
          title="Pengaturan & Akun"
        >
          <Menu size={18} />
          <span className="hidden sm:inline">Menu</span>
        </button>
      </div>
    </header>
  );
};

