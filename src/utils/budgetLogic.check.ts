import { getSmartRecommendation, canRollbackTransaction, runScheduledChecks } from './budgetLogic';
import { Envelope } from '../types';

console.log('Running budgetLogic checks...');

// 1. Smart Recommendation test
const aug3 = new Date('2026-08-03T10:00:00');
const rec1 = getSmartRecommendation(210000, aug3);
console.assert(rec1.phase === 1, 'Aug 3 should be phase 1');
console.assert(rec1.remainingDays === 5, 'Aug 3 should have 5 days remaining in phase 1 (7-3+1)');
console.assert(rec1.dailyLimit === 42000, '210k / 5 days should be 42k');

const aug22 = new Date('2026-08-22T10:00:00');
const rec4 = getSmartRecommendation(300000, aug22);
console.assert(rec4.phase === 4, 'Aug 22 should be phase 4');
console.assert(rec4.remainingDays === 10, 'Aug 22 in Aug (31 days) should have 10 days remaining (31-22+1)');
console.assert(rec4.dailyLimit === 30000, '300k / 10 days should be 30k');

// 2. Transaction Rollback test
const now = new Date();
const recentTx = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
const oldTx = new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString();
console.assert(canRollbackTransaction(recentTx, now) === true, 'Recent tx should be rollbackable');
console.assert(canRollbackTransaction(oldTx, now) === false, 'Old tx should NOT be rollbackable');

// 3. Auto Debt & Carryover test
const mockEnvelope: Envelope = {
  $id: 'env-1',
  name: 'Makan',
  icon: 'Utensils',
  color: '#f59e0b',
  type: 'monthly_split',
  target_monthly: 1000000,
  weekly_allowance: 210000,
  reserve_balance: 790000,
  active_balance: 10000, // 10k left over from last week
  is_smart_rec: true,
  is_auto_debt: true,
  last_reset_phase: 1,
  last_reset_month: '2026-08'
};

// Simulate Aug 8 (Phase 2 reset day)
const aug8 = new Date('2026-08-08T09:00:00');
const res = runScheduledChecks([mockEnvelope], aug8);
console.assert(res.hasChanges === true, 'Should update envelope on reset day');
const updatedEnv = res.updatedEnvelopes[0];
console.assert(updatedEnv.active_balance === 210000, `Active balance should be topped up to 210k (got ${updatedEnv.active_balance})`);
console.assert(updatedEnv.reserve_balance === 590000, `Reserve balance should decrease by 200k (790k - 200k = 590k, got ${updatedEnv.reserve_balance})`);

// 4. End of Month Rollover test: Sept 1 should archive PREVIOUS month ("Agustus 2026")
const sept1 = new Date('2026-09-01T09:00:00');
const eomMockEnv: Envelope = { ...mockEnvelope, last_reset_month: '2026-08' };
const eomRes = runScheduledChecks([eomMockEnv], sept1);
console.assert(eomRes.newReport !== undefined, 'Should generate a report on Sept 1 for EOM Rollover');
console.assert(eomRes.newReport?.month_year === 'Agustus 2026', `Report for Sept 1 should be for previous month 'Agustus 2026' (got ${eomRes.newReport?.month_year})`);

// 5. Empty envelopes test: Should NOT generate a report if envelopes list is empty
const emptyRes = runScheduledChecks([], sept1);
console.assert(emptyRes.newReport === undefined, 'Should NOT generate a report if envelopes list is empty');

console.log('All budgetLogic checks passed successfully!');
