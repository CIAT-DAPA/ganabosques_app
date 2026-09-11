jest.mock("react-apexcharts", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: function ChartStub(props) {
      return React.createElement("div", {
        "data-testid": "apex-chart",
        "data-categories": JSON.stringify(props?.options?.xaxis?.categories ?? []),
        "data-series": JSON.stringify(props?.series ?? []),
        "data-legend": String(props?.options?.legend?.show ?? ""),
      });
    },
  };
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EnterpriseChart from "../EnterpriseChart";

const provider = (overrides = {}) => ({
  _id: "p1",
  ext_id: [{ source: "SIT_CODE", ext_code: "111" }],
  risk: { risk_direct: false, risk_input: false, risk_output: false },
  ...overrides,
});

const enterprise = (overrides = {}) => ({
  _id: "e1",
  name: "Planta Norte",
  type_enterprise: "SLAUGHTERHOUSE",
  adm1: { name: "Caquetá" },
  adm2: { name: "Florencia" },
  providers: { inputs: [provider()], outputs: [] },
  ...overrides,
});

const charts = () => screen.queryAllByTestId("apex-chart");
const seriesOf = (el) => JSON.parse(el.getAttribute("data-series"));
const categoriesOf = (el) => JSON.parse(el.getAttribute("data-categories"));
const fieldValue = (label) => screen.getByText(label).parentElement.querySelector(".font-medium");

const openTab = async (user, name) => {
  await user.click(screen.getByRole("button", { name }));
};

describe("EnterpriseChart", () => {
  describe("empty input", () => {
    it("renders nothing with no props", () => {
      const { container } = render(<EnterpriseChart />);
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing for an empty list", () => {
      const { container } = render(<EnterpriseChart enterpriseDetails={[]} />);
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when the list is null", () => {
      const { container } = render(<EnterpriseChart enterpriseDetails={null} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("enterprise header", () => {
    it("renders name, type and location", () => {
      render(<EnterpriseChart enterpriseDetails={[enterprise()]} />);

      expect(fieldValue("Empresa")).toHaveTextContent("Planta Norte");
      expect(fieldValue("Tipo de empresa")).toHaveTextContent("Planta de beneficio");
      expect(fieldValue("Departamento")).toHaveTextContent("Caquetá");
      expect(fieldValue("Municipio")).toHaveTextContent("Florencia");
    });

    it("falls back to a dash for each missing field", () => {
      render(
        <EnterpriseChart
          enterpriseDetails={[enterprise({ name: null, adm1: null, adm2: null })]}
        />
      );

      expect(fieldValue("Empresa")).toHaveTextContent("—");
      expect(fieldValue("Departamento")).toHaveTextContent("—");
      expect(fieldValue("Municipio")).toHaveTextContent("—");
    });

    it("reads the type from the legacy type field", () => {
      render(
        <EnterpriseChart
          enterpriseDetails={[
            enterprise({ type_enterprise: null, type: "COLLECTION_CENTER" }),
          ]}
        />
      );

      expect(fieldValue("Tipo de empresa")).toHaveTextContent("Centro de acopio");
    });

    it("renders one card per enterprise", () => {
      render(
        <EnterpriseChart
          enterpriseDetails={[enterprise(), enterprise({ _id: "e2", name: "Acopio Sur" })]}
        />
      );

      expect(screen.getAllByText("Empresa")).toHaveLength(2);
    });

    it("falls back to the id field when there is no _id", () => {
      render(<EnterpriseChart enterpriseDetails={[enterprise({ _id: undefined, id: "alt" })]} />);
      expect(fieldValue("Empresa")).toHaveTextContent("Planta Norte");
    });
  });

  describe("period label", () => {
    it("shows a dash when no range is given", () => {
      render(<EnterpriseChart enterpriseDetails={[enterprise()]} />);
      expect(fieldValue("Período")).toHaveTextContent("—");
    });

    it("joins the two ends of an annual range", () => {
      render(
        <EnterpriseChart enterpriseDetails={[enterprise()]} yearStart="2023" yearEnd="2024" />
      );

      expect(fieldValue("Período")).toHaveTextContent("2023 - 2024");
    });

    it("collapses a single-year range", () => {
      render(
        <EnterpriseChart enterpriseDetails={[enterprise()]} yearStart="2023" yearEnd="2023" />
      );

      expect(fieldValue("Período")).toHaveTextContent("2023");
    });

    it("uses whichever end is present", () => {
      render(<EnterpriseChart enterpriseDetails={[enterprise()]} yearEnd="2024" />);
      expect(fieldValue("Período")).toHaveTextContent("2024");
    });

    it("formats a quarterly range for atd", () => {
      render(
        <EnterpriseChart
          enterpriseDetails={[enterprise()]}
          yearStart="2023-01-01"
          yearEnd="2023-07-01"
          risk="atd"
        />
      );

      expect(fieldValue("Período")).toHaveTextContent("202301 - 202303");
    });

    it("collapses a quarterly range that starts and ends in the same quarter", () => {
      render(
        <EnterpriseChart
          enterpriseDetails={[enterprise()]}
          yearStart="2023-07-01"
          yearEnd="2023-09-30"
          risk="nad"
        />
      );

      expect(fieldValue("Período")).toHaveTextContent("202303");
    });

    it("keeps an unparseable quarterly value as-is", () => {
      render(
        <EnterpriseChart
          enterpriseDetails={[enterprise()]}
          yearStart="no-date"
          yearEnd="no-date"
          risk="atd"
        />
      );

      expect(fieldValue("Período")).toHaveTextContent("no-date");
    });

    it("shows a dash for a quarterly range with no values", () => {
      render(<EnterpriseChart enterpriseDetails={[enterprise()]} risk="atd" />);
      expect(fieldValue("Período")).toHaveTextContent("—");
    });
  });

  describe("aggregate alert badges", () => {
    it("reports no alert when no provider carries one", () => {
      render(<EnterpriseChart enterpriseDetails={[enterprise()]} />);
      expect(screen.getAllByText("Sin Alerta")).toHaveLength(2);
    });

    it("flags the inbound badge when an input provider has a direct alert", () => {
      const ent = enterprise({
        providers: {
          inputs: [provider({ risk: { risk_direct: true } })],
          outputs: [],
        },
      });
      render(<EnterpriseChart enterpriseDetails={[ent]} />);

      expect(screen.getByText("Con Alerta")).toBeInTheDocument();
    });

    it("flags the outbound badge from an output provider input alert", () => {
      const ent = enterprise({
        providers: {
          inputs: [],
          outputs: [provider({ risk: { risk_input: true } })],
        },
      });
      render(<EnterpriseChart enterpriseDetails={[ent]} />);

      expect(screen.getByText("Con Alerta")).toBeInTheDocument();
    });

    it("flags an alert from the output risk flag", () => {
      const ent = enterprise({
        providers: { inputs: [provider({ risk: { risk_output: true } })], outputs: [] },
      });
      render(<EnterpriseChart enterpriseDetails={[ent]} />);

      expect(screen.getByText("Con Alerta")).toBeInTheDocument();
    });

    it("treats a missing providers object as no alerts", () => {
      render(<EnterpriseChart enterpriseDetails={[enterprise({ providers: undefined })]} />);
      expect(screen.getAllByText("Sin Alerta")).toHaveLength(2);
    });
  });

  describe("the alerts tab", () => {
    it("opens by default with both provider tables", () => {
      render(<EnterpriseChart enterpriseDetails={[enterprise()]} />);

      expect(screen.getByText("Predios con alerta de entrada")).toBeInTheDocument();
      expect(screen.getByText("Predios con alerta de salida")).toBeInTheDocument();
    });

    it("renders the provider external code with its label", () => {
      render(<EnterpriseChart enterpriseDetails={[enterprise()]} />);

      expect(screen.getByText("SIT_CODE:")).toBeInTheDocument();
      expect(screen.getByText(/111/)).toBeInTheDocument();
    });

    it("falls back to the first available code when SIT_CODE is absent", () => {
      const ent = enterprise({
        providers: {
          inputs: [provider({ ext_id: [{ source: "ICA", ext_code: "999" }] })],
          outputs: [],
        },
      });
      render(<EnterpriseChart enterpriseDetails={[ent]} />);

      expect(screen.getByText("ICA:")).toBeInTheDocument();
    });

    it("labels a code with no source as ID", () => {
      const ent = enterprise({
        providers: { inputs: [provider({ ext_id: [{ ext_code: "777" }] })], outputs: [] },
      });
      render(<EnterpriseChart enterpriseDetails={[ent]} />);

      expect(screen.getByText("ID:")).toBeInTheDocument();
    });

    it("reads the code from the extId spelling too", () => {
      const ent = enterprise({
        providers: {
          inputs: [
            { _id: "p9", extId: [{ source: "SIT_CODE", ext_code: "555" }], risk: {} },
          ],
          outputs: [],
        },
      });
      render(<EnterpriseChart enterpriseDetails={[ent]} />);

      expect(screen.getByText(/555/)).toBeInTheDocument();
    });

    it("renders the producer id alongside the farm code", () => {
      const ent = enterprise({
        providers: {
          inputs: [
            provider({
              ext_id: [
                { source: "SIT_CODE", ext_code: "111" },
                { source: "PRODUCER_ID", ext_code: "PR-9" },
              ],
            }),
          ],
          outputs: [],
        },
      });
      render(<EnterpriseChart enterpriseDetails={[ent]} />);

      expect(screen.getByText("PRODUCER_ID:")).toBeInTheDocument();
      expect(screen.getByText(/PR-9/)).toBeInTheDocument();
    });

    it("renders an alert chip per alert kind", () => {
      render(<EnterpriseChart enterpriseDetails={[enterprise()]} />);

      expect(screen.getByTitle("Alerta Directa")).toBeInTheDocument();
      expect(screen.getByTitle("Alerta de Entrada")).toBeInTheDocument();
      expect(screen.getByTitle("Alerta de Salida")).toBeInTheDocument();
    });

    it("renders the deforested area of the provider", () => {
      const ent = enterprise({
        providers: {
          inputs: [provider({ risk: { deforestation: { ha: 12.345 } } })],
          outputs: [],
        },
      });
      render(<EnterpriseChart enterpriseDetails={[ent]} />);

      expect(screen.getByText("12,3 ha")).toBeInTheDocument();
    });

    it("shows an empty-row message when a table has no providers", () => {
      render(<EnterpriseChart enterpriseDetails={[enterprise()]} />);
      expect(screen.getByText("No hay predios para mostrar.")).toBeInTheDocument();
    });

    it("shows the message in both tables when there are no providers at all", () => {
      const ent = enterprise({ providers: { inputs: [], outputs: [] } });
      render(<EnterpriseChart enterpriseDetails={[ent]} />);

      expect(screen.getAllByText("No hay predios para mostrar.")).toHaveLength(2);
    });

    it("renders no code block when the provider has no identifiers", () => {
      const ent = enterprise({
        providers: { inputs: [provider({ ext_id: [] })], outputs: [] },
      });
      render(<EnterpriseChart enterpriseDetails={[ent]} />);

      expect(screen.queryByText("SIT_CODE:")).not.toBeInTheDocument();
    });
  });

  describe("the movements tab", () => {
    const withStats = (stats) => (
      <EnterpriseChart enterpriseDetails={[enterprise()]} movementStats={stats} />
    );

    it("reports missing data when the enterprise has no stats", async () => {
      const user = userEvent.setup();
      render(withStats({}));

      await openTab(user, /Movilizaciones/);

      expect(screen.getByText("No hay datos de movilizaciones disponibles")).toBeInTheDocument();
    });

    it("renders the movement summary tiles", async () => {
      const user = userEvent.setup();
      render(
        withStats({
          e1: {
            summary: {
              total_movements: 9,
              inputs: { count: 4, percentage: 44.4 },
              outputs: { count: 5, percentage: 55.6 },
            },
          },
        })
      );

      await openTab(user, /Movilizaciones/);

      expect(screen.getByText("Resumen de Movilizaciones")).toBeInTheDocument();
      expect(screen.getByText("9")).toBeInTheDocument();
      expect(screen.getByText("Entradas (44.40%)")).toBeInTheDocument();
      expect(screen.getByText("Salidas (55.60%)")).toBeInTheDocument();
    });

    it("defaults the tiles to zero when the summary is missing", async () => {
      const user = userEvent.setup();
      render(withStats({ e1: {} }));

      await openTab(user, /Movilizaciones/);

      expect(screen.getByText("Entradas (0.00%)")).toBeInTheDocument();
    });

    it("lists the inbound origin types", async () => {
      const user = userEvent.setup();
      render(
        withStats({
          e1: {
            summary: {
              inputs: {
                count: 4,
                by_destination_type: { FARM: { count: 3, percentage_of_total: 33.3 } },
              },
            },
          },
        })
      );

      await openTab(user, /Movilizaciones/);

      expect(screen.getByText("Entradas por tipo de origen:")).toBeInTheDocument();
      expect(screen.getByText(/Finca/)).toBeInTheDocument();
      expect(screen.getByText(/33,30%|33.30%/)).toBeInTheDocument();
    });

    it("lists the outbound destination types", async () => {
      const user = userEvent.setup();
      render(
        withStats({
          e1: {
            summary: {
              outputs: {
                count: 2,
                by_destination_type: { SLAUGHTERHOUSE: { count: 2, percentage_of_total: 100 } },
              },
            },
          },
        })
      );

      await openTab(user, /Movilizaciones/);

      expect(screen.getByText("Salidas por tipo de destino:")).toBeInTheDocument();
    });

    it("aggregates the nested species object into a chart", async () => {
      const user = userEvent.setup();
      render(
        withStats({
          e1: {
            summary: {},
            inputs: { statistics: { species: { bovino: { Vacas: { headcount: 10 } } } } },
          },
        })
      );

      await openTab(user, /Movilizaciones/);

      expect(categoriesOf(charts()[0])).toEqual(["Vacas"]);
      expect(seriesOf(charts()[0])[0]).toEqual({ name: "Entradas", data: [10] });
    });

    it("accepts a flat object of group totals", async () => {
      const user = userEvent.setup();
      render(
        withStats({
          e1: { summary: {}, inputs: { statistics: { species: { bovino: 15 } } } },
        })
      );

      await openTab(user, /Movilizaciones/);

      expect(seriesOf(charts()[0])[0].data).toEqual([15]);
    });

    // Unlike MovementChart, this aggregator only understands objects.
    it("ignores a species array", async () => {
      const user = userEvent.setup();
      render(
        withStats({
          e1: {
            summary: {},
            inputs: { statistics: { species: [{ subcategory: "Vacas", headcount: 3 }] } },
          },
        })
      );

      await openTab(user, /Movilizaciones/);

      expect(screen.getByText("No hay datos de entradas")).toBeInTheDocument();
    });

    it("shows a placeholder for each flow without data", async () => {
      const user = userEvent.setup();
      render(withStats({ e1: { summary: {} } }));

      await openTab(user, /Movilizaciones/);

      expect(screen.getByText("No hay datos de entradas")).toBeInTheDocument();
      expect(screen.getByText("No hay datos de salidas")).toBeInTheDocument();
    });

    it("toggles the inbound legend independently", async () => {
      const user = userEvent.setup();
      render(
        withStats({
          e1: {
            summary: {},
            inputs: { statistics: { species: { bovino: { Vacas: { headcount: 10 } } } } },
            outputs: { statistics: { species: { bovino: { Toros: { headcount: 4 } } } } },
          },
        })
      );

      await openTab(user, /Movilizaciones/);
      await user.click(screen.getAllByText("Mostrar leyenda")[0]);

      expect(charts()[0].getAttribute("data-legend")).toBe("true");
      expect(charts()[1].getAttribute("data-legend")).toBe("false");
    });

    it("hides the legend again on a second click", async () => {
      const user = userEvent.setup();
      render(
        withStats({
          e1: {
            summary: {},
            inputs: { statistics: { species: { bovino: { Vacas: { headcount: 10 } } } } },
          },
        })
      );

      await openTab(user, /Movilizaciones/);
      await user.click(screen.getByText("Mostrar leyenda"));
      await user.click(screen.getByText("Ocultar leyenda"));

      expect(charts()[0].getAttribute("data-legend")).toBe("false");
    });
  });

  describe("the suppliers tab", () => {
    const withSuppliers = (data) => (
      <EnterpriseChart enterpriseDetails={[enterprise()]} supplierData={data} />
    );

    it("reports missing data when there is no entry for the enterprise", async () => {
      const user = userEvent.setup();
      render(withSuppliers({}));

      await openTab(user, /Proveedores/);

      expect(screen.getByText("No hay datos de proveedores disponibles")).toBeInTheDocument();
    });

    // An empty array is still an entry, so the request reaches the table and
    // the table's own empty message is what shows.
    it("shows the table empty message for an empty supplier list", async () => {
      const user = userEvent.setup();
      render(withSuppliers({ e1: [] }));

      await openTab(user, /Proveedores/);

      expect(screen.getByText("No hay predios proveedores registrados.")).toBeInTheDocument();
    });

    it("renders a row per supplier farm", async () => {
      const user = userEvent.setup();
      render(
        withSuppliers({
          e1: [
            { farm_id: "f1", ext_id: [{ source: "SIT_CODE", ext_code: "111" }], years: [2023] },
          ],
        })
      );

      await openTab(user, /Proveedores/);

      expect(screen.getByText("Códigos de predio")).toBeInTheDocument();
      expect(screen.getByText("Años como proveedor")).toBeInTheDocument();
      expect(screen.getByText("2023")).toBeInTheDocument();
    });

    it("merges the years of repeated records for one farm", async () => {
      const user = userEvent.setup();
      render(
        withSuppliers({
          e1: [
            { farm_id: "f1", ext_id: [{ source: "SIT_CODE", ext_code: "111" }], years: [2024] },
            { farm_id: "f1", ext_id: [{ source: "SIT_CODE", ext_code: "111" }], years: [2022] },
            { farm_id: "f1", years: [2024] },
          ],
        })
      );

      await openTab(user, /Proveedores/);

      expect(screen.getByText("2022, 2024")).toBeInTheDocument();
      expect(screen.getAllByRole("row")).toHaveLength(2);
    });

    it("falls back to the id field when farm_id is missing", async () => {
      const user = userEvent.setup();
      render(withSuppliers({ e1: [{ id: "alt", ext_id: [], years: [2023] }] }));

      await openTab(user, /Proveedores/);

      expect(screen.getByText("Sin código")).toBeInTheDocument();
    });

    it("reports a supplier with no registered years", async () => {
      const user = userEvent.setup();
      render(
        withSuppliers({
          e1: [{ farm_id: "f1", ext_id: [{ source: "SIT_CODE", ext_code: "111" }] }],
        })
      );

      await openTab(user, /Proveedores/);

      expect(screen.getByText("Sin años registrados")).toBeInTheDocument();
    });

    it("renders several codes for the same supplier", async () => {
      const user = userEvent.setup();
      render(
        withSuppliers({
          e1: [
            {
              farm_id: "f1",
              ext_id: [
                { source: "SIT_CODE", ext_code: "111" },
                { label: "ICA", ext_code: "222" },
              ],
              years: [2023],
            },
          ],
        })
      );

      await openTab(user, /Proveedores/);

      expect(screen.getByText("SIT_CODE:")).toBeInTheDocument();
      expect(screen.getByText("ICA:")).toBeInTheDocument();
    });
  });

  describe("tab navigation", () => {
    it("switches away from and back to the alerts tab", async () => {
      const user = userEvent.setup();
      render(<EnterpriseChart enterpriseDetails={[enterprise()]} />);

      await openTab(user, /Movilizaciones/);
      expect(screen.queryByText("Predios con alerta de entrada")).not.toBeInTheDocument();

      await openTab(user, /Alertas/);
      expect(screen.getByText("Predios con alerta de entrada")).toBeInTheDocument();
    });

    it("keeps the tab state independent per enterprise", async () => {
      const user = userEvent.setup();
      render(
        <EnterpriseChart
          enterpriseDetails={[enterprise(), enterprise({ _id: "e2", name: "Acopio Sur" })]}
        />
      );

      await user.click(screen.getAllByRole("button", { name: /Movilizaciones/ })[0]);

      expect(screen.getAllByText("Predios con alerta de entrada")).toHaveLength(1);
    });
  });
});
