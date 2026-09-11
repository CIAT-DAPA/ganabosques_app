jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/apiService", () => ({ searchAdmByName: jest.fn() }));

const mockBounds = { _bounds: true };
const mockGeoJSON = jest.fn(() => ({ getBounds: () => mockBounds }));
jest.mock("leaflet", () => ({
  geoJSON: (...args) => mockGeoJSON(...args),
  default: { geoJSON: (...args) => mockGeoJSON(...args) },
}));

import { renderHook, act } from "@testing-library/react";
import { searchAdmByName } from "@/services/apiService";
import { useFilterState } from "../useFilterState";
import { mockToken, silenceConsoleError } from "./helpers";

describe("useFilterState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToken();
  });

  describe("initial values", () => {
    it("uses the documented defaults", () => {
      const { result } = renderHook(() => useFilterState());

      expect(result.current.risk).toBe("annual");
      expect(result.current.year).toBe("");
      expect(result.current.period).toBe("");
      expect(result.current.source).toBe("smbyc");
      expect(result.current.search).toBe("");
      expect(result.current.admLevel).toBe("adm1");
      expect(result.current.sourceLabel).toBe("SIT_CODE");
      expect(result.current.yearStart).toBe(2023);
      expect(result.current.yearEnd).toBe(2024);
    });

    it("starts with no selections", () => {
      const { result } = renderHook(() => useFilterState());

      expect(result.current.selectedEnterprise).toBeNull();
      expect(result.current.foundFarms).toEqual([]);
      expect(result.current.foundAdms).toEqual([]);
      expect(result.current.admResults).toEqual([]);
    });

    it("accepts a different initial risk", () => {
      const { result } = renderHook(() => useFilterState("cumulative"));
      expect(result.current.risk).toBe("cumulative");
    });

    it("exposes the token from the auth context", () => {
      const { result } = renderHook(() => useFilterState());
      expect(result.current.token).toBe("test-token");
    });
  });

  describe("state setters", () => {
    it("updates the simple filters", () => {
      const { result } = renderHook(() => useFilterState());

      act(() => {
        result.current.setRisk("nad");
        result.current.setYear("2024");
        result.current.setSource("other");
        result.current.setSearch("Meta");
        result.current.setAdmLevel("adm3");
        result.current.setSourceLabel("GEOFARMER_ID");
      });

      expect(result.current.risk).toBe("nad");
      expect(result.current.year).toBe("2024");
      expect(result.current.source).toBe("other");
      expect(result.current.search).toBe("Meta");
      expect(result.current.admLevel).toBe("adm3");
      expect(result.current.sourceLabel).toBe("GEOFARMER_ID");
    });

    it("updates the period with an object", () => {
      const { result } = renderHook(() => useFilterState());
      const period = { id: 7, deforestation_period_start: "2023-01-01" };

      act(() => {
        result.current.setPeriod(period);
      });

      expect(result.current.period).toBe(period);
    });

    it("updates the selection collections", () => {
      const { result } = renderHook(() => useFilterState());

      act(() => {
        result.current.setSelectedEnterprise({ id: "e1" });
        result.current.setFoundFarms([{ id: "f1" }]);
        result.current.setFoundAdms([{ id: "a1" }]);
        result.current.setAdmResults([{ id: "a1" }]);
      });

      expect(result.current.selectedEnterprise).toEqual({ id: "e1" });
      expect(result.current.foundFarms).toEqual([{ id: "f1" }]);
      expect(result.current.foundAdms).toEqual([{ id: "a1" }]);
      expect(result.current.admResults).toEqual([{ id: "a1" }]);
    });
  });

  describe("handleYearStartEndChange", () => {
    it("sets both ends of the range", () => {
      const { result } = renderHook(() => useFilterState());

      act(() => {
        result.current.handleYearStartEndChange(2020, 2021);
      });

      expect(result.current.yearStart).toBe(2020);
      expect(result.current.yearEnd).toBe(2021);
    });

    it("accepts null on both ends", () => {
      const { result } = renderHook(() => useFilterState());

      act(() => {
        result.current.handleYearStartEndChange(null, null);
      });

      expect(result.current.yearStart).toBeNull();
      expect(result.current.yearEnd).toBeNull();
    });

    it("keeps its identity stable across renders", () => {
      const { result, rerender } = renderHook(() => useFilterState());
      const first = result.current.handleYearStartEndChange;

      rerender();

      expect(result.current.handleYearStartEndChange).toBe(first);
    });
  });

  describe("resetSearchResults", () => {
    it("clears the selection, farms, adms and the search text", () => {
      const { result } = renderHook(() => useFilterState());

      act(() => {
        result.current.setSelectedEnterprise({ id: "e1" });
        result.current.setFoundFarms([{ id: "f1" }]);
        result.current.setFoundAdms([{ id: "a1" }]);
        result.current.setSearch("Meta");
      });
      act(() => {
        result.current.resetSearchResults();
      });

      expect(result.current.selectedEnterprise).toBeNull();
      expect(result.current.foundFarms).toEqual([]);
      expect(result.current.foundAdms).toEqual([]);
      expect(result.current.search).toBe("");
    });

    // admResults is left alone: it holds the last response of the adm lookup,
    // independent of what the user has selected.
    it("does not clear admResults", () => {
      const { result } = renderHook(() => useFilterState());

      act(() => {
        result.current.setAdmResults([{ id: "a1" }]);
      });
      act(() => {
        result.current.resetSearchResults();
      });

      expect(result.current.admResults).toEqual([{ id: "a1" }]);
    });
  });

  describe("handleAdmSearch", () => {
    it("does not search without a token", async () => {
      mockToken(null);
      const { result } = renderHook(() => useFilterState());

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1", { current: null });
      });

      expect(searchAdmByName).not.toHaveBeenCalled();
    });

    it("searches and stores the results", async () => {
      const results = [{ id: "a1" }];
      searchAdmByName.mockResolvedValue(results);
      const { result } = renderHook(() => useFilterState());

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1", { current: null });
      });

      expect(searchAdmByName).toHaveBeenCalledWith("test-token", "Meta", "adm1");
      expect(result.current.admResults).toEqual(results);
    });

    it("stores nothing when the response is empty", async () => {
      searchAdmByName.mockResolvedValue([]);
      const { result } = renderHook(() => useFilterState());

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1", { current: null });
      });

      expect(result.current.admResults).toEqual([]);
    });

    it("stores nothing when the response is null", async () => {
      searchAdmByName.mockResolvedValue(null);
      const { result } = renderHook(() => useFilterState());

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1", { current: null });
      });

      expect(result.current.admResults).toEqual([]);
    });

    it("fits the map passed in as a parameter", async () => {
      searchAdmByName.mockResolvedValue([{ id: "a1", geometry: { type: "Polygon" } }]);
      const { result } = renderHook(() => useFilterState());
      const mapRef = { current: { fitBounds: jest.fn() } };

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1", mapRef);
      });

      expect(mockGeoJSON).toHaveBeenCalledWith({ type: "Polygon" });
      expect(mapRef.current.fitBounds).toHaveBeenCalledWith(mockBounds);
    });

    it("does not fit when the result carries no geometry", async () => {
      searchAdmByName.mockResolvedValue([{ id: "a1" }]);
      const { result } = renderHook(() => useFilterState());
      const mapRef = { current: { fitBounds: jest.fn() } };

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1", mapRef);
      });

      expect(mapRef.current.fitBounds).not.toHaveBeenCalled();
    });

    it("does not fail when mapRef is omitted", async () => {
      searchAdmByName.mockResolvedValue([{ id: "a1", geometry: { type: "Polygon" } }]);
      const { result } = renderHook(() => useFilterState());

      await act(async () => {
        await expect(result.current.handleAdmSearch("Meta", "adm1")).resolves.toBeUndefined();
      });

      expect(result.current.admResults).toHaveLength(1);
    });

    it("catches and logs the search error", async () => {
      const spy = silenceConsoleError();
      searchAdmByName.mockRejectedValue(new Error("down"));
      const { result } = renderHook(() => useFilterState());

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1", { current: null });
      });

      expect(spy).toHaveBeenCalled();
      expect(result.current.admResults).toEqual([]);
      spy.mockRestore();
    });
  });
});
