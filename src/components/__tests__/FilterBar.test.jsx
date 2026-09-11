jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/apiService", () => ({
  fetchAnalysisYearRanges: jest.fn(),
  fetchFarmBySITCode: jest.fn(),
  fetchEnums: jest.fn(),
  searchAdmByName: jest.fn(),
  searchEnterprisesByName: jest.fn(),
}));

const mockGeoJSON = jest.fn(() => ({ getBounds: () => ({}) }));
jest.mock("leaflet", () => ({
  geoJSON: (...args) => mockGeoJSON(...args),
  default: { geoJSON: (...args) => mockGeoJSON(...args) },
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchAnalysisYearRanges,
  fetchEnums,
  searchAdmByName,
  searchEnterprisesByName,
} from "@/services/apiService";
import FilterBar from "../FilterBar";
import { MapFiltersProvider } from "@/contexts/MapFiltersContext";

const RISK_OPTIONS = [
  { value: "annual", label: "Alerta anual" },
  { value: "nad", label: "Núcleos activos" },
];

const RANGES = [
  {
    id: 10,
    deforestation_type: "annual",
    deforestation_period_start: "2023-06-15",
    deforestation_period_end: "2024-06-15",
  },
];

// Standalone props: FilterBar can run fully controlled, with no context.
const standalone = (overrides = {}) => ({
  risk: "annual",
  setRisk: jest.fn(),
  year: "10",
  setYear: jest.fn(),
  source: "smbyc",
  setSource: jest.fn(),
  search: "",
  setSearch: jest.fn(),
  activity: "ganaderia",
  setActivity: jest.fn(),
  admLevel: "adm1",
  riskOptions: RISK_OPTIONS,
  period: RANGES[0],
  setPeriod: jest.fn(),
  selectedEnterprise: [],
  setSelectedEnterprise: jest.fn(),
  foundFarms: [],
  setFoundFarms: jest.fn(),
  foundAdms: [],
  setFoundAdms: jest.fn(),
  onYearStartEndChange: jest.fn(),
  sourceLabel: "SIT_CODE",
  setSourceLabel: jest.fn(),
  onAdmSearch: jest.fn(),
  ...overrides,
});

describe("FilterBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ token: "test-token" });
    fetchAnalysisYearRanges.mockResolvedValue(RANGES);
    fetchEnums.mockResolvedValue([]);
    searchAdmByName.mockResolvedValue([]);
    searchEnterprisesByName.mockResolvedValue([]);
  });

  describe("layout", () => {
    it("overlays the map by default", () => {
      const { container } = render(<FilterBar {...standalone()} />);
      expect(container.firstChild).toHaveClass("absolute");
    });

    it("sits in the flow for the dashboard", () => {
      const { container } = render(<FilterBar {...standalone()} dashboardRisk />);
      expect(container.firstChild).toHaveClass("relative");
    });
  });

  describe("the filter controls", () => {
    it("renders the selects driven by the given props", async () => {
      render(<FilterBar {...standalone()} />);

      expect(screen.getByText("Ganadería")).toBeInTheDocument();
      expect(screen.getByText("SMBYC")).toBeInTheDocument();
      expect(screen.getByText("Alerta anual")).toBeInTheDocument();
      await waitFor(() => expect(fetchAnalysisYearRanges).toHaveBeenCalled());
    });

    it("feeds the fetched year ranges into the period select", async () => {
      render(<FilterBar {...standalone()} />);

      await waitFor(() => expect(screen.getByText("2023 - 2024")).toBeInTheDocument());
    });
  });

  describe("the search area", () => {
    it("shows the search box outside report mode", () => {
      render(<FilterBar {...standalone()} farmRisk />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("hides the search box when asked", () => {
      render(<FilterBar {...standalone()} farmRisk hideSearch />);
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("hides the search box in report mode until a scope is chosen", () => {
      render(<FilterBar {...standalone()} report reportType="" setReportType={jest.fn()} />);
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("shows the search box once a report scope is chosen", () => {
      render(<FilterBar {...standalone()} report reportType="finca" setReportType={jest.fn()} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });
  });

  describe("mode wiring", () => {
    it("asks for a code in farm mode", () => {
      render(<FilterBar {...standalone()} farmRisk />);
      expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", "Buscar SIT_CODE");
    });

    it("asks for an enterprise in enterprise mode", () => {
      render(<FilterBar {...standalone()} enterpriseRisk />);
      expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", "Buscar empresa");
    });

    it("derives the farm mode from the report scope", () => {
      render(<FilterBar {...standalone()} report reportType="finca" setReportType={jest.fn()} />);
      expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", "Buscar SIT_CODE");
    });

    it("derives the enterprise mode from the report scope", () => {
      render(<FilterBar {...standalone()} report reportType="empresa" setReportType={jest.fn()} />);
      expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", "Buscar empresa");
    });

    it("derives the national mode from the report scope", () => {
      render(<FilterBar {...standalone()} report reportType="vereda" setReportType={jest.fn()} />);
      expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", "Buscar sitio");
    });
  });

  describe("suggestion sources", () => {
    it("searches enterprises in enterprise mode", async () => {
      render(<FilterBar {...standalone({ search: "Frigo" })} enterpriseRisk />);

      await waitFor(() =>
        expect(searchEnterprisesByName).toHaveBeenCalledWith("test-token", "Frigo", "ganaderia")
      );
    });

    it("searches enterprises for the empresa report scope", async () => {
      render(
        <FilterBar
          {...standalone({ search: "Frigo" })}
          report
          reportType="empresa"
          setReportType={jest.fn()}
        />
      );

      await waitFor(() => expect(searchEnterprisesByName).toHaveBeenCalled());
    });

    it("does not search enterprises in farm mode", async () => {
      render(<FilterBar {...standalone({ search: "Frigo" })} farmRisk />);

      await waitFor(() => expect(fetchAnalysisYearRanges).toHaveBeenCalled());
      expect(searchEnterprisesByName).not.toHaveBeenCalled();
    });

    it("searches administrative levels in national mode", async () => {
      render(<FilterBar {...standalone({ search: "Meta" })} nationalRisk />);

      await waitFor(() =>
        expect(searchAdmByName).toHaveBeenCalledWith("test-token", "Meta", "adm1")
      );
    });

    it("searches administrative levels for the vereda report scope", async () => {
      render(
        <FilterBar
          {...standalone({ search: "Meta" })}
          report
          reportType="vereda"
          setReportType={jest.fn()}
        />
      );

      await waitFor(() => expect(searchAdmByName).toHaveBeenCalled());
    });
  });

  describe("source label selector", () => {
    it("stays hidden when the enum returns nothing", async () => {
      render(<FilterBar {...standalone()} farmRisk />);

      await waitFor(() => expect(fetchEnums).toHaveBeenCalled());
      expect(screen.queryByLabelText("Tipo de código")).not.toBeInTheDocument();
    });

    it("appears for farm mode once labels are available", async () => {
      fetchEnums.mockResolvedValue(["SIT_CODE", "GEOFARMER_ID"]);
      render(<FilterBar {...standalone()} farmRisk />);

      await waitFor(() => expect(screen.getByLabelText("Tipo de código")).toBeInTheDocument());
      expect(screen.getByRole("option", { name: "GEOFARMER_ID" })).toBeInTheDocument();
    });

    it("stays hidden in enterprise mode", async () => {
      fetchEnums.mockResolvedValue(["SIT_CODE"]);
      render(<FilterBar {...standalone()} enterpriseRisk />);

      await waitFor(() => expect(fetchEnums).toHaveBeenCalled());
      expect(screen.queryByLabelText("Tipo de código")).not.toBeInTheDocument();
    });

    it("reports the chosen label", async () => {
      const user = userEvent.setup();
      fetchEnums.mockResolvedValue(["SIT_CODE", "GEOFARMER_ID"]);
      const props = standalone();
      render(<FilterBar {...props} farmRisk />);

      const select = await screen.findByLabelText("Tipo de código");
      await user.selectOptions(select, "GEOFARMER_ID");

      expect(props.setSourceLabel).toHaveBeenCalledWith("GEOFARMER_ID");
    });
  });

  describe("activity drives the source label", () => {
    it("sets SIT_CODE for ganaderia", async () => {
      const props = standalone({ activity: "ganaderia" });
      render(<FilterBar {...props} farmRisk />);

      await waitFor(() => expect(props.setSourceLabel).toHaveBeenCalledWith("SIT_CODE"));
    });

    it("sets GEOFARMER_ID for cacao", async () => {
      const props = standalone({ activity: "cacao" });
      render(<FilterBar {...props} farmRisk />);

      await waitFor(() => expect(props.setSourceLabel).toHaveBeenCalledWith("GEOFARMER_ID"));
    });

    it("sets PRODUCER_ID for cafe", async () => {
      const props = standalone({ activity: "cafe" });
      render(<FilterBar {...props} farmRisk />);

      await waitFor(() => expect(props.setSourceLabel).toHaveBeenCalledWith("PRODUCER_ID"));
    });

    it("leaves the label alone for an unknown activity", async () => {
      const props = standalone({ activity: "palma" });
      render(<FilterBar {...props} farmRisk />);

      await waitFor(() => expect(props.setFoundFarms).toHaveBeenCalledWith([]));
      expect(props.setSourceLabel).not.toHaveBeenCalled();
    });

    it("clears the found farms whenever the activity changes", async () => {
      const props = standalone();
      render(<FilterBar {...props} farmRisk />);

      await waitFor(() => expect(props.setFoundFarms).toHaveBeenCalledWith([]));
    });
  });

  describe("error toasts", () => {
    it("surfaces a year range failure", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      fetchAnalysisYearRanges.mockRejectedValue(new Error("down"));
      render(<FilterBar {...standalone()} />);

      await waitFor(() =>
        expect(screen.getByText("Error al cargar años disponibles")).toBeInTheDocument()
      );
      spy.mockRestore();
    });

    it("lets the toast be dismissed", async () => {
      const user = userEvent.setup();
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      fetchAnalysisYearRanges.mockRejectedValue(new Error("down"));
      render(<FilterBar {...standalone()} />);

      await screen.findByText("Error al cargar años disponibles");
      await user.click(screen.getByRole("button", { name: "Cerrar" }));

      expect(screen.queryByText("Error al cargar años disponibles")).not.toBeInTheDocument();
      spy.mockRestore();
    });

    it("shows no toast on the happy path", async () => {
      render(<FilterBar {...standalone()} />);

      await waitFor(() => expect(fetchAnalysisYearRanges).toHaveBeenCalled());
      expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
    });
  });

  describe("chips", () => {
    it("renders a chip per found farm", () => {
      render(
        <FilterBar {...standalone({ foundFarms: [{ id: "f1", code: "111" }] })} farmRisk />
      );

      expect(screen.getByText("111")).toBeInTheDocument();
    });

    it("renders a chip per selected enterprise", () => {
      render(
        <FilterBar
          {...standalone({ selectedEnterprise: [{ id: "e1", name: "Planta" }] })}
          enterpriseRisk
        />
      );

      expect(screen.getByText("Planta")).toBeInTheDocument();
    });

    it("renders a chip per found region", () => {
      render(
        <FilterBar
          {...standalone({ foundAdms: [{ id: "a1", adm3name: "El Retorno" }] })}
          nationalRisk
        />
      );

      expect(screen.getByText("El Retorno")).toBeInTheDocument();
    });
  });

  describe("falling back to the map filters context", () => {
    // With no props at all, every value has to come from the provider.
    const inProvider = (ui) => render(<MapFiltersProvider>{ui}</MapFiltersProvider>);

    it("reads the filters from the context", async () => {
      inProvider(<FilterBar farmRisk />);

      expect(screen.getByText("Ganadería")).toBeInTheDocument();
      expect(screen.getByText("Alerta anual")).toBeInTheDocument();
      await waitFor(() => expect(fetchAnalysisYearRanges).toHaveBeenCalled());
    });

    it("uses the context risk options", async () => {
      const user = userEvent.setup();
      inProvider(<FilterBar farmRisk />);

      await user.click(screen.getByText("Alerta anual"));

      expect(screen.getByText("Alerta temprana")).toBeInTheDocument();
    });

    it("uses the context adm search for the search box", async () => {
      const user = userEvent.setup();
      searchAdmByName.mockResolvedValue([{ id: "a1", name: "Meta", geometry: null }]);
      inProvider(<FilterBar nationalRisk />);

      await user.type(screen.getByRole("textbox"), "Meta");
      await user.click(screen.getByRole("button", { name: "Buscar" }));

      await waitFor(() =>
        expect(searchAdmByName).toHaveBeenCalledWith("test-token", "Meta", "adm1")
      );
    });

    it("lets explicit props win over the context", async () => {
      const setRisk = jest.fn();
      inProvider(
        <FilterBar
          farmRisk
          risk="nad"
          setRisk={setRisk}
          riskOptions={RISK_OPTIONS}
        />
      );

      expect(screen.getByText("Núcleos activos")).toBeInTheDocument();
      await waitFor(() => expect(fetchAnalysisYearRanges).toHaveBeenCalled());
    });
  });
});
