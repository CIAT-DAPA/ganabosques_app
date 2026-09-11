jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/apiService", () => ({
  fetchAdm3RisksByAnalysisAndAdm3: jest.fn(),
}));

import { renderHook, waitFor } from "@testing-library/react";
import { fetchAdm3RisksByAnalysisAndAdm3 } from "@/services/apiService";
import { useAdm3Risk } from "../useAdm3Risk";
import { mockToken, makePendingTracker, silenceConsoleError } from "./helpers";

describe("useAdm3Risk", () => {
  let setAdm3Risk;
  let tracker;

  beforeEach(() => {
    jest.clearAllMocks();
    setAdm3Risk = jest.fn();
    tracker = makePendingTracker();
    mockToken();
  });

  const run = (period, foundAdms) =>
    renderHook(() => useAdm3Risk(period, foundAdms, setAdm3Risk, tracker.setPendingTasks));

  describe("does not fetch", () => {
    it("when there is no token", () => {
      mockToken(null);
      run({ id: 1 }, [{ id: "a1" }]);
      expect(fetchAdm3RisksByAnalysisAndAdm3).not.toHaveBeenCalled();
    });

    it("when the period has no id", () => {
      run({}, [{ id: "a1" }]);
      expect(fetchAdm3RisksByAnalysisAndAdm3).not.toHaveBeenCalled();
    });

    it("when the period is null", () => {
      run(null, [{ id: "a1" }]);
      expect(fetchAdm3RisksByAnalysisAndAdm3).not.toHaveBeenCalled();
    });

    it("when the adm list is empty", () => {
      run({ id: 1 }, []);
      expect(fetchAdm3RisksByAnalysisAndAdm3).not.toHaveBeenCalled();
    });

    it("when the adm list is null", () => {
      run({ id: 1 }, null);
      expect(fetchAdm3RisksByAnalysisAndAdm3).not.toHaveBeenCalled();
    });

    it("when no adm has a usable id", () => {
      run({ id: 1 }, [{ id: null }, {}]);
      expect(fetchAdm3RisksByAnalysisAndAdm3).not.toHaveBeenCalled();
    });

    // Unlike the rest of the family, this hook does not clear state when it
    // cannot fetch: it keeps the last result on screen.
    it("and does not reset the previous state either", () => {
      run(null, []);
      expect(setAdm3Risk).not.toHaveBeenCalled();
    });
  });

  describe("successful fetch", () => {
    it("sends the analysis id and the adm ids", async () => {
      fetchAdm3RisksByAnalysisAndAdm3.mockResolvedValue({});

      run({ id: 42 }, [{ id: "a1" }, { id: "a2" }]);

      await waitFor(() => expect(fetchAdm3RisksByAnalysisAndAdm3).toHaveBeenCalledTimes(1));
      expect(fetchAdm3RisksByAnalysisAndAdm3).toHaveBeenCalledWith("test-token", 42, [
        "a1",
        "a2",
      ]);
    });

    it("drops adms without an id", async () => {
      fetchAdm3RisksByAnalysisAndAdm3.mockResolvedValue({});

      run({ id: 42 }, [{ id: "a1" }, { id: null }, { id: "a2" }]);

      await waitFor(() => expect(fetchAdm3RisksByAnalysisAndAdm3).toHaveBeenCalled());
      expect(fetchAdm3RisksByAnalysisAndAdm3).toHaveBeenCalledWith("test-token", 42, [
        "a1",
        "a2",
      ]);
    });

    it("hands the result to the setter", async () => {
      const data = { a1: [{ risk_total: true }] };
      fetchAdm3RisksByAnalysisAndAdm3.mockResolvedValue(data);

      run({ id: 1 }, [{ id: "a1" }]);

      await waitFor(() => expect(setAdm3Risk).toHaveBeenCalledWith(data));
    });

    it("leaves the pending-task counter at zero", async () => {
      fetchAdm3RisksByAnalysisAndAdm3.mockResolvedValue({});

      run({ id: 1 }, [{ id: "a1" }]);

      await waitFor(() => expect(tracker.state.value).toBe(0));
    });
  });

  describe("when the fetch fails", () => {
    it("logs the error and returns the counter to zero", async () => {
      const spy = silenceConsoleError();
      fetchAdm3RisksByAnalysisAndAdm3.mockRejectedValue(new Error("down"));

      run({ id: 1 }, [{ id: "a1" }]);

      await waitFor(() => expect(spy).toHaveBeenCalled());
      expect(tracker.state.value).toBe(0);
      expect(setAdm3Risk).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("cancellation", () => {
    it("does not apply the result if the hook unmounts before it resolves", async () => {
      let resolve;
      fetchAdm3RisksByAnalysisAndAdm3.mockReturnValue(
        new Promise((r) => {
          resolve = r;
        })
      );

      const { unmount } = run({ id: 1 }, [{ id: "a1" }]);
      await waitFor(() => expect(fetchAdm3RisksByAnalysisAndAdm3).toHaveBeenCalled());

      unmount();
      resolve({ a1: [] });

      await waitFor(() => expect(tracker.state.value).toBe(0));
      expect(setAdm3Risk).not.toHaveBeenCalled();
    });

    it("does not log the error if it unmounts before the rejection", async () => {
      const spy = silenceConsoleError();
      let reject;
      fetchAdm3RisksByAnalysisAndAdm3.mockReturnValue(
        new Promise((_, r) => {
          reject = r;
        })
      );

      const { unmount } = run({ id: 1 }, [{ id: "a1" }]);
      await waitFor(() => expect(fetchAdm3RisksByAnalysisAndAdm3).toHaveBeenCalled());

      unmount();
      reject(new Error("late"));

      await waitFor(() => expect(tracker.state.value).toBe(0));
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  it("refetches when the period changes", async () => {
    fetchAdm3RisksByAnalysisAndAdm3.mockResolvedValue({});
    const adms = [{ id: "a1" }];

    const { rerender } = renderHook(
      ({ period }) => useAdm3Risk(period, adms, setAdm3Risk, tracker.setPendingTasks),
      { initialProps: { period: { id: 1 } } }
    );
    await waitFor(() => expect(fetchAdm3RisksByAnalysisAndAdm3).toHaveBeenCalledTimes(1));

    rerender({ period: { id: 2 } });

    await waitFor(() => expect(fetchAdm3RisksByAnalysisAndAdm3).toHaveBeenCalledTimes(2));
    expect(fetchAdm3RisksByAnalysisAndAdm3).toHaveBeenLastCalledWith("test-token", 2, ["a1"]);
  });
});
