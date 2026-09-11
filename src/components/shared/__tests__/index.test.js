// Guards the "./shared" barrel contract. Tables import their chips and utils
// from here, so a renamed or dropped re-export breaks them at render time.
import * as shared from "../index";

describe("shared barrel", () => {
  it("re-exports the chip and cell components", () => {
    for (const name of [
      "RiskChip",
      "VerificationChip",
      "ExpandableCodeCell",
      "SortIcon",
      "InfoTooltip",
    ]) {
      expect(typeof shared[name]).toBe("function");
    }
  });

  it("re-exports the column info map", () => {
    expect(shared.COLUMN_INFO).toBeDefined();
    expect(shared.COLUMN_INFO.deforestation_ha).toEqual(expect.any(String));
  });

  // The barrel also forwards everything from "@/utils" for backward
  // compatibility, which is what the table components rely on.
  it("forwards the formatting helpers from @/utils", () => {
    for (const name of ["fmtNum", "fmtProp", "formatPeriod", "getCodes"]) {
      expect(typeof shared[name]).toBe("function");
    }
  });

  it("forwards the table style constants from @/utils", () => {
    expect(shared.TABLE_CSS).toBeDefined();
    expect(shared.COLOR_RISK).toBeDefined();
    expect(shared.COLOR_OK).toBeDefined();
  });

  it("forwards the chart constants from @/utils", () => {
    expect(shared.TYPE_ALIASES).toBeDefined();
    expect(shared.ENTERPRISE_TYPES).toBeDefined();
  });

  it("does not forward mapUtils, which needs Leaflet and window", () => {
    expect(shared.createIcon).toBeUndefined();
    expect(shared.ARROW_CONFIG).toBeUndefined();
  });
});
