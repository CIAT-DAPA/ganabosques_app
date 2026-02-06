// Chart colors
export const CHART_COLORS = {
  RISK: "#D50000",
  OK: "#00C853",
  WARNING: "#FFD600",
  PRIMARY: "#2563eb",
  SECONDARY: "#10b981",
};

// Base chart series colors
export const BASE_CHART_COLORS = [
  "#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

// Movement chart colors (green to orange)
export const MOVEMENT_CHART_COLORS = [
  "#a3d977", "#7ab86b", "#568c5e", "#366f50", "#1f5043",
  "#e9a25f", "#de7c48", "#cc5a33", "#b3411f", "#993014",
  "#7a9e9f", "#d2c29d", "#d26a5c", "#8c8c8c", "#546e7a",
];

// Alert styles
export const ALERT_STYLES = {
  TRUE: {
    label: "Con alerta",
    bgClass: "bg-red-500/20",
    borderClass: "border-red-500",
    textClass: "text-red-700",
    color: CHART_COLORS.RISK,
    desc: "Se han presentado alertas para este período.",
  },
  FALSE: {
    label: "Sin alerta",
    bgClass: "bg-green-500/20",
    borderClass: "border-green-500",
    textClass: "text-green-700",
    color: CHART_COLORS.OK,
    desc: "No se han presentado alertas para este período.",
  },
};

// Enterprise type aliases
export const TYPE_ALIASES = {
  COLLECTIONCENTER: "COLLECTION_CENTER",
  "CENTRO_ACOPIO": "COLLECTION_CENTER",
  "CENTRO DE ACOPIO": "COLLECTION_CENTER",
  ACOPIO: "COLLECTION_CENTER",
  PLANTA: "SLAUGHTERHOUSE",
  FERIA: "CATTLE_FAIR",
  EMPRESA: "ENTERPRISE",
  FINCA: "FARM",
  "SLAUGHTERHOUSE_ID": "SLAUGHTERHOUSE",
  "PRODUCTIONUNIT_ID": "FARM",
};

// Enterprise type labels
export const ENTERPRISE_TYPES = {
  FARM: "Finca",
  COLLECTION_CENTER: "Centro de acopio",
  SLAUGHTERHOUSE: "Planta de beneficio",
  CATTLE_FAIR: "Feria ganadera",
  ENTERPRISE: "Empresa",
};

// Risk filter options
export const RISK_OPTIONS = [
  { value: "annual", label: "Alerta anual" },
  { value: "cumulative", label: "Alerta acumulada" },
];

// Destination type labels
export const DESTINATION_TYPE_LABELS = {
  SLAUGHTERHOUSE: "Planta de beneficio",
  COLLECTION_CENTER: "Centro de acopio",
  CATTLE_FAIR: "Feria ganadera",
  ENTERPRISE: "Empresa",
  FARM: "Finca",
  COLLECTIONCENTER: "Centro de acopio",
  CENTRO_ACOPIO: "Centro de acopio",
  ACOPIO: "Centro de acopio",
  PLANTA: "Planta de beneficio",
  FERIA: "Feria ganadera",
  EMPRESA: "Empresa",
  FINCA: "Finca",
};

// Translate enterprise type to Spanish
export function translateEnterpriseType(type) {
  if (!type) return "—";
  const raw = type.toString().trim().toUpperCase();
  const normalized = TYPE_ALIASES[raw] || raw;
  return ENTERPRISE_TYPES[normalized] || type;
}

// Translate destination type to Spanish
export function translateDestinationType(type) {
  if (!type) return "—";
  const key = type.toString().trim().toUpperCase().replace(/-/g, "_");
  return DESTINATION_TYPE_LABELS[key] || type;
}

// Extract year from ISO date
export function isoToYear(iso) {
  if (!iso) return null;
  const s = String(iso);
  const hasTZ = /[zZ]|[+-]\d{2}:?\d{2}$/.test(s);
  const d = new Date(s);
  const y = hasTZ ? d.getUTCFullYear() : d.getFullYear();
  return Number.isFinite(y) ? y : null;
}

// Normalize date to year number
export function toYear(val) {
  if (val == null) return null;
  if (typeof val === "number" && Number.isFinite(val)) return val;
  const s = String(val);
  const m = s.match(/^(\d{4})/);
  if (m) return parseInt(m[1], 10);
  return isoToYear(s);
}

// Build label from period
export function buildLabelFromPeriod(item) {
  const ys = isoToYear(item?.period_start);
  const ye = isoToYear(item?.period_end);
  if (ys != null && ye != null) return `${ys} - ${ye}`;
  if (ys != null) return String(ys);
  if (ye != null) return String(ye);
  return "—";
}

// Get sort key from period
export function sortKeyFromPeriod(item) {
  const ys = isoToYear(item?.period_start);
  const ye = isoToYear(item?.period_end);
  return ys != null ? ys : ye != null ? ye : 0;
}

// Format number with locale
export function formatNumber(val) {
  if (typeof val !== "number") return val;
  try {
    return val.toLocaleString("es-CO");
  } catch {
    return String(val);
  }
}

// Format value with decimals
export function formatValue(value, decimals = 2) {
  return value != null ? Number(value).toFixed(decimals) : "—";
}

// Format hectares
export function formatHa(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return Number(v).toLocaleString("es-CO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + " ha";
}

// Get alert level styles
export function getAlertLevel(flag) {
  return flag ? ALERT_STYLES.TRUE : ALERT_STYLES.FALSE;
}

// Get risk badge from boolean
export function riskBadgeBool(isRisk) {
  return isRisk ? ALERT_STYLES.TRUE : ALERT_STYLES.FALSE;
}

// Get badge text color
export function badgeTextColor(hex) {
  if (!hex) return "#fff";
  return hex.toUpperCase() === "#FFD600" ? "#111827" : "#ffffff";
}

// Build bar chart data
export function buildBarFromItems(
  items = [],
  valueKey = "value",
  seriesName = "Total",
  { round1Decimal = false } = {}
) {
  const cleaned = (items || []).filter((it) => {
    const v = Number(it?.[valueKey] ?? 0);
    return Number.isFinite(v) && v > 0;
  });

  const categories = cleaned.map((it) => buildLabelFromPeriod(it));
  const values = cleaned.map((it) => {
    let v = Number(it?.[valueKey] ?? 0);
    if (round1Decimal) v = Math.round(v * 10) / 10;
    return v;
  });

  return {
    categories,
    series: [{ name: seriesName, data: values }],
  };
}

// Base bar chart options
export function baseBarOptions({ title, categories, yTitle, yFormatter }) {
  const options = {
    chart: { type: "bar", toolbar: { show: false }, parentHeightOffset: 0 },
    xaxis: { categories, title: { text: "Período" }, labels: { rotate: -30 } },
    yaxis: { title: { text: yTitle } },
    dataLabels: { enabled: false },
    grid: { strokeDashArray: 4 },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "30%" } },
    tooltip: {
      y: {
        formatter: (val) =>
          typeof yFormatter === "function"
            ? yFormatter(val)
            : formatNumber(val),
      },
    },
  };
  
  if (title) {
    options.title = { text: title, style: { fontWeight: 600 } };
  }
  
  return options;
}

// Normalize bubble series data
export function normalizeBubbleSeries(items = []) {
  const rows = (items || []).map((it) => ({
    label: buildLabelFromPeriod(it),
    isRisk: Boolean(it?.risk_total),
    raw: it,
  }));

  const points = rows.map((r) => ({
    x: r.label,
    y: 1,
    z: 28,
    fillColor: r.isRisk ? CHART_COLORS.RISK : CHART_COLORS.OK,
    isRisk: r.isRisk,
  }));

  return { points, rows };
}
