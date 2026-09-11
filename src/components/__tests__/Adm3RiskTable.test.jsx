import { render, screen } from "@testing-library/react";
import Adm3RiskTable from "../Adm3RiskTable";

const record = (overrides = {}) => ({
  department: "Guaviare",
  municipality: "San José",
  name: "El Retorno",
  adm3_id: "a1",
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
        output: {},
      },
    },
  ],
  ...overrides,
});

const cellsOfFirstRow = () =>
  Array.from(screen.getAllByRole("row")[1].querySelectorAll("td")).map((td) => td.textContent);

describe("Adm3RiskTable", () => {
  describe("empty input", () => {
    it("shows the vereda-specific empty message", () => {
      render(<Adm3RiskTable data={{}} />);
      expect(screen.getByText("No hay datos de veredas para mostrar.")).toBeInTheDocument();
    });

    it("shows the empty message with no props", () => {
      render(<Adm3RiskTable />);
      expect(screen.getByText("No hay datos de veredas para mostrar.")).toBeInTheDocument();
    });

    it("skips records without items", () => {
      render(<Adm3RiskTable data={{ a1: { name: "El Retorno", items: [] } }} />);
      expect(screen.getByText("No hay datos de veredas para mostrar.")).toBeInTheDocument();
    });

    it("skips records whose items is not an array", () => {
      render(<Adm3RiskTable data={{ a1: { name: "X", items: "nope" } }} />);
      expect(screen.getByText("No hay datos de veredas para mostrar.")).toBeInTheDocument();
    });
  });

  describe("headers", () => {
    it("renders every column", () => {
      render(<Adm3RiskTable data={{ a1: record() }} />);

      for (const label of [
        "Departamento",
        "Municipio",
        "Vereda",
        "Periodo",
        "Alerta",
        "Alerta Directa (SIT)",
        "Alerta Entrada (SIT)",
        "Alerta Salida (SIT)",
        "Predios",
        "Deforestación (ha)",
      ]) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
    });
  });

  describe("row mapping", () => {
    it("maps location, period, counts and deforestation", () => {
      render(<Adm3RiskTable data={{ a1: record() }} />);

      const cells = cellsOfFirstRow();
      expect(cells[0]).toBe("Guaviare");
      expect(cells[1]).toBe("San José");
      expect(cells[2]).toBe("El Retorno");
      expect(cells[3]).toBe("2023 - 2024");
      expect(cells[8]).toBe("7");
      // fmtNum drops to one decimal for values of 10 or more.
      expect(cells[9]).toBe("45.7");
    });

    it("shows an alert chip when risk_total is set", () => {
      render(<Adm3RiskTable data={{ a1: record() }} />);
      expect(screen.getByText("Con alerta")).toBeInTheDocument();
    });

    it("shows no alert when risk_total is false", () => {
      const data = { a1: record({ items: [{ ...record().items[0], risk_total: false }] }) };
      render(<Adm3RiskTable data={data} />);

      expect(screen.getByText("Sin alerta")).toBeInTheDocument();
    });

    it("renders the SIT codes of the direct alert", () => {
      render(<Adm3RiskTable data={{ a1: record() }} />);
      expect(screen.getByText("111")).toBeInTheDocument();
    });

    it("shows a placeholder for the empty code groups", () => {
      render(<Adm3RiskTable data={{ a1: record() }} />);
      expect(screen.getAllByText("Sin códigos")).toHaveLength(2);
    });

    it("falls back to a dash for missing location fields", () => {
      const data = { a1: { adm3_id: "a1", items: [{ period_start: "2023-06-15" }] } };
      render(<Adm3RiskTable data={data} />);

      const cells = cellsOfFirstRow();
      expect(cells[0]).toBe("—");
      expect(cells[1]).toBe("—");
      expect(cells[2]).toBe("—");
    });

    it("defaults counts and hectares to zero", () => {
      const data = { a1: { adm3_id: "a1", items: [{ period_start: "2023-06-15" }] } };
      render(<Adm3RiskTable data={data} />);

      const cells = cellsOfFirstRow();
      expect(cells[8]).toBe("0");
      expect(cells[9]).toBe("0.00");
    });
  });

  describe("input shapes", () => {
    it("accepts an object keyed by adm3 id", () => {
      render(<Adm3RiskTable data={{ a1: record() }} />);
      expect(screen.getByText("El Retorno")).toBeInTheDocument();
    });

    it("accepts a plain array of records", () => {
      render(<Adm3RiskTable data={[record()]} />);
      expect(screen.getByText("El Retorno")).toBeInTheDocument();
    });

    it("emits one row per record item", () => {
      const data = {
        a1: record({
          items: [
            { period_start: "2022-06-15", period_end: "2023-06-15" },
            { period_start: "2023-06-15", period_end: "2024-06-15" },
          ],
        }),
      };
      render(<Adm3RiskTable data={data} />);

      expect(screen.getAllByRole("row")).toHaveLength(3);
    });
  });

  describe("ordering", () => {
    // Items are sorted newest first so the most recent period leads the table.
    it("puts the newest period first", () => {
      const data = {
        a1: record({
          items: [
            { period_start: "2021-06-15", period_end: "2022-06-15" },
            { period_start: "2023-06-15", period_end: "2024-06-15" },
            { period_start: "2022-06-15", period_end: "2023-06-15" },
          ],
        }),
      };
      render(<Adm3RiskTable data={data} />);

      const periods = screen
        .getAllByRole("row")
        .slice(1)
        .map((row) => row.querySelectorAll("td")[3].textContent);
      expect(periods).toEqual(["2023 - 2024", "2022 - 2023", "2021 - 2022"]);
    });

    it("does not mutate the original items array", () => {
      const items = [
        { period_start: "2021-06-15", period_end: "2022-06-15" },
        { period_start: "2023-06-15", period_end: "2024-06-15" },
      ];
      render(<Adm3RiskTable data={{ a1: record({ items }) }} />);

      expect(items[0].period_start).toBe("2021-06-15");
    });
  });

  describe("printing mode", () => {
    it("expands the code cells so they reach the PDF", () => {
      const many = Object.fromEntries(
        Array.from({ length: 4 }, (_, i) => [
          `f${i}`,
          [{ source: "SIT", ext_code: `code-${i}` }],
        ])
      );
      const data = {
        a1: record({ items: [{ ...record().items[0], sit_codes: { direct: many } }] }),
      };

      render(<Adm3RiskTable data={data} isPrinting />);

      expect(screen.getByText("code-3")).toBeInTheDocument();
    });

    it("collapses them when not printing", () => {
      const many = Object.fromEntries(
        Array.from({ length: 4 }, (_, i) => [
          `f${i}`,
          [{ source: "SIT", ext_code: `code-${i}` }],
        ])
      );
      const data = {
        a1: record({ items: [{ ...record().items[0], sit_codes: { direct: many } }] }),
      };

      render(<Adm3RiskTable data={data} />);

      expect(screen.queryByText("code-3")).not.toBeInTheDocument();
    });
  });

  it("forwards extra props to the underlying table", () => {
    render(<Adm3RiskTable data={{ a1: record() }} tableId="tabla-veredas" />);
    expect(screen.getByRole("table")).toHaveAttribute("id", "tabla-veredas");
  });
});
