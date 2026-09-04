import { useState, useEffect, useCallback } from 'react';
import { Envelope, Transaction, Report, TabType, AppMode, DailyCamEntry, TextPasteItem, Activity } from './types';
import {
  getCurrentUser,
  loginWithGoogle,
  logoutUser,
  clearUserCache,
  getEnvelopes,
  createEnvelope,
  updateEnvelope,
  deleteEnvelope,
  getTransactions,
  createTransaction,
  deleteTransaction,
  getReports,
  createReport,
  getDailyCamEntries,
  createDailyCamEntry,
  deleteDailyCamEntry,
  getTextPasteItems,
  createTextPasteItem,
  updateTextPasteItem,
  deleteTextPasteItem,
  getActivities,
  createActivity,
  clearAllActivities
} from './services/appwrite';
import { runScheduledChecks } from './utils/budgetLogic';
import { getNotificationPermissionStatus, subscribeToNotifications } from './utils/notificationHelper';
import { HeaderNav } from './components/HeaderNav';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { AktivitasView } from './components/AktivitasView';
import { TransactionModal } from './components/TransactionModal';
import { HistoryView } from './components/HistoryView';
import { LaporanView } from './components/LaporanView';
import { DailyCamView } from './components/DailyCamView';
import { TextPasteView } from './components/TextPasteView';
import { EnvelopeModal } from './components/EnvelopeModal';
import { SidebarDrawer } from './components/SidebarDrawer';
import { LoginView } from './components/LoginView';
import { Models } from 'appwrite';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  // Active App Mode: 'amplop' | 'dailycam' | 'textpaste'
  const [activeMode, setActiveMode] = useState<AppMode>('amplop');

  // Account-level optional toggle for monthly auto-debt
  const [isMonthlyAutoDebtEnabled, setIsMonthlyAutoDebtEnabled] = useState<boolean>(true);

  // Amplop State
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [preselectedEnvelopeId, setPreselectedEnvelopeId] = useState<string>('');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false);

  // DailyCam State
  const [dailyCamEntries, setDailyCamEntries] = useState<DailyCamEntry[]>([]);

  // TextPaste State
  const [textPasteItems, setTextPasteItems] = useState<TextPasteItem[]>([]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEnvelopeModalOpen, setIsEnvelopeModalOpen] = useState(false);
  const [selectedEnvelopeForModal, setSelectedEnvelopeForModal] = useState<Envelope | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Activity Handlers (Synced across devices via Appwrite DB & Account Prefs)
  const handleAddActivity = async (act: Omit<Activity, '$id' | 'id'>) => {
    try {
      const created = await createActivity(act, currentUser?.$id);
      setActivities(prev => [created, ...prev]);
    } catch (e) {
      console.warn('handleAddActivity error:', e);
    }
  };

  const handleClearActivities = async () => {
    setActivities([]);
    await clearAllActivities(currentUser?.$id);
  };

  // 1. Check Google Auth Session on startup
  const checkAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        await loadDatabaseData(user.$id);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('checkAuth session error:', err);
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  // 2. Load Appwrite Database collections strictly scoped to user ID
  const loadDatabaseData = async (userId: string) => {
    setIsLoadingData(true);
    try {
      const savedAutoDebtSetting = localStorage.getItem(`mb_setting_auto_debt_${userId}`);
      const autoDebtEnabled = savedAutoDebtSetting !== null ? savedAutoDebtSetting === 'true' : true;
      setIsMonthlyAutoDebtEnabled(autoDebtEnabled);

      let [loadedEnv, loadedTx, loadedRep, loadedCam, loadedPaste, loadedActs] = await Promise.all([
        getEnvelopes(userId),
        getTransactions(userId),
        getReports(userId),
        getDailyCamEntries(userId),
        getTextPasteItems(userId),
        getActivities(userId)
      ]);

      loadedEnv = Array.isArray(loadedEnv) ? loadedEnv : [];
      loadedTx = Array.isArray(loadedTx) ? loadedTx : [];
      loadedRep = Array.isArray(loadedRep) ? loadedRep : [];
      loadedCam = Array.isArray(loadedCam) ? loadedCam : [];
      loadedPaste = Array.isArray(loadedPaste) ? loadedPaste : [];
      loadedActs = Array.isArray(loadedActs) ? loadedActs : [];

      // Backward compatibility: If current device had local activities, migrate them to cloud DB
      const savedLocalActs = localStorage.getItem(`mybox_activities_${userId}`);
      if (savedLocalActs) {
        try {
          const parsed: Activity[] = JSON.parse(savedLocalActs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cloudSignatures = new Set(loadedActs.map(a => `${a.timestamp}_${a.title}`));
            for (const localAct of parsed) {
              const sig = `${localAct.timestamp}_${localAct.title}`;
              if (!cloudSignatures.has(sig)) {
                createActivity(localAct, userId).catch(() => {});
                loadedActs.push(localAct);
                cloudSignatures.add(sig);
              }
            }
          }
        } catch (e) {}
      }

      // Auto-sync current device push subscriber to Appwrite database if permission is granted
      if (getNotificationPermissionStatus() === 'granted') {
        const isPushEnabled = localStorage.getItem(`mb_push_enabled_${userId}`) !== 'false';
        if (isPushEnabled) {
          subscribeToNotifications(userId).catch(e => console.warn('Push auto-sync background error:', e));
        }
      }

      let finalEnvelopes = loadedEnv;
      let finalReports = loadedRep;
      let finalTransactions = loadedTx;

      if (autoDebtEnabled) {
        const today = new Date();
        const checkResult = runScheduledChecks(loadedEnv, today, loadedRep, loadedTx);

        if (checkResult.hasChanges) {
          finalEnvelopes = checkResult.updatedEnvelopes;
          for (const env of finalEnvelopes) {
            if (env.$id || env.id) {
              await updateEnvelope(env.$id || env.id || '', env, userId);
            }
          }

          if (checkResult.generatedActivities && checkResult.generatedActivities.length > 0) {
            for (const genAct of checkResult.generatedActivities) {
              createActivity(genAct, userId).catch(() => {});
            }
            loadedActs = [...checkResult.generatedActivities, ...loadedActs];
          }

          if (checkResult.newReport) {
            const createdRep = await createReport(checkResult.newReport, userId);
            finalReports = [createdRep, ...finalReports];

            // Clear previous month active transactions after archiving to report
            for (const tx of loadedTx) {
              if (tx.$id || tx.id) {
                await deleteTransaction(tx.$id || tx.id || '', userId);
              }
            }
            finalTransactions = [];
          }
        }
      }

      setEnvelopes(finalEnvelopes);
      setTransactions(finalTransactions);
      setReports(finalReports);
      setActivities(loadedActs);
      setDailyCamEntries(loadedCam);
      setTextPasteItems(loadedPaste);
    } catch (err) {
      console.error('loadDatabaseData error:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Toggle account-level Auto-Debt setting
  const handleToggleMonthlyAutoDebt = (enabled: boolean) => {
    setIsMonthlyAutoDebtEnabled(enabled);
    if (currentUser?.$id) {
      localStorage.setItem(`mb_setting_auto_debt_${currentUser.$id}`, String(enabled));
    }
    handleAddActivity({
      type: 'setting_change',
      title: 'Pengaturan Auto Debt',
      description: `Fitur Auto Debt bulanan telah ${enabled ? 'diaktifkan' : 'dinonaktifkan'}.`,
      timestamp: new Date().toISOString()
    });
  };

  // Auth Handlers
  const handleLoginGoogle = () => {
    loginWithGoogle();
  };

  const handleLogout = async () => {
    const userId = currentUser?.$id;
    await logoutUser();
    clearUserCache(userId);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setEnvelopes([]);
    setTransactions([]);
    setReports([]);
    setActivities([]);
    setDailyCamEntries([]);
    setTextPasteItems([]);
    setActiveMode('amplop');
  };

  // Handler: Manual Scheduled Check
  const handleRunScheduledCheck = async () => {
    const userId = currentUser?.$id;
    const today = new Date();
    const checkResult = runScheduledChecks(envelopes, today, reports, transactions);
    if (checkResult.hasChanges) {
      const updated = checkResult.updatedEnvelopes;
      for (const env of updated) {
        if (env.$id || env.id) {
          await updateEnvelope(env.$id || env.id || '', env, userId);
        }
      }

      if (checkResult.generatedActivities && checkResult.generatedActivities.length > 0) {
        checkResult.generatedActivities.forEach(act => handleAddActivity(act));
      }

      let currentReports = reports;
      if (checkResult.newReport) {
        const rep = await createReport(checkResult.newReport, userId);
        currentReports = [rep, ...currentReports];
        setReports(currentReports);

        for (const tx of transactions) {
          if (tx.$id || tx.id) {
            await deleteTransaction(tx.$id || tx.id || '', userId);
          }
        }
        setTransactions([]);
      }
      setEnvelopes(updated);
    }
  };

  // Handler: Force EOM Rollover simulation
  const handleTriggerEomRolloverManually = async () => {
    const simDate = new Date();
    simDate.setDate(1);
    const checkResult = runScheduledChecks(envelopes, simDate, reports, transactions);

    if (checkResult.generatedActivities && checkResult.generatedActivities.length > 0) {
      checkResult.generatedActivities.forEach(act => handleAddActivity(act));
    }

    if (checkResult.newReport) {
      const simulatedReport: Report = {
        ...checkResult.newReport,
        $id: `sim-rep-${Date.now()}`,
        id: `sim-rep-${Date.now()}`
      };
      setReports(prev => [simulatedReport, ...prev]);
      setTransactions([]);
    }

    if (checkResult.hasChanges) {
      setEnvelopes(checkResult.updatedEnvelopes);
    }
  };

  // Envelope CRUD
  const handleSaveEnvelope = async (
    envelopeData: Omit<Envelope, '$id' | 'id'>,
    id?: string
  ) => {
    const userId = currentUser?.$id;
    if (id) {
      await updateEnvelope(id, envelopeData, userId);
      setEnvelopes(prev =>
        prev.map(e => ((e.$id === id || e.id === id) ? { ...envelopeData, user_id: userId, $id: id, id } : e))
      );
      handleAddActivity({
        type: 'setting_change',
        title: `Ubah Pengaturan: ${envelopeData.name}`,
        envelope_name: envelopeData.name,
        description: `Pengaturan amplop "${envelopeData.name}" diubah (Target: Rp ${envelopeData.target_monthly.toLocaleString('id-ID')}).`,
        timestamp: new Date().toISOString()
      });
    } else {
      const created = await createEnvelope(envelopeData, userId);
      setEnvelopes(prev => [...prev, created]);
      handleAddActivity({
        type: 'setting_change',
        title: `Amplop Baru: ${envelopeData.name}`,
        envelope_name: envelopeData.name,
        description: `Amplop baru "${envelopeData.name}" berhasil dibuat dengan target bulanan Rp ${envelopeData.target_monthly.toLocaleString('id-ID')}.`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleDeleteEnvelope = async (id: string) => {
    const userId = currentUser?.$id;
    await deleteEnvelope(id, userId);
    setEnvelopes(prev => prev.filter(e => e.$id !== id && e.id !== id));
  };

  const handleTopUpEnvelope = async (envelopeId: string) => {
    const targetEnv = envelopes.find(e => (e.$id === envelopeId || e.id === envelopeId));
    if (!targetEnv) return;

    const topUpAmount = targetEnv.target_monthly || 0;
    const newActiveBalance = (targetEnv.active_balance || 0) + topUpAmount;

    const updatedData: Omit<Envelope, '$id' | 'id'> = {
      name: targetEnv.name,
      icon: targetEnv.icon,
      color: targetEnv.color,
      type: targetEnv.type,
      target_monthly: targetEnv.target_monthly,
      weekly_allowance: targetEnv.weekly_allowance,
      active_balance: newActiveBalance,
      reserve_balance: targetEnv.reserve_balance,
      is_smart_rec: targetEnv.is_smart_rec,
      is_auto_debt: targetEnv.is_auto_debt,
      last_reset_phase: targetEnv.last_reset_phase,
      last_reset_month: targetEnv.last_reset_month
    };

    await handleSaveEnvelope(updatedData, targetEnv.$id || targetEnv.id);

    handleAddActivity({
      type: 'top_up',
      title: `Top Up: ${targetEnv.name}`,
      envelope_name: targetEnv.name,
      envelope_id: envelopeId,
      amount: topUpAmount,
      details: {
        saldo_sebelum: targetEnv.active_balance || 0,
        nominal_top_up: topUpAmount,
        saldo_setelah: newActiveBalance
      },
      description: `Top up manual saldo amplop ${targetEnv.name} sebesar Rp ${topUpAmount.toLocaleString('id-ID')}. Saldo kini Rp ${newActiveBalance.toLocaleString('id-ID')}.`,
      timestamp: new Date().toISOString()
    });
  };

  // Transaction CRUD & Rollback
  const handleAddTransaction = async (
    envelopeId: string,
    amount: number,
    note: string,
    dateIso: string
  ) => {
    const userId = currentUser?.$id;
    const targetEnv = envelopes.find(e => (e.$id || e.id) === envelopeId);
    if (!targetEnv) throw new Error('Amplop tidak ditemukan');

    const newTx = await createTransaction({
      envelope_id: envelopeId,
      amount,
      note,
      timestamp: dateIso
    }, userId);

    const newActiveBalance = Math.max(0, (targetEnv.active_balance || 0) - amount);
    await updateEnvelope(envelopeId, { active_balance: newActiveBalance }, userId);

    setEnvelopes(prev =>
      prev.map(e =>
        (e.$id === envelopeId || e.id === envelopeId)
          ? { ...e, active_balance: newActiveBalance }
          : e
      )
    );
    setTransactions(prev => [newTx, ...prev]);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    const userId = currentUser?.$id;
    const tx = transactions.find(t => (t.$id || t.id) === transactionId);
    if (!tx) return;

    await deleteTransaction(transactionId, userId);

    const targetEnv = envelopes.find(e => (e.$id || e.id) === tx.envelope_id);
    if (targetEnv) {
      const restoredActiveBalance = (targetEnv.active_balance || 0) + tx.amount;
      await updateEnvelope(tx.envelope_id, { active_balance: restoredActiveBalance }, userId);

      setEnvelopes(prev =>
        prev.map(e =>
          (e.$id === tx.envelope_id || e.id === tx.envelope_id)
            ? { ...e, active_balance: restoredActiveBalance }
            : e
        )
      );
    }

    setTransactions(prev => prev.filter(t => t.$id !== transactionId && t.id !== transactionId));
  };

  // DailyCam CRUD Handlers
  const handleSaveDailyCamPhoto = async (photoInput: Blob | string, dayNumber: number, note?: string) => {
    const userId = currentUser?.$id;
    const newEntry = await createDailyCamEntry({ day_number: dayNumber, note }, photoInput, userId);
    setDailyCamEntries(prev => [...prev, newEntry]);
  };

  const handleDeleteDailyCamPhoto = async (id: string, fileId?: string) => {
    const userId = currentUser?.$id;
    await deleteDailyCamEntry(id, fileId, userId);
    setDailyCamEntries(prev => prev.filter(e => e.$id !== id && e.id !== id));
  };

  // TextPaste CRUD Handlers
  const handleAddTextPasteItem = async (item: Omit<TextPasteItem, '$id' | 'id'>) => {
    const userId = currentUser?.$id;
    const created = await createTextPasteItem(item, userId);
    setTextPasteItems(prev => [created, ...prev]);
  };

  const handleUpdateTextPasteItem = async (id: string, data: Partial<TextPasteItem>) => {
    const userId = currentUser?.$id;
    await updateTextPasteItem(id, data, userId);
    setTextPasteItems(prev => prev.map(i => (i.$id === id || i.id === id ? { ...i, ...data } : i)));
  };

  const handleDeleteTextPasteItem = async (id: string) => {
    const userId = currentUser?.$id;
    await deleteTextPasteItem(id, userId);
    setTextPasteItems(prev => prev.filter(i => i.$id !== id && i.id !== id));
  };

  const handleOpenEnvelopeModal = (envelope?: Envelope) => {
    setSelectedEnvelopeForModal(envelope || null);
    setIsEnvelopeModalOpen(true);
  };

  const handleNavigateToTransaction = (envelopeId?: string) => {
    if (envelopeId) {
      setPreselectedEnvelopeId(envelopeId);
    } else {
      setPreselectedEnvelopeId('');
    }
    setIsTransactionModalOpen(true);
  };

  const totalOverallBalance = envelopes.reduce(
    (sum, env) => sum + (env.active_balance || 0) + (env.reserve_balance || 0),
    0
  );

  // Dynamic selection highlight class based on mode
  const selectionClass = activeMode === 'dailycam'
    ? 'selection:bg-blue-200'
    : activeMode === 'textpaste'
    ? 'selection:bg-emerald-200'
    : 'selection:bg-amber-200';

  // Loading spinner during initial auth check
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-4 p-4 text-slate-100 font-sans">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="font-semibold text-sm text-slate-300">Memeriksa Sesi Google Auth...</div>
      </div>
    );
  }

  // RESTRICTED ACCESS: Show LoginView if user is NOT authenticated
  if (!isAuthenticated) {
    return <LoginView onLoginWithGoogle={handleLoginGoogle} isLoading={isLoadingAuth} />;
  }

  // AUTHENTICATED ACCESS: Main MyBox App UI
  return (
    <div className={`min-h-screen bg-slate-100 font-sans text-slate-900 ${activeMode === 'amplop' ? 'pb-16' : 'pb-6'} ${selectionClass}`}>
      {/* Top Header with Mode Dropdown Switcher */}
      <HeaderNav
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        totalActiveBalance={totalOverallBalance}
      />

      {/* Main Body View Switching with Motion Transition */}
      <main className="max-w-md mx-auto overflow-hidden">
        {isLoadingData ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-2">
            <div className={`w-8 h-8 border-3 border-t-transparent rounded-full animate-spin mx-auto ${
              activeMode === 'dailycam' ? 'border-blue-500' : activeMode === 'textpaste' ? 'border-emerald-500' : 'border-amber-500'
            }`}></div>
            <div>Memuat data database akun Anda...</div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeMode === 'dailycam' && (
              <motion.div
                key="dailycam-mode"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <DailyCamView
                  entries={dailyCamEntries}
                  onSavePhoto={handleSaveDailyCamPhoto}
                  onDeletePhoto={handleDeleteDailyCamPhoto}
                  isLoading={isLoadingData}
                />
              </motion.div>
            )}

            {activeMode === 'textpaste' && (
              <motion.div
                key="textpaste-mode"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <TextPasteView
                  items={textPasteItems}
                  onAddItem={handleAddTextPasteItem}
                  onUpdateItem={handleUpdateTextPasteItem}
                  onDeleteItem={handleDeleteTextPasteItem}
                  isLoading={isLoadingData}
                />
              </motion.div>
            )}

            {activeMode === 'amplop' && (
              <motion.div
                key={`amplop-${activeTab}`}
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
              >
                {activeTab === 'home' && (
                  <DashboardView
                    envelopes={envelopes}
                    transactions={transactions}
                    onOpenEnvelopeModal={handleOpenEnvelopeModal}
                    onNavigateToTransaction={handleNavigateToTransaction}
                    onTopUpEnvelope={handleTopUpEnvelope}
                  />
                )}

                {activeTab === 'aktivitas' && (
                  <AktivitasView
                    activities={activities}
                    onClearActivities={handleClearActivities}
                  />
                )}

                {activeTab === 'riwayat' && (
                  <HistoryView
                    transactions={transactions}
                    envelopes={envelopes}
                    onDeleteTransaction={handleDeleteTransaction}
                  />
                )}

                {activeTab === 'laporan' && (
                  <LaporanView
                    reports={reports}
                    onTriggerEomRolloverManually={handleTriggerEomRolloverManually}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Bottom Navigation Bar (Only for Amplop Mode) */}
      {activeMode === 'amplop' && (
        <BottomNav
          activeTab={activeTab}
          onSelectTab={tab => setActiveTab(tab)}
          onOpenTransactionModal={() => {
            setPreselectedEnvelopeId('');
            setIsTransactionModalOpen(true);
          }}
        />
      )}

      {/* Transaction Popup Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        envelopes={envelopes}
        preselectedEnvelopeId={preselectedEnvelopeId}
        onAddTransaction={handleAddTransaction}
        onNavigateToRiwayat={() => {
          setIsTransactionModalOpen(false);
          setActiveTab('riwayat');
        }}
      />

      {/* Sidebar Drawer */}
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeMode={activeMode}
        envelopes={envelopes}
        onOpenEnvelopeModal={handleOpenEnvelopeModal}
        onRunScheduledCheck={handleRunScheduledCheck}
        isAppwriteConnected={true}
        userId={currentUser?.$id}
        userEmail={currentUser?.email || currentUser?.name || 'User Google'}
        onLogout={handleLogout}
        isMonthlyAutoDebtEnabled={isMonthlyAutoDebtEnabled}
        onToggleMonthlyAutoDebt={handleToggleMonthlyAutoDebt}
      />

      {/* Envelope Create/Edit Modal */}
      <EnvelopeModal
        isOpen={isEnvelopeModalOpen}
        onClose={() => setIsEnvelopeModalOpen(false)}
        envelope={selectedEnvelopeForModal}
        onSave={handleSaveEnvelope}
        onDelete={handleDeleteEnvelope}
      />
    </div>
  );
}

