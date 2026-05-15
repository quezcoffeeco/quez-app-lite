// ============================================================
// QUEZ APP LITE — Time format helpers
// One canonical 12-hour format across the entire app:
//   • "h:mm am" / "h:mm pm"
//   • Lowercase am/pm
//   • No zero-padding on the hour (so 6:07 am, not 06:07 AM)
//   • Single space between the minutes and the period
// Match the GlobalClock pill in App.js so every visible clock reads identically.
// ============================================================

// Format a Date or ISO string as "h:mm am".
export function fmtClock(input) {
  if (!input) return '';
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const rawH = d.getHours();
  const h12 = ((rawH + 11) % 12) + 1;
  const mm = String(d.getMinutes()).padStart(2, '0');
  const period = rawH < 12 ? 'am' : 'pm';
  return `${h12}:${mm} ${period}`;
}

// Format a 24-hour "HH:MM" shift string as "h:mm am". If the string is malformed,
// returns the input unchanged so we never blank out a schedule cell.
export function fmtShiftTime(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return '';
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm.trim());
  if (!m) return hhmm;
  const rawH = Number(m[1]);
  const mm = m[2];
  if (Number.isNaN(rawH)) return hhmm;
  const h12 = ((rawH + 11) % 12) + 1;
  const period = rawH < 12 ? 'am' : 'pm';
  return `${h12}:${mm} ${period}`;
}

// Relative-time helper for "X minutes ago" / "yesterday at 6:14 pm" displays.
export function fmtRelTime(input) {
  if (!input) return '';
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return `yesterday at ${fmtClock(d)}`;
  if (days < 7)  return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
