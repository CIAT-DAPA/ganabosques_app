import { render, screen } from "@testing-library/react";
import EnterpriseRiskTable from "../EnterpriseRiskTable";

const record = (enterprise = {}, items) => ({
  enterprise: {
    department: "Caquetá",
    municipality: "Florencia",
    type_enterprise: "SLAUGHTERHOUSE",
    ext_id: [{ source: "SIT", ext_code: "EMP-1" }],
    name: "Planta Norte",
    ...enterprise,
  },
  items:
    items ?? [
      {
        period_start: "2023-06-15",
        period_end: "2024-06-15",
        sit_codes: { input: { f1: [{ source: "SIT", ext_code: "111" }] }, output: {} },
      },
    ],
});

const cellsOfFirstRow = () =>
  Array.from(screen.getAllByRole("row")[1].querySelectorAll("td")).map((td) => td.textContent);

describe("EnterpriseRiskTable", () => {
  describe("empty input", () => {
    it("shows the enterprise-specific empty message", () => {
      render(<EnterpriseRiskTable data={{}} />);
      expect(screen.getByText("No hay datos de empresas para mostrar.")).toBeInTheDocument();
    });

    it("shows the empty message with no props", () => {
      render(<EnterpriseRiskTable />);
      expect(screen.getByText("No hay datos de empresas para mostrar.")).toBeInTheDocument();
    });

    it("skips records whose items is not an array", () => {
      render(<EnterpriseRiskTable data={{ e1: { enterprise: {}, items: null } }} />);
      expect(screen.getByText("No hay datos de empresas para mostrar.")).toBeInTheDocument();
    });
  });

  it("renders every column header", () => {
    render(<EnterpriseRiskTable data={{ e1: record() }} />);

    for (const label of [
      "Departamento",
      "Municipio",
      "Tipo Empresa",
      "ID Empresa",
      "Nombre Empresa",
      "Periodo",
      "Alerta",
      "Alerta Entrada",
      "Alerta Salida",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  describe("row mapping", () => {
    it("maps location, id, name and period", () => {
      render(<EnterpriseRiskTable data={{ e1: record() }} />);

      const cells = cellsOfFirstRow();
      expect(cells[0]).toBe("Caquetá");
      expect(cells[1]).toBe("Florencia");
      expect(cells[3]).toBe("EMP-1");
      expect(cells[4]).toBe("Planta Norte");
      expect(cells[5]).toBe("2023 - 2024");
    });

    it("falls back to a dash for missing location and name", () => {
      const data = { e1: { enterprise: {}, items: [{ period_start: "2023-06-15" }] } };
      render(<EnterpriseRiskTable data={data} />);

      const cells = cellsOfFirstRow();
      expect(cells[0]).toBe("—");
      expect(cells[1]).toBe("—");
      expect(cells[4]).toBe("—");
    });

    it("uses N/A when the enterprise has no external id", () => {
      const data = { e1: { enterprise: { name: "X" }, items: [{ period_start: "2023-06-15" }] } };
      render(<EnterpriseRiskTable data={data} />);

      expect(cellsOfFirstRow()[3]).toBe("N/A");
    });

    it("uses N/A when the first external id has no code", () => {
      const data = {
        e1: { enterprise: { ext_id: [{ source: "SIT" }] }, items: [{ period_start: "2023-06-15" }] },
      };
      render(<EnterpriseRiskTable data={data} />);

      expect(cellsOfFirstRow()[3]).toBe("N/A");
    });

    it("emits one row per item", () => {
      const data = {
        e1: record({}, [
          { period_start: "2022-06-15", period_end: "2023-06-15" },
          { period_start: "2023-06-15", period_end: "2024-06-15" },
        ]),
      };
      render(<EnterpriseRiskTable data={data} />);

      expect(screen.getAllByRole("row")).toHaveLength(3);
    });
  });

  describe("enterprise type resolution", () => {
    it("translates type_enterprise", () => {
      render(<EnterpriseRiskTable data={{ e1: record() }} />);
      expect(cellsOfFirstRow()[2]).toBe("Planta de beneficio");
    });

    it("falls back to the type field when type_enterprise is absent", () => {
      const data = {
        e1: record({ type_enterprise: undefined, type: "COLLECTION_CENTER" }),
      };
      render(<EnterpriseRiskTable data={data} />);

      expect(cellsOfFirstRow()[2]).toBe("Centro de acopio");
    });

    it("resolves the type from a known ext_id label", () => {
      const data = {
        e1: record({
          type_enterprise: undefined,
          ext_id: [{ label: "PLANTA", source: "SIT", ext_code: "EMP-1" }],
        }),
      };
      render(<EnterpriseRiskTable data={data} />);

      expect(cellsOfFirstRow()[2]).toBe("Planta de beneficio");
    });

    it("recognises a slaughterhouse id label even without an alias", () => {
      const data = {
        e1: record({
          type_enterprise: undefined,
          ext_id: [{ label: "SLAUGHTERHOUSE_ID", source: "SIT", ext_code: "EMP-1" }],
        }),
      };
      render(<EnterpriseRiskTable data={data} />);

      expect(cellsOfFirstRow()[2]).toBe("Planta de beneficio");
    });

    it("falls back to a dash when nothing identifies the type", () => {
      const data = {
        e1: record({
          type_enterprise: undefined,
          ext_id: [{ source: "SIT", ext_code: "EMP-1" }],
        }),
      };
      render(<EnterpriseRiskTable data={data} />);

      expect(cellsOfFirstRow()[2]).toBe("—");
    });

    it("falls back to a dash when there is no ext_id at all", () => {
      const data = { e1: record({ type_enterprise: undefined, ext_id: undefined }) };
      render(<EnterpriseRiskTable data={data} />);

      expect(cellsOfFirstRow()[2]).toBe("—");
    });
  });

  describe("alert flag", () => {
    it("reports an alert when there are input codes", () => {
      render(<EnterpriseRiskTable data={{ e1: record() }} />);
      expect(screen.getByText("Con alerta")).toBeInTheDocument();
    });

    it("reports an alert when there are only output codes", () => {
      const data = {
        e1: record({}, [
          {
            period_start: "2023-06-15",
            period_end: "2024-06-15",
            sit_codes: { input: {}, output: { f2: [{ source: "SIT", ext_code: "222" }] } },
          },
        ]),
      };
      render(<EnterpriseRiskTable data={data} />);

      expect(screen.getByText("Con alerta")).toBeInTheDocument();
    });

    it("reports no alert when both code groups are empty", () => {
      const data = {
        e1: record({}, [
          {
            period_start: "2023-06-15",
            period_end: "2024-06-15",
            sit_codes: { input: {}, output: {} },
          },
        ]),
      };
      render(<EnterpriseRiskTable data={data} />);

      expect(screen.getByText("Sin alerta")).toBeInTheDocument();
    });

    it("reports no alert when sit_codes is missing entirely", () => {
      const data = { e1: record({}, [{ period_start: "2023-06-15", period_end: "2024-06-15" }]) };
      render(<EnterpriseRiskTable data={data} />);

      expect(screen.getByText("Sin alerta")).toBeInTheDocument();
    });
  });

  describe("code cells", () => {
    it("renders the input codes", () => {
      render(<EnterpriseRiskTable data={{ e1: record() }} />);
      expect(screen.getByText("111")).toBeInTheDocument();
    });

    it("shows a placeholder for the empty output group", () => {
      render(<EnterpriseRiskTable data={{ e1: record() }} />);
      expect(screen.getByText("Sin códigos")).toBeInTheDocument();
    });

    it("expands the cells when printing", () => {
      const many = Object.fromEntries(
        Array.from({ length: 4 }, (_, i) => [`f${i}`, [{ source: "SIT", ext_code: `c-${i}` }]])
      );
      const data = {
        e1: record({}, [
          { period_start: "2023-06-15", period_end: "2024-06-15", sit_codes: { input: many } },
        ]),
      };

      render(<EnterpriseRiskTable data={data} isPrinting />);

      expect(screen.getByText("c-3")).toBeInTheDocument();
    });
  });

  it("forwards extra props to the underlying table", () => {
    render(<EnterpriseRiskTable data={{ e1: record() }} tableId="tabla-empresas" />);
    expect(screen.getByRole("table")).toHaveAttribute("id", "tabla-empresas");
  });
});
