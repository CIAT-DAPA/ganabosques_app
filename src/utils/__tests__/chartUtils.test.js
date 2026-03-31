import {
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
} from "../chartUtils";

describe("Constants", () => {
  it("CHART_COLORS has expected keys", () => {
    expect(CHART_COLORS).toHaveProperty("RISK");
    expect(CHART_COLORS).toHaveProperty("OK");
    expect(CHART_COLORS).toHaveProperty("WARNING");
    expect(CHART_COLORS).toHaveProperty("PRIMARY");
    expect(CHART_COLORS).toHaveProperty("SECONDARY");
  });

  it("BASE_CHART_COLORS is a non-empty array", () => {
    expect(Array.isArray(BASE_CHART_COLORS)).toBe(true);
    expect(BASE_CHART_COLORS.length).toBe(10);
  });

  it("MOVEMENT_CHART_COLORS is a non-empty array", () => {
    expect(Array.isArray(MOVEMENT_CHART_COLORS)).toBe(true);
    expect(MOVEMENT_CHART_COLORS.length).toBe(15);
  });

  it("ALERT_STYLES has TRUE and FALSE entries", () => {
    expect(ALERT_STYLES.TRUE).toHaveProperty("label", "Con alerta");
    expect(ALERT_STYLES.FALSE).toHaveProperty("label", "Sin alerta");
    expect(ALERT_STYLES.TRUE.color).toBe(CHART_COLORS.RISK);
    expect(ALERT_STYLES.FALSE.color).toBe(CHART_COLORS.OK);
  });

  it("TYPE_ALIASES maps common aliases", () => {
    expect(TYPE_ALIASES.COLLECTIONCENTER).toBe("COLLECTION_CENTER");
    expect(TYPE_ALIASES.PLANTA).toBe("SLAUGHTERHOUSE");
    expect(TYPE_ALIASES.FERIA).toBe("CATTLE_FAIR");
  });

  it("ENTERPRISE_TYPES has all canonical types", () => {
    expect(ENTERPRISE_TYPES.FARM).toBe("Finca");
    expect(ENTERPRISE_TYPES.SLAUGHTERHOUSE).toBe("Planta de beneficio");
    expect(ENTERPRISE_TYPES.COLLECTION_CENTER).toBe("Centro de acopio");
    expect(ENTERPRISE_TYPES.CATTLE_FAIR).toBe("Feria ganadera");
  });

  it("DESTINATION_TYPE_LABELS has all keys including aliases", () => {
    expect(DESTINATION_TYPE_LABELS.SLAUGHTERHOUSE).toBe("Planta de beneficio");
    expect(DESTINATION_TYPE_LABELS.PLANTA).toBe("Planta de beneficio");
    expect(DESTINATION_TYPE_LABELS.FINCA).toBe("Finca");
  });
});

describe("translateEnterpriseType", () => {
  it("returns '—' for falsy input", () => {
    expect(translateEnterpriseType(null)).toBe("—");
    expect(translateEnterpriseType("")).toBe("—");
    expect(translateEnterpriseType(undefined)).toBe("—");
  });

  it("translates canonical type", () => {
    expect(translateEnterpriseType("FARM")).toBe("Finca");
    expect(translateEnterpriseType("SLAUGHTERHOUSE")).toBe("Planta de beneficio");
  });

  it("translates aliased type", () => {
    expect(translateEnterpriseType("PLANTA")).toBe("Planta de beneficio");
    expect(translateEnterpriseType("FERIA")).toBe("Feria ganadera");
    expect(translateEnterpriseType("COLLECTIONCENTER")).toBe("Centro de acopio");
  });

  it("handles case insensitivity", () => {
    expect(translateEnterpriseType("farm")).toBe("Finca");
    expect(translateEnterpriseType("planta")).toBe("Planta de beneficio");
  });

  it("returns original type if unknown", () => {
    expect(translateEnterpriseType("UNKNOWN_TYPE")).toBe("UNKNOWN_TYPE");
  });
});

describe("translateDestinationType", () => {
  it("returns '—' for falsy input", () => {
    expect(translateDestinationType(null)).toBe("—");
    expect(translateDestinationType("")).toBe("—");
  });

  it("translates known destination types", () => {
    expect(translateDestinationType("SLAUGHTERHOUSE")).toBe("Planta de beneficio");
    expect(translateDestinationType("FINCA")).toBe("Finca");
  });

  it("handles hyphens by replacing with underscores", () => {
    expect(translateDestinationType("COLLECTION-CENTER")).toBe("Centro de acopio");
  });

  it("handles case insensitivity", () => {
    expect(translateDestinationType("farm")).toBe("Finca");
  });

  it("returns original type if unknown", () => {
    expect(translateDestinationType("MYSTERY")).toBe("MYSTERY");
  });
});

describe("isoToYear", () => {
  it("returns null for falsy input", () => {
    expect(isoToYear(null)).toBeNull();
    expect(isoToYear("")).toBeNull();
    expect(isoToYear(undefined)).toBeNull();
  });

  it("extracts year from ISO date with timezone", () => {
    expect(isoToYear("2022-06-15T00:00:00Z")).toBe(2022);
  });

  it("extracts year from ISO date without timezone", () => {
    expect(isoToYear("2021-03-10")).toBe(2021);
  });

  it("extracts year from full ISO with offset", () => {
    expect(isoToYear("2020-01-01T00:00:00+05:00")).toBe(2019);
  });

  it("returns null for invalid date", () => {
    expect(isoToYear("not-a-date")).toBeNull();
  });
});

describe("toYear", () => {
  it("returns null for null/undefined", () => {
    expect(toYear(null)).toBeNull();
    expect(toYear(undefined)).toBeNull();
  });

  it("returns finite number as-is", () => {
    expect(toYear(2023)).toBe(2023);
  });

  it("parses year from string starting with digits", () => {
    expect(toYear("2021-01-01")).toBe(2021);
  });

  it("falls back to isoToYear for complex strings", () => {
    expect(toYear("2020")).toBe(2020);
  });

  it("returns null for Infinity", () => {
    expect(toYear(Infinity)).toBeNull();
  });
});

describe("buildLabelFromPeriod", () => {
  it("returns '—' for empty item", () => {
    expect(buildLabelFromPeriod({})).toBe("—");
    expect(buildLabelFromPeriod(null)).toBe("—");
  });

  it("returns 'startYear - endYear' for complete period", () => {
    const item = { period_start: "2020-06-15", period_end: "2021-06-15" };
    expect(buildLabelFromPeriod(item)).toBe("2020 - 2021");
  });

  it("returns start year only if end is missing", () => {
    const item = { period_start: "2020-06-15" };
    expect(buildLabelFromPeriod(item)).toBe("2020");
  });

  it("returns end year only if start is missing", () => {
    const item = { period_end: "2022-12-31" };
    expect(buildLabelFromPeriod(item)).toBe("2022");
  });
});

describe("sortKeyFromPeriod", () => {
  it("returns 0 for empty item", () => {
    expect(sortKeyFromPeriod({})).toBe(0);
  });

  it("returns start year when available", () => {
    expect(sortKeyFromPeriod({ period_start: "2020-06-15", period_end: "2021-06-15" })).toBe(2020);
  });

  it("returns end year when start is missing", () => {
    expect(sortKeyFromPeriod({ period_end: "2022-06-15" })).toBe(2022);
  });
});

describe("formatNumber", () => {
  it("returns non-number values unchanged", () => {
    expect(formatNumber("hello")).toBe("hello");
    expect(formatNumber(null)).toBeNull();
  });

  it("formats number with locale", () => {
    const result = formatNumber(1234);
    expect(typeof result).toBe("string");
  });

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0");
  });
});

describe("formatValue", () => {
  it("returns '—' for null/undefined", () => {
    expect(formatValue(null)).toBe("—");
    expect(formatValue(undefined)).toBe("—");
  });

  it("formats with default 2 decimals", () => {
    expect(formatValue(3.14159)).toBe("3.14");
  });

  it("formats with custom decimals", () => {
    expect(formatValue(3.14159, 4)).toBe("3.1416");
  });

  it("formats zero", () => {
    expect(formatValue(0)).toBe("0.00");
  });
});

describe("formatHa", () => {
  it("returns '—' for null/undefined/NaN", () => {
    expect(formatHa(null)).toBe("—");
    expect(formatHa(undefined)).toBe("—");
    expect(formatHa("abc")).toBe("—");
  });

  it("formats number with ' ha' suffix", () => {
    const result = formatHa(100);
    expect(result).toContain("ha");
  });

  it("formats zero", () => {
    const result = formatHa(0);
    expect(result).toContain("0");
    expect(result).toContain("ha");
  });
});

describe("getAlertLevel", () => {
  it("returns TRUE style for truthy flag", () => {
    expect(getAlertLevel(true)).toBe(ALERT_STYLES.TRUE);
    expect(getAlertLevel(1)).toBe(ALERT_STYLES.TRUE);
  });

  it("returns FALSE style for falsy flag", () => {
    expect(getAlertLevel(false)).toBe(ALERT_STYLES.FALSE);
    expect(getAlertLevel(0)).toBe(ALERT_STYLES.FALSE);
    expect(getAlertLevel(null)).toBe(ALERT_STYLES.FALSE);
  });
});

describe("riskBadgeBool", () => {
  it("returns TRUE style when isRisk is true", () => {
    expect(riskBadgeBool(true)).toBe(ALERT_STYLES.TRUE);
  });

  it("returns FALSE style when isRisk is false", () => {
    expect(riskBadgeBool(false)).toBe(ALERT_STYLES.FALSE);
  });
});

describe("badgeTextColor", () => {
  it("returns '#fff' for falsy input", () => {
    expect(badgeTextColor(null)).toBe("#fff");
    expect(badgeTextColor("")).toBe("#fff");
  });

  it("returns dark color for yellow (#FFD600)", () => {
    expect(badgeTextColor("#FFD600")).toBe("#111827");
    expect(badgeTextColor("#ffd600")).toBe("#111827");
  });

  it("returns white for other colors", () => {
    expect(badgeTextColor("#D50000")).toBe("#ffffff");
    expect(badgeTextColor("#00C853")).toBe("#ffffff");
  });
});

describe("buildBarFromItems", () => {
  it("returns empty series for empty items", () => {
    const result = buildBarFromItems([]);
    expect(result.categories).toEqual([]);
    expect(result.series).toEqual([{ name: "Total", data: [] }]);
  });

  it("handles null items", () => {
    const result = buildBarFromItems(null);
    expect(result.categories).toEqual([]);
  });

  it("filters out zero/negative/non-finite values", () => {
    const items = [
      { value: 10, period_start: "2020-01-01", period_end: "2021-12-31" },
      { value: 0, period_start: "2019-01-01", period_end: "2019-12-31" },
      { value: -5, period_start: "2018-01-01", period_end: "2018-12-31" },
    ];
    const result = buildBarFromItems(items);
    expect(result.categories).toHaveLength(1);
    expect(result.series[0].data).toEqual([10]);
  });

  it("uses custom valueKey and seriesName", () => {
    const items = [{ count: 42, period_start: "2023-01-01", period_end: "2023-12-31" }];
    const result = buildBarFromItems(items, "count", "Cantidad");
    expect(result.series[0].name).toBe("Cantidad");
    expect(result.series[0].data).toEqual([42]);
  });

  it("applies round1Decimal option", () => {
    const items = [{ value: 3.456, period_start: "2023-01-01", period_end: "2023-12-31" }];
    const result = buildBarFromItems(items, "value", "Total", { round1Decimal: true });
    expect(result.series[0].data[0]).toBe(3.5);
  });

  it("uses custom labelFormatter", () => {
    const items = [{ value: 10, custom: "My Label" }];
    const result = buildBarFromItems(items, "value", "Total", {
      labelFormatter: (it) => it.custom,
    });
    expect(result.categories[0]).toBe("My Label");
  });
});

describe("baseBarOptions", () => {
  it("returns options with chart type bar", () => {
    const opts = baseBarOptions({ categories: ["2020", "2021"], yTitle: "Hectáreas" });
    expect(opts.chart.type).toBe("bar");
    expect(opts.xaxis.categories).toEqual(["2020", "2021"]);
    expect(opts.yaxis.title.text).toBe("Hectáreas");
  });

  it("includes title when provided", () => {
    const opts = baseBarOptions({ title: "Mi Gráfico", categories: [], yTitle: "" });
    expect(opts.title.text).toBe("Mi Gráfico");
  });

  it("omits title when not provided", () => {
    const opts = baseBarOptions({ categories: [], yTitle: "" });
    expect(opts.title).toBeUndefined();
  });

  it("uses custom yFormatter in tooltip", () => {
    const formatter = (val) => `${val} ha`;
    const opts = baseBarOptions({ categories: [], yTitle: "", yFormatter: formatter });
    expect(opts.tooltip.y.formatter(100)).toBe("100 ha");
  });

  it("uses formatNumber as default tooltip formatter", () => {
    const opts = baseBarOptions({ categories: [], yTitle: "" });
    const result = opts.tooltip.y.formatter(1234);
    expect(typeof result).toBe("string");
  });
});

describe("normalizeBubbleSeries", () => {
  it("returns empty arrays for empty input", () => {
    const result = normalizeBubbleSeries([]);
    expect(result.points).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it("handles null input", () => {
    const result = normalizeBubbleSeries(null);
    expect(result.points).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it("creates points with risk color for items with risk_total", () => {
    const items = [
      { period_start: "2020-01-01", period_end: "2021-12-31", risk_total: 5 },
    ];
    const result = normalizeBubbleSeries(items);
    expect(result.points[0].fillColor).toBe(CHART_COLORS.RISK);
    expect(result.points[0].isRisk).toBe(true);
    expect(result.points[0].y).toBe(1);
    expect(result.points[0].z).toBe(28);
  });

  it("creates points with OK color for items without risk_total", () => {
    const items = [
      { period_start: "2020-01-01", period_end: "2021-12-31", risk_total: 0 },
    ];
    const result = normalizeBubbleSeries(items);
    expect(result.points[0].fillColor).toBe(CHART_COLORS.OK);
    expect(result.points[0].isRisk).toBe(false);
  });

  it("uses custom labelFormatter", () => {
    const items = [{ custom: "Q1 2023", risk_total: 1 }];
    const result = normalizeBubbleSeries(items, (it) => it.custom);
    expect(result.points[0].x).toBe("Q1 2023");
    expect(result.rows[0].label).toBe("Q1 2023");
  });
});
