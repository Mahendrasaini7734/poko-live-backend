/**
 * Dashboard change notifications for admins (reuses the ONE admin socket room of liveAnalytics.service).
 *
 * Models report "something that matters to a dashboard group changed" via note(group). We coalesce a burst
 * into a single `adminDashboard:event` {groups:[...], seq, ts} (<= 1 emit / 1.5s) - the payload carries NO
 * counters, the admin refetches the affected metrics from the authoritative API (no double counting possible).
 * Groups: users | hosts | reports | withdrawals | transactions
 */
const ADMIN_ROOM = "liveAnalytics:admin";
const EVENT = "adminDashboard:event";
const WINDOW_MS = 1500;
const GROUPS = new Set(["users", "hosts", "reports", "withdrawals", "transactions"]);

let pending = new Set();
let timer = null;
let seq = 0;

function note(group) {
  try {
    if (!GROUPS.has(group)) return;
    pending.add(group);
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      const groups = [...pending];
      pending = new Set();
      const io = global.io;
      if (!io || !groups.length) return;
      io.to(ADMIN_ROOM).emit(EVENT, { groups, seq: ++seq, ts: Date.now() });
    }, WINDOW_MS);
    if (timer.unref) timer.unref();
  } catch (e) { console.error("[adminDashboardEvents]", e.message); }
}

module.exports = { note, EVENT, ADMIN_ROOM };
