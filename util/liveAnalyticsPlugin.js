/**
 * Mongoose plugin: tells the Live Analytics service "something changed".
 *
 * It only OBSERVES writes (post hooks) - it never changes or blocks them, and every
 * hook is wrapped in try/catch so a failure here can never break the live flow.
 *
 *  kind "live"  -> LiveBroadcaster / LiveBroadcastView / Room / Participant
 *                  (any write marks the snapshot dirty)
 *  kind "user" | "host" -> only writes that touch status-like fields
 */
const WATCH_FIELDS = [
  "isOnline",
  "isBusy",
  "isLive",
  "liveHistoryId",
  "callId",
  "isBlock",
  "status",
  "name",
  "image",
];

const PRESENCE_FIELDS = ["isOnline", "isBusy", "isLive"];

const service = () => require("../services/liveAnalytics.service");

const flatKeys = (update) => {
  const keys = [];
  if (!update || typeof update !== "object") return keys;
  Object.keys(update).forEach((k) => {
    if (k.startsWith("$")) {
      const inner = update[k];
      if (inner && typeof inner === "object") keys.push(...Object.keys(inner));
    } else {
      keys.push(k);
    }
  });
  return keys.map((k) => k.split(".")[0]);
};

module.exports = function liveAnalyticsPlugin(schema, { kind }) {
  const safe = (fn) => {
    try {
      fn();
    } catch (e) {
      console.error("[liveAnalyticsPlugin]", e.message);
    }
  };

  // ---------------- lastActiveAt: authoritative UTC stamp whenever presence (isOnline) is written ----------------
  if (kind === "user" || kind === "host") {
    schema.pre("save", function (next) {
      safe(() => { if (this.isModified("isOnline")) this.lastActiveAt = new Date(); });
      next();
    });
    ["updateOne", "updateMany", "findOneAndUpdate"].forEach((op) => {
      schema.pre(op, function (next) {
        safe(() => {
          const upd = this.getUpdate && this.getUpdate();
          if (!upd) return;
          const touchesPresence = flatKeys(upd).includes("isOnline");
          const alreadySet = flatKeys(upd).includes("lastActiveAt");
          if (touchesPresence && !alreadySet) this.set("lastActiveAt", new Date());
        });
        next();
      });
    });
  }

  // ---------------- document save ----------------
  schema.pre("save", function (next) {
    safe(() => {
      this.$locals.laRelevant =
        kind === "live" ||
        this.isNew ||
        WATCH_FIELDS.some((f) => this.isModified(f));
      this.$locals.laPresence =
        kind !== "live" && PRESENCE_FIELDS.some((f) => this.isModified(f) || this.isNew);
    });
    next();
  });

  schema.post("save", function (doc) {
    safe(() => {
      if (!doc.$locals?.laRelevant) return;
      if (kind !== "live" && doc.$locals.laPresence) service().notePresence(kind, doc._id);
      service().markDirty();
    });
  });

  // ---------------- query based updates ----------------
  ["updateOne", "updateMany", "findOneAndUpdate", "replaceOne", "findOneAndReplace"].forEach(
    (op) => {
      schema.post(op, function () {
        safe(() => {
          if (kind === "live") return service().markDirty();

          const keys = flatKeys(this.getUpdate && this.getUpdate());
          if (!keys.some((k) => WATCH_FIELDS.includes(k))) return;

          if (keys.some((k) => PRESENCE_FIELDS.includes(k))) {
            const raw = this.getFilter && this.getFilter()?._id;
            // plain id / ObjectId -> single id, anything else ($in, no _id ...) -> "many"
            const id = raw && (typeof raw === "string" || raw._bsontype) ? String(raw) : null;
            service().notePresence(kind, id);
          }
          service().markDirty();
        });
      });
    }
  );

  // ---------------- deletes / bulk ----------------
  ["deleteOne", "deleteMany", "findOneAndDelete"].forEach((op) => {
    schema.post(op, function () {
      safe(() => {
        if (kind === "live") service().markDirty();
      });
    });
  });

  schema.post("insertMany", function () {
    safe(() => service().markDirty());
  });
};
