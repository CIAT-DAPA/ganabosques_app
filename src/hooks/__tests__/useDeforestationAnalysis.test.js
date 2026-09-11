jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/apiService", () => ({
  fetchFarmRiskByDeforestationId: jest.fn(),
}));

import { renderHook, waitFor } from "@testing-library/react";
import { fetchFarmRiskByDeforestationId } from "@/services/apiService";
import { useDeforestationAnalysis } from "../useDeforestationAnalysis";
import { mockToken, makePendingTracker, silenceConsoleError } from "./helpers";

describe("useDeforestationAnalysis", () => {
  let setAnalysis;
  let tracker;

  beforeEach(() => {
    jest.clearAllMocks();
    setAnalysis = jest.fn();
    tracker = makePendingTracker();
    mockToken();
  });

  const run = (period) =>
    renderHook(() => useDeforestationAnalysis(period, setAnalysis, tracker.setPendingTasks));

  describe("does not fetch and clears the analysis", () => {
    it("when there is no token", () => {
      mockToken(null);
      run({ deforestation_id: 5 });
      expect(fetchFarmRiskByDeforestationId).not.toHaveBeenCalled();
      expect(setAnalysis).toHaveBeenCalledWith([]);
    });

    it("when the period is null", () => {
      run(null);
      expect(fetchFarmRiskByDeforestationId).not.toHaveBeenCalled();
      expect(setAnalysis).toHaveBeenCalledWith([]);
    });

    it("when the period is an empty string", () => {
      run("");
      expect(fetchFarmRiskByDeforestationId).not.toHaveBeenCalled();
      expect(setAnalysis).toHaveBeenCalledWith([]);
    });

    it("when the period carries no deforestation_id", () => {
      run({ id: 1 });
      expect(fetchFarmRiskByDeforestationId).not.toHaveBeenCalled();
      expect(setAnalysis).toHaveBeenCalledWith([]);
    });

    it("does not touch the task counter on the fast path", () => {
      run(null);
      expect(tracker.setPendingTasks).not.toHaveBeenCalled();
    });
  });

  describe("successful fetch", () => {
    it("fetches with the period deforestation_id", async () => {
      fetchFarmRiskByDeforestationId.mockResolvedValue([]);

      run({ deforestation_id: 77 });

      await waitFor(() => expect(fetchFarmRiskByDeforestationId).toHaveBeenCalledTimes(1));
      expect(fetchFarmRiskByDeforestationId).toHaveBeenCalledWith("test-token", 77);
    });

    it("hands the result to the setter", async () => {
      const data = [{ farm_id: "f1" }];
      fetchFarmRiskByDeforestationId.mockResolvedValue(data);

      run({ deforestation_id: 77 });

      await waitFor(() => expect(setAnalysis).toHaveBeenCalledWith(data));
    });

    it("leaves the pending-task counter at zero", async () => {
      fetchFarmRiskByDeforestationId.mockResolvedValue([]);

      run({ deforestation_id: 77 });

      await waitFor(() => expect(tracker.state.value).toBe(0));
      expect(tracker.setPendingTasks).toHaveBeenCalledTimes(2);
    });
  });

  describe("when the fetch fails", () => {
    it("clears the analysis and logs the error", async () => {
      const spy = silenceConsoleError();
      fetchFarmRiskByDeforestationId.mockRejectedValue(new Error("down"));

      run({ deforestation_id: 77 });

      await waitFor(() => expect(spy).toHaveBeenCalled());
      expect(setAnalysis).toHaveBeenLastCalledWith([]);
      expect(tracker.state.value).toBe(0);
      spy.mockRestore();
    });
  });

  describe("cancellation", () => {
    it("does not apply the result if it unmounts before resolving", async () => {
      let resolve;
      fetchFarmRiskByDeforestationId.mockReturnValue(
        new Promise((r) => {
          resolve = r;
        })
      );

      const { unmount } = run({ deforestation_id: 77 });
      await waitFor(() => expect(fetchFarmRiskByDeforestationId).toHaveBeenCalled());

      unmount();
      resolve([{ farm_id: "f1" }]);

      await waitFor(() => expect(tracker.state.value).toBe(0));
      expect(setAnalysis).not.toHaveBeenCalled();
    });
  });

  it("refetches when the deforestation_id changes", async () => {
    fetchFarmRiskByDeforestationId.mockResolvedValue([]);

    const { rerender } = renderHook(
      ({ period }) => useDeforestationAnalysis(period, setAnalysis, tracker.setPendingTasks),
      { initialProps: { period: { deforestation_id: 1 } } }
    );
    await waitFor(() => expect(fetchFarmRiskByDeforestationId).toHaveBeenCalledTimes(1));

    rerender({ period: { deforestation_id: 2 } });

    await waitFor(() => expect(fetchFarmRiskByDeforestationId).toHaveBeenCalledTimes(2));
    expect(fetchFarmRiskByDeforestationId).toHaveBeenLastCalledWith("test-token", 2);
  });
});
