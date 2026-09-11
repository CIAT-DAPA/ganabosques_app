// Guards the "@/utils" barrel contract: components import from here, so a
// renamed or dropped export breaks the app without any single-module test
// noticing.
import * as utils from "../index";

describe("@/utils barrel", () => {
  it("re-exports the chartUtils constants", () => {
    for (const name of [
      "CHART_COLORS",
      "BASE_CHART_COLORS",
      "MOVEMENT_CHART_COLORS",
      "ALERT_STYLES",
      "TYPE_ALIASES",
      "ENTERPRISE_TYPES",
      "DESTINATION_TYPE_LABELS",
    ]) {
      expect(utils[name]).toBeDefined();
    }
  });

  it("re-exports the chartUtils functions", () => {
    for (const name of [
      "translateEnterpriseType",
      "translateDestinationType",
      "isoToYear",
      "toYear",
      "buildLabelFromPeriod",
      "sortKeyFromPeriod",
      "formatNumber",
      "formatValue",
      "formatHa",
      "getAlertLevel",
      "riskBadgeBool",
      "badgeTextColor",
      "buildBarFromItems",
      "baseBarOptions",
      "normalizeBubbleSeries",
    ]) {
      expect(typeof utils[name]).toBe("function");
    }
  });

  it("re-exports the formatUtils functions", () => {
    for (const name of ["fmtNum", "fmtProp", "formatPeriod", "getCodes", "yearFromDateLike", "asYear"]) {
      expect(typeof utils[name]).toBe("function");
    }
  });

  it("re-exports the table styles", () => {
    expect(utils.COLOR_RISK).toBeDefined();
    expect(utils.COLOR_OK).toBeDefined();
    expect(utils.TABLE_CSS).toBeDefined();
  });

  it("re-exports the exportCSV functions", () => {
    for (const name of [
      "formatSitCodes",
      "formatFarmCodes",
      "escapeCsvCell",
      "exportEnterpriseToCSV",
      "exportFarmToCSV",
      "exportVeredaToCSV",
    ]) {
      expect(typeof utils[name]).toBe("function");
    }
  });

  // mapUtils imports Leaflet, which needs `window`. Re-exporting it from the
  // barrel breaks SSR/SSG as soon as a server component imports "@/utils".
  it("does NOT re-export mapUtils, which depends on Leaflet and window", () => {
    for (const name of [
      "ARROW_CONFIG",
      "ENTERPRISE_BASES",
      "normalizeType",
      "getEnterpriseBase",
      "getTypeLabel",
      "createIcon",
      "getEnterpriseIcon",
      "getFarmIcon",
      "calculateDistance",
      "calculateAngle",
      "interpolatePoints",
      "getArrowSpacing",
      "getIconSize",
      "getGeojsonName",
    ]) {
      expect(utils[name]).toBeUndefined();
    }
  });

  it("exposes no default export", () => {
    expect(utils.default).toBeUndefined();
  });
});
