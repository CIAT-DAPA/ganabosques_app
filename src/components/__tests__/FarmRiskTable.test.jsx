import { render, screen } from "@testing-library/react";
import FarmRiskTable from "../FarmRiskTable";

const record = (farm = {}, items) => ({
  farm_id: "f1",
  farm: {
    department: "Meta",
    municipality: "Puerto López",
    vereda: "La Esperanza",
    ext_id: [{ source: "SIT", ext_code: "F-1" }],
    ...farm,
  },
  items:
    items ?? [
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
});

const cellsOfFirstRow = () =>
  Array.from(screen.getAllByRole("row")[1].querySelectorAll("td")).map((td) => td.textContent);

describe("FarmRiskTable", () => {
  describe("empty input", () => {
    it("shows the farm-specific empty message", () => {
      render(<FarmRiskTable data={{}} />);
      expect(screen.getByText("No hay datos de fincas para mostrar.")).toBeInTheDocument();
    });

    it("shows the empty message with no props", () => {
      render(<FarmRiskTable />);
      expect(screen.getByText("No hay datos de fincas para mostrar.")).toBeInTheDocument();
    });

    it("skips records whose items is not an array", () => {
      render(<FarmRiskTable data={{ f1: { farm: {}, items: undefined } }} />);
      expect(screen.getByText("No hay datos de fincas para mostrar.")).toBeInTheDocument();
    });
  });

  it("renders all 17 column headers", () => {
    render(<FarmRiskTable data={{ f1: record() }} />);

    for (const label of [
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
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  describe("row mapping", () => {
    it("maps location, codes and period", () => {
      render(<FarmRiskTable data={{ f1: record() }} />);

      const cells = cellsOfFirstRow();
      expect(cells[0]).toBe("Meta");
      expect(cells[1]).toBe("Puerto López");
      expect(cells[2]).toBe("La Esperanza");
      expect(cells[3]).toBe("SIT: F-1");
      expect(cells[4]).toBe("2023 - 2024");
    });

    it("formats every metric column", () => {
      render(<FarmRiskTable data={{ f1: record() }} />);

      const cells = cellsOfFirstRow();
      expect(cells[9]).toBe("12.3");
      expect(cells[10]).toBe("12.34%");
      expect(cells[11]).toBe("3.50");
      expect(cells[12]).toBe("5%");
      expect(cells[13]).toBe("8.00");
      expect(cells[14]).toBe("20%");
      expect(cells[15]).toBe("1.25");
      expect(cells[16]).toBe("3%");
    });

    it("falls back to a dash for missing location", () => {
      const data = { f1: { farm_id: "f1", farm: {}, items: [{ period_start: "2023-06-15" }] } };
      render(<FarmRiskTable data={data} />);

      const cells = cellsOfFirstRow();
      expect(cells[0]).toBe("—");
      expect(cells[1]).toBe("—");
      expect(cells[2]).toBe("—");
    });

    it("falls back to a dash for missing codes and metrics", () => {
      const data = { f1: { farm_id: "f1", farm: {}, items: [{ period_start: "2023-06-15" }] } };
      render(<FarmRiskTable data={data} />);

      const cells = cellsOfFirstRow();
      expect(cells[3]).toBe("—");
      expect(cells[9]).toBe("—");
      expect(cells[10]).toBe("—");
    });

    it("emits one row per item", () => {
      const data = {
        f1: record({}, [
          { period_start: "2022-06-15", period_end: "2023-06-15" },
          { period_start: "2023-06-15", period_end: "2024-06-15" },
        ]),
      };
      render(<FarmRiskTable data={data} />);

      expect(screen.getAllByRole("row")).toHaveLength(3);
    });
  });

  describe("alert chips", () => {
    it("renders one chip per alert kind", () => {
      render(<FarmRiskTable data={{ f1: record() }} />);

      expect(screen.getByTitle("Alerta Directa")).toHaveTextContent("Con alerta");
      expect(screen.getByTitle("Alerta Entrada")).toHaveTextContent("Sin alerta");
      expect(screen.getByTitle("Alerta Salida")).toHaveTextContent("Con alerta");
    });

    it("treats missing flags as no alert", () => {
      const data = { f1: record({}, [{ period_start: "2023-06-15" }]) };
      render(<FarmRiskTable data={data} />);

      expect(screen.getByTitle("Alerta Directa")).toHaveTextContent("Sin alerta");
    });
  });

  describe("verification", () => {
    it("shows the verified chip when the item carries a positive verification", () => {
      const data = {
        f1: record({}, [
          {
            period_start: "2023-06-15",
            period_end: "2024-06-15",
            verification: { status: true, verification_date: "2024-03-15T10:30:00Z" },
          },
        ]),
      };
      render(<FarmRiskTable data={data} />);

      expect(screen.getByText("Verificado")).toBeInTheDocument();
    });

    it("shows the unverified chip when there is no verification", () => {
      render(<FarmRiskTable data={{ f1: record() }} />);
      expect(screen.getByText("No verificado")).toBeInTheDocument();
    });
  });

  describe("ordering", () => {
    // Rows are sorted by period across every farm, newest first.
    it("puts the newest period first across farms", () => {
      const data = {
        f1: record({ vereda: "Vieja" }, [
          { period_start: "2021-06-15", period_end: "2022-06-15" },
        ]),
        f2: {
          farm_id: "f2",
          farm: { vereda: "Nueva" },
          items: [{ period_start: "2024-06-15", period_end: "2025-06-15" }],
        },
      };
      render(<FarmRiskTable data={data} />);

      const veredas = screen
        .getAllByRole("row")
        .slice(1)
        .map((row) => row.querySelectorAll("td")[2].textContent);
      expect(veredas).toEqual(["Nueva", "Vieja"]);
    });

    it("falls back to the end date when the start is unparseable", () => {
      const data = {
        f1: record({ vereda: "Sin inicio" }, [
          { period_start: "bad", period_end: "2025-06-15" },
        ]),
        f2: {
          farm_id: "f2",
          farm: { vereda: "Con inicio" },
          items: [{ period_start: "2022-06-15", period_end: "2023-06-15" }],
        },
      };
      render(<FarmRiskTable data={data} />);

      const veredas = screen
        .getAllByRole("row")
        .slice(1)
        .map((row) => row.querySelectorAll("td")[2].textContent);
      expect(veredas).toEqual(["Sin inicio", "Con inicio"]);
    });
  });

  it("documents the metric columns with info tooltips", () => {
    render(<FarmRiskTable data={{ f1: record() }} />);

    // One tooltip per metric column: 8 metrics.
    expect(screen.getAllByRole("button")).toHaveLength(8);
  });

  it("forwards extra props to the underlying table", () => {
    render(<FarmRiskTable data={{ f1: record() }} tableId="tabla-predios" />);
    expect(screen.getByRole("table")).toHaveAttribute("id", "tabla-predios");
  });
});
