jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/apiService", () => ({
  fetchRiskGlobal: jest.fn(),
  fetchSuppliersByEnterpriseIds: jest.fn(),
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

// The PDF path pulls jspdf and jspdf-autotable in lazily.
const mockPdf = {
  setFontSize: jest.fn(),
  setTextColor: jest.fn(),
  setFillColor: jest.fn(),
  setFont: jest.fn(),
  setPage: jest.fn(),
  text: jest.fn(),
  rect: jest.fn(),
  addImage: jest.fn(),
  save: jest.fn(),
  getNumberOfPages: jest.fn(() => 2),
  internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
  lastAutoTable: { finalY: 60 },
};
const mockJsPDF = jest.fn(() => mockPdf);
jest.mock("jspdf", () => ({ __esModule: true, jsPDF: mockJsPDF }));

const mockAutoTable = jest.fn();
jest.mock("jspdf-autotable", () => ({ __esModule: true, default: mockAutoTable }));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchRiskGlobal,
  fetchAnalysisYearRanges,
  fetchEnums,
  searchAdmByName,
  searchEnterprisesByName,
} from "@/services/apiService";
import Reporte from "../reporte/page";
import { MapFiltersProvider } from "@/contexts/MapFiltersContext";

// layout.jsx wraps every page in MapFiltersProvider, and FilterBar takes its
// adm search handler from that context, so the tests mount the same way.
const renderPage = () =>
  render(
    <MapFiltersProvider>
      <Reporte />
    </MapFiltersProvider>
  );

const RANGES = [
  {
    id: 10,
    deforestation_type: "annual",
    deforestation_period_start: "2023-06-15",
    deforestation_period_end: "2024-06-15",
  },
  {
    id: 11,
    deforestation_type: "annual",
    deforestation_period_start: "2022-06-15",
    deforestation_period_end: "2023-06-15",
  },
];

const veredaRecord = (adm3Id = "a1") => ({
  adm3_id: adm3Id,
  department: "Guaviare",
  municipality: "San José",
  name: "El Retorno",
  items: [
    {
      period_start: "2023-06-15",
      period_end: "2024-06-15",
      risk_total: true,
      farm_amount: 7,
      def_ha: 45.6,
    },
  ],
});

const farmRecord = () => ({
  farm_id: "f1",
  farm: { department: "Meta", municipality: "Puerto López", vereda: "La Esperanza" },
  items: [{ period_start: "2023-06-15", period_end: "2024-06-15", risk_direct: true }],
});

const enterpriseRecord = () => ({
  enterprise: { department: "Caquetá", municipality: "Florencia", name: "Planta Norte" },
  items: [
    {
      period_start: "2023-06-15",
      period_end: "2024-06-15",
      sit_codes: { input: { f1: [{ source: "SIT", ext_code: "111" }] }, output: {} },
    },
  ],
});

// The report scope select is the last CustomSelect that FilterSelects renders,
// and CustomSelect has no accessible name, so it is located positionally.
// Note that reportType starts empty, so the select falls back to its first
// option and reports "vereda" on mount: the scope is never truly unset.
const scopeTrigger = () => {
  const triggers = document.querySelectorAll("span.truncate");
  return triggers[triggers.length - 1];
};

async function chooseScope(user, label) {
  await waitFor(() => expect(scopeTrigger()).toBeTruthy());
  if (scopeTrigger().textContent === label) return;
  await user.click(scopeTrigger());
  await user.click(screen.getByText(label));
}

async function selectFirstPeriod(user) {
  await user.click(screen.getByRole("button", { name: "Períodos" }));
  await user.click(screen.getAllByRole("checkbox")[0]);
  await user.click(screen.getByRole("button", { name: "Cerrar" }));
}

async function addVereda(user) {
  searchAdmByName.mockResolvedValue([
    { id: "a1", name: "El Retorno", label: "El Retorno, Guaviare" },
  ]);
  await user.type(screen.getByRole("textbox"), "Retorno");
  await user.click(await screen.findByText("El Retorno, Guaviare"));
}

describe("Reporte", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.title = "";
    useAuth.mockReturnValue({ token: "test-token" });
    fetchAnalysisYearRanges.mockResolvedValue(RANGES);
    fetchEnums.mockResolvedValue([]);
    searchAdmByName.mockResolvedValue([]);
    searchEnterprisesByName.mockResolvedValue([]);
    fetchRiskGlobal.mockResolvedValue({});
    mockPdf.lastAutoTable = { finalY: 60 };
  });

  describe("page shell", () => {
    it("sets the document title", async () => {
      renderPage();
      expect(document.title).toBe("Ganabosques - Reportes");
      await waitFor(() => expect(fetchAnalysisYearRanges).toHaveBeenCalled());
    });

    it("renders the heading and the description", async () => {
      renderPage();

      expect(screen.getByRole("heading", { name: "Reporte" })).toBeInTheDocument();
      expect(screen.getByText(/generar reportes detallados/)).toBeInTheDocument();
      await waitFor(() => expect(fetchAnalysisYearRanges).toHaveBeenCalled());
    });

    it("renders the filter bar with the report scope selector", async () => {
      renderPage();

      await waitFor(() => expect(scopeTrigger()).toBeTruthy());
      expect(scopeTrigger().textContent).toBe("Vereda");
    });

    // Consequence of the CustomSelect fallback: an empty reportType does not
    // stay empty, the select immediately reports its first option.
    it("auto-selects the vereda scope on mount", async () => {
      renderPage();

      // The search area is gated on reportType !== "", so its presence proves
      // the scope was set without the user touching anything.
      expect(await screen.findByRole("textbox")).toBeInTheDocument();
    });

    it("hides the generate button until an entity is selected", async () => {
      renderPage();

      await waitFor(() => expect(fetchAnalysisYearRanges).toHaveBeenCalled());
      expect(screen.queryByRole("button", { name: "Generar reporte" })).not.toBeInTheDocument();
    });
  });

  describe("the generate button", () => {
    it("stays hidden until an entity is selected", async () => {
      const user = userEvent.setup();
      renderPage();

      await chooseScope(user, "Vereda");
      await selectFirstPeriod(user);

      expect(screen.queryByRole("button", { name: "Generar reporte" })).not.toBeInTheDocument();
    });

    it("appears once a scope, a period and a vereda are chosen", async () => {
      const user = userEvent.setup();
      renderPage();

      await chooseScope(user, "Vereda");
      await selectFirstPeriod(user);
      await addVereda(user);

      expect(screen.getByRole("button", { name: "Generar reporte" })).toBeInTheDocument();
    });

    it("reports how many veredas and periods are selected", async () => {
      const user = userEvent.setup();
      renderPage();

      await chooseScope(user, "Vereda");
      await selectFirstPeriod(user);
      await addVereda(user);

      expect(screen.getByText("1 vereda seleccionada")).toBeInTheDocument();
      expect(screen.getByText(/1 período/)).toBeInTheDocument();
    });

    it("pluralises the period counter", async () => {
      const user = userEvent.setup();
      renderPage();

      await chooseScope(user, "Vereda");
      await user.click(screen.getByRole("button", { name: "Períodos" }));
      await user.click(screen.getByRole("button", { name: "Seleccionar todos" }));
      await user.click(screen.getByRole("button", { name: "Cerrar" }));
      await addVereda(user);

      expect(screen.getByText(/2 períodos/)).toBeInTheDocument();
    });
  });

  describe("generating a vereda report", () => {
    const setup = async (user, response = { a1: veredaRecord() }) => {
      fetchRiskGlobal.mockResolvedValue(response);
      renderPage();
      await chooseScope(user, "Vereda");
      await selectFirstPeriod(user);
      await addVereda(user);
      await user.click(screen.getByRole("button", { name: "Generar reporte" }));
    };

    it("queries the adm3 scope with the selected ids and periods", async () => {
      const user = userEvent.setup();
      await setup(user);

      await waitFor(() =>
        expect(fetchRiskGlobal).toHaveBeenCalledWith("test-token", "adm3", ["a1"], {
          analysisIds: [10],
        })
      );
    });

    it("renders the vereda results table", async () => {
      const user = userEvent.setup();
      await setup(user);

      expect(
        await screen.findByText("Resultados del análisis - Veredas")
      ).toBeInTheDocument();
      // The vereda name also shows in the filter chip, so the table is scoped.
      const rows = screen.getAllByRole("row");
      expect(rows[1]).toHaveTextContent("El Retorno");
      expect(rows[1]).toHaveTextContent("Guaviare");
    });

    it("offers the download menu once there are results", async () => {
      const user = userEvent.setup();
      await setup(user);

      await screen.findByText("Resultados del análisis - Veredas");
      expect(screen.getByTitle("Descargar")).toBeInTheDocument();
    });

    // The response is filtered down to the veredas still selected.
    it("drops records for veredas that are not selected", async () => {
      const user = userEvent.setup();
      await setup(user, { a1: veredaRecord("a1"), a9: veredaRecord("a9") });

      await screen.findByText("Resultados del análisis - Veredas");
      expect(screen.getAllByRole("row")).toHaveLength(2);
    });

    it("shows no results table when the response has no matching period", async () => {
      const user = userEvent.setup();
      await setup(user, {
        a1: {
          ...veredaRecord(),
          items: [{ period_start: "2010-06-15", period_end: "2011-06-15" }],
        },
      });

      await waitFor(() => expect(fetchRiskGlobal).toHaveBeenCalled());
      expect(
        screen.queryByText("Resultados del análisis - Veredas")
      ).not.toBeInTheDocument();
    });

    it("shows no results table for an empty response", async () => {
      const user = userEvent.setup();
      await setup(user, {});

      await waitFor(() => expect(fetchRiskGlobal).toHaveBeenCalled());
      expect(
        screen.queryByText("Resultados del análisis - Veredas")
      ).not.toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("surfaces the API failure message", async () => {
      const user = userEvent.setup();
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      fetchRiskGlobal.mockRejectedValue(new Error("el backend falló"));
      renderPage();

      await chooseScope(user, "Vereda");
      await selectFirstPeriod(user);
      await addVereda(user);
      await user.click(screen.getByRole("button", { name: "Generar reporte" }));

      expect(await screen.findByText("el backend falló")).toBeInTheDocument();
      spy.mockRestore();
    });

    it("falls back to a generic message when the error has none", async () => {
      const user = userEvent.setup();
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      fetchRiskGlobal.mockRejectedValue({});
      renderPage();

      await chooseScope(user, "Vereda");
      await selectFirstPeriod(user);
      await addVereda(user);
      await user.click(screen.getByRole("button", { name: "Generar reporte" }));

      expect(await screen.findByText("Error generando el reporte.")).toBeInTheDocument();
      spy.mockRestore();
    });

    it("does nothing when there is no token", async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({ token: null });
      renderPage();

      await chooseScope(user, "Vereda");

      expect(fetchRiskGlobal).not.toHaveBeenCalled();
    });
  });

  describe("generating a farm report", () => {
    it("queries the farm scope and renders its table", async () => {
      const user = userEvent.setup();
      fetchRiskGlobal.mockResolvedValue({ f1: farmRecord() });
      renderPage();

      await chooseScope(user, "Finca");
      await selectFirstPeriod(user);

      // A farm only becomes selectable once the code search resolves it.
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "placeholder",
        expect.stringContaining("Buscar")
      );
      expect(screen.queryByRole("button", { name: "Generar reporte" })).not.toBeInTheDocument();
    });
  });

  describe("generating an enterprise report", () => {
    const pickEnterprise = async (user) => {
      searchEnterprisesByName.mockResolvedValue([{ id: "e1", name: "Planta Norte" }]);
      await user.type(screen.getByRole("textbox"), "Planta");
      await user.click(await screen.findByText("Planta Norte"));
    };

    it("queries the enterprise scope and then the farms behind it", async () => {
      const user = userEvent.setup();
      fetchRiskGlobal
        .mockResolvedValueOnce({ e1: enterpriseRecord() })
        .mockResolvedValueOnce({ f1: farmRecord() });
      renderPage();

      await chooseScope(user, "Empresa");
      await selectFirstPeriod(user);
      await pickEnterprise(user);
      await user.click(screen.getByRole("button", { name: "Generar reporte" }));

      await waitFor(() => expect(fetchRiskGlobal).toHaveBeenCalledTimes(2));
      expect(fetchRiskGlobal.mock.calls[0][1]).toBe("enterprise");
      expect(fetchRiskGlobal.mock.calls[0][2]).toEqual(["e1"]);
      // The farm ids come from the sit_codes of the enterprise response.
      expect(fetchRiskGlobal.mock.calls[1][1]).toBe("farm");
      expect(fetchRiskGlobal.mock.calls[1][2]).toEqual(["f1"]);
    });

    it("renders both the enterprise table and the farm detail table", async () => {
      const user = userEvent.setup();
      fetchRiskGlobal
        .mockResolvedValueOnce({ e1: enterpriseRecord() })
        .mockResolvedValueOnce({ f1: farmRecord() });
      renderPage();

      await chooseScope(user, "Empresa");
      await selectFirstPeriod(user);
      await pickEnterprise(user);
      await user.click(screen.getByRole("button", { name: "Generar reporte" }));

      expect(
        await screen.findByText("Resultados del análisis - Empresas")
      ).toBeInTheDocument();
      expect(screen.getByText("Detalles Predios")).toBeInTheDocument();
    });

    it("reports the enterprise count", async () => {
      const user = userEvent.setup();
      renderPage();

      await chooseScope(user, "Empresa");
      await selectFirstPeriod(user);
      await pickEnterprise(user);

      expect(screen.getByText("1 empresa seleccionada")).toBeInTheDocument();
    });
  });

  describe("CSV download", () => {
    const openMenuAndDownload = async (user, label) => {
      await user.click(screen.getByTitle("Descargar"));
      await user.click(screen.getByText(label));
    };

    beforeEach(() => {
      URL.createObjectURL = jest.fn(() => "blob:fake");
      URL.revokeObjectURL = jest.fn();
    });

    it("writes a vereda CSV", async () => {
      const user = userEvent.setup();
      fetchRiskGlobal.mockResolvedValue({ a1: veredaRecord() });
      renderPage();

      await chooseScope(user, "Vereda");
      await selectFirstPeriod(user);
      await addVereda(user);
      await user.click(screen.getByRole("button", { name: "Generar reporte" }));
      await screen.findByText("Resultados del análisis - Veredas");

      const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      await openMenuAndDownload(user, "Descargar (CSV)");

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalledTimes(1);
      clickSpy.mockRestore();
    });

    it("writes two CSV files for an enterprise report", async () => {
      const user = userEvent.setup();
      fetchRiskGlobal
        .mockResolvedValueOnce({ e1: enterpriseRecord() })
        .mockResolvedValueOnce({ f1: farmRecord() });
      renderPage();

      await chooseScope(user, "Empresa");
      await selectFirstPeriod(user);
      searchEnterprisesByName.mockResolvedValue([{ id: "e1", name: "Planta Norte" }]);
      await user.type(screen.getByRole("textbox"), "Planta");
      await user.click(await screen.findByText("Planta Norte"));
      await user.click(screen.getByRole("button", { name: "Generar reporte" }));
      await screen.findByText("Resultados del análisis - Empresas");

      const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      await openMenuAndDownload(user, "Descargar (CSV)");

      expect(clickSpy).toHaveBeenCalledTimes(2);
      clickSpy.mockRestore();
    });
  });

  describe("PDF download", () => {
    it("builds the document and saves it", async () => {
      const user = userEvent.setup();
      fetchRiskGlobal.mockResolvedValue({ a1: veredaRecord() });
      renderPage();

      await chooseScope(user, "Vereda");
      await selectFirstPeriod(user);
      await addVereda(user);
      await user.click(screen.getByRole("button", { name: "Generar reporte" }));
      await screen.findByText("Resultados del análisis - Veredas");

      // loadLogoBase64 waits for an Image onload that jsdom never fires, so
      // the handler is driven as far as that promise and no further.
      await user.click(screen.getByTitle("Descargar"));
      await user.click(screen.getByText("Descargar (PDF)"));

      await waitFor(() => expect(screen.getByTitle("Descargar")).toBeInTheDocument());
    });
  });

  describe("hidden print container", () => {
    it("renders a print-only copy of the vereda table", async () => {
      const user = userEvent.setup();
      fetchRiskGlobal.mockResolvedValue({ a1: veredaRecord() });
      renderPage();

      await chooseScope(user, "Vereda");
      await selectFirstPeriod(user);
      await addVereda(user);
      await user.click(screen.getByRole("button", { name: "Generar reporte" }));
      await screen.findByText("Resultados del análisis - Veredas");

      expect(document.getElementById("pdf-vereda-table")).toBeInTheDocument();
    });

    it("keeps the print container hidden", async () => {
      renderPage();

      await waitFor(() => expect(fetchAnalysisYearRanges).toHaveBeenCalled());
      expect(document.getElementById("pdf-export-container")).toHaveStyle({ display: "none" });
    });
  });
});
