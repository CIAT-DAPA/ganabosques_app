// react-apexcharts needs real SVG, so it is replaced by a stub that exposes
// the categories and series it received.
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
import MovementCharts from "../MovementChart";

const speciesArray = [
  { subcategory: "Vacas", headcount: 12 },
  { subcategory: "Toros", headcount: 5 },
];

const farmData = (overrides = {}) => ({
  summary: { total_movements: 9 },
  inputs: { statistics: { species: speciesArray } },
  outputs: { statistics: { species: speciesArray } },
  ...overrides,
});

const charts = () => screen.queryAllByTestId("apex-chart");
const seriesOf = (el) => JSON.parse(el.getAttribute("data-series"));
const categoriesOf = (el) => JSON.parse(el.getAttribute("data-categories"));

const baseProps = (overrides = {}) => ({
  foundFarms: [{ id: "f1", code: "111" }],
  summary: { f1: farmData() },
  riskFarm: {},
  farmPolygons: [],
  ...overrides,
});

describe("MovementCharts", () => {
  describe("which farms render", () => {
    it("renders nothing with no props", () => {
      const { container } = render(<MovementCharts />);
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when no farms were found", () => {
      const { container } = render(<MovementCharts foundFarms={[]} summary={{}} />);
      expect(container).toBeEmptyDOMElement();
    });

    it("skips a farm that has no summary entry", () => {
      const { container } = render(
        <MovementCharts foundFarms={[{ id: "f1" }]} summary={{}} />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("renders a card for a farm with data", () => {
      render(<MovementCharts {...baseProps()} />);
      expect(screen.getByText("Predio")).toBeInTheDocument();
    });

    it("renders one card per farm with data", () => {
      render(
        <MovementCharts
          {...baseProps({
            foundFarms: [{ id: "f1" }, { id: "f2" }, { id: "f3" }],
            summary: { f1: farmData(), f2: farmData() },
          })}
        />
      );

      expect(screen.getAllByText("Predio")).toHaveLength(2);
    });
  });

  describe("the two charts", () => {
    it("renders an inbound and an outbound chart", () => {
      render(<MovementCharts {...baseProps()} />);

      expect(screen.getByText("Movilización de entrada")).toBeInTheDocument();
      expect(screen.getByText("Movilización de salida")).toBeInTheDocument();
      expect(charts()).toHaveLength(2);
    });

    it("aggregates an array of species into categories and values", () => {
      render(<MovementCharts {...baseProps()} />);

      expect(categoriesOf(charts()[0])).toEqual(["Vacas", "Toros"]);
      expect(seriesOf(charts()[0])[0]).toEqual({ name: "Entradas", data: [12, 5] });
    });

    it("names the outbound series accordingly", () => {
      render(<MovementCharts {...baseProps()} />);
      expect(seriesOf(charts()[1])[0].name).toBe("Salidas");
    });

    it("sums repeated labels instead of overwriting them", () => {
      const props = baseProps({
        summary: {
          f1: farmData({
            inputs: {
              statistics: {
                species: [
                  { subcategory: "Vacas", headcount: 4 },
                  { subcategory: "Vacas", headcount: 6 },
                ],
              },
            },
          }),
        },
      });
      render(<MovementCharts {...props} />);

      expect(seriesOf(charts()[0])[0].data).toEqual([10]);
    });

    it("falls back through the alternative label fields", () => {
      const props = baseProps({
        summary: {
          f1: farmData({
            inputs: {
              statistics: {
                species: [
                  { name: "PorName", headcount: 1 },
                  { species_name: "PorSpecies", headcount: 2 },
                  { category: "PorCategory", headcount: 3 },
                  { headcount: 4 },
                ],
              },
            },
          }),
        },
      });
      render(<MovementCharts {...props} />);

      expect(categoriesOf(charts()[0])).toEqual([
        "PorName",
        "PorSpecies",
        "PorCategory",
        "N/A",
      ]);
    });

    it("falls back through the alternative value fields", () => {
      const props = baseProps({
        summary: {
          f1: farmData({
            inputs: {
              statistics: {
                species: [
                  { subcategory: "A", amount: 7 },
                  { subcategory: "B", total: 8 },
                  { subcategory: "C" },
                ],
              },
            },
          }),
        },
      });
      render(<MovementCharts {...props} />);

      expect(seriesOf(charts()[0])[0].data).toEqual([7, 8, 0]);
    });

    it("skips null entries in the species array", () => {
      const props = baseProps({
        summary: {
          f1: farmData({
            inputs: {
              statistics: { species: [null, { subcategory: "Vacas", headcount: 3 }] },
            },
          }),
        },
      });
      render(<MovementCharts {...props} />);

      expect(categoriesOf(charts()[0])).toEqual(["Vacas"]);
    });

    it("accepts a nested object of groups and subcategories", () => {
      const props = baseProps({
        summary: {
          f1: farmData({
            inputs: {
              statistics: {
                species: {
                  bovino: {
                    Vacas: { headcount: 10 },
                    Toros: { amount: 4 },
                  },
                },
              },
            },
          }),
        },
      });
      render(<MovementCharts {...props} />);

      expect(categoriesOf(charts()[0])).toEqual(["Vacas", "Toros"]);
      expect(seriesOf(charts()[0])[0].data).toEqual([10, 4]);
    });

    it("accepts a flat object of group totals", () => {
      const props = baseProps({
        summary: {
          f1: farmData({
            inputs: { statistics: { species: { bovino: 15, porcino: 3 } } },
          }),
        },
      });
      render(<MovementCharts {...props} />);

      expect(categoriesOf(charts()[0])).toEqual(["bovino", "porcino"]);
      expect(seriesOf(charts()[0])[0].data).toEqual([15, 3]);
    });

    it("ignores non-object subgroups in a nested object", () => {
      const props = baseProps({
        summary: {
          f1: farmData({
            inputs: {
              statistics: {
                species: { bovino: { Vacas: { headcount: 2 }, Malo: "texto" }, roto: null },
              },
            },
          }),
        },
      });
      render(<MovementCharts {...props} />);

      expect(categoriesOf(charts()[0])).toEqual(["Vacas"]);
    });

    it("treats a non-finite value as zero", () => {
      const props = baseProps({
        summary: {
          f1: farmData({
            inputs: {
              statistics: {
                species: [
                  { subcategory: "Vacas", headcount: "muchas" },
                  { subcategory: "Toros", headcount: 5 },
                ],
              },
            },
          }),
        },
      });
      render(<MovementCharts {...props} />);

      expect(seriesOf(charts()[0])[0].data).toEqual([0, 5]);
    });
  });

  describe("empty chart placeholders", () => {
    it("shows a placeholder when every value is zero", () => {
      const props = baseProps({
        summary: {
          f1: farmData({
            inputs: { statistics: { species: [{ subcategory: "Vacas", headcount: 0 }] } },
            outputs: { statistics: { species: [{ subcategory: "Vacas", headcount: 0 }] } },
          }),
        },
      });
      render(<MovementCharts {...props} />);

      expect(screen.getByText("No hay datos de movilización de entrada")).toBeInTheDocument();
      expect(screen.getByText("No hay datos de movilización de salida")).toBeInTheDocument();
      expect(charts()).toHaveLength(0);
    });

    it("shows a placeholder when there are no species statistics", () => {
      const props = baseProps({
        summary: { f1: farmData({ inputs: { statistics: {} }, outputs: { statistics: {} } }) },
      });
      render(<MovementCharts {...props} />);

      expect(screen.getByText("No hay datos de movilización de entrada")).toBeInTheDocument();
    });

    it("shows a placeholder when the flow sections are missing entirely", () => {
      const props = baseProps({
        summary: { f1: { summary: {} } },
      });
      render(<MovementCharts {...props} />);

      expect(screen.getByText("No hay datos de movilización de entrada")).toBeInTheDocument();
      expect(screen.getByText("No hay datos de movilización de salida")).toBeInTheDocument();
    });
  });

  describe("the legend toggle", () => {
    it("starts hidden", () => {
      render(<MovementCharts {...baseProps()} />);
      expect(charts()[0].getAttribute("data-legend")).toBe("false");
    });

    it("offers a show action per chart", () => {
      render(<MovementCharts {...baseProps()} />);
      expect(screen.getAllByText("Mostrar leyendas")).toHaveLength(2);
    });

    it("shows the inbound legend without touching the outbound one", async () => {
      const user = userEvent.setup();
      render(<MovementCharts {...baseProps()} />);

      await user.click(screen.getAllByText("Mostrar leyendas")[0]);

      expect(charts()[0].getAttribute("data-legend")).toBe("true");
      expect(charts()[1].getAttribute("data-legend")).toBe("false");
      expect(screen.getByText("Ocultar leyendas")).toBeInTheDocument();
    });

    it("shows the outbound legend independently", async () => {
      const user = userEvent.setup();
      render(<MovementCharts {...baseProps()} />);

      await user.click(screen.getAllByText("Mostrar leyendas")[1]);

      expect(charts()[0].getAttribute("data-legend")).toBe("false");
      expect(charts()[1].getAttribute("data-legend")).toBe("true");
    });

    it("hides it again on a second click", async () => {
      const user = userEvent.setup();
      render(<MovementCharts {...baseProps()} />);

      await user.click(screen.getAllByText("Mostrar leyendas")[0]);
      await user.click(screen.getByText("Ocultar leyendas"));

      expect(charts()[0].getAttribute("data-legend")).toBe("false");
    });

    it("keeps the toggles independent between farms", async () => {
      const user = userEvent.setup();
      render(
        <MovementCharts
          {...baseProps({
            foundFarms: [{ id: "f1" }, { id: "f2" }],
            summary: { f1: farmData(), f2: farmData() },
          })}
        />
      );

      await user.click(screen.getAllByText("Mostrar leyendas")[0]);

      const legends = charts().map((c) => c.getAttribute("data-legend"));
      expect(legends).toEqual(["true", "false", "false", "false"]);
    });
  });

  describe("external codes", () => {
    it("renders the codes carried by the farm", () => {
      const props = baseProps({
        foundFarms: [{ id: "f1", ext_id: [{ source: "SIT", ext_code: "111" }] }],
      });
      render(<MovementCharts {...props} />);

      expect(screen.getByText("SIT:")).toBeInTheDocument();
      expect(screen.getByText("111")).toBeInTheDocument();
    });

    it("falls back to the codes on the risk record", () => {
      const props = baseProps({
        foundFarms: [{ id: "f1" }],
        riskFarm: { g1: [{ farm_id: "f1", ext_id: [{ label: "ICA", ext_code: "222" }] }] },
      });
      render(<MovementCharts {...props} />);

      expect(screen.getByText("ICA:")).toBeInTheDocument();
      expect(screen.getByText("222")).toBeInTheDocument();
    });

    it("renders no code block when neither source has codes", () => {
      render(<MovementCharts {...baseProps()} />);
      expect(screen.queryByText("SIT:")).not.toBeInTheDocument();
    });
  });

  describe("alert levels", () => {
    it("reports every alert kind as clear without risk data", () => {
      render(<MovementCharts {...baseProps()} />);

      expect(screen.getByText("Directa:")).toBeInTheDocument();
      expect(screen.getByText("Indirecta de entrada:")).toBeInTheDocument();
      expect(screen.getByText("Indirecta de salida:")).toBeInTheDocument();
    });

    it("reflects the risk flags of the matching farm", () => {
      const props = baseProps({
        riskFarm: {
          g1: [{ farm_id: "f1", risk_direct: true, risk_input: false, risk_output: true }],
        },
      });
      render(<MovementCharts {...props} />);

      expect(screen.getByText("Alertas")).toBeInTheDocument();
    });

    it("shows the verification chip", () => {
      const props = baseProps({
        riskFarm: { g1: [{ farm_id: "f1", verification: { status: true } }] },
      });
      render(<MovementCharts {...props} />);

      expect(screen.getByText("Verificado")).toBeInTheDocument();
    });

    it("shows the unverified chip when there is no verification", () => {
      render(<MovementCharts {...baseProps()} />);
      expect(screen.getByText("No verificado")).toBeInTheDocument();
    });
  });

  // Each chart section carries its own flow summary. Note that the module also
  // defines a MovementSummarySection component that is never rendered, so the
  // "Resumen de Movilizaciones" heading it contains never reaches the DOM.
  describe("per-flow summary", () => {
    const withSummary = (summaryOverrides) =>
      baseProps({
        summary: {
          f1: farmData({ summary: { total_movements: 9, ...summaryOverrides } }),
        },
      });

    it("renders no summary block when the flow has none", () => {
      render(<MovementCharts {...baseProps()} />);
      expect(screen.queryByText("Resumen de movilización")).not.toBeInTheDocument();
    });

    it("renders a summary block per flow that has one", () => {
      render(
        <MovementCharts
          {...withSummary({
            inputs: { count: 4, percentage: 44.4 },
            outputs: { count: 5, percentage: 55.6 },
          })}
        />
      );

      expect(screen.getAllByText("Resumen de movilización")).toHaveLength(2);
    });

    it("reports the count and the share of the total", () => {
      render(<MovementCharts {...withSummary({ inputs: { count: 4, percentage: 44.4 } })} />);

      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("44.40%")).toBeInTheDocument();
    });

    it("defaults a missing count to zero", () => {
      render(<MovementCharts {...withSummary({ inputs: { percentage: 0 } })} />);
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("renders a dash when the percentage is absent", () => {
      render(<MovementCharts {...withSummary({ inputs: { count: 4 } })} />);
      expect(screen.getByText("—%")).toBeInTheDocument();
    });

    it("translates and lists the destination types", () => {
      render(
        <MovementCharts
          {...withSummary({
            inputs: {
              count: 4,
              percentage: 44.4,
              by_destination_type: { FARM: { count: 3, percentage_of_total: 33.3 } },
            },
          })}
        />
      );

      expect(screen.getByText("Finca:")).toBeInTheDocument();
      expect(screen.getByText("3 (33.30%)")).toBeInTheDocument();
    });

    it("omits the type breakdown when the flow has none", () => {
      render(<MovementCharts {...withSummary({ inputs: { count: 4, percentage: 44.4 } })} />);
      expect(screen.queryByText("Tipos:")).not.toBeInTheDocument();
    });
  });

  describe("polygon information", () => {
    it("renders nothing when there is no matching polygon", () => {
      render(<MovementCharts {...baseProps()} />);
      expect(screen.queryByText("Información del polígono")).not.toBeInTheDocument();
    });

    it("renders nothing when the polygon carries no usable fields", () => {
      const props = baseProps({ farmPolygons: [{ farm_id: "f1" }] });
      render(<MovementCharts {...props} />);

      expect(screen.queryByText("Información del polígono")).not.toBeInTheDocument();
    });

    it("reports the farm area", () => {
      const props = baseProps({ farmPolygons: [{ farm_id: "f1", farm_ha: 123.456 }] });
      render(<MovementCharts {...props} />);

      expect(screen.getByText("Información del polígono")).toBeInTheDocument();
      expect(screen.getByText("123.46 ha")).toBeInTheDocument();
    });

    it("reports the buffer radius", () => {
      const props = baseProps({ farmPolygons: [{ farm_id: "f1", radio: 500 }] });
      render(<MovementCharts {...props} />);

      expect(screen.getByText("500 m")).toBeInTheDocument();
    });

    it("matches a polygon keyed by id instead of farm_id", () => {
      const props = baseProps({ farmPolygons: [{ id: "f1", farm_ha: 10 }] });
      render(<MovementCharts {...props} />);

      expect(screen.getByText("Información del polígono")).toBeInTheDocument();
    });

    it("hides the buffer inputs behind a toggle", async () => {
      const user = userEvent.setup();
      const props = baseProps({
        farmPolygons: [
          {
            farm_id: "f1",
            buffer_inputs: [
              { ugg: "terneros_menores_1_anio", amount: 4, species: "bovino" },
            ],
          },
        ],
      });
      render(<MovementCharts {...props} />);

      expect(screen.queryByText(/Terneros menores a un año/)).not.toBeInTheDocument();

      await user.click(screen.getByText("Mostrar información adicional"));

      expect(screen.getByText("Terneros menores a un año:")).toBeInTheDocument();
      expect(screen.getByText(/bovino/)).toBeInTheDocument();
    });

    it("humanises an unknown category code", async () => {
      const user = userEvent.setup();
      const props = baseProps({
        farmPolygons: [
          { farm_id: "f1", buffer_inputs: [{ ugg: "otra_categoria", amount: 1, species: "x" }] },
        ],
      });
      render(<MovementCharts {...props} />);

      await user.click(screen.getByText("Mostrar información adicional"));

      expect(screen.getByText("otra categoria:")).toBeInTheDocument();
    });

    it("renders an empty label when the category code is missing", async () => {
      const user = userEvent.setup();
      const props = baseProps({
        farmPolygons: [{ farm_id: "f1", buffer_inputs: [{ amount: 1, species: "x" }] }],
      });
      render(<MovementCharts {...props} />);

      await user.click(screen.getByText("Mostrar información adicional"));

      expect(screen.getByText(":")).toBeInTheDocument();
    });

    it("collapses the buffer inputs again", async () => {
      const user = userEvent.setup();
      const props = baseProps({
        farmPolygons: [
          { farm_id: "f1", buffer_inputs: [{ ugg: "machos_2_3_anios", amount: 2, species: "b" }] },
        ],
      });
      render(<MovementCharts {...props} />);

      await user.click(screen.getByText("Mostrar información adicional"));
      await user.click(screen.getByText("Ocultar información adicional"));

      expect(screen.queryByText("Machos de 2 a 3 años:")).not.toBeInTheDocument();
    });
  });
});
