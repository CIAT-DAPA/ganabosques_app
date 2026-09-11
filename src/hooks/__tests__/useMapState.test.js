jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/apiService", () => ({ searchAdmByName: jest.fn() }));

// The hook does `await import("leaflet")`, so the mock exposes geoJSON both at
// the root and on default to cover CJS/ESM interop.
const mockBounds = { _bounds: true };
const mockGeoJSON = jest.fn(() => ({ getBounds: () => mockBounds }));
jest.mock("leaflet", () => ({
  geoJSON: (...args) => mockGeoJSON(...args),
  default: { geoJSON: (...args) => mockGeoJSON(...args) },
}));

import { renderHook, act } from "@testing-library/react";
import { searchAdmByName } from "@/services/apiService";
import { useMapState } from "../useMapState";
import { mockToken, silenceConsoleError } from "./helpers";

// Stand-in for the Leaflet map object the hook stores in mapRef.
const makeMap = () => ({
  fitBounds: jest.fn(),
  flyToBounds: jest.fn(),
  flyTo: jest.fn(),
});

describe("useMapState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToken();
  });

  it("starts with an empty mapRef", () => {
    const { result } = renderHook(() => useMapState());
    expect(result.current.mapRef.current).toBeNull();
  });

  it("handleMapCreated stores the map instance", () => {
    const { result } = renderHook(() => useMapState());
    const map = makeMap();

    act(() => {
      result.current.handleMapCreated(map);
    });

    expect(result.current.mapRef.current).toBe(map);
  });

  it("keeps the callback identities stable", () => {
    const { result, rerender } = renderHook(() => useMapState());
    const first = { ...result.current };

    rerender();

    expect(result.current.handleMapCreated).toBe(first.handleMapCreated);
    expect(result.current.flyToBounds).toBe(first.flyToBounds);
    expect(result.current.flyToCoordinates).toBe(first.flyToCoordinates);
  });

  describe("handleAdmSearch", () => {
    it("does not search without a token", async () => {
      mockToken(null);
      const { result } = renderHook(() => useMapState());
      const setAdmResults = jest.fn();

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1", setAdmResults);
      });

      expect(searchAdmByName).not.toHaveBeenCalled();
      expect(setAdmResults).not.toHaveBeenCalled();
    });

    it("searches with the given text and level", async () => {
      searchAdmByName.mockResolvedValue([{ id: "a1" }]);
      const { result } = renderHook(() => useMapState());

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1", jest.fn());
      });

      expect(searchAdmByName).toHaveBeenCalledWith("test-token", "Meta", "adm1");
    });

    it("hands the results to the setter", async () => {
      const results = [{ id: "a1" }];
      searchAdmByName.mockResolvedValue(results);
      const { result } = renderHook(() => useMapState());
      const setAdmResults = jest.fn();

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1", setAdmResults);
      });

      expect(setAdmResults).toHaveBeenCalledWith(results);
    });

    it("does not fail when setAdmResults is omitted", async () => {
      searchAdmByName.mockResolvedValue([{ id: "a1" }]);
      const { result } = renderHook(() => useMapState());

      await act(async () => {
        await expect(result.current.handleAdmSearch("Meta", "adm1")).resolves.toBeUndefined();
      });
    });

    it("bails out without touching the setter when there are no results", async () => {
      searchAdmByName.mockResolvedValue([]);
      const { result } = renderHook(() => useMapState());
      const setAdmResults = jest.fn();

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1", setAdmResults);
      });

      expect(setAdmResults).not.toHaveBeenCalled();
    });

    it("bails out without touching the setter when the response is null", async () => {
      searchAdmByName.mockResolvedValue(null);
      const { result } = renderHook(() => useMapState());
      const setAdmResults = jest.fn();

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1", setAdmResults);
      });

      expect(setAdmResults).not.toHaveBeenCalled();
    });

    it("fits the map to the geometry of the first result", async () => {
      searchAdmByName.mockResolvedValue([{ id: "a1", geometry: { type: "Polygon" } }]);
      const { result } = renderHook(() => useMapState());
      const map = makeMap();

      act(() => {
        result.current.handleMapCreated(map);
      });
      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1", jest.fn());
      });

      expect(mockGeoJSON).toHaveBeenCalledWith({ type: "Polygon" });
      expect(map.fitBounds).toHaveBeenCalledWith(mockBounds);
    });

    it("does not fit when the result carries no geometry", async () => {
      searchAdmByName.mockResolvedValue([{ id: "a1" }]);
      const { result } = renderHook(() => useMapState());
      const map = makeMap();

      act(() => {
        result.current.handleMapCreated(map);
      });
      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1", jest.fn());
      });

      expect(map.fitBounds).not.toHaveBeenCalled();
    });

    it("does not fit when there is no map yet", async () => {
      searchAdmByName.mockResolvedValue([{ id: "a1", geometry: { type: "Polygon" } }]);
      const { result } = renderHook(() => useMapState());
      const setAdmResults = jest.fn();

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1", setAdmResults);
      });

      expect(setAdmResults).toHaveBeenCalled();
      expect(mockGeoJSON).not.toHaveBeenCalled();
    });

    it("catches and logs the search error", async () => {
      const spy = silenceConsoleError();
      searchAdmByName.mockRejectedValue(new Error("down"));
      const { result } = renderHook(() => useMapState());

      await act(async () => {
        await result.current.handleAdmSearch("Meta", "adm1", jest.fn());
      });

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("flyToBounds", () => {
    it("does nothing without a map", async () => {
      const { result } = renderHook(() => useMapState());

      await act(async () => {
        await result.current.flyToBounds({ type: "Polygon" });
      });

      expect(mockGeoJSON).not.toHaveBeenCalled();
    });

    it("does nothing without a geojson", async () => {
      const { result } = renderHook(() => useMapState());
      const map = makeMap();

      act(() => {
        result.current.handleMapCreated(map);
      });
      await act(async () => {
        await result.current.flyToBounds(null);
      });

      expect(map.flyToBounds).not.toHaveBeenCalled();
    });

    it("flies to the bounds with the default padding", async () => {
      const { result } = renderHook(() => useMapState());
      const map = makeMap();

      act(() => {
        result.current.handleMapCreated(map);
      });
      await act(async () => {
        await result.current.flyToBounds({ type: "Polygon" });
      });

      expect(map.flyToBounds).toHaveBeenCalledWith(mockBounds, {
        padding: [50, 50],
        animate: true,
        duration: 1.5,
      });
    });

    it("accepts a custom padding", async () => {
      const { result } = renderHook(() => useMapState());
      const map = makeMap();

      act(() => {
        result.current.handleMapCreated(map);
      });
      await act(async () => {
        await result.current.flyToBounds({ type: "Polygon" }, [10, 20]);
      });

      expect(map.flyToBounds).toHaveBeenCalledWith(mockBounds, {
        padding: [10, 20],
        animate: true,
        duration: 1.5,
      });
    });

    it("catches and logs a Leaflet error", async () => {
      const spy = silenceConsoleError();
      mockGeoJSON.mockImplementationOnce(() => {
        throw new Error("invalid geometry");
      });
      const { result } = renderHook(() => useMapState());
      const map = makeMap();

      act(() => {
        result.current.handleMapCreated(map);
      });
      await act(async () => {
        await result.current.flyToBounds({ type: "Polygon" });
      });

      expect(spy).toHaveBeenCalled();
      expect(map.flyToBounds).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("flyToCoordinates", () => {
    it("does nothing without a map", () => {
      const { result } = renderHook(() => useMapState());
      expect(() => result.current.flyToCoordinates(4.6, -74.1)).not.toThrow();
    });

    it("flies to the coordinate with the default zoom", () => {
      const { result } = renderHook(() => useMapState());
      const map = makeMap();

      act(() => {
        result.current.handleMapCreated(map);
        result.current.flyToCoordinates(4.6, -74.1);
      });

      expect(map.flyTo).toHaveBeenCalledWith([4.6, -74.1], 12, {
        animate: true,
        duration: 1.5,
      });
    });

    it("accepts a custom zoom", () => {
      const { result } = renderHook(() => useMapState());
      const map = makeMap();

      act(() => {
        result.current.handleMapCreated(map);
        result.current.flyToCoordinates(4.6, -74.1, 16);
      });

      expect(map.flyTo).toHaveBeenCalledWith([4.6, -74.1], 16, {
        animate: true,
        duration: 1.5,
      });
    });
  });
});
