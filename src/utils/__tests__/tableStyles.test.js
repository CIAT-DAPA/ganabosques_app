import { COLOR_RISK, COLOR_OK, TABLE_CSS } from "../tableStyles";

describe("tableStyles constants", () => {
  it("COLOR_RISK is a red hex color", () => {
    expect(COLOR_RISK).toBe("#D50000");
  });

  it("COLOR_OK is a green hex color", () => {
    expect(COLOR_OK).toBe("#00C853");
  });

  it("TABLE_CSS is an object with expected keys", () => {
    expect(TABLE_CSS).toHaveProperty("tableContainer");
    expect(TABLE_CSS).toHaveProperty("table");
    expect(TABLE_CSS).toHaveProperty("tableHeader");
    expect(TABLE_CSS).toHaveProperty("th");
    expect(TABLE_CSS).toHaveProperty("td");
    expect(TABLE_CSS).toHaveProperty("tr");
    expect(TABLE_CSS).toHaveProperty("tbody");
    expect(TABLE_CSS).toHaveProperty("emptyState");
    expect(TABLE_CSS).toHaveProperty("pagination");
    expect(TABLE_CSS).toHaveProperty("paginationButton");
    expect(TABLE_CSS).toHaveProperty("codeCell");
    expect(TABLE_CSS).toHaveProperty("viewMapButton");
  });

  it("all TABLE_CSS values are non-empty strings", () => {
    Object.entries(TABLE_CSS).forEach(([key, value]) => {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    });
  });
});
