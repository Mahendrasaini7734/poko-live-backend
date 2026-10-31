/**
 * Converts "HH:mm:ss" to seconds. Never throws.
 * "00:12:35" -> 755, "01:00:00" -> 3600. Invalid/null -> 0.
 */
const parseDurationToSeconds = (duration) => {
  if (typeof duration !== "string") return 0;

  const match = /^(\d{1,3}):([0-5]?\d):([0-5]?\d)$/.exec(duration.trim());
  if (!match) return 0;

  return (
    Number(match[1]) * 3600 +
    Number(match[2]) * 60 +
    Number(match[3])
  );
};

module.exports = { parseDurationToSeconds };
