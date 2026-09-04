import { Client, Account, Databases, Storage, ID, Query, Permission, Role, Models } from 'appwrite';
import { Envelope, Transaction, Report, DailyCamEntry, TextPasteItem, Activity } from '../types';

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const APPWRITE_PROJECT = 'mybox';

export const client = new Client();
client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const DATABASE_ID = 'db_mybox';
export const COL_ENVELOPES = 'col_envelopes';
export const COL_TRANSACTIONS = 'col_transactions';
export const COL_REPORTS = 'col_reports';
export const COL_PUSH_SUBSCRIBERS = 'col_push_subscribers';
export const COL_DAILYCAM = 'col_dailycam';
export const COL_TEXTPASTE = 'col_textpaste';
export const COL_ACTIVITIES = 'col_activities';
export const BUCKET_DAILYCAM = '6a98130500111e865d17';

// Get active logged-in user or null if not authenticated
export const getCurrentUser = async (): Promise<Models.User<Models.Preferences> | null> => {
  try {
    const user = await account.get();
    return user;
  } catch (err) {
    return null;
  }
};

// Trigger Google OAuth2 Login flow
export const loginWithGoogle = () => {
  const origin = window.location.origin;
  account.createOAuth2Session(
    'google' as any,
    origin,
    origin
  );
};

// Logout active user session
export const logoutUser = async (): Promise<void> => {
  try {
    await account.deleteSession('current');
  } catch (err) {
    console.warn('Logout failed:', err);
  }
};

// Helper: Document level security permissions per user
const getUserPermissions = (userId?: string) => {
  if (!userId) return undefined;
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId))
  ];
};

// Helper: Check document ownership via user_id attribute or Appwrite native $permissions
const isDocumentOwnedByUser = (doc: any, userId?: string): boolean => {
  if (!userId) return true;

  // 1. Check user_id property if present
  if (doc.user_id && typeof doc.user_id === 'string' && doc.user_id.trim() !== '') {
    return doc.user_id === userId;
  }

  // 2. Check native Appwrite $permissions array
  if (Array.isArray(doc.$permissions) && doc.$permissions.length > 0) {
    return doc.$permissions.some((p: string) => p.includes(userId));
  }

  // 3. If no permission restriction metadata is present, default accessible
  return true;
};

// Helper: Save/Get/Clear LocalStorage cache
const saveLocalCache = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to write to LocalStorage:', e);
  }
};

const getLocalCache = (key: string): any[] => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    return [];
  }
};

export const clearUserCache = (userId?: string) => {
  try {
    if (userId) {
      localStorage.removeItem(`mb_envelopes_${userId}`);
      localStorage.removeItem(`mb_transactions_${userId}`);
      localStorage.removeItem(`mb_reports_${userId}`);
      localStorage.removeItem(`mb_dailycam_${userId}`);
      localStorage.removeItem(`mb_textpaste_${userId}`);
    }
    localStorage.removeItem('mb_envelopes');
    localStorage.removeItem('mb_transactions');
    localStorage.removeItem('mb_reports');
    localStorage.removeItem('mb_dailycam');
    localStorage.removeItem('mb_textpaste');
  } catch (e) {
    console.warn('Failed to clear cache:', e);
  }
};

// ==========================================
// 1. ENVELOPES CRUD
// ==========================================
export const getEnvelopes = async (userId?: string): Promise<Envelope[]> => {
  const cacheKey = userId ? `mb_envelopes_${userId}` : 'mb_envelopes';
  try {
    const res = await databases.listDocuments(DATABASE_ID, COL_ENVELOPES, [
      Query.limit(100)
    ]);

    const docs = res.documents.map(doc => ({
      $id: doc.$id,
      id: doc.$id,
      user_id: doc.user_id || '',
      name: doc.name,
      icon: doc.icon,
      color: doc.color,
      type: doc.type as any,
      target_monthly: Number(doc.target_monthly),
      weekly_allowance: Number(doc.weekly_allowance),
      reserve_balance: Number(doc.reserve_balance),
      active_balance: Number(doc.active_balance),
      is_smart_rec: Boolean(doc.is_smart_rec),
      is_auto_debt: Boolean(doc.is_auto_debt),
      last_reset_phase: doc.last_reset_phase !== undefined && doc.last_reset_phase !== null ? Number(doc.last_reset_phase) : 1,
      last_reset_month: doc.last_reset_month || '',
      $permissions: doc.$permissions
    }));

    const filtered = userId
      ? docs.filter(doc => isDocumentOwnedByUser(doc, userId))
      : docs;

    if (filtered.length > 0) {
      saveLocalCache(cacheKey, filtered);
      return filtered;
    }

    return getLocalCache(cacheKey);
  } catch (err) {
    console.error('Appwrite getEnvelopes error, reading from local cache:', err);
    return getLocalCache(cacheKey);
  }
};

export const createEnvelope = async (data: Omit<Envelope, '$id' | 'id'>, userId?: string): Promise<Envelope> => {
  const cacheKey = userId ? `mb_envelopes_${userId}` : 'mb_envelopes';

  const basePayload: Record<string, any> = {
    name: data.name,
    icon: data.icon,
    color: data.color,
    type: data.type,
    target_monthly: Number(data.target_monthly),
    weekly_allowance: Number(data.weekly_allowance),
    reserve_balance: Number(data.reserve_balance),
    active_balance: Number(data.active_balance),
    is_smart_rec: Boolean(data.is_smart_rec),
    is_auto_debt: Boolean(data.is_auto_debt)
  };

  const fullPayload = {
    ...basePayload,
    ...(userId ? { user_id: userId } : {}),
    last_reset_phase: data.last_reset_phase !== undefined ? Number(data.last_reset_phase) : 1,
    last_reset_month: data.last_reset_month || ''
  };

  const permissions = getUserPermissions(userId);

  try {
    let doc;
    try {
      doc = await databases.createDocument(DATABASE_ID, COL_ENVELOPES, ID.unique(), fullPayload, permissions);
    } catch (attrErr) {
      console.warn('Retrying createDocument with base payload:', attrErr);
      doc = await databases.createDocument(DATABASE_ID, COL_ENVELOPES, ID.unique(), basePayload, permissions);
    }

    const created: Envelope = {
      ...data,
      $id: doc.$id,
      id: doc.$id,
      user_id: doc.user_id || userId || ''
    };

    const currentLocal = getLocalCache(cacheKey);
    saveLocalCache(cacheKey, [...currentLocal, created]);

    return created;
  } catch (err) {
    console.error('Appwrite createEnvelope Error:', err);
    const localEnvelope: Envelope = {
      ...data,
      $id: `env-${Date.now()}`,
      id: `env-${Date.now()}`,
      user_id: userId || ''
    };
    const currentLocal = getLocalCache(cacheKey);
    saveLocalCache(cacheKey, [...currentLocal, localEnvelope]);
    return localEnvelope;
  }
};

export const updateEnvelope = async (id: string, data: Partial<Envelope>, userId?: string): Promise<void> => {
  const cacheKey = userId ? `mb_envelopes_${userId}` : 'mb_envelopes';
  const cleanData: Record<string, any> = {};

  const allowedKeys = [
    'name', 'icon', 'color', 'type',
    'target_monthly', 'weekly_allowance', 'reserve_balance', 'active_balance',
    'is_smart_rec', 'is_auto_debt', 'last_reset_phase', 'last_reset_month', 'user_id'
  ];

  for (const key of allowedKeys) {
    if ((data as any)[key] !== undefined) {
      cleanData[key] = (data as any)[key];
    }
  }

  const currentLocal = getLocalCache(cacheKey);
  const updatedLocal = currentLocal.map(e => (e.$id === id || e.id === id ? { ...e, ...cleanData } : e));
  saveLocalCache(cacheKey, updatedLocal);

  if (id && !id.startsWith('env-')) {
    try {
      try {
        await databases.updateDocument(DATABASE_ID, COL_ENVELOPES, id, cleanData);
      } catch (attrErr) {
        delete cleanData.user_id;
        delete cleanData.last_reset_phase;
        delete cleanData.last_reset_month;
        await databases.updateDocument(DATABASE_ID, COL_ENVELOPES, id, cleanData);
      }
    } catch (err) {
      console.error('Appwrite updateEnvelope Error:', err);
    }
  }
};

export const deleteEnvelope = async (id: string, userId?: string): Promise<void> => {
  const cacheKey = userId ? `mb_envelopes_${userId}` : 'mb_envelopes';

  const currentLocal = getLocalCache(cacheKey);
  saveLocalCache(cacheKey, currentLocal.filter(e => e.$id !== id && e.id !== id));

  if (id && !id.startsWith('env-')) {
    try {
      await databases.deleteDocument(DATABASE_ID, COL_ENVELOPES, id);
    } catch (err) {
      console.error('Appwrite deleteEnvelope Error:', err);
    }
  }
};

// ==========================================
// 2. TRANSACTIONS CRUD
// ==========================================
export const getTransactions = async (userId?: string): Promise<Transaction[]> => {
  const cacheKey = userId ? `mb_transactions_${userId}` : 'mb_transactions';
  try {
    const res = await databases.listDocuments(DATABASE_ID, COL_TRANSACTIONS, [
      Query.orderDesc('timestamp'),
      Query.limit(100)
    ]);

    const docs = res.documents.map(doc => ({
      $id: doc.$id,
      id: doc.$id,
      user_id: doc.user_id || '',
      envelope_id: doc.envelope_id,
      amount: Number(doc.amount),
      note: doc.note || '',
      timestamp: doc.timestamp,
      $permissions: doc.$permissions
    }));

    const filtered = userId
      ? docs.filter(doc => isDocumentOwnedByUser(doc, userId))
      : docs;

    if (filtered.length > 0) {
      saveLocalCache(cacheKey, filtered);
      return filtered;
    }

    return getLocalCache(cacheKey);
  } catch (err) {
    console.error('Appwrite getTransactions error, reading from local cache:', err);
    return getLocalCache(cacheKey);
  }
};

export const createTransaction = async (data: Omit<Transaction, '$id' | 'id'>, userId?: string): Promise<Transaction> => {
  const cacheKey = userId ? `mb_transactions_${userId}` : 'mb_transactions';

  const basePayload: Record<string, any> = {
    envelope_id: data.envelope_id,
    amount: Number(data.amount),
    note: data.note || '',
    timestamp: data.timestamp
  };

  const fullPayload = {
    ...basePayload,
    ...(userId ? { user_id: userId } : {})
  };

  const permissions = getUserPermissions(userId);

  try {
    let doc;
    try {
      doc = await databases.createDocument(DATABASE_ID, COL_TRANSACTIONS, ID.unique(), fullPayload, permissions);
    } catch (attrErr) {
      doc = await databases.createDocument(DATABASE_ID, COL_TRANSACTIONS, ID.unique(), basePayload, permissions);
    }

    const created: Transaction = {
      ...data,
      $id: doc.$id,
      id: doc.$id,
      user_id: doc.user_id || userId || ''
    };

    const currentLocal = getLocalCache(cacheKey);
    saveLocalCache(cacheKey, [created, ...currentLocal]);

    return created;
  } catch (err) {
    console.error('Appwrite createTransaction Error:', err);
    const localTx: Transaction = {
      ...data,
      $id: `tx-${Date.now()}`,
      id: `tx-${Date.now()}`,
      user_id: userId || ''
    };
    const currentLocal = getLocalCache(cacheKey);
    saveLocalCache(cacheKey, [localTx, ...currentLocal]);
    return localTx;
  }
};

export const deleteTransaction = async (id: string, userId?: string): Promise<void> => {
  const cacheKey = userId ? `mb_transactions_${userId}` : 'mb_transactions';

  const currentLocal = getLocalCache(cacheKey);
  saveLocalCache(cacheKey, currentLocal.filter(t => t.$id !== id && t.id !== id));

  if (id && !id.startsWith('tx-')) {
    try {
      await databases.deleteDocument(DATABASE_ID, COL_TRANSACTIONS, id);
    } catch (err) {
      console.error('Appwrite deleteTransaction Error:', err);
    }
  }
};

// ==========================================
// 3. REPORTS CRUD
// ==========================================
export const getReports = async (userId?: string): Promise<Report[]> => {
  const cacheKey = userId ? `mb_reports_${userId}` : 'mb_reports';
  try {
    const res = await databases.listDocuments(DATABASE_ID, COL_REPORTS, [
      Query.limit(50)
    ]);

    const docs = res.documents.map(doc => ({
      $id: doc.$id,
      id: doc.$id,
      user_id: doc.user_id || '',
      month_year: doc.month_year,
      total_saved: Number(doc.total_saved),
      details: doc.details,
      $permissions: doc.$permissions
    }));

    const filtered = userId
      ? docs.filter(doc => isDocumentOwnedByUser(doc, userId))
      : docs;

    if (filtered.length > 0) {
      saveLocalCache(cacheKey, filtered);
      return filtered;
    }

    return getLocalCache(cacheKey);
  } catch (err) {
    console.error('Appwrite getReports error, reading from local cache:', err);
    return getLocalCache(cacheKey);
  }
};

export const createReport = async (data: Omit<Report, '$id' | 'id'>, userId?: string): Promise<Report> => {
  const cacheKey = userId ? `mb_reports_${userId}` : 'mb_reports';

  const basePayload: Record<string, any> = {
    month_year: data.month_year,
    total_saved: Number(data.total_saved),
    details: data.details || ''
  };

  const fullPayload = {
    ...basePayload,
    ...(userId ? { user_id: userId } : {})
  };

  const permissions = getUserPermissions(userId);

  try {
    let doc;
    try {
      doc = await databases.createDocument(DATABASE_ID, COL_REPORTS, ID.unique(), fullPayload, permissions);
    } catch (attrErr) {
      doc = await databases.createDocument(DATABASE_ID, COL_REPORTS, ID.unique(), basePayload, permissions);
    }

    const created: Report = {
      ...data,
      $id: doc.$id,
      id: doc.$id,
      user_id: doc.user_id || userId || ''
    };

    const currentLocal = getLocalCache(cacheKey);
    saveLocalCache(cacheKey, [created, ...currentLocal]);

    return created;
  } catch (err) {
    console.error('Appwrite createReport Error:', err);
    const localRep: Report = {
      ...data,
      $id: `rep-${Date.now()}`,
      id: `rep-${Date.now()}`,
      user_id: userId || ''
    };
    const currentLocal = getLocalCache(cacheKey);
    saveLocalCache(cacheKey, [localRep, ...currentLocal]);
    return localRep;
  }
};

export interface PushSubscriber {
  $id?: string;
  id?: string;
  user_id: string;
  endpoint: string;
  device_name?: string;
  subscription_json: string;
  created_at?: string;
}

// Multi-Device Push Subscription Storage
export const savePushSubscription = async (
  userId: string,
  subscription: any,
  deviceName: string = 'Browser Device'
): Promise<PushSubscriber | null> => {
  if (!userId || !subscription?.endpoint) return null;

  const endpoint = subscription.endpoint;
  const subscriptionJson = JSON.stringify(subscription);
  const permissions = [
    Permission.read(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any())
  ];

  const fullPayload: Record<string, any> = {
    user_id: userId,
    endpoint: endpoint,
    device_name: deviceName,
    subscription_json: subscriptionJson
  };

  const basePayload: Record<string, any> = {
    endpoint: endpoint,
    subscription_json: subscriptionJson
  };

  // 1. Guaranteed Persistence: Save to Appwrite Account Preferences
  try {
    const currentPrefs = await account.getPrefs();
    const currentDevices = Array.isArray(currentPrefs?.push_devices) ? currentPrefs.push_devices : [];
    const filteredDevices = currentDevices.filter((d: any) => d.endpoint !== endpoint);
    const newDeviceEntry = {
      endpoint,
      device_name: deviceName,
      subscription_json: subscriptionJson,
      updated_at: new Date().toISOString()
    };
    await account.updatePrefs({
      ...currentPrefs,
      push_devices: [...filteredDevices, newDeviceEntry]
    });
    console.log('✅ Device saved to Appwrite Account Preferences:', deviceName);
  } catch (prefsErr) {
    console.warn('account.updatePrefs notice:', prefsErr);
  }

  // 2. Native Appwrite Messaging Push Target Registration (1 Target Per Device)
  try {
    if (typeof (account as any).createPushTarget === 'function') {
      // Deterministic Target ID based on device name to prevent duplicates
      const deviceSlug = (deviceName || 'device').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15);
      const targetId = `push_${deviceSlug}`;

      // Token from Firebase SDK is already a raw FCM token — no URL parsing needed
      const tokenIdentifier = subscription?.endpoint || endpoint;

      // Delete old target for this device first to prevent duplicates
      try {
        if (typeof (account as any).deletePushTarget === 'function') {
          await (account as any).deletePushTarget(targetId);
        }
      } catch (delErr) {
        // Target doesn't exist yet, that's fine
      }

      // Register fresh target
      await (account as any).createPushTarget(targetId, tokenIdentifier);
      console.log('✅ Registered Appwrite Native Push Target (1 per device):', targetId, tokenIdentifier.slice(0, 30) + '...');
    }
  } catch (pushTargetErr: any) {
    console.warn('account.createPushTarget notice:', pushTargetErr?.message || pushTargetErr);
  }

  // 2. Database Persistence: Save to col_push_subscribers collection
  try {
    let existingDocs: any[] = [];
    try {
      const response = await databases.listDocuments(DATABASE_ID, COL_PUSH_SUBSCRIBERS);
      existingDocs = response.documents.filter(d => d.endpoint === endpoint || (d.user_id === userId && d.device_name === deviceName));
    } catch (e) {
      // list fallback
    }

    if (existingDocs.length > 0) {
      const docId = existingDocs[0].$id;
      let updated;
      try {
        updated = await databases.updateDocument(
          DATABASE_ID,
          COL_PUSH_SUBSCRIBERS,
          docId,
          fullPayload,
          permissions
        );
      } catch (attrErr) {
        updated = await databases.updateDocument(
          DATABASE_ID,
          COL_PUSH_SUBSCRIBERS,
          docId,
          basePayload,
          permissions
        );
      }

      console.log('✅ Push Subscription updated in Appwrite col_push_subscribers:', updated.$id);
      return {
        $id: updated.$id,
        id: updated.$id,
        user_id: userId,
        endpoint,
        device_name: deviceName,
        subscription_json: subscriptionJson
      };
    } else {
      let created;
      try {
        created = await databases.createDocument(
          DATABASE_ID,
          COL_PUSH_SUBSCRIBERS,
          ID.unique(),
          fullPayload,
          permissions
        );
      } catch (attrErr) {
        created = await databases.createDocument(
          DATABASE_ID,
          COL_PUSH_SUBSCRIBERS,
          ID.unique(),
          basePayload,
          permissions
        );
      }

      console.log('✅ New Push Subscription created in Appwrite col_push_subscribers:', created.$id);
      return {
        $id: created.$id,
        id: created.$id,
        user_id: userId,
        endpoint,
        device_name: deviceName,
        subscription_json: subscriptionJson
      };
    }
  } catch (err) {
    console.error('Appwrite savePushSubscription notice (saved to preferences & local cache):', err);
    const localKey = `mb_push_subscribers_${userId}`;
    const current: PushSubscriber[] = getLocalCache(localKey);
    const filtered = current.filter(s => s.endpoint !== endpoint);
    const newSub: PushSubscriber = {
      $id: `push-${Date.now()}`,
      id: `push-${Date.now()}`,
      user_id: userId,
      endpoint,
      device_name: deviceName,
      subscription_json: subscriptionJson
    };
    saveLocalCache(localKey, [...filtered, newSub]);
    return newSub;
  }
};

export const deletePushSubscription = async (userId: string, endpoint?: string): Promise<boolean> => {
  if (!userId) return false;
  try {
    const response = await databases.listDocuments(DATABASE_ID, COL_PUSH_SUBSCRIBERS);
    const targetDocs = response.documents.filter(doc => {
      const isOwner = doc.user_id === userId || (doc.$permissions && doc.$permissions.some((p: string) => p.includes(userId)));
      if (!isOwner) return false;
      return endpoint ? doc.endpoint === endpoint : true;
    });

    for (const doc of targetDocs) {
      await databases.deleteDocument(DATABASE_ID, COL_PUSH_SUBSCRIBERS, doc.$id);
    }
    console.log(`✅ Deleted ${targetDocs.length} push subscriptions from Appwrite col_push_subscribers`);

    const localKey = `mb_push_subscribers_${userId}`;
    if (endpoint) {
      const current: PushSubscriber[] = getLocalCache(localKey);
      saveLocalCache(localKey, current.filter(s => s.endpoint !== endpoint));
    } else {
      saveLocalCache(localKey, []);
    }
    return true;
  } catch (err) {
    console.warn('deletePushSubscription error:', err);
    const localKey = `mb_push_subscribers_${userId}`;
    saveLocalCache(localKey, []);
    return false;
  }
};

export const getPushSubscriptions = async (userId: string): Promise<PushSubscriber[]> => {
  if (!userId) return [];
  try {
    const response = await databases.listDocuments(DATABASE_ID, COL_PUSH_SUBSCRIBERS);
    const userDocs = response.documents.filter(doc => {
      return doc.user_id === userId || (doc.$permissions && doc.$permissions.some((p: string) => p.includes(userId)));
    });
    return userDocs.map(d => ({
      $id: d.$id,
      id: d.$id,
      user_id: d.user_id || userId,
      endpoint: d.endpoint,
      device_name: d.device_name,
      subscription_json: d.subscription_json
    }));
  } catch (err) {
    const localKey = `mb_push_subscribers_${userId}`;
    return getLocalCache(localKey);
  }
};

// ==========================================
// 4. DAILYCAM CRUD & STORAGE
// ==========================================
export const getDailyCamPhotoUrl = (fileId: string): string => {
  if (!fileId) return '';
  if (fileId.startsWith('data:') || fileId.startsWith('http://') || fileId.startsWith('https://') || fileId.startsWith('blob:')) {
    return fileId;
  }
  try {
    const viewUrl = storage.getFileView(BUCKET_DAILYCAM, fileId);
    return viewUrl ? viewUrl.toString() : '';
  } catch (e) {
    return `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_DAILYCAM}/files/${fileId}/view?project=${APPWRITE_PROJECT}`;
  }
};

export const getDailyCamEntries = async (userId?: string): Promise<DailyCamEntry[]> => {
  const cacheKey = userId ? `mb_dailycam_${userId}` : 'mb_dailycam';
  try {
    const res = await databases.listDocuments(DATABASE_ID, COL_DAILYCAM, [
      Query.orderAsc('day_number'),
      Query.limit(500)
    ]);

    const docs = res.documents.map(doc => {
      const fileId = doc.file_id || '';
      return {
        $id: doc.$id,
        id: doc.$id,
        user_id: doc.user_id || '',
        file_id: fileId,
        day_number: Number(doc.day_number) || 1,
        timestamp: doc.timestamp || new Date().toISOString(),
        note: doc.note || '',
        photo_url: getDailyCamPhotoUrl(fileId),
        $permissions: doc.$permissions
      };
    });

    const filtered = userId
      ? docs.filter(doc => isDocumentOwnedByUser(doc, userId))
      : docs;

    if (filtered.length > 0) {
      saveLocalCache(cacheKey, filtered);
      return filtered;
    }

    return getLocalCache(cacheKey);
  } catch (err) {
    console.error('Appwrite getDailyCamEntries error, reading local cache:', err);
    return getLocalCache(cacheKey);
  }
};

export const createDailyCamEntry = async (
  data: { day_number?: number; note?: string },
  photoInput: Blob | File | string,
  userId?: string
): Promise<DailyCamEntry> => {
  const cacheKey = userId ? `mb_dailycam_${userId}` : 'mb_dailycam';
  const timestamp = new Date().toISOString();
  let fileId = `snap_${Date.now()}`;
  let photoUrl = '';
  let photoData = '';

  if (typeof photoInput === 'string') {
    photoData = photoInput;
    photoUrl = photoInput;
  }

  // 1. Try uploading to Appwrite Storage if File/Blob
  try {
    let fileToUpload: File | null = null;
    if (photoInput instanceof File) {
      fileToUpload = photoInput;
    } else if (photoInput instanceof Blob) {
      fileToUpload = new File([photoInput], `dailycam_${Date.now()}.jpg`, { type: photoInput.type || 'image/jpeg' });
    } else if (typeof photoInput === 'string' && photoInput.startsWith('data:image')) {
      const res = await fetch(photoInput);
      const blob = await res.blob();
      fileToUpload = new File([blob], `dailycam_${Date.now()}.jpg`, { type: 'image/jpeg' });
    }

    if (fileToUpload) {
      try {
        const filePermissions = [
          Permission.read(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any())
        ];
        if (userId) {
          filePermissions.push(
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId))
          );
        }

        const uploadedFile = await storage.createFile(BUCKET_DAILYCAM, ID.unique(), fileToUpload, filePermissions);
        fileId = uploadedFile.$id;
        photoUrl = getDailyCamPhotoUrl(fileId);
        console.log('✅ Photo successfully uploaded to Appwrite bucket:', fileId, photoUrl);
      } catch (storageErr) {
        console.error('Appwrite storage upload error:', storageErr);
      }
    }
  } catch (e) {
    console.warn('Photo processing error:', e);
  }

  // Calculate next day_number if not provided
  let dayNumber = data.day_number;
  if (!dayNumber) {
    const existing = getLocalCache(cacheKey);
    dayNumber = existing.length > 0 ? Math.max(...existing.map((e: any) => Number(e.day_number) || 0)) + 1 : 1;
  }

  const basePayload: Record<string, any> = {
    file_id: fileId,
    day_number: Number(dayNumber),
    timestamp,
    note: data.note || ''
  };

  const fullPayload = {
    ...basePayload,
    ...(userId ? { user_id: userId } : {})
  };

  const permissions = getUserPermissions(userId);

  try {
    let doc;
    try {
      doc = await databases.createDocument(DATABASE_ID, COL_DAILYCAM, ID.unique(), fullPayload, permissions);
    } catch (attrErr) {
      doc = await databases.createDocument(DATABASE_ID, COL_DAILYCAM, ID.unique(), basePayload, permissions);
    }

    const created: DailyCamEntry = {
      $id: doc.$id,
      id: doc.$id,
      user_id: doc.user_id || userId || '',
      file_id: fileId,
      day_number: dayNumber,
      timestamp,
      note: data.note || '',
      photo_url: photoUrl || getDailyCamPhotoUrl(fileId),
      photo_data: photoData
    };

    const currentLocal = getLocalCache(cacheKey);
    saveLocalCache(cacheKey, [...currentLocal, created]);
    return created;
  } catch (err) {
    console.error('Appwrite createDailyCamEntry error, saving locally:', err);
    const localEntry: DailyCamEntry = {
      $id: `cam-${Date.now()}`,
      id: `cam-${Date.now()}`,
      user_id: userId || '',
      file_id: fileId,
      day_number: dayNumber,
      timestamp,
      note: data.note || '',
      photo_url: photoUrl || photoData,
      photo_data: photoData
    };
    const currentLocal = getLocalCache(cacheKey);
    saveLocalCache(cacheKey, [...currentLocal, localEntry]);
    return localEntry;
  }
};

export const deleteDailyCamEntry = async (id: string, fileId?: string, userId?: string): Promise<void> => {
  const cacheKey = userId ? `mb_dailycam_${userId}` : 'mb_dailycam';
  const currentLocal = getLocalCache(cacheKey);
  saveLocalCache(cacheKey, currentLocal.filter(e => e.$id !== id && e.id !== id));

  if (fileId && !fileId.startsWith('snap_') && !fileId.startsWith('data:')) {
    try {
      await storage.deleteFile(BUCKET_DAILYCAM, fileId);
    } catch (e) {
      console.warn('deleteFile notice:', e);
    }
  }

  if (id && !id.startsWith('cam-')) {
    try {
      await databases.deleteDocument(DATABASE_ID, COL_DAILYCAM, id);
    } catch (err) {
      console.error('Appwrite deleteDailyCamEntry error:', err);
    }
  }
};

// ==========================================
// 5. TEXTPASTE CRUD
// ==========================================
export const getTextPasteItems = async (userId?: string): Promise<TextPasteItem[]> => {
  const cacheKey = userId ? `mb_textpaste_${userId}` : 'mb_textpaste';
  try {
    const res = await databases.listDocuments(DATABASE_ID, COL_TEXTPASTE, [
      Query.orderDesc('timestamp'),
      Query.limit(200)
    ]);

    const docs = res.documents.map(doc => ({
      $id: doc.$id,
      id: doc.$id,
      user_id: doc.user_id || '',
      category: doc.category || 'biasa',
      label: doc.label || '',
      value: doc.value || '',
      timestamp: doc.timestamp || new Date().toISOString(),
      $permissions: doc.$permissions
    }));

    const filtered = userId
      ? docs.filter(doc => isDocumentOwnedByUser(doc, userId))
      : docs;

    if (filtered.length > 0) {
      saveLocalCache(cacheKey, filtered);
      return filtered;
    }

    return getLocalCache(cacheKey);
  } catch (err) {
    console.error('Appwrite getTextPasteItems error, reading local cache:', err);
    return getLocalCache(cacheKey);
  }
};

export const createTextPasteItem = async (
  data: Omit<TextPasteItem, '$id' | 'id'>,
  userId?: string
): Promise<TextPasteItem> => {
  const cacheKey = userId ? `mb_textpaste_${userId}` : 'mb_textpaste';
  const timestamp = data.timestamp || new Date().toISOString();

  const basePayload: Record<string, any> = {
    category: data.category || 'biasa',
    label: data.label || '',
    value: data.value || '',
    timestamp
  };

  const fullPayload = {
    ...basePayload,
    ...(userId ? { user_id: userId } : {})
  };

  const permissions = getUserPermissions(userId);

  try {
    let doc;
    try {
      doc = await databases.createDocument(DATABASE_ID, COL_TEXTPASTE, ID.unique(), fullPayload, permissions);
    } catch (attrErr) {
      doc = await databases.createDocument(DATABASE_ID, COL_TEXTPASTE, ID.unique(), basePayload, permissions);
    }

    const created: TextPasteItem = {
      $id: doc.$id,
      id: doc.$id,
      user_id: doc.user_id || userId || '',
      category: doc.category || data.category,
      label: doc.label || data.label,
      value: doc.value || data.value,
      timestamp: doc.timestamp || timestamp
    };

    const currentLocal = getLocalCache(cacheKey);
    saveLocalCache(cacheKey, [created, ...currentLocal]);
    return created;
  } catch (err) {
    console.error('Appwrite createTextPasteItem error, saving locally:', err);
    const localItem: TextPasteItem = {
      $id: `paste-${Date.now()}`,
      id: `paste-${Date.now()}`,
      user_id: userId || '',
      category: data.category,
      label: data.label,
      value: data.value,
      timestamp
    };
    const currentLocal = getLocalCache(cacheKey);
    saveLocalCache(cacheKey, [localItem, ...currentLocal]);
    return localItem;
  }
};

export const updateTextPasteItem = async (
  id: string,
  data: Partial<TextPasteItem>,
  userId?: string
): Promise<void> => {
  const cacheKey = userId ? `mb_textpaste_${userId}` : 'mb_textpaste';
  const cleanData: Record<string, any> = {};

  const allowedKeys = ['category', 'label', 'value', 'timestamp', 'user_id'];
  for (const key of allowedKeys) {
    if ((data as any)[key] !== undefined) {
      cleanData[key] = (data as any)[key];
    }
  }

  const currentLocal = getLocalCache(cacheKey);
  const updatedLocal = currentLocal.map(item => (item.$id === id || item.id === id ? { ...item, ...cleanData } : item));
  saveLocalCache(cacheKey, updatedLocal);

  if (id && !id.startsWith('paste-')) {
    try {
      await databases.updateDocument(DATABASE_ID, COL_TEXTPASTE, id, cleanData);
    } catch (err) {
      console.error('Appwrite updateTextPasteItem error:', err);
    }
  }
};

export const deleteTextPasteItem = async (id: string, userId?: string): Promise<void> => {
  const cacheKey = userId ? `mb_textpaste_${userId}` : 'mb_textpaste';
  const currentLocal = getLocalCache(cacheKey);
  saveLocalCache(cacheKey, currentLocal.filter(item => item.$id !== id && item.id !== id));

  if (id && !id.startsWith('paste-')) {
    try {
      await databases.deleteDocument(DATABASE_ID, COL_TEXTPASTE, id);
    } catch (err) {
      console.error('Appwrite deleteTextPasteItem error:', err);
    }
  }
};

// ==========================================
// Activities Sync Handlers (Multi-Device Appwrite DB + Account Prefs Fallback)
// ==========================================
export const getActivities = async (userId?: string): Promise<Activity[]> => {
  const cacheKey = userId ? `mb_activities_${userId}` : 'mb_activities';
  const localData = getLocalCache(cacheKey);

  try {
    const queries = [
      Query.orderDesc('timestamp'),
      Query.limit(100)
    ];
    if (userId) {
      queries.push(Query.equal('user_id', userId));
    }

    const res = await databases.listDocuments(DATABASE_ID, COL_ACTIVITIES, queries);
    const serverActivities: Activity[] = res.documents.map(doc => {
      let parsedDetails = undefined;
      if (doc.details) {
        try {
          parsedDetails = typeof doc.details === 'string' ? JSON.parse(doc.details) : doc.details;
        } catch (e) {
          parsedDetails = undefined;
        }
      }

      return {
        $id: doc.$id,
        id: doc.$id,
        user_id: doc.user_id,
        type: doc.type,
        title: doc.title,
        description: doc.description,
        envelope_name: doc.envelope_name || undefined,
        envelope_id: doc.envelope_id || undefined,
        amount: doc.amount !== undefined ? Number(doc.amount) : undefined,
        details: parsedDetails,
        timestamp: doc.timestamp || doc.$createdAt
      };
    });

    // Also update local cache
    saveLocalCache(cacheKey, serverActivities);
    return serverActivities;
  } catch (err) {
    console.warn('Appwrite getActivities DB notice, checking account prefs fallback:', err);
    try {
      const prefs = await account.getPrefs();
      if (Array.isArray(prefs?.activities) && prefs.activities.length > 0) {
        saveLocalCache(cacheKey, prefs.activities);
        return prefs.activities;
      }
    } catch (prefErr) {}

    return localData || [];
  }
};

export const createActivity = async (
  activityData: Omit<Activity, '$id' | 'id'>,
  userId?: string
): Promise<Activity> => {
  const cacheKey = userId ? `mb_activities_${userId}` : 'mb_activities';
  const permissions = getUserPermissions(userId);

  const payload: Record<string, any> = {
    user_id: userId || '',
    type: activityData.type,
    title: activityData.title,
    description: activityData.description || '',
    envelope_name: activityData.envelope_name || '',
    envelope_id: activityData.envelope_id || '',
    amount: activityData.amount !== undefined ? Number(activityData.amount) : 0,
    details: activityData.details ? JSON.stringify(activityData.details) : '',
    timestamp: activityData.timestamp || new Date().toISOString()
  };

  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COL_ACTIVITIES,
      ID.unique(),
      payload,
      permissions
    );

    const created: Activity = {
      ...activityData,
      $id: doc.$id,
      id: doc.$id,
      user_id: userId
    };

    const current = getLocalCache(cacheKey);
    const updated = [created, ...current].slice(0, 100);
    saveLocalCache(cacheKey, updated);

    // Backup to account preferences so it's always accessible on all devices
    account.getPrefs().then(prefs => {
      account.updatePrefs({
        ...prefs,
        activities: updated.slice(0, 30)
      }).catch(() => {});
    }).catch(() => {});

    return created;
  } catch (err) {
    console.error('Appwrite createActivity error, saving to local & prefs:', err);
    const localActivity: Activity = {
      ...activityData,
      $id: `act-${Date.now()}`,
      id: `act-${Date.now()}`,
      user_id: userId
    };
    const current = getLocalCache(cacheKey);
    const updated = [localActivity, ...current].slice(0, 100);
    saveLocalCache(cacheKey, updated);

    account.getPrefs().then(prefs => {
      account.updatePrefs({
        ...prefs,
        activities: updated.slice(0, 30)
      }).catch(() => {});
    }).catch(() => {});

    return localActivity;
  }
};

export const clearAllActivities = async (userId?: string): Promise<void> => {
  const cacheKey = userId ? `mb_activities_${userId}` : 'mb_activities';
  saveLocalCache(cacheKey, []);

  try {
    const prefs = await account.getPrefs();
    await account.updatePrefs({
      ...prefs,
      activities: []
    });
  } catch (e) {}

  if (userId) {
    try {
      const res = await databases.listDocuments(DATABASE_ID, COL_ACTIVITIES, [
        Query.equal('user_id', userId),
        Query.limit(100)
      ]);
      for (const doc of res.documents) {
        await databases.deleteDocument(DATABASE_ID, COL_ACTIVITIES, doc.$id);
      }
    } catch (e) {
      console.warn('clearAllActivities DB delete notice:', e);
    }
  }
};



