jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/apiService", () => ({
  fetchAnalysisYearRanges: jest.fn(),
  fetchFarmBySITCode: jest.fn(),
  fetchEnums: jest.fn(),
  searchAdmByName: jest.fn(),
  searchEnterprisesByName: jest.fn(),
}));

import { renderHook, act } from "@testing-library/react";
import { fetchFarmBySITCode } from "@/services/apiService";
import { useFarmCodeSearch } from "../useFilterBarLogic";
import { mockToken, silenceConsoleError } from "./helpers";

const advance = async (ms) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

// setFoundFarms receives an updater function; this applies it to a concrete
// previous state to check how it transforms the list.
const applyLastUpdate = (setFoundFarms, prev) => {
  const updater = setFoundFarms.mock.calls.at(-1)[0];
  return typeof updater === "function" ? updater(prev) : updater;
};

// The API returns the farm with its external codes keyed by source.
const apiFarm = (id, code, source = "SIT_CODE") => ({
  id,
  ext_id: [{ source, ext_code: code }],
});

describe("useFarmCodeSearch", () => {
  let setFoundFarms;
  let setToast;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    setFoundFarms = jest.fn();
    setToast = jest.fn();
    mockToken();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const run = (foundFarms, { farmRisk = true, activity = null, sourceLabel = null } = {}) =>
    renderHook(() =>
      useFarmCodeSearch(farmRisk, foundFarms, setFoundFarms, setToast, activity, sourceLabel)
    );

  describe("does not search", () => {
    it("when farm mode is off", async () => {
      run([{ code: "111" }], { farmRisk: false });
      await advance(500);
      expect(fetchFarmBySITCode).not.toHaveBeenCalled();
    });

    it("when the farm list is empty", async () => {
      run([]);
      await advance(500);
      expect(fetchFarmBySITCode).not.toHaveBeenCalled();
    });

    it("when there is no token", async () => {
      mockToken(null);
      run([{ code: "111" }]);
      await advance(500);
      expect(fetchFarmBySITCode).not.toHaveBeenCalled();
    });

    it("when every farm is already resolved with an id", async () => {
      run([{ id: "f1", code: "111" }]);
      await advance(500);
      expect(fetchFarmBySITCode).not.toHaveBeenCalled();
    });

    it("when the pending farms carry no code", async () => {
      run([{ code: "" }, {}]);
      await advance(500);
      expect(fetchFarmBySITCode).not.toHaveBeenCalled();
    });
  });

  describe("debounce", () => {
    it("waits 500 ms before searching", async () => {
      fetchFarmBySITCode.mockResolvedValue([apiFarm("f1", "111")]);
      run([{ code: "111" }]);

      await advance(499);
      expect(fetchFarmBySITCode).not.toHaveBeenCalled();

      await advance(1);
      expect(fetchFarmBySITCode).toHaveBeenCalledTimes(1);
    });

    it("cancels the pending search if it unmounts first", async () => {
      const { unmount } = run([{ code: "111" }]);

      await advance(300);
      unmount();
      await advance(500);

      expect(fetchFarmBySITCode).not.toHaveBeenCalled();
    });
  });

  describe("pending codes", () => {
    it("searches only the farms without an id", async () => {
      fetchFarmBySITCode.mockResolvedValue([apiFarm("f2", "222")]);
      run([{ id: "f1", code: "111" }, { code: "222" }]);

      await advance(500);
      expect(fetchFarmBySITCode).toHaveBeenCalledWith("test-token", "222", null, "SIT_CODE");
    });

    it("joins several pending codes with a comma", async () => {
      fetchFarmBySITCode.mockResolvedValue([apiFarm("f1", "111")]);
      run([{ code: "111" }, { code: "222" }, { code: "333" }]);

      await advance(500);
      expect(fetchFarmBySITCode).toHaveBeenCalledWith(
        "test-token",
        "111,222,333",
        null,
        "SIT_CODE"
      );
    });
  });

  describe("source label selection", () => {
    it("uses SIT_CODE by default", async () => {
      fetchFarmBySITCode.mockResolvedValue([apiFarm("f1", "111")]);
      run([{ code: "111" }]);

      await advance(500);
      expect(fetchFarmBySITCode.mock.calls[0][3]).toBe("SIT_CODE");
    });

    it("uses GEOFARMER_ID for the cacao activity", async () => {
      fetchFarmBySITCode.mockResolvedValue([apiFarm("f1", "111", "GEOFARMER_ID")]);
      run([{ code: "111" }], { activity: "cacao" });

      await advance(500);
      expect(fetchFarmBySITCode.mock.calls[0][3]).toBe("GEOFARMER_ID");
    });

    it("uses GEOFARMER_ID for the cafe activity", async () => {
      fetchFarmBySITCode.mockResolvedValue([apiFarm("f1", "111", "GEOFARMER_ID")]);
      run([{ code: "111" }], { activity: "cafe" });

      await advance(500);
      expect(fetchFarmBySITCode.mock.calls[0][3]).toBe("GEOFARMER_ID");
    });

    it("uses SIT_CODE for the ganaderia activity", async () => {
      fetchFarmBySITCode.mockResolvedValue([apiFarm("f1", "111")]);
      run([{ code: "111" }], { activity: "ganaderia" });

      await advance(500);
      expect(fetchFarmBySITCode.mock.calls[0][3]).toBe("SIT_CODE");
    });

    it("gives sourceLabel precedence over the activity", async () => {
      fetchFarmBySITCode.mockResolvedValue([apiFarm("f1", "111", "OTHER")]);
      run([{ code: "111" }], { activity: "cacao", sourceLabel: "OTHER" });

      await advance(500);
      expect(fetchFarmBySITCode.mock.calls[0][3]).toBe("OTHER");
    });

    it("passes the activity to the API", async () => {
      fetchFarmBySITCode.mockResolvedValue([apiFarm("f1", "111")]);
      run([{ code: "111" }], { activity: "cacao", sourceLabel: "SIT_CODE" });

      await advance(500);
      expect(fetchFarmBySITCode.mock.calls[0][2]).toBe("cacao");
    });
  });

  describe("when the API finds no farms", () => {
    it("warns with an alert toast", async () => {
      fetchFarmBySITCode.mockResolvedValue([]);
      run([{ code: "111" }]);

      await advance(500);
      expect(setToast).toHaveBeenCalledWith({
        type: "alert",
        message: "No se encontraron fincas para: 111",
      });
    });

    it("warns the same way when the response is null", async () => {
      fetchFarmBySITCode.mockResolvedValue(null);
      run([{ code: "111" }]);

      await advance(500);
      expect(setToast).toHaveBeenCalledWith(expect.objectContaining({ type: "alert" }));
    });

    it("removes the codes that do not exist from the list", async () => {
      fetchFarmBySITCode.mockResolvedValue([]);
      run([{ code: "111" }, { code: "222" }]);

      await advance(500);
      const next = applyLastUpdate(setFoundFarms, [
        { id: "f9", code: "999" },
        { code: "111" },
        { code: "222" },
      ]);
      expect(next).toEqual([{ id: "f9", code: "999" }]);
    });

    it("keeps already confirmed farms while discarding failed codes", async () => {
      fetchFarmBySITCode.mockResolvedValue([]);
      run([{ code: "111" }]);

      await advance(500);
      const next = applyLastUpdate(setFoundFarms, [
        { id: "f1", code: "aaa" },
        { code: "111" },
      ]);
      expect(next).toEqual([{ id: "f1", code: "aaa" }]);
    });
  });

  describe("when the API finds the farms", () => {
    it("replaces the pending entries with farms carrying id and code", async () => {
      fetchFarmBySITCode.mockResolvedValue([apiFarm("f1", "111")]);
      run([{ code: "111" }]);

      await advance(500);
      const next = applyLastUpdate(setFoundFarms, [{ code: "111" }]);
      expect(next).toEqual([
        { id: "f1", code: "111", ext_id: [{ source: "SIT_CODE", ext_code: "111" }] },
      ]);
    });

    it("takes the code from the effective source", async () => {
      fetchFarmBySITCode.mockResolvedValue([
        {
          id: "f1",
          ext_id: [
            { source: "SIT_CODE", ext_code: "sit-111" },
            { source: "GEOFARMER_ID", ext_code: "geo-111" },
          ],
        },
      ]);
      run([{ code: "geo-111" }], { activity: "cacao" });

      await advance(500);
      const next = applyLastUpdate(setFoundFarms, [{ code: "geo-111" }]);
      expect(next[0].code).toBe("geo-111");
    });

    it("leaves the code undefined when the effective source is absent from ext_id", async () => {
      fetchFarmBySITCode.mockResolvedValue([apiFarm("f1", "111", "OTHER_SOURCE")]);
      run([{ code: "111" }]);

      await advance(500);
      const next = applyLastUpdate(setFoundFarms, [{ code: "111" }]);
      expect(next[0].code).toBeUndefined();
      expect(next[0].id).toBe("f1");
    });

    it("keeps already confirmed farms and appends the new ones", async () => {
      fetchFarmBySITCode.mockResolvedValue([apiFarm("f2", "222")]);
      run([{ id: "f1", code: "111" }, { code: "222" }]);

      await advance(500);
      const next = applyLastUpdate(setFoundFarms, [
        { id: "f1", code: "111" },
        { code: "222" },
      ]);
      expect(next.map((f) => f.id)).toEqual(["f1", "f2"]);
    });

    it("does not duplicate a farm that was already confirmed", async () => {
      fetchFarmBySITCode.mockResolvedValue([apiFarm("f1", "111")]);
      run([{ id: "f1", code: "111" }, { code: "111" }]);

      await advance(500);
      const next = applyLastUpdate(setFoundFarms, [
        { id: "f1", code: "111" },
        { code: "111" },
      ]);
      expect(next).toHaveLength(1);
      expect(next[0].id).toBe("f1");
    });

    it("emits no toast on the happy path", async () => {
      fetchFarmBySITCode.mockResolvedValue([apiFarm("f1", "111")]);
      run([{ code: "111" }]);

      await advance(500);
      expect(setToast).not.toHaveBeenCalled();
    });
  });

  describe("when the search fails", () => {
    it("warns with a toast naming the codes", async () => {
      const spy = silenceConsoleError();
      fetchFarmBySITCode.mockRejectedValue(new Error("down"));
      run([{ code: "111" }]);

      await advance(500);
      expect(setToast).toHaveBeenCalledWith({
        type: "alert",
        message: "Error de red al buscar los códigos",
      });
      spy.mockRestore();
    });

    it("names the source label in the toast when it is known", async () => {
      const spy = silenceConsoleError();
      fetchFarmBySITCode.mockRejectedValue(new Error("down"));
      run([{ code: "111" }], { sourceLabel: "GEOFARMER_ID" });

      await advance(500);
      expect(setToast).toHaveBeenCalledWith({
        type: "alert",
        message: "Error de red al buscar los GEOFARMER_ID",
      });
      spy.mockRestore();
    });

    it("leaves the farm list untouched", async () => {
      const spy = silenceConsoleError();
      fetchFarmBySITCode.mockRejectedValue(new Error("down"));
      run([{ code: "111" }]);

      await advance(500);
      expect(setFoundFarms).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it("logs the error outside production", async () => {
      const spy = silenceConsoleError();
      fetchFarmBySITCode.mockRejectedValue(new Error("down"));
      run([{ code: "111" }]);

      await advance(500);
      expect(spy).toHaveBeenCalledWith("Error fetching farm code:", expect.any(Error));
      spy.mockRestore();
    });

    it("does not log the error in production", async () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      const spy = silenceConsoleError();
      fetchFarmBySITCode.mockRejectedValue(new Error("down"));

      run([{ code: "111" }]);
      await advance(500);

      expect(spy).not.toHaveBeenCalled();
      expect(setToast).toHaveBeenCalled();
      spy.mockRestore();
      process.env.NODE_ENV = original;
    });
  });
});
