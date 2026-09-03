import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Copy, 
  Check, 
  KeyRound, 
  IdCard, 
  FileText, 
  CreditCard, 
  StickyNote, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  X, 
  Search, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { TextPasteItem, TextPasteCategory } from '../types';

interface TextPasteViewProps {
  items: TextPasteItem[];
  onAddItem: (item: Omit<TextPasteItem, '$id' | 'id'>) => Promise<void>;
  onUpdateItem: (id: string, item: Partial<TextPasteItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  isLoading?: boolean;
}

interface CategoryConfig {
  id: TextPasteCategory;
  label: string;
  icon: React.ReactNode;
  bg: string;
  textColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'kredensial',
    label: 'Kredensial',
    icon: <KeyRound size={16} />,
    bg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    textColor: 'text-indigo-600',
  },
  {
    id: 'identitas',
    label: 'Identitas',
    icon: <IdCard size={16} />,
    bg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    textColor: 'text-emerald-600',
  },
  {
    id: 'keuangan',
    label: 'Keuangan',
    icon: <CreditCard size={16} />,
    bg: 'bg-amber-50 text-amber-600 border-amber-200',
    textColor: 'text-amber-600',
  },
  {
    id: 'catatan',
    label: 'Catatan',
    icon: <StickyNote size={16} />,
    bg: 'bg-teal-50 text-teal-600 border-teal-200',
    textColor: 'text-teal-600',
  },
  {
    id: 'biasa',
    label: 'Biasa',
    icon: <FileText size={16} />,
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    textColor: 'text-slate-600',
  },
];

export const TextPasteView: React.FC<TextPasteViewProps> = ({
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  isLoading = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TextPasteItem | null>(null);
  const [formCategory, setFormCategory] = useState<TextPasteCategory>('kredensial');
  const [formLabel, setFormLabel] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formShowValue, setFormShowValue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Search Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCategory = selectedCategory === 'semua' || item.category === selectedCategory;
      const matchSearch = searchQuery.trim() === '' ||
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  // Copy to clipboard handler
  const handleCopyValue = async (id: string, value: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = value;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.warn('Copy error:', err);
    }
  };

  // Toggle reveal secret value
  const toggleReveal = (id: string) => {
    setRevealedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormCategory('kredensial');
    setFormLabel('');
    setFormValue('');
    setFormShowValue(false);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: TextPasteItem) => {
    setEditingItem(item);
    setFormCategory((item.category as TextPasteCategory) || 'biasa');
    setFormLabel(item.label);
    setFormValue(item.value);
    setFormShowValue(false);
    setIsModalOpen(true);
  };

  // Submit Modal
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim() || !formValue.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingItem && (editingItem.$id || editingItem.id)) {
        const itemId = editingItem.$id || editingItem.id || '';
        await onUpdateItem(itemId, {
          category: formCategory,
          label: formLabel.trim(),
          value: formValue.trim(),
        });
      } else {
        await onAddItem({
          category: formCategory,
          label: formLabel.trim(),
          value: formValue.trim(),
          timestamp: new Date().toISOString(),
        });
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to save TextPaste item:', err);
      alert('Gagal menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper: Get Category Config
  const getCategoryConfig = (categoryName: string): CategoryConfig => {
    return (
      CATEGORIES.find(c => c.id === categoryName) || {
        id: 'biasa',
        label: categoryName || 'Biasa',
        icon: <FileText size={16} />,
        bg: 'bg-slate-100 text-slate-600 border-slate-200',
        textColor: 'text-slate-600',
      }
    );
  };

  return (
    <div className="space-y-4 px-4 py-4 pb-20">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-emerald-100 flex items-center gap-1.5 border border-white/15">
              <ShieldCheck size={13} className="text-emerald-200" />
              Secure TextPaste Vault
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
              {items.length} Tersimpan
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                TextPaste
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Kredensial, identitas & teks rahasia siap salin cepat.
              </p>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="py-2.5 px-4 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>Tambah Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-2.5">
        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari label atau kategori..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('semua')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'semua'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Semua ({items.length})
          </button>

          {CATEGORIES.map(cat => {
            const count = items.filter(i => i.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Flatlist of Data Items */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Belum ada data</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {searchQuery ? 'Tidak ada data yang cocok dengan pencarian.' : 'Klik "Tambah Data" untuk menyimpan kredensial/teks rahasia.'}
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Tambah Sekarang</span>
            </button>
          </div>
        ) : (
          filteredItems.map(item => {
            const itemId = item.$id || item.id || '';
            const catConfig = getCategoryConfig(item.category);
            const isCopied = copiedId === itemId;
            const isRevealed = Boolean(revealedIds[itemId]);

            return (
              <div
                key={itemId}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:shadow-xs transition-all flex flex-col space-y-2.5"
              >
                {/* Header Row: [Icon Kategori] [Label] [Copy Button] */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {/* Category Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${catConfig.bg}`}
                      title={catConfig.label}
                    >
                      {catConfig.icon}
                    </div>

                    {/* Label & Secret Asterisks */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-800 truncate">
                          {item.label}
                        </h3>
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          {catConfig.label}
                        </span>
                      </div>

                      {/* Masked Secret Text with Eye Toggle */}
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs font-mono text-slate-500 tracking-wider truncate">
                          {isRevealed ? item.value : '••••••••••••'}
                        </p>
                        <button
                          onClick={() => toggleReveal(itemId)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                          title={isRevealed ? 'Sembunyikan nilai' : 'Lihat nilai'}
                        >
                          {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Fast Copy Action Button */}
                  <button
                    onClick={() => handleCopyValue(itemId, item.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 active:scale-95'
                    }`}
                    title="Salin nilai ke clipboard"
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Footer Controls: Edit, Delete, Timestamp */}
                <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-[11px] text-slate-400">
                  <span>
                    {new Date(item.timestamp).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Edit item"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus "${item.label}"?`)) {
                          onDeleteItem(itemId);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL: CREATE / EDIT TEXTPASTE ITEM                          */}
      {/* ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  {editingItem ? <Edit3 size={16} /> : <Plus size={16} />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingItem ? 'Edit Data TextPaste' : 'Tambah Data Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">Isolasi aman di akun Anda</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveModal} className="space-y-3.5">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kategori
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CATEGORIES.map(cat => {
                    const isSelected = formCategory === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setFormCategory(cat.id)}
                        className={`py-2 px-2 rounded-xl text-xs flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {cat.icon}
                        <span className="text-[11px]">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Label Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Label / Nama Kredensial <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formLabel}
                  onChange={e => setFormLabel(e.target.value)}
                  placeholder="Misal: PIN ATM BCA, Token API, KTP"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Secret Value Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Nilai / Teks Rahasia <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormShowValue(prev => !prev)}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    {formShowValue ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{formShowValue ? 'Sembunyikan' : 'Perlihatkan'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={formShowValue ? 'text' : 'password'}
                    required
                    value={formValue}
                    onChange={e => setFormValue(e.target.value)}
                    placeholder="Masukkan data yang ingin disimpan..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={16} />
                      <span>{editingItem ? 'Perbarui' : 'Simpan'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
