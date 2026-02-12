// Shared formatting utilities

// Format number with decimals
export const fmtNum = (value, decimals = 2) => {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  if (n >= 100) return n.toFixed(0);
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(decimals);
};

// Format proportion as percentage
export const fmtProp = (value) => {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${(Number(value) * 100).toFixed(0)}%`;
};

// Format date range as "YYYY - YYYY" or "YYYY-Q#" for quarterly periods (atd/nad)
export const formatPeriod = (start, end) => {
  if (!start && !end) return "—";
  const ds = start ? new Date(start) : null;
  const de = end ? new Date(end) : null;

  // Use UTC to avoid timezone drift
  const ys = ds && !isNaN(ds.getTime()) ? ds.getUTCFullYear() : null;
  const ye = de && !isNaN(de.getTime()) ? de.getUTCFullYear() : null;
  const ms = ds && !isNaN(ds.getTime()) ? ds.getUTCMonth() : null;
  const me = de && !isNaN(de.getTime()) ? de.getUTCMonth() : null;

  // Detect quarterly period: same year and span <= 4 months
  if (ys != null && ye != null && ys === ye && ms != null && me != null) {
    const diffMonths = me - ms + 1;
    if (diffMonths <= 4) {
      const quarter = Math.ceil((ms + 1) / 3);
      return `${ys}0${quarter}`;
    }
  }

  return ys != null && ye != null ? `${ys} - ${ye}` : String(ys || ye || "—");
};

// Extract external codes from ext_id array
export const getCodes = (extIds) => {
  if (!Array.isArray(extIds)) return "—";
  return extIds.map((e) => e?.ext_code || "").filter(Boolean).join(", ") || "—";
};

// Convert date-like value to year
export const yearFromDateLike = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d.getFullYear();
  const m = String(value).match(/(\d{4})/);
  return m ? Number(m[1]) : null;
};

// Convert value to year number
export const asYear = (value) =>
  value instanceof Date
    ? value.getFullYear()
    : typeof value === "number"
    ? value
    : typeof value === "string"
    ? parseInt(value.slice(0, 4), 10)
    : NaN;
