import React from 'react';
import { Wallet, Sparkles, RefreshCw, ShieldCheck, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLoginWithGoogle: () => void;
  isLoading?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginWithGoogle, isLoading }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 relative overflow-hidden font-sans">
      {/* Background Decorator Gradients */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Header */}
      <div className="max-w-md mx-auto w-full pt-8 text-center space-y-3 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30 text-white font-bold ring-4 ring-white/10">
          <Wallet size={32} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          MyBox <span className="text-xs uppercase tracking-widest bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">BaaS</span>
        </h1>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Sistem Manajemen Anggaran Amplop Cerdas Terintegrasi Appwrite Cloud
        </p>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md mx-auto w-full my-auto py-6 relative z-10">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-bold text-white">Selamat Datang!</h2>
            <p className="text-xs text-slate-400">Silakan login dengan akun Google Anda untuk mengakses aplikasi.</p>
          </div>

          {/* Features Highlights */}
          <div className="space-y-3 py-2 border-y border-slate-700/40">
            <div className="flex items-start space-x-3 text-xs text-slate-300">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
                <Sparkles size={16} />
              </div>
              <div>
                <strong className="block text-white font-semibold">Rekomendasi Cerdas</strong>
                <span>Jatah harian dinamis terhitung otomatis dari 4 fase tanggal.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs text-slate-300">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 mt-0.5">
                <RefreshCw size={16} />
              </div>
              <div>
                <strong className="block text-white font-semibold">Auto-Debt & Carryover</strong>
                <span>Refill saldo mingguan di tanggal 1, 8, 15, 22 tanpa blind-fill.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs text-slate-300">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                <ShieldCheck size={16} />
              </div>
              <div>
                <strong className="block text-white font-semibold">Appwrite Cloud Database</strong>
                <span>Akses aman & tersinkronisasi real-time.</span>
              </div>
            </div>
          </div>

          {/* Google OAuth Login Button */}
          <button
            onClick={onLoginWithGoogle}
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 active:scale-98 text-slate-900 font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-3 cursor-pointer group"
          >
            {/* Google SVG Logo */}
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-sm">Lanjutkan dengan Google</span>
            <ArrowRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-md mx-auto w-full text-center pb-6 text-[10px] text-slate-500 space-y-1 relative z-10">
        <div>OAuth2 Appwrite Session: <code className="text-amber-400">sgp.cloud.appwrite.io/.../google/mybox</code></div>
        <div>MyBox © 2026 • Secure OAuth2 Authentication</div>
      </div>
    </div>
  );
};
