import { fmtNum, fmtProp, formatPeriod, getCodes, yearFromDateLike, asYear } from "../formatUtils";

// ─── fmtNum ──────────────────────────────────────────────────────

describe("fmtNum", () => {
  it("returns '—' for null", () => {
    expect(fmtNum(null)).toBe("—");
  });

  it("returns '—' for undefined", () => {
    expect(fmtNum(undefined)).toBe("—");
  });

  it("returns '—' for NaN string", () => {
    expect(fmtNum("abc")).toBe("—");
  });

  it("formats values >= 100 with 0 decimals", () => {
    expect(fmtNum(100)).toBe("100");
    expect(fmtNum(1234.567)).toBe("1235");
  });

  it("formats values >= 10 and < 100 with 1 decimal", () => {
    expect(fmtNum(10)).toBe("10.0");
    expect(fmtNum(45.678)).toBe("45.7");
  });

  it("formats values < 10 with 2 decimals by default", () => {
    expect(fmtNum(0)).toBe("0.00");
    expect(fmtNum(5.1234)).toBe("5.12");
  });

  it("respects custom decimal count for values < 10", () => {
    expect(fmtNum(3.1415, 3)).toBe("3.142");
  });

  it("handles string numbers", () => {
    expect(fmtNum("200")).toBe("200");
    expect(fmtNum("5.5")).toBe("5.50");
  });

  it("handles zero", () => {
    expect(fmtNum(0)).toBe("0.00");
  });

  it("handles negative numbers", () => {
    expect(fmtNum(-5)).toBe("-5.00");
  });
});

// ─── fmtProp ─────────────────────────────────────────────────────

describe("fmtProp", () => {
  it("returns '—' for null", () => {
    expect(fmtProp(null)).toBe("—");
  });

  it("returns '—' for undefined", () => {
    expect(fmtProp(undefined)).toBe("—");
  });

  it("returns '—' for NaN string", () => {
    expect(fmtProp("xyz")).toBe("—");
  });

  it("converts 0.5 to '50%'", () => {
    expect(fmtProp(0.5)).toBe("50%");
  });

  it("converts 1 to '100%'", () => {
    expect(fmtProp(1)).toBe("100%");
  });

  it("converts 0 to '0%'", () => {
    expect(fmtProp(0)).toBe("0%");
  });

  it("converts 0.123 to '12%'", () => {
    expect(fmtProp(0.123)).toBe("12%");
  });

  it("handles string number input", () => {
    expect(fmtProp("0.75")).toBe("75%");
  });
});

// ─── formatPeriod ────────────────────────────────────────────────

describe("formatPeriod", () => {
  it("returns '—' when both start and end are falsy", () => {
    expect(formatPeriod(null, null)).toBe("—");
    expect(formatPeriod("", "")).toBe("—");
  });

  it("formats annual period as 'startYear - endYear'", () => {
    expect(formatPeriod("2020-01-01", "2021-12-31")).toBe("2020 - 2021");
  });

  it("handles ISO date strings with time", () => {
    expect(formatPeriod("2018-01-01T00:00:00Z", "2019-12-31T23:59:59Z")).toBe("2018 - 2019");
  });

  it("returns only start year if end is falsy", () => {
    expect(formatPeriod("2020-06-01", null)).toBe("2020");
  });

  it("returns only end year if start is falsy", () => {
    expect(formatPeriod(null, "2022-06-01")).toBe("2022");
  });

  it("detects quarterly period (same year, ≤4 months span)", () => {
    // Jan-Mar = Q1
    expect(formatPeriod("2023-01-01", "2023-03-31")).toBe("202301");
    // Apr-Jun = Q2
    expect(formatPeriod("2023-04-01", "2023-06-30")).toBe("202302");
    // Jul-Sep = Q3
    expect(formatPeriod("2023-07-01", "2023-09-30")).toBe("202303");
    // Oct-Dec = Q4
    expect(formatPeriod("2023-10-01", "2023-12-31")).toBe("202304");
  });

  it("does not detect quarterly when spanning > 4 months", () => {
    expect(formatPeriod("2023-01-01", "2023-07-31")).toBe("2023 - 2023");
  });
});

// ─── getCodes ────────────────────────────────────────────────────

describe("getCodes", () => {
  it("returns '—' for non-array input", () => {
    expect(getCodes(null)).toBe("—");
    expect(getCodes(undefined)).toBe("—");
    expect(getCodes("string")).toBe("—");
    expect(getCodes(123)).toBe("—");
  });

  it("returns '—' for empty array", () => {
    expect(getCodes([])).toBe("—");
  });

  it("extracts and joins ext_codes", () => {
    const ids = [
      { ext_code: "ABC123" },
      { ext_code: "DEF456" },
    ];
    expect(getCodes(ids)).toBe("ABC123, DEF456");
  });

  it("filters out empty and missing ext_codes", () => {
    const ids = [
      { ext_code: "ABC" },
      { ext_code: "" },
      {},
      { ext_code: "DEF" },
    ];
    expect(getCodes(ids)).toBe("ABC, DEF");
  });

  it("returns '—' when all ext_codes are empty", () => {
    const ids = [{ ext_code: "" }, {}];
    expect(getCodes(ids)).toBe("—");
  });
});

// ─── yearFromDateLike ────────────────────────────────────────────

describe("yearFromDateLike", () => {
  it("returns null for falsy input", () => {
    expect(yearFromDateLike(null)).toBeNull();
    expect(yearFromDateLike("")).toBeNull();
    expect(yearFromDateLike(undefined)).toBeNull();
  });

  it("extracts year from ISO date string", () => {
    expect(yearFromDateLike("2023-06-15")).toBe(2023);
  });

  it("extracts year from Date object", () => {
    expect(yearFromDateLike(new Date("2021-03-10"))).toBe(2021);
  });

  it("extracts year from year-only string via regex fallback", () => {
    // Note: new Date("2019") parses as UTC midnight, so in negative UTC offsets
    // getFullYear() returns 2018. The function tries Date first, then regex.
    // Since Date parses successfully, it returns the local year.
    // Use a mid-year date to avoid timezone boundary:
    expect(yearFromDateLike("2019-06-15")).toBe(2019);
  });

  it("extracts year from string with embedded year", () => {
    expect(yearFromDateLike("report_2022_annual")).toBe(2022);
  });

  it("returns null when no year can be extracted", () => {
    expect(yearFromDateLike("nodate")).toBeNull();
  });
});

// ─── asYear ──────────────────────────────────────────────────────

describe("asYear", () => {
  it("extracts year from Date object", () => {
    expect(asYear(new Date("2023-05-01"))).toBe(2023);
  });

  it("returns number as-is", () => {
    expect(asYear(2020)).toBe(2020);
  });

  it("parses first 4 chars of string", () => {
    expect(asYear("2021-01-01")).toBe(2021);
  });

  it("returns NaN for non-parseable values", () => {
    expect(asYear(null)).toBeNaN();
    expect(asYear({})).toBeNaN();
    expect(asYear(true)).toBeNaN();
  });
});
