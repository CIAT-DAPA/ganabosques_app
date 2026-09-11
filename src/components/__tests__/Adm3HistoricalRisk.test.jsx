// The chart arrives through next/dynamic, so dynamic() is replaced by a stub
// that exposes the chart type and series it was handed.
jest.mock("next/dynamic", () => () => {
  const React = require("react");
  return function ChartStub(props) {
    return React.createElement("div", {
      "data-testid": "apex-chart",
      "data-chart-type": props?.options?.chart?.type ?? "",
      "data-categories": JSON.stringify(props?.options?.xaxis?.categories ?? []),
      "data-series": JSON.stringify(props?.series ?? []),
    });
  };
});

import { render, screen } from "@testing-library/react";
import Adm3HistoricalRisk from "../Adm3HistoricalRisk";

// Mid-year dates on purpose: the component compares a year from toYear (which
// reads the leading four digits) against years from isoToYear (which parses the
// date), and those two disagree for January 1st periods. See the dedicated test
// in "selected period" below.
const item = (overrides = {}) => ({
  period_start: "2023-06-15",
  period_end: "2024-06-15",
  risk_total: true,
  def_ha: 45.67,
  farm_amount: 7,
  ...overrides,
});

const group = (overrides = {}) => ({
  adm3_id: "a1",
  department: "Guaviare",
  municipality: "San José",
  name: "El Retorno",
  items: [item()],
  ...overrides,
});

const charts = () => screen.getAllByTestId("apex-chart");
const seriesOf = (el) => JSON.parse(el.getAttribute("data-series"));
const categoriesOf = (el) => JSON.parse(el.getAttribute("data-categories"));
const fieldValue = (label) => screen.getByText(label).parentElement.querySelector(".font-medium");

describe("Adm3HistoricalRisk", () => {
  describe("empty input", () => {
    it("renders nothing for an empty history", () => {
      render(<Adm3HistoricalRisk adm3RiskHistory={[]} />);
      expect(screen.queryByTestId("apex-chart")).not.toBeInTheDocument();
    });

    it("renders nothing with no props", () => {
      render(<Adm3HistoricalRisk />);
      expect(screen.queryByTestId("apex-chart")).not.toBeInTheDocument();
    });

    it("renders nothing when the history is not an array", () => {
      render(<Adm3HistoricalRisk adm3RiskHistory={{ a1: {} }} />);
      expect(screen.queryByTestId("apex-chart")).not.toBeInTheDocument();
    });
  });

  describe("group heading", () => {
    it("uses the vereda name when present", () => {
      render(<Adm3HistoricalRisk adm3RiskHistory={[group()]} />);
      expect(screen.getByRole("heading", { name: "El Retorno" })).toBeInTheDocument();
    });

    it("derives a title from the municipality when the name is missing", () => {
      render(<Adm3HistoricalRisk adm3RiskHistory={[group({ name: null })]} />);
      expect(screen.getByRole("heading", { name: "Vereda de San José" })).toBeInTheDocument();
    });

    it("falls back to the adm3 id when nothing names the group", () => {
      render(
        <Adm3HistoricalRisk adm3RiskHistory={[group({ name: null, municipality: null })]} />
      );
      expect(screen.getByRole("heading", { name: "a1" })).toBeInTheDocument();
    });
  });

  describe("location fields", () => {
    it("renders department, municipality and vereda", () => {
      render(<Adm3HistoricalRisk adm3RiskHistory={[group()]} />);

      expect(fieldValue("Departamento")).toHaveTextContent("Guaviare");
      expect(fieldValue("Municipio")).toHaveTextContent("San José");
      expect(fieldValue("Vereda")).toHaveTextContent("El Retorno");
    });

    it("falls back to a dash for each missing field", () => {
      render(
        <Adm3HistoricalRisk
          adm3RiskHistory={[group({ department: null, municipality: null, name: null })]}
        />
      );

      expect(fieldValue("Departamento")).toHaveTextContent("—");
      expect(fieldValue("Municipio")).toHaveTextContent("—");
      expect(fieldValue("Vereda")).toHaveTextContent("—");
    });
  });

  describe("selected period", () => {
    it("shows a dash when no year filter is given", () => {
      render(<Adm3HistoricalRisk adm3RiskHistory={[group()]} />);
      expect(screen.getByText("Periodo seleccionado").parentElement).toHaveTextContent("—");
    });

    it("labels a matching annual period by its years", () => {
      render(
        <Adm3HistoricalRisk
          adm3RiskHistory={[group()]}
          yearStart="2023-06-15"
          yearEnd="2024-06-15"
          risk="annual"
        />
      );

      expect(screen.getByText(/2023 - 2024/)).toBeInTheDocument();
    });

    it("marks the period as alerted when the match carries risk", () => {
      render(
        <Adm3HistoricalRisk
          adm3RiskHistory={[group()]}
          yearStart="2023-06-15"
          yearEnd="2024-06-15"
          risk="annual"
        />
      );

      expect(screen.getByText("Con alerta")).toBeInTheDocument();
    });

    it("marks the period as clear when the match has no risk", () => {
      const data = [group({ items: [item({ risk_total: false })] })];
      render(
        <Adm3HistoricalRisk
          adm3RiskHistory={data}
          yearStart="2023-06-15"
          yearEnd="2024-06-15"
          risk="annual"
        />
      );

      expect(screen.getByText("Sin alerta")).toBeInTheDocument();
    });

    it("reports no alert when the filter matches nothing", () => {
      render(
        <Adm3HistoricalRisk
          adm3RiskHistory={[group()]}
          yearStart="2019-01-01"
          yearEnd="2020-01-01"
          risk="annual"
        />
      );

      expect(screen.getByText("Sin alerta")).toBeInTheDocument();
    });

    // Known defect, documented rather than asserted as desirable: the filter
    // year comes from toYear, which reads the leading four digits ("2023"),
    // while each row's year comes from isoToYear, which parses the date and
    // yields 2022 for "2023-01-01" west of Greenwich. Annual periods always
    // start on January 1st, so the panel never finds its match and falls back
    // to "Sin alerta" with zeroed metrics even though data exists.
    it("fails to match an annual period that starts on January 1st", () => {
      const data = [
        group({ items: [item({ period_start: "2023-01-01", period_end: "2024-01-01" })] }),
      ];

      render(
        <Adm3HistoricalRisk
          adm3RiskHistory={data}
          yearStart="2023-01-01"
          yearEnd="2024-01-01"
          risk="annual"
        />
      );

      expect(screen.getByText("Sin alerta")).toBeInTheDocument();
      expect(fieldValue("Área deforestada por predios")).toHaveTextContent("0 ha");
      expect(fieldValue("Predios con alertas")).toHaveTextContent("0 predios");
    });

    // Quarterly risks label the period as YYYY0Q and match on the exact start.
    it("labels a quarterly period as YYYY0Q", () => {
      const spy = jest.spyOn(console, "log").mockImplementation(() => {});
      const data = [
        group({ items: [item({ period_start: "2023-07-01", period_end: "2023-09-30" })] }),
      ];

      render(
        <Adm3HistoricalRisk
          adm3RiskHistory={data}
          yearStart="2023-07-01"
          yearEnd="2023-09-30"
          risk="atd"
        />
      );

      expect(screen.getByText(/202303/)).toBeInTheDocument();
      spy.mockRestore();
    });

    it("matches a quarterly period on the exact start date", () => {
      const spy = jest.spyOn(console, "log").mockImplementation(() => {});
      const data = [
        group({
          items: [
            item({ period_start: "2023-01-01", period_end: "2023-03-31", risk_total: false }),
            item({ period_start: "2023-07-01", period_end: "2023-09-30", risk_total: true }),
          ],
        }),
      ];

      render(
        <Adm3HistoricalRisk
          adm3RiskHistory={data}
          yearStart="2023-07-01"
          yearEnd="2023-09-30"
          risk="nad"
        />
      );

      expect(screen.getByText("Con alerta")).toBeInTheDocument();
      spy.mockRestore();
    });
  });

  describe("metric fields", () => {
    const filtered = (data) => (
      <Adm3HistoricalRisk
        adm3RiskHistory={data}
        yearStart="2023-06-15"
        yearEnd="2024-06-15"
        risk="annual"
      />
    );

    it("formats the deforested area to one decimal", () => {
      render(filtered([group()]));
      expect(fieldValue("Área deforestada por predios")).toHaveTextContent("45,7 ha");
    });

    it("shows zero hectares when the match has no area", () => {
      render(filtered([group({ items: [item({ def_ha: null })] })]));
      expect(fieldValue("Área deforestada por predios")).toHaveTextContent("0 ha");
    });

    it("shows zero hectares when nothing matched", () => {
      render(<Adm3HistoricalRisk adm3RiskHistory={[group()]} />);
      expect(fieldValue("Área deforestada por predios")).toHaveTextContent("0 ha");
    });

    it("reports the number of alerted farms", () => {
      render(filtered([group()]));
      expect(fieldValue("Predios con alertas")).toHaveTextContent("7 Predios");
    });

    it("shows zero farms when the match has none", () => {
      render(filtered([group({ items: [item({ farm_amount: null })] })]));
      expect(fieldValue("Predios con alertas")).toHaveTextContent("0 predios");
    });
  });

  describe("total farms in the vereda", () => {
    it("reads the total from the risk lookup", () => {
      render(
        <Adm3HistoricalRisk
          adm3RiskHistory={[group()]}
          adm3Risk={{ g1: [{ adm3_id: "a1", farm_total_amount: 120 }] }}
        />
      );

      expect(fieldValue("Total predios en vereda")).toHaveTextContent("120 Predios");
    });

    it("shows a dash when no lookup is given", () => {
      render(<Adm3HistoricalRisk adm3RiskHistory={[group()]} />);
      expect(fieldValue("Total predios en vereda")).toHaveTextContent("—");
    });

    it("shows a dash when the lookup has no entry for the group", () => {
      render(
        <Adm3HistoricalRisk
          adm3RiskHistory={[group()]}
          adm3Risk={{ g1: [{ adm3_id: "other", farm_total_amount: 5 }] }}
        />
      );

      expect(fieldValue("Total predios en vereda")).toHaveTextContent("—");
    });
  });

  describe("charts", () => {
    it("renders a bubble chart and two bar charts per group", () => {
      render(<Adm3HistoricalRisk adm3RiskHistory={[group()]} />);

      const types = charts().map((el) => el.getAttribute("data-chart-type"));
      expect(types).toEqual(["bubble", "bar", "bar"]);
    });

    it("feeds the alert series into the bubble chart", () => {
      render(<Adm3HistoricalRisk adm3RiskHistory={[group()]} />);

      const series = seriesOf(charts()[0]);
      expect(series[0].name).toBe("Alerta");
      expect(series[0].data).toHaveLength(1);
    });

    it("feeds the deforestation values into the first bar chart", () => {
      render(<Adm3HistoricalRisk adm3RiskHistory={[group()]} />);

      const series = seriesOf(charts()[1]);
      expect(series[0].name).toBe("Hectáreas");
      expect(series[0].data).toEqual([45.7]);
    });

    it("feeds the farm counts into the second bar chart", () => {
      render(<Adm3HistoricalRisk adm3RiskHistory={[group()]} />);

      const series = seriesOf(charts()[2]);
      expect(series[0].name).toBe("Fincas");
      expect(series[0].data).toEqual([7]);
    });

    it("orders the chart categories oldest to newest", () => {
      const data = [
        group({
          items: [
            item({ period_start: "2023-01-01", period_end: "2024-01-01", def_ha: 3 }),
            item({ period_start: "2021-01-01", period_end: "2022-01-01", def_ha: 1 }),
            item({ period_start: "2022-01-01", period_end: "2023-01-01", def_ha: 2 }),
          ],
        }),
      ];
      render(<Adm3HistoricalRisk adm3RiskHistory={data} />);

      expect(seriesOf(charts()[1])[0].data).toEqual([1, 2, 3]);
      expect(categoriesOf(charts()[1])).toHaveLength(3);
    });

    it("does not mutate the original items array while sorting", () => {
      const items = [
        item({ period_start: "2023-01-01", def_ha: 3 }),
        item({ period_start: "2021-01-01", def_ha: 1 }),
      ];
      render(<Adm3HistoricalRisk adm3RiskHistory={[group({ items })]} />);

      expect(items[0].def_ha).toBe(3);
    });

    it("treats a group without items as an empty series", () => {
      render(<Adm3HistoricalRisk adm3RiskHistory={[group({ items: undefined })]} />);

      expect(seriesOf(charts()[0])[0].data).toEqual([]);
    });
  });

  describe("several groups", () => {
    it("renders one block per group", () => {
      const data = [group(), group({ adm3_id: "a2", name: "Calamar" })];
      render(<Adm3HistoricalRisk adm3RiskHistory={data} />);

      expect(screen.getByRole("heading", { name: "El Retorno" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Calamar" })).toBeInTheDocument();
      expect(charts()).toHaveLength(6);
    });
  });

  it("appends the extra className to the wrapper", () => {
    const { container } = render(
      <Adm3HistoricalRisk adm3RiskHistory={[group()]} className="mt-8" />
    );
    expect(container.firstChild).toHaveClass("mt-8");
  });
});
