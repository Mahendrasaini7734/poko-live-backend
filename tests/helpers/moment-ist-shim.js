// Test-only stand-in for moment-timezone (Asia/Kolkata = fixed +05:30). Used ONLY when the
// real package is not installed. Production always uses the real moment-timezone.
const OFF = 330 * 60000;
const p2 = (n) => String(n).padStart(2, "0");
class M {
  constructor(ms) { this.ms = ms; }
  tz() { return this; }
  clone() { return new M(this.ms); }
  valueOf() { return this.ms; }
  toDate() { return new Date(this.ms); }
  isValid() { return Number.isFinite(this.ms); }
  startOf() { const l = this.ms + OFF; return new M(l - (((l % 86400000) + 86400000) % 86400000) - OFF); }
  add(n, unit) { return new M(this.ms + n * (unit === "day" ? 86400000 : 1000)); }
  _p() { const d = new Date(this.ms + OFF); return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds() }; }
  format(f) {
    const x = this._p(), mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][x.mo];
    if (!f) return `${x.y}-${p2(x.mo + 1)}-${p2(x.d)}T${p2(x.h)}:${p2(x.mi)}:${p2(x.s)}+05:30`;
    if (f === "YYYY-MM-DD") return `${x.y}-${p2(x.mo + 1)}-${p2(x.d)}`;
    if (f === "HH:mm:ss") return `${p2(x.h)}:${p2(x.mi)}:${p2(x.s)}`;
    return `${x.d} ${mon}, ${x.y}, ${p2(x.h % 12 || 12)}:${p2(x.mi)} ${x.h < 12 ? "AM" : "PM"}`;
  }
}
const parse = (v) => {
  if (v instanceof Date) return new M(v.getTime());
  if (typeof v === "number") return new M(v);
  if (typeof v !== "string" || !v) return new M(NaN);
  if (/[T].*([+-]\d\d:\d\d|Z)$/.test(v)) return new M(Date.parse(v));
  const m = /^(\d{4})-(\d\d)-(\d\d)(?:[ T](\d\d):(\d\d):(\d\d))?$/.exec(v);
  if (!m) return new M(NaN);
  return new M(Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)) - OFF);
};
const moment = (v) => (v === undefined ? new M(Date.now()) : parse(v));
moment.tz = (v) => parse(v);
moment.ISO_8601 = "ISO_8601";
moment.utc = (ms) => ({ format: () => new M(ms - OFF).format("HH:mm:ss") });
module.exports = moment;
