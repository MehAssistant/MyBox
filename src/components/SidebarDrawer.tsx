import React, { useState, useEffect } from 'react';
import { Envelope, AppMode } from '../types';
import { IconHelper } from './IconHelper';
import { 
  X, 
  Plus, 
  RefreshCw, 
  Database, 
  LogOut, 
  User, 
  FileText, 
  BellRing, 
  RotateCcw, 
  Settings, 
  Camera, 
  ClipboardList, 
  Wallet, 
  ShieldCheck, 
  Info,
  Check,
  Download
} from 'lucide-react';
import { formatCurrency } from '../utils/dateHelper';
import {
  getNotificationPermissionStatus,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  sendNotification,
  getDeviceName
} from '../utils/notificationHelper';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode?: AppMode;
  envelopes: Envelope[];
  onOpenEnvelopeModal: (envelope?: Envelope) => void;
  onRunScheduledCheck: () => Promise<void>;
  isAppwriteConnected: boolean;
  userId?: string;
  userEmail?: string;
  onLogout?: () => Promise<void>;
  isMonthlyAutoDebtEnabled?: boolean;
  onToggleMonthlyAutoDebt?: (enabled: boolean) => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeMode = 'amplop',
  envelopes,
  onOpenEnvelopeModal,
  onRunScheduledCheck,
  isAppwriteConnected,
  userId,
  userEmail,
  onLogout,
  isMonthlyAutoDebtEnabled = true,
  onToggleMonthlyAutoDebt
}) => {
  const [isNotifActive, setIsNotifActive] = useState<boolean>(false);
  const [isSubscribingNotif, setIsSubscribingNotif] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRunningCheck, setIsRunningCheck] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const perm = getNotificationPermissionStatus();
      const localFlag = localStorage.getItem(userId ? `mb_push_enabled_${userId}` : 'mb_push_enabled');
      setIsNotifActive(perm === 'granted' && localFlag === 'true');

      // Check if already running in standalone PWA mode
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsAppInstalled(true);
      }

      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      const handleAppInstalled = () => {
        setIsAppInstalled(true);
        setDeferredPrompt(null);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, [isOpen, userId]);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsAppInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // Toggle Push Notifications On/Off
  const handleToggleNotification = async (enabled: boolean) => {
    setIsSubscribingNotif(true);
    setFeedbackMsg('');

    if (enabled) {
      const res = await subscribeToNotifications(userId);
      if (res.success) {
        setIsNotifActive(true);
        setFeedbackMsg('✅ Perangkat berhasil disimpan ke database Appwrite!');
      } else {
        setIsNotifActive(false);
        setFeedbackMsg(`❌ ${res.message}`);
      }
    } else {
      await unsubscribeFromNotifications(userId);
      setIsNotifActive(false);
      setFeedbackMsg('ℹ️ Notifikasi dinonaktifkan & perangkat dihapus.');
    }

    setIsSubscribingNotif(false);
  };

  // Reset and Re-Subscribe Device
  const handleResetAndReRegister = async () => {
    setIsSubscribingNotif(true);
    setFeedbackMsg('');
    await unsubscribeFromNotifications(userId);
    const res = await subscribeToNotifications(userId);
    if (res.success) {
      setIsNotifActive(true);
      setFeedbackMsg(`✅ Izin di-reset & didaftarkan ulang ke Appwrite (${getDeviceName()})`);
    } else {
      setFeedbackMsg(`❌ ${res.message}`);
    }
    setIsSubscribingNotif(false);
  };

  const handleTestNotification = () => {
    sendNotification(
      '🔔 Pengingat Anggaran MyBox',
      'Pengeluaran harian Anda aman hari ini. Notifikasi berfungsi sempurna!'
    );
  };

  const handleRunCheck = async () => {
    setIsRunningCheck(true);
    try {
      await onRunScheduledCheck();
      alert('Cek Auto-Debt & Reset Fase Selesai dieksekusi!');
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunningCheck(false);
    }
  };

  // Mode-based Theme Configurations
  const modeConfigs = {
    amplop: {
      title: 'Manajemen Amplop',
      subtitle: 'Smart Envelope Budgeting',
      iconBg: 'bg-amber-500',
      icon: <Wallet size={16} className="text-white" />,
      userIconBg: 'bg-amber-100 text-amber-700',
      btnBg: 'bg-amber-500 hover:bg-amber-600',
      hoverBorder: 'hover:border-amber-200 hover:bg-amber-50/50',
      accentColor: 'text-amber-600',
    },
    dailycam: {
      title: 'MyBox DailyCam',
      subtitle: 'Daily Photo Progress',
      iconBg: 'bg-blue-600',
      icon: <Camera size={16} className="text-white" />,
      userIconBg: 'bg-blue-100 text-blue-700',
      btnBg: 'bg-blue-600 hover:bg-blue-700',
      hoverBorder: 'hover:border-blue-200 hover:bg-blue-50/50',
      accentColor: 'text-blue-600',
    },
    textpaste: {
      title: 'MyBox TextPaste',
      subtitle: 'Vault Kredensial & Teks',
      iconBg: 'bg-emerald-600',
      icon: <ClipboardList size={16} className="text-white" />,
      userIconBg: 'bg-emerald-100 text-emerald-700',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700',
      hoverBorder: 'hover:border-emerald-200 hover:bg-emerald-50/50',
      accentColor: 'text-emerald-600',
    },
  };

  const currentConfig = modeConfigs[activeMode] || modeConfigs.amplop;

  return (
    <>
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Smooth Backdrop Overlay Fade-In */}
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
        />

        {/* Smooth Slide-In Drawer Panel */}
        <div
          className={`fixed top-0 bottom-0 left-0 z-50 w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-4 overflow-y-auto transform transition-transform duration-300 ease-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-xl ${currentConfig.iconBg} text-white font-bold flex items-center justify-center shadow-md`}>
                  {currentConfig.icon}
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-sm leading-tight">{currentConfig.title}</h2>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Database size={11} className={isAppwriteConnected ? 'text-emerald-500' : 'text-amber-500'} />
                    <span>{isAppwriteConnected ? 'Appwrite Cloud' : 'Local Cache'}</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Logged in User Profile badge */}
            {userEmail && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <div className={`p-2 rounded-xl ${currentConfig.userIconBg} flex items-center justify-center shrink-0`}>
                    <User size={15} />
                  </div>
                  <div className="truncate text-xs">
                    <div className="text-[10px] text-slate-400 font-medium">Akun Google Aktif</div>
                    <div className="font-semibold text-slate-700 truncate">{userEmail}</div>
                  </div>
                </div>
              </div>
            )}

            {/* PWA Install Action Button (shown when installable via Chrome/Android) */}
            {deferredPrompt && !isAppInstalled && (
              <button
                onClick={handleInstallPWA}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <Download size={16} />
                <span>Install Aplikasi Mybox</span>
              </button>
            )}

            {/* SEGMENT CONTENT BASED ON ACTIVE MODE */}
            {activeMode === 'amplop' ? (
              <>
                {/* Envelope Action Button */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenEnvelopeModal();
                  }}
                  className={`w-full py-2.5 px-3 ${currentConfig.btnBg} text-white text-xs font-semibold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer`}
                >
                  <Plus size={16} /> Buat Amplop Baru
                </button>

                {/* Envelopes list */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Daftar Amplop ({envelopes.length})
                  </div>
                  <div className="space-y-1.5 max-h-[36vh] overflow-y-auto pr-1">
                    {envelopes.map(env => (
                      <div
                        key={env.$id || env.id}
                        onClick={() => {
                          onClose();
                          onOpenEnvelopeModal(env);
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 ${currentConfig.hoverBorder} cursor-pointer transition-all text-xs`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
                            style={{ backgroundColor: env.color || '#f59e0b' }}
                          >
                            <IconHelper name={env.icon} size={14} />
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-slate-800 truncate">{env.name}</div>
                            <div className="text-[10px] text-slate-500">
                              {env.type === 'monthly_split' ? 'Monthly Split' : 'Standard'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-slate-700">{formatCurrency(env.active_balance || 0)}</div>
                          <div className={`text-[10px] ${currentConfig.accentColor}`}>Edit</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : activeMode === 'dailycam' ? (
              /* DailyCam Segment Account Info */
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/70 text-xs text-blue-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-950">
                    <Camera size={16} className="text-blue-600" />
                    <span>Mode DailyCam Aktif</span>
                  </div>
                  <p className="text-[11px] text-blue-800/90 leading-relaxed">
                    Setiap hari hanya dibatasi 1 foto untuk mendokumentasikan progres Anda secara konsisten. Seluruh foto tersimpan dengan aman di cloud storage.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1 text-slate-600">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Fitur Keamanan</div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Isolasi Akun Pengguna Aktif</span>
                  </div>
                </div>
              </div>
            ) : (
              /* TextPaste Segment Account Info */
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-950">
                    <ClipboardList size={16} className="text-emerald-600" />
                    <span>Mode TextPaste Vault Aktif</span>
                  </div>
                  <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                    Kredensial, identitas, dan teks rahasia Anda tersimpan dalam vault terlindungi dengan tombol salin cepat ke clipboard.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1 text-slate-600">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Fitur Keamanan</div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Terenkripsi & Terisolasi Akun</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions: Logout Button + Settings Gear Button */}
          <div className="border-t pt-3 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              {onLogout && (
                <button
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="flex-1 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors text-xs border border-red-100 active:scale-98 cursor-pointer"
                >
                  <LogOut size={14} /> Logout
                </button>
              )}

              {/* Settings Gear Button (Opens Pop-up) */}
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all active:scale-95 border border-slate-200 cursor-pointer"
                title="Pengaturan Sistem & Notifikasi"
              >
                <Settings size={16} className="text-slate-600" />
              </button>
            </div>

            <div className="text-[10px] text-slate-400 text-center">
              MyBox BaaS v1.0 • Appwrite Cloud
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* POP-UP MODAL: SETTINGS & NOTIFICATIONS                       */}
      {/* ============================================================ */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
                  <Settings size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Pengaturan Sistem</h3>
                  <p className="text-[11px] text-slate-500">Notifikasi & Konfigurasi Akun</p>
                </div>
              </div>

              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Push Notification Toggle Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BellRing size={16} className={isNotifActive ? 'text-emerald-600' : 'text-amber-600'} />
                  <span className="font-bold text-slate-800 text-xs">Push Notification</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNotifActive}
                    disabled={isSubscribingNotif}
                    onChange={e => handleToggleNotification(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <p className="text-[10px] text-slate-500 leading-tight">
                {isNotifActive
                  ? `Aktif untuk perangkat: ${getDeviceName()}`
                  : 'Mati: Aktifkan untuk menerima notifikasi pengingat anggaran harian.'}
              </p>

              {feedbackMsg && (
                <div className="text-[10px] font-medium text-slate-700 bg-white p-1.5 rounded-lg border border-slate-200">
                  {feedbackMsg}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-1">
                {isNotifActive && (
                  <button
                    onClick={handleTestNotification}
                    className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-[10px] border border-emerald-200 transition-colors cursor-pointer"
                  >
                    Tes Notifikasi 🔔
                  </button>
                )}
                <button
                  onClick={handleResetAndReRegister}
                  disabled={isSubscribingNotif}
                  className="py-1.5 px-2.5 bg-slate-200/70 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-[10px] border border-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset dan daftarkan ulang perangkat ini ke Appwrite"
                >
                  <RotateCcw size={11} /> Reset Izin
                </button>
              </div>
            </div>

            {/* Auto Report & Auto Debt Bulanan */}
            {onToggleMonthlyAutoDebt && (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText size={16} className="text-amber-600" />
                    <span className="font-bold text-slate-800 text-xs">Auto Report & Debt Bulanan</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMonthlyAutoDebtEnabled}
                      onChange={e => onToggleMonthlyAutoDebt(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
                <p className="text-[10px] text-slate-600 leading-tight">
                  {isMonthlyAutoDebtEnabled
                    ? 'Aktif: Tanggal 1 otomatis mengarsipkan sisa saldo bulan lalu ke Laporan dan mengisi ulang saldo (Full Top-Up) sesuai Target Bulanan amplop.'
                    : 'Nonaktif: Otomatisasi pengarsipan dan isi ulang bulanan dinonaktifkan.'}
                </p>
              </div>
            )}

            {/* Run Scheduled Check Action Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <RefreshCw size={14} className="text-blue-600" />
                <span>Cek Terjadwal Manual</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Mengeksekusi perhitungan rollover mingguan (fase saldo) dan auto-debt bulanan ke laporan secara instan tanpa menunggu jadwal otomatis.
              </p>
              <button
                onClick={handleRunCheck}
                disabled={isRunningCheck}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors text-xs active:scale-98 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isRunningCheck ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <RefreshCw size={13} />
                    <span>Jalankan Cek Terjadwal</span>
                  </>
                )}
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsSettingsModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Tutup Pengaturan
            </button>
          </div>
        </div>
      )}
    </>
  );
};
