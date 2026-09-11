jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/apiService", () => ({ searchAdmByName: jest.fn() }));

const mockBounds = { _bounds: true };
const mockGeoJSON = jest.fn(() => ({ getBounds: () => mockBounds }));
jest.mock("leaflet", () => ({
  geoJSON: (...args) => mockGeoJSON(...args),
  default: { geoJSON: (...args) => mockGeoJSON(...args) },
}));

import { render, screen, renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "@/hooks/useAuth";
import { searchAdmByName } from "@/services/apiService";
import MapFiltersContext, {
  MapFiltersProvider,
  RISK_OPTIONS,
  useMapFilters,
  useMapFiltersOptional,
} from "../MapFiltersContext";

const wrapper = ({ children }) => <MapFiltersProvider>{children}</MapFiltersProvider>;

const setup = () => renderHook(() => useMapFilters(), { wrapper });

describe("RISK_OPTIONS", () => {
  it("lists the four risk types the app supports", () => {
    expect(RISK_OPTIONS.map((o) => o.value)).toEqual(["annual", "cumulative", "nad", "atd"]);
  });

  it("gives every option a label", () => {
    for (const option of RISK_OPTIONS) {
      expect(typeof option.label).toBe("string");
      expect(option.label.length).toBeGreaterThan(0);
    }
  });
});

describe("useMapFilters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ token: "test-token" });
  });

  describe("outside the provider", () => {
    it("throws an explanatory error", () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(() => renderHook(() => useMapFilters())).toThrow(
        "useMapFilters must be used within a MapFiltersProvider"
      );
      spy.mockRestore();
    });
  });

  describe("initial values", () => {
    it("starts on the first risk option", () => {
      const { result } = setup();
      expect(result.current.risk).toBe("annual");
    });

    it("uses the documented defaults", () => {
      const { result } = setup();

      expect(result.current.year).toBe("");
      expect(result.current.period).toBe("");
      expect(result.current.source).toBe("smbyc");
      expect(result.current.activity).toBe("ganaderia");
      expect(result.current.search).toBe("");
      expect(result.current.admLevel).toBe("adm1");
      expect(result.current.sourceLabel).toBe("SIT_CODE");
      expect(result.current.yearStart).toBe(2023);
      expect(result.current.yearEnd).toBe(2024);
    });

    it("starts with empty selections", () => {
      const { result } = setup();

      expect(result.current.selectedEnterprise).toEqual([]);
      expect(result.current.foundFarms).toEqual([]);
      expect(result.current.foundAdms).toEqual([]);
      expect(result.current.admResults).toEqual([]);
    });

    it("starts idle with no analysis", () => {
      const { result } = setup();

      expect(result.current.pendingTasks).toBe(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.analysis).toBeNull();
    });

    it("exposes the risk options and the token", () => {
      const { result } = setup();

      expect(result.current.riskOptions).toBe(RISK_OPTIONS);
      expect(result.current.token).toBe("test-token");
    });

    it("starts with an empty map ref", () => {
      const { result } = setup();
      expect(result.current.mapRef.current).toBeNull();
    });
  });

  describe("setters", () => {
    it("updates the simple filters", () => {
      const { result } = setup();

      act(() => {
        result.current.setRisk("nad");
        result.current.setYear("2024");
        result.current.setSource("other");
        result.current.setActivity("cacao");
        result.current.setSearch("Meta");
        result.current.setAdmLevel("adm3");
        result.current.setSourceLabel("GEOFARMER_ID");
      });

      expect(result.current.risk).toBe("nad");
      expect(result.current.year).toBe("2024");
      expect(result.current.source).toBe("other");
      expect(result.current.activity).toBe("cacao");
      expect(result.current.search).toBe("Meta");
      expect(result.current.admLevel).toBe("adm3");
      expect(result.current.sourceLabel).toBe("GEOFARMER_ID");
    });

    it("updates the period and the analysis", () => {
      const { result } = setup();
      const period = { id: 3 };

      act(() => {
        result.current.setPeriod(period);
        result.current.setAnalysis([{ id: 1 }]);
      });

      expect(result.current.period).toBe(period);
      expect(result.current.analysis).toEqual([{ id: 1 }]);
    });

    it("updates the selection collections", () => {
      const { result } = setup();

      act(() => {
        result.current.setSelectedEnterprise([{ id: "e1" }]);
        result.current.setFoundFarms([{ id: "f1" }]);
        result.current.setFoundAdms([{ id: "a1" }]);
        result.current.setAdmResults([{ id: "a1" }]);
      });

      expect(result.current.selectedEnterprise).toEqual([{ id: "e1" }]);
      expect(result.current.foundFarms).toEqual([{ id: "f1" }]);
      expect(result.current.foundAdms).toEqual([{ id: "a1" }]);
      expect(result.current.admResults).toEqual([{ id: "a1" }]);
    });
  });

  describe("loading derived from pendingTasks", () => {
    it("turns on while there are pending tasks", () => {
      const { result } = setup();

      act(() => {
        result.current.setPendingTasks(1);
      });

      expect(result.current.loading).toBe(true);
    });

    it("turns off when the counter is back to zero", () => {
      const { result } = setup();

      act(() => {
        result.current.setPendingTasks(2);
      });
      act(() => {
        result.current.setPendingTasks(0);
      });

      expect(result.current.loading).toBe(false);
    });

    it("accepts an updater function", () => {
      const { result } = setup();

      act(() => {
        result.current.setPendingTasks((prev) => prev + 3);
      });

      expect(result.current.pendingTasks).toBe(3);
      expect(result.current.loading).toBe(true);
    });
  });

  describe("handleYearStartEndChange", () => {
    it("sets both ends of the range", () => {
      const { result } = setup();

      act(() => {
        result.current.handleYearStartEndChange(2019, 2020);
      });

      expect(result.current.yearStart).toBe(2019);
      expect(result.current.yearEnd).toBe(2020);
    });

    it("keeps a stable identity", () => {
      const { result, rerender } = setup();
      const first = result.current.handleYearStartEndChange;

      rerender();

      expect(result.current.handleYearStartEndChange).toBe(first);
    });
  });

  describe("handleMapCreated", () => {
    it("stores the map instance in the shared ref", () => {
      const { result } = setup();
      const map = { fitBounds: jest.fn() };

      act(() => {
        result.current.handleMapCreated(map);
      });

      expect(result.current.mapRef.current).toBe(map);
    });
  });

  describe("resetSearchResults", () => {
    it("clears the selection, farms, adms and search text", () => {
      const { result } = setup();

      act(() => {
        result.current.setSelectedEnterprise([{ id: "e1" }]);
        result.current.setFoundFarms([{ id: "f1" }]);
        result.current.setFoundAdms([{ id: "a1" }]);
        result.current.setSearch("Meta");
      });
      act(() => {
        result.current.resetSearchResults();
      });

      expect(result.current.selectedEnterprise).toEqual([]);
      expect(result.current.foundFarms).toEqual([]);
      expect(result.current.foundAdms).toEqual([]);
      expect(result.current.search).toBe("");
    });
  });

  describe("handleAdmSearch", () => {
    it("does not search without a token", async () => {
      useAuth.mockReturnValue({ token: null });
      const { result } = setup();

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1");
      });

      expect(searchAdmByName).not.toHaveBeenCalled();
    });

    it("stores the results it finds", async () => {
      searchAdmByName.mockResolvedValue([{ id: "a1" }]);
      const { result } = setup();

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1");
      });

      expect(searchAdmByName).toHaveBeenCalledWith("test-token", "Meta", "adm1");
      expect(result.current.admResults).toEqual([{ id: "a1" }]);
    });

    it("stores nothing for an empty response", async () => {
      searchAdmByName.mockResolvedValue([]);
      const { result } = setup();

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1");
      });

      expect(result.current.admResults).toEqual([]);
    });

    it("stores nothing for a null response", async () => {
      searchAdmByName.mockResolvedValue(null);
      const { result } = setup();

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1");
      });

      expect(result.current.admResults).toEqual([]);
    });

    it("fits the shared map to the first geometry", async () => {
      searchAdmByName.mockResolvedValue([{ id: "a1", geometry: { type: "Polygon" } }]);
      const { result } = setup();
      const map = { fitBounds: jest.fn() };

      act(() => {
        result.current.handleMapCreated(map);
      });
      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1");
      });

      expect(mockGeoJSON).toHaveBeenCalledWith({ type: "Polygon" });
      expect(map.fitBounds).toHaveBeenCalledWith(mockBounds);
    });

    it("does not fit when the result has no geometry", async () => {
      searchAdmByName.mockResolvedValue([{ id: "a1" }]);
      const { result } = setup();
      const map = { fitBounds: jest.fn() };

      act(() => {
        result.current.handleMapCreated(map);
      });
      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1");
      });

      expect(map.fitBounds).not.toHaveBeenCalled();
    });

    it("does not fit when no map has been created", async () => {
      searchAdmByName.mockResolvedValue([{ id: "a1", geometry: { type: "Polygon" } }]);
      const { result } = setup();

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1");
      });

      expect(mockGeoJSON).not.toHaveBeenCalled();
      expect(result.current.admResults).toHaveLength(1);
    });

    it("catches and logs the search error", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      searchAdmByName.mockRejectedValue(new Error("down"));
      const { result } = setup();

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1");
      });

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("context value memoization", () => {
    it("keeps the same reference while nothing changes", () => {
      const { result, rerender } = setup();
      const first = result.current;

      rerender();

      expect(result.current).toBe(first);
    });

    it("produces a new reference when a filter changes", () => {
      const { result } = setup();
      const first = result.current;

      act(() => {
        result.current.setRisk("nad");
      });

      expect(result.current).not.toBe(first);
    });
  });
});

describe("useMapFiltersOptional", () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ token: "test-token" });
  });

  it("returns null outside the provider instead of throwing", () => {
    const { result } = renderHook(() => useMapFiltersOptional());
    expect(result.current).toBeNull();
  });

  it("returns the context inside the provider", () => {
    const { result } = renderHook(() => useMapFiltersOptional(), { wrapper });
    expect(result.current.risk).toBe("annual");
  });
});

describe("MapFiltersProvider", () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ token: "test-token" });
  });

  it("renders its children", () => {
    render(
      <MapFiltersProvider>
        <p>map screen</p>
      </MapFiltersProvider>
    );

    expect(screen.getByText("map screen")).toBeInTheDocument();
  });

  it("exports the raw context as the default export", () => {
    expect(MapFiltersContext).toBeDefined();
    expect(MapFiltersContext.Provider).toBeDefined();
  });
});
