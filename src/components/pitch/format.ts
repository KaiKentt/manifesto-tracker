// Formatting for the landing page. Locale-free on purpose, so server and browser render identical text.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function group(n: number) {
  return Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** RM12,345 or −RM12,345 */
export function rm(n: number) {
  return `${n < 0 ? "−" : ""}RM${group(n)}`;
}

/** RM48.9M, RM8.26M, RM200.8K: trims trailing zeros, keeps the given decimals at most. */
export function rmShort(n: number, decimals = 1) {
  const [value, unit] = Math.abs(n) >= 1e6 ? [n / 1e6, "M"] : Math.abs(n) >= 1e3 ? [n / 1e3, "K"] : [n, ""];
  return `RM${Number(value.toFixed(decimals)).toString()}${unit}`;
}

export function pct(share: number, decimals = 1) {
  return `${Number((share * 100).toFixed(decimals))}%`;
}

/** Model month (1 = first forecast month) to "Jan 2027". */
export function monthLabel(month: number, start = "2027-01") {
  const [y, m] = start.split("-").map(Number);
  const index = m - 1 + (month - 1);
  return `${MONTHS[index % 12]} ${y + Math.floor(index / 12)}`;
}

/** Model month range to "Jan–Mar 2027" or "Nov 2027–Jan 2028". */
export function monthRange(from: number, to: number, start = "2027-01") {
  const a = monthLabel(from, start);
  const b = monthLabel(to, start);
  const [am, ay] = a.split(" ");
  const [bm, by] = b.split(" ");
  return ay === by ? `${am}–${bm} ${by}` : `${a}–${b}`;
}
