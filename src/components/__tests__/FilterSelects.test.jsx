import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterSelects from "../FilterSelects";

const RISK_OPTIONS = [
  { value: "annual", label: "Alerta anual" },
  { value: "cumulative", label: "Alerta acumulada" },
  { value: "nad", label: "Núcleos activos" },
  { value: "atd", label: "Alerta temprana" },
];

const range = (overrides = {}) => ({
  id: 10,
  deforestation_type: "annual",
  deforestation_period_start: "2023-06-15",
  deforestation_period_end: "2024-06-15",
  ...overrides,
});

const baseProps = (overrides = {}) => ({
  risk: "annual",
  setRisk: jest.fn(),
  year: "10",
  setYear: jest.fn(),
  source: "smbyc",
  setSource: jest.fn(),
  activity: "ganaderia",
  setActivity: jest.fn(),
  riskOptions: RISK_OPTIONS,
  yearRanges: [range()],
  setPeriod: jest.fn(),
  onYearStartEndChange: jest.fn(),
  onPeriodsChange: jest.fn(),
  ...overrides,
});

describe("FilterSelects", () => {
  describe("the control set", () => {
    it("renders activity, source, risk and period by default", () => {
      render(<FilterSelects {...baseProps()} />);

      expect(screen.getByText("Ganadería")).toBeInTheDocument();
      expect(screen.getByText("SMBYC")).toBeInTheDocument();
      expect(screen.getByText("Alerta anual")).toBeInTheDocument();
      expect(screen.getByText("2023 - 2024")).toBeInTheDocument();
    });

    it("hides the report type selector outside report mode", () => {
      render(<FilterSelects {...baseProps()} />);
      expect(screen.queryByText("Tipo de reporte")).not.toBeInTheDocument();
    });

    it("adds the report type selector in report mode", () => {
      render(<FilterSelects {...baseProps()} report reportType="vereda" setReportType={jest.fn()} />);
      expect(screen.getByText("Vereda")).toBeInTheDocument();
    });

    it("swaps the single period select for the multi one in report multiPeriod mode", () => {
      render(<FilterSelects {...baseProps()} report multiPeriod reportType="vereda" />);
      expect(screen.getByRole("button", { name: "Períodos" })).toBeInTheDocument();
    });
  });

  describe("activity options", () => {
    it("offers the three supply chains", async () => {
      const user = userEvent.setup();
      render(<FilterSelects {...baseProps()} />);

      await user.click(screen.getByText("Ganadería"));

      expect(screen.getByText("Cacao")).toBeInTheDocument();
      expect(screen.getByText("Café")).toBeInTheDocument();
    });

    it("reports the chosen activity", async () => {
      const user = userEvent.setup();
      const props = baseProps();
      render(<FilterSelects {...props} />);

      await user.click(screen.getByText("Ganadería"));
      await user.click(screen.getByText("Cacao"));

      expect(props.setActivity).toHaveBeenCalledWith("cacao");
    });

    it("does not fail when setActivity is absent", async () => {
      const user = userEvent.setup();
      render(<FilterSelects {...baseProps({ setActivity: undefined })} />);

      await user.click(screen.getByText("Ganadería"));
      await expect(user.click(screen.getByText("Cacao"))).resolves.toBeUndefined();
    });
  });

  describe("risk options", () => {
    it("lists the risks it receives", async () => {
      const user = userEvent.setup();
      render(<FilterSelects {...baseProps()} />);

      await user.click(screen.getByText("Alerta anual"));

      expect(screen.getByText("Núcleos activos")).toBeInTheDocument();
      expect(screen.getByText("Alerta temprana")).toBeInTheDocument();
    });

    it("reports the chosen risk", async () => {
      const user = userEvent.setup();
      const props = baseProps();
      render(<FilterSelects {...props} />);

      await user.click(screen.getByText("Alerta anual"));
      await user.click(screen.getByText("Núcleos activos"));

      expect(props.setRisk).toHaveBeenCalledWith("nad");
    });
  });

  describe("period labels", () => {
    it("shows only the years for an annual period", () => {
      render(<FilterSelects {...baseProps()} />);
      expect(screen.getByText("2023 - 2024")).toBeInTheDocument();
    });

    it("shows only the years for a cumulative period", () => {
      const props = baseProps({
        yearRanges: [range({ deforestation_type: "cumulative" })],
      });
      render(<FilterSelects {...props} />);

      expect(screen.getByText("2023 - 2024")).toBeInTheDocument();
    });

    // For quarterly risks the label comes from the tail of the analysis name.
    it("shows the trailing name segment for an atd period", () => {
      const props = baseProps({
        yearRanges: [
          range({ deforestation_type: "atd", deforestation_name: "ATD_SMBYC_2023Q3" }),
        ],
      });
      render(<FilterSelects {...props} />);

      expect(screen.getByText("2023Q3")).toBeInTheDocument();
    });

    it("shows the trailing name segment for a nad period", () => {
      const props = baseProps({
        yearRanges: [
          range({ deforestation_type: "nad", deforestation_name: "NAD_SMBYC_2024Q1" }),
        ],
      });
      render(<FilterSelects {...props} />);

      expect(screen.getByText("2024Q1")).toBeInTheDocument();
    });

    // A quarterly period with no name yields an empty label. The option still
    // exists, so the placeholder does not take over and the control looks blank.
    it("renders a blank label when a quarterly period has no name", () => {
      const props = baseProps({
        year: "",
        yearRanges: [range({ deforestation_type: "nad", deforestation_name: "" })],
      });
      const { container } = render(<FilterSelects {...props} />);

      expect(screen.queryByText("Seleccionar período")).not.toBeInTheDocument();
      const labels = Array.from(container.querySelectorAll("span.truncate")).map(
        (el) => el.textContent
      );
      expect(labels).toContain("");
    });

    it("falls back to the raw dates for an unknown period type", () => {
      const props = baseProps({
        yearRanges: [range({ deforestation_type: "other" })],
      });
      render(<FilterSelects {...props} />);

      expect(screen.getByText("2023-06-15 - 2024-06-15")).toBeInTheDocument();
    });

    it("renders an empty range when the dates are missing", () => {
      const props = baseProps({
        yearRanges: [
          {
            id: 10,
            deforestation_type: "annual",
            deforestation_period_start: null,
            deforestation_period_end: null,
          },
        ],
      });
      render(<FilterSelects {...props} />);

      expect(screen.getByText("-")).toBeInTheDocument();
    });

    it("shows the placeholder when there are no ranges", () => {
      render(<FilterSelects {...baseProps({ yearRanges: [], year: "" })} />);
      expect(screen.getByText("Seleccionar período")).toBeInTheDocument();
    });

    it("treats a missing yearRanges as empty", () => {
      render(<FilterSelects {...baseProps({ yearRanges: undefined, year: "" })} />);
      expect(screen.getByText("Seleccionar período")).toBeInTheDocument();
    });
  });

  describe("choosing a single period", () => {
    const twoRanges = [
      range(),
      range({
        id: 11,
        deforestation_period_start: "2022-06-15",
        deforestation_period_end: "2023-06-15",
      }),
    ];

    it("reports the id, the full period and its date range", async () => {
      const user = userEvent.setup();
      const props = baseProps({ yearRanges: twoRanges });
      render(<FilterSelects {...props} />);

      await user.click(screen.getByText("2023 - 2024"));
      await user.click(screen.getByText("2022 - 2023"));

      expect(props.setYear).toHaveBeenCalledWith("11");
      expect(props.setPeriod).toHaveBeenCalledWith(twoRanges[1]);
      expect(props.onYearStartEndChange).toHaveBeenCalledWith("2022-06-15", "2023-06-15");
    });
  });

  describe("choosing several periods", () => {
    const multiProps = (overrides = {}) =>
      baseProps({
        report: true,
        multiPeriod: true,
        reportType: "vereda",
        yearRanges: [
          range(),
          range({
            id: 11,
            deforestation_period_start: "2022-06-15",
            deforestation_period_end: "2023-06-15",
          }),
        ],
        ...overrides,
      });

    it("reports the selected raw periods", async () => {
      const user = userEvent.setup();
      const props = multiProps();
      render(<FilterSelects {...props} />);

      await user.click(screen.getByRole("button", { name: "Períodos" }));
      await user.click(screen.getAllByRole("checkbox")[0]);

      expect(props.onPeriodsChange).toHaveBeenCalledWith([props.yearRanges[0]]);
    });

    it("spans the widest range across the chosen periods", async () => {
      const user = userEvent.setup();
      const props = multiProps();
      render(<FilterSelects {...props} />);

      await user.click(screen.getByRole("button", { name: "Períodos" }));
      await user.click(screen.getByRole("button", { name: "Seleccionar todos" }));

      const [start, end] = props.onYearStartEndChange.mock.calls.at(-1);
      expect(new Date(start).getUTCFullYear()).toBe(2022);
      expect(new Date(end).getUTCFullYear()).toBe(2024);
    });

    it("clears the range when the selection is emptied", async () => {
      const user = userEvent.setup();
      const props = multiProps();
      render(<FilterSelects {...props} />);

      await user.click(screen.getByRole("button", { name: "Períodos" }));
      await user.click(screen.getByRole("button", { name: "Limpiar" }));

      expect(props.onYearStartEndChange).toHaveBeenCalledWith(null, null);
      expect(props.onPeriodsChange).toHaveBeenCalledWith([]);
    });

    it("ignores unparseable dates when computing the span", async () => {
      const user = userEvent.setup();
      const props = multiProps({
        yearRanges: [
          range({ deforestation_period_start: "bad", deforestation_period_end: "bad" }),
        ],
      });
      render(<FilterSelects {...props} />);

      await user.click(screen.getByRole("button", { name: "Períodos" }));
      await user.click(screen.getAllByRole("checkbox")[0]);

      expect(props.onYearStartEndChange).toHaveBeenCalledWith(null, null);
    });
  });

  describe("report type", () => {
    it("offers the three report scopes", async () => {
      const user = userEvent.setup();
      render(
        <FilterSelects {...baseProps()} report reportType="vereda" setReportType={jest.fn()} />
      );

      await user.click(screen.getByText("Vereda"));

      expect(screen.getByText("Finca")).toBeInTheDocument();
      expect(screen.getByText("Empresa")).toBeInTheDocument();
    });

    it("reports the chosen scope", async () => {
      const user = userEvent.setup();
      const setReportType = jest.fn();
      render(
        <FilterSelects {...baseProps()} report reportType="vereda" setReportType={setReportType} />
      );

      await user.click(screen.getByText("Vereda"));
      await user.click(screen.getByText("Empresa"));

      expect(setReportType).toHaveBeenCalledWith("empresa");
    });
  });
});
