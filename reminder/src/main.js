import { Client, Users, Databases, Messaging, ID, Query } from 'node-appwrite';

/**
 * Appwrite Cloud Function: Daily Transaction Reminder (Morning & Night)
 * 
 * Schedule: Cron "0 8,20 * * *" (Runs at 08:00 WIB and 20:00 WIB)
 * Logic:
 * 1. Checks every user in the Appwrite project.
 * 2. Checks if the user already recorded any transaction today (UTC+7 / WIB).
 * 3. If ALREADY recorded: Skips notification.
 * 4. If NOT YET recorded: Sends a personalized push notification reminder.
 */
export default async ({ req, res, log, error }) => {
  const client = new Client();

  // Appwrite Config from Environment Variables
  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || 'mybox';
  const apiKey = process.env.APPWRITE_API_KEY || process.env.APPWRITE_FUNCTION_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID || 'db_mybox';
  const colTransactions = process.env.APPWRITE_COL_TRANSACTIONS || 'col_transactions';

  if (!apiKey) {
    error('Missing APPWRITE_API_KEY environment variable. Please configure it in Function Settings.');
    return res.json({ success: false, message: 'Missing APPWRITE_API_KEY' }, 500);
  }

  client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const users = new Users(client);
  const databases = new Databases(client);
  const messaging = new Messaging(client);

  // 1. Calculate Today's Date in Indonesia Timezone (WIB / UTC+7)
  const now = new Date();
  const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const todayYMD = wibTime.toISOString().slice(0, 10); // "YYYY-MM-DD"
  const hourWIB = wibTime.getUTCHours(); // 0 - 23

  const isMorning = hourWIB < 15; // Morning/Afternoon (< 15:00) vs Night (>= 15:00)

  const notificationTitle = isMorning
    ? '🌅 Selamat Pagi! Jangan Lupa Catat Keuangan'
    : '🌙 Evaluasi Malam: Ada Pengeluaran Hari Ini?';

  const notificationBody = isMorning
    ? 'Yuk sempatkan catat pengeluaran dan pemasukan harianmu di MyBox agar pos anggaran tetap terkontrol!'
    : 'Belum ada catatan transaksi hari ini. Luangkan 1 menit untuk mencatat pengeluaranmu di MyBox!';

  log(`[MyBox Reminder] Running trigger for Date: ${todayYMD} (Hour WIB: ${hourWIB}). Mode: ${isMorning ? 'PAGI' : 'MALAM'}`);

  const results = {
    date: todayYMD,
    mode: isMorning ? 'morning' : 'night',
    totalUsers: 0,
    activeUsersToday: 0,
    remindersSent: 0,
    skippedUsers: 0,
    details: []
  };

  try {
    // 2. Fetch all registered users
    const usersList = await users.list();
    results.totalUsers = usersList.total || usersList.users?.length || 0;
    log(`[MyBox Reminder] Found ${results.totalUsers} registered users.`);

    for (const user of usersList.users || []) {
      const userId = user.$id;
      const userName = user.name || user.email || userId;

      // 3. Check if user has recorded any transactions today
      let hasTransactionToday = false;
      try {
        const txResponse = await databases.listDocuments(
          databaseId,
          colTransactions,
          [
            Query.equal('user_id', userId),
            Query.startsWith('date', todayYMD),
            Query.limit(1)
          ]
        );

        if (txResponse.total > 0) {
          hasTransactionToday = true;
        } else {
          // Fallback check on $createdAt if date format differs
          const startOfDay = `${todayYMD}T00:00:00.000Z`;
          const txCreatedCheck = await databases.listDocuments(
            databaseId,
            colTransactions,
            [
              Query.equal('user_id', userId),
              Query.greaterThanEqual('$createdAt', startOfDay),
              Query.limit(1)
            ]
          );
          if (txCreatedCheck.total > 0) {
            hasTransactionToday = true;
          }
        }
      } catch (dbErr) {
        log(`[Notice] Query transactions for ${userId}: ${dbErr.message}`);
      }

      // 4. Decide Action: Skip if active, Send Reminder if inactive today
      if (hasTransactionToday) {
        results.activeUsersToday++;
        results.skippedUsers++;
        log(`- ✅ User "${userName}" (${userId}): Sudah ada transaksi hari ini (${todayYMD}). Tidak perlu diingatkan.`);
        results.details.push({
          userId,
          name: userName,
          status: 'SKIPPED_ALREADY_ACTIVE'
        });
      } else {
        // User has NO transactions today -> Send Push Notification Reminder!
        try {
          // Appwrite Messaging createPush to specific user ID
          const message = await messaging.createPush(
            ID.unique(),
            notificationTitle,
            notificationBody,
            [],          // topics
            [userId],    // users
            [],          // targets
            { url: '/' } // data payload
          );

          results.remindersSent++;
          log(`- 🔔 User "${userName}" (${userId}): BELUM ada transaksi. Notifikasi pengingat terkirim! (Msg ID: ${message.$id})`);
          results.details.push({
            userId,
            name: userName,
            status: 'REMINDER_SENT',
            messageId: message.$id
          });
        } catch (pushErr) {
          log(`- ⚠️ Gagal mengirim notifikasi ke "${userName}" (${userId}): ${pushErr.message}`);
          results.details.push({
            userId,
            name: userName,
            status: 'FAILED_SENDING',
            error: pushErr.message
          });
        }
      }
    }

    log(`[MyBox Reminder] Finished! Total: ${results.totalUsers}, Sent: ${results.remindersSent}, Skipped: ${results.skippedUsers}`);
    return res.json({ success: true, results });

  } catch (err) {
    error(`[MyBox Reminder Fatal Error]: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
