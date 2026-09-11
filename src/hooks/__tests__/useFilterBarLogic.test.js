jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/apiService", () => ({
  fetchAnalysisYearRanges: jest.fn(),
  fetchFarmBySITCode: jest.fn(),
  fetchEnums: jest.fn(),
  searchAdmByName: jest.fn(),
  searchEnterprisesByName: jest.fn(),
}));

import { renderHook, act, waitFor } from "@testing-library/react";
import {
  fetchAnalysisYearRanges,
  fetchEnums,
  searchAdmByName,
  searchEnterprisesByName,
} from "@/services/apiService";
import {
  useEnterpriseSuggestions,
  useYearRanges,
  useAdmSuggestions,
  useSourceLabels,
} from "../useFilterBarLogic";
import { mockToken, silenceConsoleError } from "./helpers";

// Advances the fake timers and lets the await microtasks run.
const advance = async (ms) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

describe("useEnterpriseSuggestions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockToken();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("does not search", () => {
    it("when the search text is empty", async () => {
      renderHook(() => useEnterpriseSuggestions("", true));
      await advance(400);
      expect(searchEnterprisesByName).not.toHaveBeenCalled();
    });

    it("when enterprise mode is off", async () => {
      renderHook(() => useEnterpriseSuggestions("Frigo", false));
      await advance(400);
      expect(searchEnterprisesByName).not.toHaveBeenCalled();
    });

    it("when there is no token", async () => {
      mockToken(null);
      renderHook(() => useEnterpriseSuggestions("Frigo", true));
      await advance(400);
      expect(searchEnterprisesByName).not.toHaveBeenCalled();
    });

    it("and leaves the suggestion list empty", () => {
      const { result } = renderHook(() => useEnterpriseSuggestions("", true));
      expect(result.current.enterpriseSuggestions).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  describe("debounce", () => {
    it("does not search before the delay elapses", async () => {
      searchEnterprisesByName.mockResolvedValue([]);
      renderHook(() => useEnterpriseSuggestions("Frigo", true));

      await advance(399);
      expect(searchEnterprisesByName).not.toHaveBeenCalled();

      await advance(1);
      expect(searchEnterprisesByName).toHaveBeenCalledTimes(1);
    });

    it("honours a custom delay", async () => {
      searchEnterprisesByName.mockResolvedValue([]);
      renderHook(() => useEnterpriseSuggestions("Frigo", true, 1000));

      await advance(999);
      expect(searchEnterprisesByName).not.toHaveBeenCalled();

      await advance(1);
      expect(searchEnterprisesByName).toHaveBeenCalledTimes(1);
    });

    it("cancels the pending search when the text changes before the delay", async () => {
      searchEnterprisesByName.mockResolvedValue([]);
      const { rerender } = renderHook(({ s }) => useEnterpriseSuggestions(s, true), {
        initialProps: { s: "Fri" },
      });

      await advance(200);
      rerender({ s: "Frigo" });
      await advance(400);

      expect(searchEnterprisesByName).toHaveBeenCalledTimes(1);
      expect(searchEnterprisesByName).toHaveBeenCalledWith("test-token", "Frigo", null);
    });

    it("does not search when it unmounts before the delay", async () => {
      const { unmount } = renderHook(() => useEnterpriseSuggestions("Frigo", true));

      await advance(200);
      unmount();
      await advance(400);

      expect(searchEnterprisesByName).not.toHaveBeenCalled();
    });
  });

  describe("results", () => {
    it("passes the given activity along", async () => {
      searchEnterprisesByName.mockResolvedValue([]);
      renderHook(() => useEnterpriseSuggestions("Frigo", true, 400, "cacao"));

      await advance(400);
      expect(searchEnterprisesByName).toHaveBeenCalledWith("test-token", "Frigo", "cacao");
    });

    it("sorts the suggestions by name", async () => {
      searchEnterprisesByName.mockResolvedValue([
        { id: 3, name: "Zeta" },
        { id: 1, name: "Alfa" },
        { id: 2, name: "Beta" },
      ]);
      const { result } = renderHook(() => useEnterpriseSuggestions("a", true));

      await advance(400);
      expect(result.current.enterpriseSuggestions.map((e) => e.name)).toEqual([
        "Alfa",
        "Beta",
        "Zeta",
      ]);
    });

    it("puts enterprises without a name first", async () => {
      searchEnterprisesByName.mockResolvedValue([{ id: 1, name: "Alfa" }, { id: 2 }]);
      const { result } = renderHook(() => useEnterpriseSuggestions("a", true));

      await advance(400);
      expect(result.current.enterpriseSuggestions[0].id).toBe(2);
    });

    it("does not mutate the array received from the API", async () => {
      const original = [{ id: 2, name: "Zeta" }, { id: 1, name: "Alfa" }];
      searchEnterprisesByName.mockResolvedValue(original);
      renderHook(() => useEnterpriseSuggestions("a", true));

      await advance(400);
      expect(original.map((e) => e.name)).toEqual(["Zeta", "Alfa"]);
    });

    it("normalizes a null response to an empty list", async () => {
      searchEnterprisesByName.mockResolvedValue(null);
      const { result } = renderHook(() => useEnterpriseSuggestions("a", true));

      await advance(400);
      expect(result.current.enterpriseSuggestions).toEqual([]);
    });

    it("turns loading off when it finishes", async () => {
      searchEnterprisesByName.mockResolvedValue([]);
      const { result } = renderHook(() => useEnterpriseSuggestions("a", true));

      await advance(400);
      expect(result.current.loading).toBe(false);
    });

    it("allows replacing the suggestions from outside", async () => {
      searchEnterprisesByName.mockResolvedValue([]);
      const { result } = renderHook(() => useEnterpriseSuggestions("a", true));

      await advance(400);
      act(() => {
        result.current.setEnterpriseSuggestions([{ id: 9, name: "Manual" }]);
      });

      expect(result.current.enterpriseSuggestions).toEqual([{ id: 9, name: "Manual" }]);
    });

    it("empties the suggestions and logs the error on failure", async () => {
      const spy = silenceConsoleError();
      searchEnterprisesByName.mockRejectedValue(new Error("down"));
      const { result } = renderHook(() => useEnterpriseSuggestions("a", true));

      await advance(400);

      expect(result.current.enterpriseSuggestions).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("does not log the error in production", async () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      const spy = silenceConsoleError();
      searchEnterprisesByName.mockRejectedValue(new Error("down"));

      renderHook(() => useEnterpriseSuggestions("a", true));
      await advance(400);

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
      process.env.NODE_ENV = original;
    });
  });
});

describe("useAdmSuggestions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockToken();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not search without a search text", async () => {
    renderHook(() => useAdmSuggestions("", "adm1", true));
    await advance(400);
    expect(searchAdmByName).not.toHaveBeenCalled();
  });

  it("does not search when national mode is off", async () => {
    renderHook(() => useAdmSuggestions("Meta", "adm1", false));
    await advance(400);
    expect(searchAdmByName).not.toHaveBeenCalled();
  });

  it("does not search without a token", async () => {
    mockToken(null);
    renderHook(() => useAdmSuggestions("Meta", "adm1", true));
    await advance(400);
    expect(searchAdmByName).not.toHaveBeenCalled();
  });

  it("searches with the given adm level after the delay", async () => {
    searchAdmByName.mockResolvedValue([]);
    renderHook(() => useAdmSuggestions("Meta", "adm3", true));

    await advance(400);
    expect(searchAdmByName).toHaveBeenCalledWith("test-token", "Meta", "adm3");
  });

  it("honours a custom delay", async () => {
    searchAdmByName.mockResolvedValue([]);
    renderHook(() => useAdmSuggestions("Meta", "adm1", true, 800));

    await advance(799);
    expect(searchAdmByName).not.toHaveBeenCalled();
    await advance(1);
    expect(searchAdmByName).toHaveBeenCalledTimes(1);
  });

  it("sorts by label when present", async () => {
    searchAdmByName.mockResolvedValue([
      { id: 2, label: "Zeta" },
      { id: 1, label: "Alfa" },
    ]);
    const { result } = renderHook(() => useAdmSuggestions("a", "adm1", true));

    await advance(400);
    expect(result.current.admSuggestions.map((a) => a.label)).toEqual(["Alfa", "Zeta"]);
  });

  it("falls back to name when label is missing", async () => {
    searchAdmByName.mockResolvedValue([
      { id: 2, name: "Zeta" },
      { id: 1, name: "Alfa" },
    ]);
    const { result } = renderHook(() => useAdmSuggestions("a", "adm1", true));

    await advance(400);
    expect(result.current.admSuggestions.map((a) => a.name)).toEqual(["Alfa", "Zeta"]);
  });

  it("normalizes a null response to an empty list", async () => {
    searchAdmByName.mockResolvedValue(null);
    const { result } = renderHook(() => useAdmSuggestions("a", "adm1", true));

    await advance(400);
    expect(result.current.admSuggestions).toEqual([]);
  });

  it("cancels the pending search when the text changes", async () => {
    searchAdmByName.mockResolvedValue([]);
    const { rerender } = renderHook(({ s }) => useAdmSuggestions(s, "adm1", true), {
      initialProps: { s: "Me" },
    });

    await advance(200);
    rerender({ s: "Meta" });
    await advance(400);

    expect(searchAdmByName).toHaveBeenCalledTimes(1);
    expect(searchAdmByName).toHaveBeenCalledWith("test-token", "Meta", "adm1");
  });

  it("empties the suggestions and logs the error on failure", async () => {
    const spy = silenceConsoleError();
    searchAdmByName.mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useAdmSuggestions("a", "adm1", true));

    await advance(400);

    expect(result.current.admSuggestions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does not log the error in production", async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const spy = silenceConsoleError();
    searchAdmByName.mockRejectedValue(new Error("down"));

    renderHook(() => useAdmSuggestions("a", "adm1", true));
    await advance(400);

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    process.env.NODE_ENV = original;
  });

  it("allows replacing the suggestions from outside", async () => {
    searchAdmByName.mockResolvedValue([]);
    const { result } = renderHook(() => useAdmSuggestions("a", "adm1", true));

    await advance(400);
    act(() => {
      result.current.setAdmSuggestions([{ id: 9, label: "Manual" }]);
    });

    expect(result.current.admSuggestions).toEqual([{ id: 9, label: "Manual" }]);
  });
});

describe("useSourceLabels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToken();
  });

  it("does not fetch without a token", () => {
    mockToken(null);
    const { result } = renderHook(() => useSourceLabels());

    expect(fetchEnums).not.toHaveBeenCalled();
    expect(result.current.sourceLabels).toEqual([]);
  });

  it("fetches the source enum", async () => {
    fetchEnums.mockResolvedValue(["SIT_CODE"]);
    renderHook(() => useSourceLabels());

    await waitFor(() => expect(fetchEnums).toHaveBeenCalledWith("test-token", "source"));
  });

  it("stores the returned list", async () => {
    fetchEnums.mockResolvedValue(["SIT_CODE", "GEOFARMER_ID"]);
    const { result } = renderHook(() => useSourceLabels());

    await waitFor(() =>
      expect(result.current.sourceLabels).toEqual(["SIT_CODE", "GEOFARMER_ID"])
    );
    expect(result.current.loading).toBe(false);
  });

  it("ignores a response that is not an array", async () => {
    fetchEnums.mockResolvedValue({ not: "an-array" });
    const { result } = renderHook(() => useSourceLabels());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.sourceLabels).toEqual([]);
  });

  it("logs the error and turns loading off on failure", async () => {
    const spy = silenceConsoleError();
    fetchEnums.mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useSourceLabels());

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(result.current.sourceLabels).toEqual([]);
    expect(result.current.loading).toBe(false);
    spy.mockRestore();
  });

  it("fetches once a token arrives", async () => {
    fetchEnums.mockResolvedValue([]);
    mockToken(null);
    const { rerender } = renderHook(() => useSourceLabels());
    expect(fetchEnums).not.toHaveBeenCalled();

    mockToken("new-token");
    rerender();

    await waitFor(() => expect(fetchEnums).toHaveBeenCalledWith("new-token", "source"));
  });
});

describe("useYearRanges", () => {
  let setYear;
  let setPeriod;
  let onYearStartEndChange;

  const RANGES = [
    {
      id: 10,
      deforestation_period_start: "2023-01-01",
      deforestation_period_end: "2024-01-01",
    },
    {
      id: 11,
      deforestation_period_start: "2022-01-01",
      deforestation_period_end: "2023-01-01",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    setYear = jest.fn();
    setPeriod = jest.fn();
    onYearStartEndChange = jest.fn();
    mockToken();
  });

  const run = (source = "smbyc", risk = "annual", activity = null) =>
    renderHook(() =>
      useYearRanges(source, risk, "", setYear, setPeriod, onYearStartEndChange, activity)
    );

  it("does not fetch without a token", () => {
    mockToken(null);
    const { result } = run();

    expect(fetchAnalysisYearRanges).not.toHaveBeenCalled();
    expect(result.current.yearRanges).toEqual([]);
  });

  it("fetches with source, risk and activity", async () => {
    fetchAnalysisYearRanges.mockResolvedValue(RANGES);
    run("smbyc", "cumulative", "cacao");

    await waitFor(() =>
      expect(fetchAnalysisYearRanges).toHaveBeenCalledWith(
        "test-token",
        "smbyc",
        "cumulative",
        "cacao"
      )
    );
  });

  it("stores the returned ranges", async () => {
    fetchAnalysisYearRanges.mockResolvedValue(RANGES);
    const { result } = run();

    await waitFor(() => expect(result.current.yearRanges).toEqual(RANGES));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("auto-selects the first period", async () => {
    fetchAnalysisYearRanges.mockResolvedValue(RANGES);
    run();

    await waitFor(() => expect(setYear).toHaveBeenCalledWith("10"));
    expect(setPeriod).toHaveBeenCalledWith(RANGES[0]);
    expect(onYearStartEndChange).toHaveBeenCalledWith("2023-01-01", "2024-01-01");
  });

  it("clears the selection when there are no ranges", async () => {
    fetchAnalysisYearRanges.mockResolvedValue([]);
    run();

    await waitFor(() => expect(setYear).toHaveBeenCalledWith(""));
    expect(setPeriod).toHaveBeenCalledWith("");
    expect(onYearStartEndChange).toHaveBeenCalledWith(null, null);
  });

  it("treats a non-array response as an empty list", async () => {
    fetchAnalysisYearRanges.mockResolvedValue({ not: "an-array" });
    const { result } = run();

    await waitFor(() => expect(setYear).toHaveBeenCalledWith(""));
    expect(result.current.yearRanges).toEqual([]);
  });

  it("exposes the error message when the fetch fails", async () => {
    const spy = silenceConsoleError();
    fetchAnalysisYearRanges.mockRejectedValue(new Error("down"));
    const { result } = run();

    await waitFor(() => expect(result.current.error).toBe("Error al cargar años disponibles"));
    expect(result.current.loading).toBe(false);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("refetches when the risk changes", async () => {
    fetchAnalysisYearRanges.mockResolvedValue(RANGES);
    const { rerender } = renderHook(
      ({ risk }) => useYearRanges("smbyc", risk, "", setYear, setPeriod, onYearStartEndChange),
      { initialProps: { risk: "annual" } }
    );
    await waitFor(() => expect(fetchAnalysisYearRanges).toHaveBeenCalledTimes(1));

    rerender({ risk: "cumulative" });

    await waitFor(() => expect(fetchAnalysisYearRanges).toHaveBeenCalledTimes(2));
  });

  it("does not refetch when the parent recreates the callbacks", async () => {
    fetchAnalysisYearRanges.mockResolvedValue(RANGES);
    const { rerender } = renderHook(() =>
      useYearRanges(
        "smbyc",
        "annual",
        "",
        (v) => v,
        (v) => v,
        (a, b) => [a, b]
      )
    );
    await waitFor(() => expect(fetchAnalysisYearRanges).toHaveBeenCalledTimes(1));

    rerender();
    rerender();
    rerender();

    expect(fetchAnalysisYearRanges).toHaveBeenCalledTimes(1);
  });

  it("calls the current callback, not the one present at mount", async () => {
    fetchAnalysisYearRanges.mockResolvedValue(RANGES);
    const first = jest.fn();
    const second = jest.fn();

    const { rerender } = renderHook(
      ({ cb, risk }) => useYearRanges("smbyc", risk, "", cb, setPeriod, onYearStartEndChange),
      { initialProps: { cb: first, risk: "annual" } }
    );
    await waitFor(() => expect(first).toHaveBeenCalledWith("10"));

    // Swap the callback and, at the same time, a value that does trigger a refetch.
    rerender({ cb: second, risk: "cumulative" });

    await waitFor(() => expect(second).toHaveBeenCalledWith("10"));
    expect(first).toHaveBeenCalledTimes(1);
  });

  it("does not apply the result if it unmounts before resolving", async () => {
    let resolve;
    fetchAnalysisYearRanges.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );

    const { unmount } = run();
    await waitFor(() => expect(fetchAnalysisYearRanges).toHaveBeenCalled());

    unmount();
    await act(async () => {
      resolve(RANGES);
    });

    expect(setYear).not.toHaveBeenCalled();
    expect(setPeriod).not.toHaveBeenCalled();
  });
});
