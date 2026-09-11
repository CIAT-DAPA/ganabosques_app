import {
  formatSitCodes,
  formatFarmCodes,
  escapeCsvCell,
  exportEnterpriseToCSV,
  exportFarmToCSV,
  exportVeredaToCSV,
} from "../exportCSV";

// Splits a CSV row into cells, honouring escaped double quotes.
function splitRow(row) {
  const cells = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

// Rows are newline separated, but a cell may contain newlines of its own
// (formatSitCodes joins farms with them), so quotes have to be tracked.
function splitRows(csv) {
  const rows = [];
  let cur = "";
  let inQuotes = false;
  for (const ch of csv) {
    if (ch === '"') inQuotes = !inQuotes;
    if (ch === "\n" && !inQuotes) {
      rows.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  rows.push(cur);
  return rows;
}

describe("escapeCsvCell", () => {
  it("wraps the value in double quotes", () => {
    expect(escapeCsvCell("hola")).toBe('"hola"');
  });

  it("doubles inner double quotes", () => {
    expect(escapeCsvCell('di "hola"')).toBe('"di ""hola"""');
  });

  it("turns null and undefined into an empty string", () => {
    expect(escapeCsvCell(null)).toBe('""');
    expect(escapeCsvCell(undefined)).toBe('""');
  });

  it("preserves zero instead of treating it as missing", () => {
    expect(escapeCsvCell(0)).toBe('"0"');
  });

  it("stringifies numbers and booleans", () => {
    expect(escapeCsvCell(42)).toBe('"42"');
    expect(escapeCsvCell(false)).toBe('"false"');
  });

  it("quotes commas and newlines without altering them", () => {
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
    expect(escapeCsvCell("a\nb")).toBe('"a\nb"');
  });
});

describe("formatSitCodes", () => {
  it("groups the codes of each farm in braces", () => {
    const result = formatSitCodes({
      f1: [{ source: "SIT", ext_code: "111" }],
    });
    expect(result).toBe("{ SIT: 111 }");
  });

  it("joins several codes of one farm with ' | '", () => {
    const result = formatSitCodes({
      f1: [
        { source: "SIT", ext_code: "111" },
        { source: "ICA", ext_code: "222" },
      ],
    });
    expect(result).toBe("{ SIT: 111 | ICA: 222 }");
  });

  it("separates different farms with a newline", () => {
    const result = formatSitCodes({
      f1: [{ source: "SIT", ext_code: "111" }],
      f2: [{ source: "SIT", ext_code: "222" }],
    });
    expect(result).toBe("{ SIT: 111 }\n{ SIT: 222 }");
  });

  it("drops entries without ext_code", () => {
    const result = formatSitCodes({
      f1: [{ source: "SIT" }, { source: "ICA", ext_code: "222" }, null],
    });
    expect(result).toBe("{ ICA: 222 }");
  });

  it("returns empty braces when a farm has no usable code", () => {
    expect(formatSitCodes({ f1: [] })).toBe("{  }");
  });

  it("returns an empty string with no arguments", () => {
    expect(formatSitCodes()).toBe("");
  });

  it("returns an empty string for an empty object", () => {
    expect(formatSitCodes({})).toBe("");
  });

  it("does not throw when a farm value is not an array", () => {
    expect(() => formatSitCodes({ f1: "not-an-array" })).not.toThrow();
    expect(formatSitCodes({ f1: "not-an-array" })).toBe("{  }");
  });

  it("does not throw when a farm value is null", () => {
    expect(formatSitCodes({ f1: null })).toBe("{  }");
  });

  it("does not throw when sitCodes is null", () => {
    expect(formatSitCodes(null)).toBe("");
  });

  it("returns an empty string when sitCodes is not an object", () => {
    expect(formatSitCodes("text")).toBe("");
    expect(formatSitCodes(5)).toBe("");
  });
});

describe("formatFarmCodes", () => {
  it("joins the codes with a comma", () => {
    const result = formatFarmCodes([
      { source: "SIT", ext_code: "111" },
      { source: "ICA", ext_code: "222" },
    ]);
    expect(result).toBe("SIT: 111, ICA: 222");
  });

  it("drops entries without ext_code", () => {
    const result = formatFarmCodes([{ source: "SIT" }, { source: "ICA", ext_code: "222" }]);
    expect(result).toBe("ICA: 222");
  });

  it("returns 'Sin códigos' for an empty array", () => {
    expect(formatFarmCodes([])).toBe("Sin códigos");
  });

  it("returns 'Sin códigos' with no arguments", () => {
    expect(formatFarmCodes()).toBe("Sin códigos");
  });

  it("returns 'Sin códigos' when the input is not an array", () => {
    expect(formatFarmCodes(null)).toBe("Sin códigos");
    expect(formatFarmCodes({})).toBe("Sin códigos");
    expect(formatFarmCodes("SIT: 1")).toBe("Sin códigos");
  });

  it("returns 'Sin códigos' when no entry has an ext_code", () => {
    expect(formatFarmCodes([{ source: "SIT" }, null])).toBe("Sin códigos");
  });
});

describe("exportEnterpriseToCSV", () => {
  const sample = {
    e1: {
      enterprise: {
        department: "Caquetá",
        municipality: "Florencia",
        type_enterprise: "SLAUGHTERHOUSE",
        ext_id: [{ source: "SIT", ext_code: "EMP-1" }],
        name: "Planta Norte",
      },
      items: [
        {
          period_start: "2023-06-15",
          period_end: "2024-06-15",
          risk_input: [{ id: 1 }],
          risk_output: [],
          sit_codes: {
            input: { f1: [{ source: "SIT", ext_code: "111" }] },
            output: {},
          },
        },
      ],
    },
  };

  it("emits the expected header row", () => {
    const rows = splitRows(exportEnterpriseToCSV(sample));
    expect(splitRow(rows[0])).toEqual([
      "Departamento",
      "Municipio",
      "Tipo Empresa",
      "ID Empresa",
      "Nombre Empresa",
      "Periodo",
      "Alerta",
      "Alerta Entrada",
      "Alerta Salida",
    ]);
  });

  it("maps enterprise and item fields onto the row", () => {
    const rows = splitRows(exportEnterpriseToCSV(sample));
    expect(splitRow(rows[1])).toEqual([
      "Caquetá",
      "Florencia",
      "SLAUGHTERHOUSE",
      "EMP-1",
      "Planta Norte",
      "2023 - 2024",
      "Con alerta",
      "{ SIT: 111 }",
      "Sin códigos",
    ]);
  });

  it("reports 'Sin alerta' when risk_input and risk_output are empty", () => {
    const data = {
      e1: {
        ...sample.e1,
        items: [{ ...sample.e1.items[0], risk_input: [], risk_output: [] }],
      },
    };
    expect(splitRow(splitRows(exportEnterpriseToCSV(data))[1])[6]).toBe("Sin alerta");
  });

  it("reports 'Con alerta' when only risk_output has entries", () => {
    const data = {
      e1: {
        ...sample.e1,
        items: [{ ...sample.e1.items[0], risk_input: [], risk_output: [{ id: 2 }] }],
      },
    };
    expect(splitRow(splitRows(exportEnterpriseToCSV(data))[1])[6]).toBe("Con alerta");
  });

  it("falls back to the object key when the enterprise has no ext_id", () => {
    const data = {
      "raw-id": {
        enterprise: { name: "Sin código" },
        items: [{ period_start: "2023-06-15", period_end: "2024-06-15" }],
      },
    };
    expect(splitRow(splitRows(exportEnterpriseToCSV(data))[1])[3]).toBe("raw-id");
  });

  it("fills missing enterprise fields with an empty string", () => {
    const data = {
      e1: {
        enterprise: { ext_id: [{ ext_code: "EMP-9" }] },
        items: [{ period_start: "2023-06-15", period_end: "2024-06-15" }],
      },
    };
    const cells = splitRow(splitRows(exportEnterpriseToCSV(data))[1]);
    expect(cells[0]).toBe("");
    expect(cells[1]).toBe("");
    expect(cells[2]).toBe("");
    expect(cells[4]).toBe("");
  });

  it("emits one row per enterprise item", () => {
    const data = {
      e1: {
        enterprise: { name: "Multi" },
        items: [
          { period_start: "2022-06-15", period_end: "2023-06-15" },
          { period_start: "2023-06-15", period_end: "2024-06-15" },
        ],
      },
    };
    const rows = splitRows(exportEnterpriseToCSV(data));
    expect(rows).toHaveLength(3);
    expect(splitRow(rows[1])[5]).toBe("2022 - 2023");
    expect(splitRow(rows[2])[5]).toBe("2023 - 2024");
  });

  it("skips enterprises without items but keeps the header", () => {
    const rows = splitRows(exportEnterpriseToCSV({ e1: { enterprise: { name: "X" } } }));
    expect(rows).toHaveLength(1);
  });

  it("returns an empty string for empty, null or undefined data", () => {
    expect(exportEnterpriseToCSV({})).toBe("");
    expect(exportEnterpriseToCSV(null)).toBe("");
    expect(exportEnterpriseToCSV(undefined)).toBe("");
  });

  it("reads dates as UTC rather than local time", () => {
    const data = {
      e1: {
        enterprise: { name: "New year" },
        items: [{ period_start: "2023-01-01", period_end: "2024-01-01" }],
      },
    };
    expect(splitRow(splitRows(exportEnterpriseToCSV(data))[1])[5]).toBe("2023 - 2024");
  });
});

describe("exportFarmToCSV", () => {
  const sample = {
    farm1: {
      farm: {
        department: "Meta",
        municipality: "Puerto López",
        vereda: "La Esperanza",
        ext_id: [{ source: "SIT", ext_code: "F-1" }],
      },
      items: [
        {
          period_start: "2023-06-15",
          period_end: "2024-06-15",
          risk_direct: true,
          risk_input: false,
          risk_output: true,
          deforestation: { ha: 12.345, prop: 0.1234 },
          protected: { ha: 3.5, prop: 0.05 },
          farming_in: { ha: 8, prop: 0.2 },
          farming_out: { ha: 1.25, prop: 0.03 },
        },
      ],
    },
  };

  it("emits the expected 17 header columns", () => {
    const header = splitRow(splitRows(exportFarmToCSV(sample))[0]);
    expect(header).toEqual([
      "Departamento",
      "Municipio",
      "Vereda",
      "Códigos",
      "Periodo",
      "Alerta Directa",
      "Alerta Entrada",
      "Alerta Salida",
      "Verificación",
      "Def. (ha)",
      "Def. (%)",
      "Prot. (ha)",
      "Prot. (%)",
      "F. In (ha)",
      "F. In (%)",
      "F. Out (ha)",
      "F. Out (%)",
    ]);
  });

  it("maps location, codes, alerts and metrics onto the row", () => {
    const cells = splitRow(splitRows(exportFarmToCSV(sample))[1]);
    expect(cells).toEqual([
      "Meta",
      "Puerto López",
      "La Esperanza",
      "SIT: F-1",
      "2023 - 2024",
      "Con alerta",
      "Sin alerta",
      "Con alerta",
      "No verificado",
      "12.35",
      "12.34%",
      "3.50",
      "5%",
      "8.00",
      "20%",
      "1.25",
      "3%",
    ]);
  });

  it("uses 0.00 and a dash when metrics are missing", () => {
    const data = {
      farm1: {
        farm: {},
        items: [{ period_start: "2023-06-15", period_end: "2024-06-15" }],
      },
    };
    const cells = splitRow(splitRows(exportFarmToCSV(data))[1]);
    expect(cells[9]).toBe("0.00");
    expect(cells[10]).toBe("—");
    expect(cells[3]).toBe("Sin códigos");
  });

  it("always emits 'No verificado' in the verification column", () => {
    const data = {
      farm1: {
        farm: {},
        items: [
          {
            period_start: "2023-06-15",
            period_end: "2024-06-15",
            verification: { status: true },
          },
        ],
      },
    };
    expect(splitRow(splitRows(exportFarmToCSV(data))[1])[8]).toBe("No verificado");
  });

  it("repeats the farm codes on every one of its items", () => {
    const data = {
      farm1: {
        farm: { ext_id: [{ source: "SIT", ext_code: "F-9" }] },
        items: [
          { period_start: "2022-06-15", period_end: "2023-06-15" },
          { period_start: "2023-06-15", period_end: "2024-06-15" },
        ],
      },
    };
    const rows = splitRows(exportFarmToCSV(data));
    expect(rows).toHaveLength(3);
    expect(splitRow(rows[1])[3]).toBe("SIT: F-9");
    expect(splitRow(rows[2])[3]).toBe("SIT: F-9");
  });

  it("returns an empty string for empty, null or undefined data", () => {
    expect(exportFarmToCSV({})).toBe("");
    expect(exportFarmToCSV(null)).toBe("");
    expect(exportFarmToCSV(undefined)).toBe("");
  });

  it("reads dates as UTC rather than local time", () => {
    const data = {
      farm1: { farm: {}, items: [{ period_start: "2023-01-01", period_end: "2024-01-01" }] },
    };
    expect(splitRow(splitRows(exportFarmToCSV(data))[1])[4]).toBe("2023 - 2024");
  });
});

describe("exportVeredaToCSV", () => {
  const sample = {
    adm1: {
      department: "Guaviare",
      municipality: "San José",
      name: "El Retorno",
      items: [
        {
          period_start: "2023-06-15",
          period_end: "2024-06-15",
          risk_total: true,
          farm_amount: 7,
          def_ha: 45.678,
          sit_codes: {
            direct: { f1: [{ source: "SIT", ext_code: "111" }] },
            input: {},
            output: { f2: [{ source: "ICA", ext_code: "222" }] },
          },
        },
      ],
    },
  };

  it("emits the expected header row", () => {
    expect(splitRow(splitRows(exportVeredaToCSV(sample))[0])).toEqual([
      "Departamento",
      "Municipio",
      "Vereda",
      "Periodo",
      "Alerta",
      "Alerta Directa",
      "Alerta Entrada",
      "Alerta Salida",
      "Predios",
      "Deforestación (ha)",
    ]);
  });

  it("reads the location from the vereda record, not a nested object", () => {
    const cells = splitRow(splitRows(exportVeredaToCSV(sample))[1]);
    expect(cells).toEqual([
      "Guaviare",
      "San José",
      "El Retorno",
      "2023 - 2024",
      "Con alerta",
      "{ SIT: 111 }",
      "Sin códigos",
      "{ ICA: 222 }",
      "7",
      "45.68",
    ]);
  });

  it("reports 'Sin alerta' when risk_total is false", () => {
    const data = {
      adm1: { ...sample.adm1, items: [{ ...sample.adm1.items[0], risk_total: false }] },
    };
    expect(splitRow(splitRows(exportVeredaToCSV(data))[1])[4]).toBe("Sin alerta");
  });

  it("uses 0 farms and 0.00 ha when the values are missing", () => {
    const data = {
      adm1: { items: [{ period_start: "2023-06-15", period_end: "2024-06-15" }] },
    };
    const cells = splitRow(splitRows(exportVeredaToCSV(data))[1]);
    expect(cells[8]).toBe("0");
    expect(cells[9]).toBe("0.00");
  });

  it("returns an empty string for empty, null or undefined data", () => {
    expect(exportVeredaToCSV({})).toBe("");
    expect(exportVeredaToCSV(null)).toBe("");
    expect(exportVeredaToCSV(undefined)).toBe("");
  });

  it("reads dates as UTC rather than local time", () => {
    const data = {
      adm1: { items: [{ period_start: "2023-01-01", period_end: "2024-01-01" }] },
    };
    expect(splitRow(splitRows(exportVeredaToCSV(data))[1])[3]).toBe("2023 - 2024");
  });

  it("escapes double quotes present in names", () => {
    const data = {
      adm1: {
        name: 'Vereda "La Y"',
        items: [{ period_start: "2023-06-15", period_end: "2024-06-15" }],
      },
    };
    expect(exportVeredaToCSV(data)).toContain('"Vereda ""La Y"""');
  });
});
