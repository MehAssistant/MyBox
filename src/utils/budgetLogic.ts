import { Envelope, Report, Transaction, ArchivedTransaction, ReportDetailsPayload, Activity } from '../types';

export interface SmartRecResult {
  phase: number;
  dailyLimit: number;
  remainingDays: number;
}

export interface WasteAnalysisCategory {
  envelopeName: string;
  totalSpent: number;
  count: number;
  avgIntervalDays: number;
  wasteRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  insight: string;
}

export const getSmartRecommendation = (
  activeBalance: number,
  today: Date = new Date()
): SmartRecResult => {
  const currentDate = today.getDate();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let phase = 1;
  let remainingDays = 1;

  if (currentDate >= 1 && currentDate <= 7) {
    phase = 1;
    remainingDays = 7 - currentDate + 1;
  } else if (currentDate >= 8 && currentDate <= 14) {
    phase = 2;
    remainingDays = 14 - currentDate + 1;
  } else if (currentDate >= 15 && currentDate <= 21) {
    phase = 3;
    remainingDays = 21 - currentDate + 1;
  } else {
    phase = 4;
    remainingDays = daysInMonth - currentDate + 1;
  }

  const dailyLimit = remainingDays > 0 ? Math.max(0, Math.floor(activeBalance / remainingDays)) : 0;

  return {
    phase,
    dailyLimit,
    remainingDays
  };
};

export const canRollbackTransaction = (
  timestampIso: string,
  now: Date = new Date()
): boolean => {
  try {
    const txTime = new Date(timestampIso).getTime();
    const currentTime = now.getTime();
    const diffMs = currentTime - txTime;
    // 24 hours in milliseconds = 86,400,000 ms
    return diffMs >= 0 && diffMs < 24 * 60 * 60 * 1000;
  } catch (e) {
    return false;
  }
};

export const getCurrentPhase = (currentDate: number): number => {
  if (currentDate >= 22) return 4;
  if (currentDate >= 15) return 3;
  if (currentDate >= 8) return 2;
  return 1;
};

// ==========================================
// Analisa Pemborosan Berdasarkan Nominal & Frekuensi Pembelian
// ==========================================
export const analyzeWastefulness = (archivedTxs: ArchivedTransaction[]): WasteAnalysisCategory[] => {
  if (!archivedTxs || archivedTxs.length === 0) return [];

  // Group transactions by envelope_name
  const groups: Record<string, ArchivedTransaction[]> = {};
  archivedTxs.forEach(tx => {
    const name = tx.envelope_name || 'Amplop';
    if (!groups[name]) groups[name] = [];
    groups[name].push(tx);
  });

  const results: WasteAnalysisCategory[] = [];

  Object.entries(groups).forEach(([name, txs]) => {
    const totalSpent = txs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const count = txs.length;

    // Calculate timestamps and average interval gap in days
    const times = txs.map(t => new Date(t.timestamp).getTime()).sort((a, b) => a - b);
    let avgIntervalDays = 30;

    if (count > 1) {
      const firstTime = times[0];
      const lastTime = times[times.length - 1];
      const spanDays = Math.max(1, (lastTime - firstTime) / (1000 * 60 * 60 * 24));
      avgIntervalDays = Number((spanDays / (count - 1)).toFixed(1));
    }

    const lowerName = name.toLowerCase();
    let wasteRisk: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    let insight = '';

    // Specialized frequency evaluation rules
    if (lowerName.includes('bensin') || lowerName.includes('bbm') || lowerName.includes('bakar')) {
      // Bensin is expected to be purchased once every 3-4 days
      if (avgIntervalDays <= 2.0 || (count >= 2 && avgIntervalDays < 3.0)) {
        wasteRisk = 'HIGH';
        insight = `⚠️ PERINGATAN BOROS! Pembelian Bensin terlalu sering (${count}x transaksi, selang rata-rata ${avgIntervalDays} hari). Normalnya bensin dibeli 1x setiap 3-4 hari.`;
      } else {
        wasteRisk = 'LOW';
        insight = `✅ Wajar. Pembelian Bensin teratur (${count}x transaksi, selang rata-rata ${avgIntervalDays} hari).`;
      }
    } else if (lowerName.includes('makan') || lowerName.includes('kuliner')) {
      if (avgIntervalDays <= 0.5 && count >= 4) {
        wasteRisk = 'HIGH';
        insight = `⚠️ Cukup Boros! Transaksi Makan sangat intensif (${count}x transaksi). Disarankan menghemat dengan masak sendiri.`;
      } else if (avgIntervalDays <= 1.5 && count >= 3) {
        wasteRisk = 'MEDIUM';
        insight = `ℹ️ Pembelian Makan tergolong sering (${count}x transaksi, rata-rata selang ${avgIntervalDays} hari).`;
      } else {
        wasteRisk = 'LOW';
        insight = `✅ Wajar & Terkendali (${count}x transaksi, rata-rata selang ${avgIntervalDays} hari).`;
      }
    } else {
      if (count >= 3 && avgIntervalDays <= 2.0) {
        wasteRisk = 'HIGH';
        insight = `⚠️ Terdeteksi Boros! Transaksi ${name} terjadi ${count}x dalam frekuensi singkat (selang ${avgIntervalDays} hari).`;
      } else if (count >= 2 && avgIntervalDays <= 3.0) {
        wasteRisk = 'MEDIUM';
        insight = `ℹ️ Transaksi ${name} cukup sering (${count}x transaksi).`;
      } else {
        wasteRisk = 'LOW';
        insight = `✅ Pengeluaran ${name} dalam batas wajar.`;
      }
    }

    results.push({
      envelopeName: name,
      totalSpent,
      count,
      avgIntervalDays,
      wasteRisk,
      insight
    });
  });

  // Sort by wasteRisk HIGH first, then by totalSpent desc
  return results.sort((a, b) => {
    const riskOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
    if (riskOrder[a.wasteRisk] !== riskOrder[b.wasteRisk]) {
      return riskOrder[a.wasteRisk] - riskOrder[b.wasteRisk];
    }
    return b.totalSpent - a.totalSpent;
  });
};

export interface ScheduledCheckResult {
  updatedEnvelopes: Envelope[];
  newReport?: Omit<Report, '$id' | 'id'>;
  hasChanges: boolean;
  generatedActivities?: Activity[];
}

export const runScheduledChecks = (
  envelopes: Envelope[],
  today: Date = new Date(),
  existingReports: Report[] = [],
  currentMonthTransactions: Transaction[] = []
): ScheduledCheckResult => {
  const currentDate = today.getDate();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const currentPhase = getCurrentPhase(currentDate);

  const isResetDay = currentDate === 1 || currentDate === 8 || currentDate === 15 || currentDate === 22;

  let hasChanges = false;
  let newReport: Omit<Report, '$id' | 'id'> | undefined = undefined;
  const generatedActivities: Activity[] = [];

  // Month Names for Indonesia
  const monthNamesIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  let updatedEnvelopes = envelopes.map(env => ({ ...env }));

  // Calculate previous month (the month being archived)
  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const prevMonthIndex = prevMonthDate.getMonth();
  const prevYear = prevMonthDate.getFullYear();
  const archivedMonthLabel = `${monthNamesIndo[prevMonthIndex]} ${prevYear}`;

  // 1. End of Month Rollover Flag & Duplicate Guard
  const hasReportAlreadyBeenCreated = existingReports.some(
    r => r.month_year === archivedMonthLabel
  );

  const needsEomRollover = currentDate === 1 &&
    !hasReportAlreadyBeenCreated &&
    updatedEnvelopes.some(env => env.last_reset_month !== currentMonthStr);

  if (needsEomRollover) {
    if (updatedEnvelopes.length > 0) {
      let totalSaved = 0;
      const detailsMap: Record<string, number> = {};

      updatedEnvelopes.forEach(env => {
        const leftover = (env.active_balance || 0) + (env.reserve_balance || 0);
        totalSaved += leftover;
        detailsMap[env.name] = leftover;
      });

      // Archive current month transactions into the report payload
      const archivedTxs: ArchivedTransaction[] = currentMonthTransactions.map(tx => {
        const env = envelopes.find(e => (e.$id || e.id) === tx.envelope_id);
        return {
          envelope_name: env?.name || 'Amplop',
          envelope_icon: env?.icon || 'Wallet',
          envelope_color: env?.color || '#f59e0b',
          amount: Number(tx.amount || 0),
          note: tx.note || '',
          timestamp: tx.timestamp
        };
      });

      const totalSpent = currentMonthTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const totalBudget = updatedEnvelopes.reduce((sum, e) => sum + Number(e.target_monthly || 0), 0);

      const detailsPayload: ReportDetailsPayload = {
        envelope_saved: detailsMap,
        total_spent: totalSpent,
        total_budget: totalBudget,
        transactions: archivedTxs
      };

      newReport = {
        month_year: archivedMonthLabel,
        total_saved: totalSaved,
        details: JSON.stringify(detailsPayload)
      };
    }

    // Apply EOM Rollover: Full Monthly Top-Up back to 100% of target_monthly
    updatedEnvelopes = updatedEnvelopes.map(env => {
      const targetMonthly = env.target_monthly || 0;
      const weeklyAllowance = env.type === 'monthly_split' ? env.weekly_allowance : targetMonthly;

      // Full top up back to target monthly
      const newActive = Math.min(targetMonthly, weeklyAllowance);
      const newReserve = Math.max(0, targetMonthly - newActive);

      generatedActivities.push({
        type: 'auto_debt',
        title: `Auto Top Up Bulanan: ${env.name}`,
        envelope_name: env.name,
        envelope_id: env.$id || env.id,
        amount: targetMonthly,
        details: {
          target_bulanan: targetMonthly,
          alokasi_mingguan: newActive,
          masuk_cadangan: newReserve
        },
        description: `Pengisian penuh awal bulan untuk amplop ${env.name} sebesar Rp ${targetMonthly.toLocaleString('id-ID')}.`,
        timestamp: today.toISOString()
      });

      return {
        ...env,
        active_balance: newActive,
        reserve_balance: newReserve,
        last_reset_month: currentMonthStr,
        last_reset_phase: 1
      };
    });

    hasChanges = true;
  }

  // 2. Auto Debt & Carryover (Reset Logic strictly for weekly phases: 1st, 8th, 15th, 22nd)
  updatedEnvelopes = updatedEnvelopes.map(env => {
    if (!env.is_auto_debt) return env;

    const lastPhase = env.last_reset_phase || 0;
    const lastMonth = env.last_reset_month || '';

    // If envelope has no recorded reset month yet:
    // If today is NOT a reset day, don't trigger auto-debt, simply stamp to current month & phase
    if (!lastMonth) {
      if (!isResetDay) {
        hasChanges = true;
        return {
          ...env,
          last_reset_phase: currentPhase,
          last_reset_month: currentMonthStr
        };
      }
    }

    // If already reset for current phase in current month, DO NOT touch funds
    const isAlreadyResetForPhase = lastMonth === currentMonthStr && lastPhase >= currentPhase;
    if (isAlreadyResetForPhase) {
      return env;
    }

    // Auto-debt should only trigger if it is a reset day (1, 8, 15, 22) OR phase has advanced to a new week
    const isNewWeekOrMonth = lastMonth !== currentMonthStr || currentPhase > lastPhase;
    if (isResetDay || isNewWeekOrMonth) {
      const targetWeekly = env.type === 'monthly_split' ? env.weekly_allowance : env.target_monthly;
      const currentActive = env.active_balance || 0;

      const neededTopUp = Math.max(0, targetWeekly - currentActive);
      const amountFromReserve = Math.min(env.reserve_balance || 0, neededTopUp);

      hasChanges = true;

      if (amountFromReserve > 0) {
        generatedActivities.push({
          type: 'auto_debt',
          title: `Auto Debt: ${env.name}`,
          envelope_name: env.name,
          envelope_id: env.$id || env.id,
          amount: amountFromReserve,
          details: {
            sisa_minggu_sebelumnya: currentActive,
            target_mingguan: targetWeekly,
            tambalan_dari_cadangan: amountFromReserve,
            sisa_cadangan: Math.max(0, (env.reserve_balance || 0) - amountFromReserve)
          },
          description: `Auto top up tambalan mingguan amplop ${env.name} sebesar Rp ${amountFromReserve.toLocaleString('id-ID')} dari dana cadangan (sisa saldo minggu sebelumnya: Rp ${currentActive.toLocaleString('id-ID')}).`,
          timestamp: today.toISOString()
        });
      }

      return {
        ...env,
        reserve_balance: Math.max(0, (env.reserve_balance || 0) - amountFromReserve),
        active_balance: currentActive + amountFromReserve,
        last_reset_phase: currentPhase,
        last_reset_month: currentMonthStr
      };
    }
    return env;
  });

  return {
    updatedEnvelopes,
    newReport,
    hasChanges,
    generatedActivities
  };
};
