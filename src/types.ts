export type EnvelopeType = 'monthly_split' | 'standard';

export interface Envelope {
  $id?: string;
  id?: string;
  user_id?: string;
  name: string;
  icon: string;
  color: string;
  type: EnvelopeType;
  target_monthly: number;
  weekly_allowance: number;
  reserve_balance: number;
  active_balance: number;
  is_smart_rec: boolean;
  is_auto_debt: boolean;
  last_reset_phase?: number;
  last_reset_month?: string;
}

export interface Transaction {
  $id?: string;
  id?: string;
  user_id?: string;
  envelope_id: string;
  amount: number;
  note?: string;
  timestamp: string; // ISO8601 format
}

export interface ArchivedTransaction {
  envelope_name: string;
  envelope_icon?: string;
  envelope_color?: string;
  amount: number;
  note: string;
  timestamp: string;
}

export interface ReportDetailsPayload {
  envelope_saved: Record<string, number>;
  total_spent?: number;
  total_budget?: number;
  transactions?: ArchivedTransaction[];
}

export interface Report {
  $id?: string;
  id?: string;
  user_id?: string;
  month_year: string;
  total_saved: number;
  details: string; // JSON string payload
}

export type TabType = 'home' | 'transaksi' | 'riwayat' | 'laporan';

export type AppMode = 'amplop' | 'dailycam' | 'textpaste';

export interface DailyCamEntry {
  $id?: string;
  id?: string;
  user_id?: string;
  file_id: string;
  day_number: number;
  timestamp: string; // ISO8601 format
  note?: string;
  photo_url?: string;
  photo_data?: string; // fallback base64 storage if storage bucket offline
}

export type TextPasteCategory = 'kredensial' | 'identitas' | 'biasa' | 'keuangan' | 'catatan';

export interface TextPasteItem {
  $id?: string;
  id?: string;
  user_id?: string;
  category: TextPasteCategory | string;
  label: string;
  value: string;
  timestamp: string; // ISO8601 format
}
