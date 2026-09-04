import React, { useState, useEffect } from 'react';
import { Envelope, EnvelopeType } from '../types';
import { X, Check, Trash2, Plus, Sparkles, RefreshCw } from 'lucide-react';
import { IconHelper } from './IconHelper';

interface EnvelopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  envelope: Envelope | null; // null means create mode
  onSave: (envelopeData: Omit<Envelope, '$id' | 'id'>, id?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const AVAILABLE_ICONS = ['Utensils', 'Car', 'ShoppingBag', 'Sparkles', 'Home', 'HeartPulse', 'BookOpen', 'Smartphone', 'Coins', '🍔', '⛽', '🛍️', '🎮', '💡'];
const AVAILABLE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4', '#f97316'];

export const EnvelopeModal: React.FC<EnvelopeModalProps> = ({
  isOpen,
  onClose,
  envelope,
  onSave,
  onDelete
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Utensils');
  const [color, setColor] = useState('#f59e0b');
  const [type, setType] = useState<EnvelopeType>('monthly_split');
  const [targetMonthly, setTargetMonthly] = useState(1000000);
  const [weeklyAllowance, setWeeklyAllowance] = useState(210000);
  const [activeBalance, setActiveBalance] = useState(210000);
  const [reserveBalance, setReserveBalance] = useState(790000);
  const [isSmartRec, setIsSmartRec] = useState(true);
  const [isAutoDebt, setIsAutoDebt] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (envelope) {
      setName(envelope.name);
      setIcon(envelope.icon || 'Utensils');
      setColor(envelope.color || '#f59e0b');
      setType(envelope.type || 'monthly_split');
      setTargetMonthly(envelope.target_monthly || 0);
      setWeeklyAllowance(envelope.weekly_allowance || 0);
      setActiveBalance(envelope.active_balance || 0);
      setReserveBalance(envelope.reserve_balance || 0);
      setIsSmartRec(Boolean(envelope.is_smart_rec));
      setIsAutoDebt(Boolean(envelope.is_auto_debt));
    } else {
      // Default reset
      setName('');
      setIcon('Utensils');
      setColor('#f59e0b');
      setType('monthly_split');
      setTargetMonthly(1000000);
      setWeeklyAllowance(210000);
      setActiveBalance(210000);
      setReserveBalance(790000);
      setIsSmartRec(true);
      setIsAutoDebt(true);
    }
  }, [envelope, isOpen]);

  const handleTargetChange = (val: number) => {
    setTargetMonthly(val);
    if (type === 'monthly_split') {
      const weekly = Math.floor(val / 4);
      setWeeklyAllowance(weekly);
      if (!envelope) {
        setActiveBalance(weekly);
        setReserveBalance(val - weekly);
      }
    } else {
      setWeeklyAllowance(val);
      if (!envelope) {
        setActiveBalance(val);
        setReserveBalance(0);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const envelopeData: Omit<Envelope, '$id' | 'id'> = {
        name: name.trim(),
        icon,
        color,
        type,
        target_monthly: Number(targetMonthly),
        weekly_allowance: Number(weeklyAllowance),
        active_balance: Number(activeBalance),
        reserve_balance: Number(reserveBalance),
        is_smart_rec: isSmartRec,
        is_auto_debt: isAutoDebt,
        last_reset_phase: envelope?.last_reset_phase !== undefined 
          ? envelope.last_reset_phase 
          : (new Date().getDate() >= 22 ? 4 : new Date().getDate() >= 15 ? 3 : new Date().getDate() >= 8 ? 2 : 1),
        last_reset_month: envelope?.last_reset_month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
      };

      await onSave(envelopeData, envelope?.$id || envelope?.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Smooth Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Smooth Bottom Sheet Panel Slide Up */}
      <div
        className={`relative z-10 bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl space-y-4 transform transition-all duration-300 ease-out ${
          isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 scale-95'
        }`}
      >
        {/* Drag Indicator Pill */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto -mt-2 mb-1 sm:hidden"></div>

        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <span style={{ color }} className="p-1.5 rounded-lg bg-slate-100">
              <IconHelper name={icon} size={20} />
            </span>
            {envelope ? 'Edit Amplop' : 'Buat Amplop Baru'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nama Amplop *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Makan, Bensin, Tabungan"
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tipe Budget</label>
              <select
                value={type}
                onChange={e => {
                  const newType = e.target.value as EnvelopeType;
                  setType(newType);
                  if (newType === 'monthly_split') {
                    const w = Math.floor(targetMonthly / 4);
                    setWeeklyAllowance(w);
                    setReserveBalance(targetMonthly - w);
                  } else {
                    setWeeklyAllowance(targetMonthly);
                    setReserveBalance(0);
                  }
                }}
                className="w-full px-3 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="monthly_split">Monthly Split (4 Minggu)</option>
                <option value="standard">Standard (Langsung Saldo Full)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Pilih Warna</label>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {AVAILABLE_COLORS.map(c => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white transition-transform ${
                      color === c ? 'ring-2 ring-offset-2 ring-slate-700 scale-110' : ''
                    }`}
                  >
                    {color === c && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Pilih Ikon / Emoji</label>
            <div className="flex items-center gap-2 overflow-x-auto py-1 border rounded-xl p-2 bg-slate-50">
              {AVAILABLE_ICONS.map(ic => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`p-2 rounded-lg text-slate-700 hover:bg-white transition-all ${
                    icon === ic ? 'bg-white shadow border border-amber-500 text-amber-600 scale-110' : ''
                  }`}
                >
                  <IconHelper name={ic} size={18} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Target Bulanan (Rp)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={targetMonthly}
                onChange={e => handleTargetChange(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Alokasi Mingguan (Rp)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={weeklyAllowance}
                onChange={e => setWeeklyAllowance(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
            <div>
              <label className="block text-xs font-medium text-amber-900 mb-1">Saldo Aktif (Saat Ini)</label>
              <input
                type="number"
                min="0"
                value={activeBalance}
                onChange={e => setActiveBalance(Number(e.target.value))}
                className="w-full px-3 py-2 border border-amber-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none font-semibold text-amber-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-amber-900 mb-1">Cadangan Reserve (Rp)</label>
              <input
                type="number"
                min="0"
                value={reserveBalance}
                onChange={e => setReserveBalance(Number(e.target.value))}
                className="w-full px-3 py-2 border border-amber-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none font-semibold text-amber-900"
              />
            </div>
          </div>

          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <div>
                  <div className="font-medium text-slate-800 text-xs">Rekomendasi Cerdas (Smart Rec)</div>
                  <div className="text-[11px] text-slate-500">Tampilkan limit jatah harian berbasis fase tanggal</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isSmartRec}
                onChange={e => setIsSmartRec(e.target.checked)}
                className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <RefreshCw size={16} className="text-blue-500" />
                <div>
                  <div className="font-medium text-slate-800 text-xs">Auto Debt & Carryover</div>
                  <div className="text-[11px] text-slate-500">Refill otomatis saldo mingguan di tanggal 1, 8, 15, 22</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isAutoDebt}
                onChange={e => setIsAutoDebt(e.target.checked)}
                className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {envelope && onDelete && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Hapus amplop "${envelope.name}"?`)) {
                    setIsSubmitting(true);
                    await onDelete(envelope.$id || envelope.id || '');
                    onClose();
                  }
                }}
                disabled={isSubmitting}
                className="p-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors active:scale-95"
                title="Hapus Amplop"
              >
                <Trash2 size={18} />
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? 'Menyimpan...' : envelope ? 'Simpan Perubahan' : 'Buat Amplop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
