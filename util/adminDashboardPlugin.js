/**
 * Observe-only mongoose plugin -> services/adminDashboardEvents.note(group).  Never changes or blocks a write.
 * options: { group, insertOnly?, fields? }  fields = update keys that matter (default: any update of the doc)
 */
const svc = () => require("../services/adminDashboardEvents.service");

const flatKeys = (update) => {
  const keys = [];
  if (!update || typeof update !== "object") return keys;
  Object.keys(update).forEach((k) => {
    if (k.startsWith("$")) { const inner = update[k]; if (inner && typeof inner === "object") keys.push(...Object.keys(inner)); }
    else keys.push(k);
  });
  return keys.map((k) => k.split(".")[0]);
};

module.exports = function adminDashboardPlugin(schema, { group, insertOnly = false, fields = null }) {
  const safe = (fn) => { try { fn(); } catch (e) { console.error("[adminDashboardPlugin]", e.message); } };

  schema.pre("save", function (next) {
    safe(() => { this.$locals.adNew = this.isNew; this.$locals.adMod = !!fields && fields.some((f) => this.isModified(f)); });
    next();
  });
  schema.post("save", function (doc) {
    safe(() => { if (doc.$locals?.adNew || (!insertOnly && (fields ? doc.$locals?.adMod : true))) svc().note(group); });
  });
  schema.post("insertMany", () => safe(() => svc().note(group)));

  if (!insertOnly) {
    ["updateOne", "updateMany", "findOneAndUpdate"].forEach((op) => {
      schema.post(op, function () {
        safe(() => {
          const keys = flatKeys(this.getUpdate && this.getUpdate());
          if (!fields || keys.some((k) => fields.includes(k))) svc().note(group);
        });
      });
    });
  }
  ["deleteOne", "deleteMany", "findOneAndDelete"].forEach((op) => schema.post(op, () => safe(() => svc().note(group))));
};
