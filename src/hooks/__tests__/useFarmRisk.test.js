jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/apiService", () => ({
  fetchFarmRiskByAnalysisAndFarm: jest.fn(),
}));

import { renderHook, waitFor } from "@testing-library/react";
import { fetchFarmRiskByAnalysisAndFarm } from "@/services/apiService";
import { useFarmRisk } from "../useFarmRisk";
import { mockToken, makePendingTracker, silenceConsoleError } from "./helpers";

describe("useFarmRisk", () => {
  let setRiskFarm;
  let tracker;

  beforeEach(() => {
    jest.clearAllMocks();
    setRiskFarm = jest.fn();
    tracker = makePendingTracker();
    mockToken();
  });

  const run = (period, foundFarms) =>
    renderHook(() => useFarmRisk(period, foundFarms, setRiskFarm, tracker.setPendingTasks));

  describe("does not fetch and clears state", () => {
    it("when there is no token", () => {
      mockToken(null);
      run({ id: 1 }, [{ id: "f1" }]);
      expect(fetchFarmRiskByAnalysisAndFarm).not.toHaveBeenCalled();
      expect(setRiskFarm).toHaveBeenCalledWith([]);
    });

    it("when the period has no id", () => {
      run({}, [{ id: "f1" }]);
      expect(fetchFarmRiskByAnalysisAndFarm).not.toHaveBeenCalled();
      expect(setRiskFarm).toHaveBeenCalledWith([]);
    });

    it("when the period is null", () => {
      run(null, [{ id: "f1" }]);
      expect(fetchFarmRiskByAnalysisAndFarm).not.toHaveBeenCalled();
      expect(setRiskFarm).toHaveBeenCalledWith([]);
    });

    it("when the farm list is empty", () => {
      run({ id: 1 }, []);
      expect(fetchFarmRiskByAnalysisAndFarm).not.toHaveBeenCalled();
      expect(setRiskFarm).toHaveBeenCalledWith([]);
    });

    it("when the farm list is not an array", () => {
      run({ id: 1 }, null);
      expect(fetchFarmRiskByAnalysisAndFarm).not.toHaveBeenCalled();
      expect(setRiskFarm).toHaveBeenCalledWith([]);
    });

    it("when no farm has a usable id", () => {
      run({ id: 1 }, [{ id: null }, {}, null]);
      expect(fetchFarmRiskByAnalysisAndFarm).not.toHaveBeenCalled();
      expect(setRiskFarm).toHaveBeenCalledWith([]);
    });

    it("does not touch the task counter on the fast path", () => {
      run(null, []);
      expect(tracker.setPendingTasks).not.toHaveBeenCalled();
    });
  });

  describe("successful fetch", () => {
    it("sends the analysis id and the farm ids", async () => {
      fetchFarmRiskByAnalysisAndFarm.mockResolvedValue({});

      run({ id: 9 }, [{ id: "f1" }, { id: "f2" }]);

      await waitFor(() => expect(fetchFarmRiskByAnalysisAndFarm).toHaveBeenCalledTimes(1));
      expect(fetchFarmRiskByAnalysisAndFarm).toHaveBeenCalledWith("test-token", 9, ["f1", "f2"]);
    });

    it("drops farms without an id", async () => {
      fetchFarmRiskByAnalysisAndFarm.mockResolvedValue({});

      run({ id: 9 }, [{ id: "f1" }, { id: null }, { id: "f2" }]);

      await waitFor(() => expect(fetchFarmRiskByAnalysisAndFarm).toHaveBeenCalled());
      expect(fetchFarmRiskByAnalysisAndFarm).toHaveBeenCalledWith("test-token", 9, ["f1", "f2"]);
    });

    it("hands the result to the setter", async () => {
      const data = { f1: { items: [] } };
      fetchFarmRiskByAnalysisAndFarm.mockResolvedValue(data);

      run({ id: 1 }, [{ id: "f1" }]);

      await waitFor(() => expect(setRiskFarm).toHaveBeenCalledWith(data));
    });

    it("leaves the pending-task counter at zero", async () => {
      fetchFarmRiskByAnalysisAndFarm.mockResolvedValue({});

      run({ id: 1 }, [{ id: "f1" }]);

      await waitFor(() => expect(tracker.state.value).toBe(0));
    });
  });

  describe("when the fetch fails", () => {
    it("clears the risk and logs the error", async () => {
      const spy = silenceConsoleError();
      fetchFarmRiskByAnalysisAndFarm.mockRejectedValue(new Error("down"));

      run({ id: 1 }, [{ id: "f1" }]);

      await waitFor(() => expect(spy).toHaveBeenCalled());
      expect(setRiskFarm).toHaveBeenLastCalledWith([]);
      expect(tracker.state.value).toBe(0);
      spy.mockRestore();
    });
  });

  describe("cancellation", () => {
    it("does not apply the result if it unmounts before resolving", async () => {
      let resolve;
      fetchFarmRiskByAnalysisAndFarm.mockReturnValue(
        new Promise((r) => {
          resolve = r;
        })
      );

      const { unmount } = run({ id: 1 }, [{ id: "f1" }]);
      await waitFor(() => expect(fetchFarmRiskByAnalysisAndFarm).toHaveBeenCalled());

      unmount();
      resolve({ f1: {} });

      await waitFor(() => expect(tracker.state.value).toBe(0));
      expect(setRiskFarm).not.toHaveBeenCalled();
    });

    it("does not clear state if it unmounts before the rejection", async () => {
      const spy = silenceConsoleError();
      let reject;
      fetchFarmRiskByAnalysisAndFarm.mockReturnValue(
        new Promise((_, r) => {
          reject = r;
        })
      );

      const { unmount } = run({ id: 1 }, [{ id: "f1" }]);
      await waitFor(() => expect(fetchFarmRiskByAnalysisAndFarm).toHaveBeenCalled());

      unmount();
      reject(new Error("late"));

      await waitFor(() => expect(tracker.state.value).toBe(0));
      expect(spy).not.toHaveBeenCalled();
      expect(setRiskFarm).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  it("refetches when the farm list changes", async () => {
    fetchFarmRiskByAnalysisAndFarm.mockResolvedValue({});
    const period = { id: 1 };

    const { rerender } = renderHook(
      ({ farms }) => useFarmRisk(period, farms, setRiskFarm, tracker.setPendingTasks),
      { initialProps: { farms: [{ id: "f1" }] } }
    );
    await waitFor(() => expect(fetchFarmRiskByAnalysisAndFarm).toHaveBeenCalledTimes(1));

    rerender({ farms: [{ id: "f1" }, { id: "f2" }] });

    await waitFor(() => expect(fetchFarmRiskByAnalysisAndFarm).toHaveBeenCalledTimes(2));
    expect(fetchFarmRiskByAnalysisAndFarm).toHaveBeenLastCalledWith("test-token", 1, [
      "f1",
      "f2",
    ]);
  });
});
