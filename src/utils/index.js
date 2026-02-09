// Central export for utilities
export {
  CHART_COLORS,
  BASE_CHART_COLORS,
  MOVEMENT_CHART_COLORS,
  ALERT_STYLES,
  TYPE_ALIASES,
  ENTERPRISE_TYPES,
  DESTINATION_TYPE_LABELS,
  translateEnterpriseType,
  translateDestinationType,
  isoToYear,
  toYear,
  buildLabelFromPeriod,
  sortKeyFromPeriod,
  formatNumber,
  formatValue,
  formatHa,
  getAlertLevel,
  riskBadgeBool,
  badgeTextColor,
  buildBarFromItems,
  baseBarOptions,
  normalizeBubbleSeries,
} from "./chartUtils";

export {
  fmtNum,
  fmtProp,
  formatPeriod,
  getCodes,
  yearFromDateLike,
  asYear,
} from "./formatUtils";

export {
  COLOR_RISK,
  COLOR_OK,
  TABLE_CSS,
} from "./tableStyles";

// Note: mapUtils is NOT re-exported here because it imports Leaflet,
// which requires `window` and breaks SSR/SSG. Import directly from
// "@/utils/mapUtils" in client-only components that need it.
