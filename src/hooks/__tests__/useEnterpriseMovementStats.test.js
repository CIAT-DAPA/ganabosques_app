jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/apiService", () => ({
  fetchMovementStatisticsByEnterpriseIds: jest.fn(),
}));

import { renderHook, waitFor } from "@testing-library/react";
import { fetchMovementStatisticsByEnterpriseIds } from "@/services/apiService";
import { useEnterpriseMovementStats } from "../useEnterpriseMovementStats";
import { mockToken, makePendingTracker, silenceConsoleError } from "./helpers";

const lastWindow = () => {
  const call = fetchMovementStatisticsByEnterpriseIds.mock.calls.at(-1);
  return { start: call[2], end: call[3] };
};

describe("useEnterpriseMovementStats", () => {
  let tracker;
  const ids = ["e1", "e2"];

  beforeEach(() => {
    jest.clearAllMocks();
    tracker = makePendingTracker();
    mockToken();
    fetchMovementStatisticsByEnterpriseIds.mockResolvedValue({});
  });

  const run = (enterpriseIds, period, risk, withTracker = true) =>
    renderHook(() =>
      useEnterpriseMovementStats(
        enterpriseIds,
        period,
        risk,
        withTracker ? tracker.setPendingTasks : undefined
      )
    );

  describe("initial state and fast paths", () => {
    it("starts with an empty object", () => {
      const { result } = run([], {}, "annual");
      expect(result.current).toEqual({});
    });

    it("does not fetch without a token", () => {
      mockToken(null);
      const { result } = run(ids, { deforestation_period_start: "2023-06-15" }, "annual");
      expect(fetchMovementStatisticsByEnterpriseIds).not.toHaveBeenCalled();
      expect(result.current).toEqual({});
    });

    it("does not fetch when the enterprise list is empty", () => {
      run([], {}, "annual");
      expect(fetchMovementStatisticsByEnterpriseIds).not.toHaveBeenCalled();
    });

    it("does not fetch when the list is not an array", () => {
      run(null, {}, "annual");
      expect(fetchMovementStatisticsByEnterpriseIds).not.toHaveBeenCalled();
    });

    it("does not fetch when every id is falsy", () => {
      run([null, undefined, ""], {}, "annual");
      expect(fetchMovementStatisticsByEnterpriseIds).not.toHaveBeenCalled();
    });

    it("drops falsy ids and fetches with the rest", async () => {
      run(["e1", null, "", "e2"], { deforestation_period_start: "2023-06-15" }, "annual");

      await waitFor(() => expect(fetchMovementStatisticsByEnterpriseIds).toHaveBeenCalled());
      expect(fetchMovementStatisticsByEnterpriseIds.mock.calls[0][1]).toEqual(["e1", "e2"]);
    });
  });

  describe("date window", () => {
    it("covers the full year of the start for annual risk", async () => {
      run(ids, { deforestation_period_start: "2023-06-15" }, "annual");

      await waitFor(() => expect(fetchMovementStatisticsByEnterpriseIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: "2023-01-01", end: "2023-12-31" });
    });

    it("uses the UTC year when the period starts on January 1st", async () => {
      run(ids, { deforestation_period_start: "2023-01-01" }, "annual");

      await waitFor(() => expect(fetchMovementStatisticsByEnterpriseIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: "2023-01-01", end: "2023-12-31" });
    });

    it("covers the year before the end for cumulative risk", async () => {
      run(ids, { deforestation_period_end: "2024-06-15" }, "cumulative");

      await waitFor(() => expect(fetchMovementStatisticsByEnterpriseIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: "2023-01-01", end: "2023-12-31" });
    });

    it("uses the UTC year when the period ends on January 1st", async () => {
      run(ids, { deforestation_period_end: "2024-01-01" }, "cumulative");

      await waitFor(() => expect(fetchMovementStatisticsByEnterpriseIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: "2023-01-01", end: "2023-12-31" });
    });

    it("uses the raw range for other risks", async () => {
      run(
        ids,
        { deforestation_period_start: "2023-04-01", deforestation_period_end: "2023-06-30" },
        "nad"
      );

      await waitFor(() => expect(fetchMovementStatisticsByEnterpriseIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: "2023-04-01", end: "2023-06-30" });
    });

    it("falls back to the raw range when the annual start date is invalid", async () => {
      run(
        ids,
        { deforestation_period_start: "no-date", deforestation_period_end: "2024-06-15" },
        "annual"
      );

      await waitFor(() => expect(fetchMovementStatisticsByEnterpriseIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: null, end: "2024-06-15" });
    });

    it("falls back to the raw range when the cumulative end date is invalid", async () => {
      run(
        ids,
        { deforestation_period_start: "2022-06-15", deforestation_period_end: "no-date" },
        "cumulative"
      );

      await waitFor(() => expect(fetchMovementStatisticsByEnterpriseIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: "2022-06-15", end: null });
    });

    it("sends null when there is neither period nor risk", async () => {
      run(ids, undefined, undefined);

      await waitFor(() => expect(fetchMovementStatisticsByEnterpriseIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: null, end: null });
    });
  });

  describe("result", () => {
    it("returns the statistics it fetched", async () => {
      const data = { e1: { total_movements: 4 } };
      fetchMovementStatisticsByEnterpriseIds.mockResolvedValue(data);

      const { result } = run(ids, { deforestation_period_start: "2023-06-15" }, "annual");

      await waitFor(() => expect(result.current).toEqual(data));
    });

    it("normalizes a null response to an empty object", async () => {
      fetchMovementStatisticsByEnterpriseIds.mockResolvedValue(null);

      const { result } = run(ids, { deforestation_period_start: "2023-06-15" }, "annual");

      await waitFor(() => expect(fetchMovementStatisticsByEnterpriseIds).toHaveBeenCalled());
      expect(result.current).toEqual({});
    });

    it("leaves the pending-task counter at zero", async () => {
      run(ids, { deforestation_period_start: "2023-06-15" }, "annual");

      await waitFor(() => expect(tracker.state.value).toBe(0));
      expect(tracker.setPendingTasks).toHaveBeenCalledTimes(2);
    });

    // setPendingTasks is called with ?. because not every consumer passes it.
    it("works without setPendingTasks", async () => {
      const data = { e1: {} };
      fetchMovementStatisticsByEnterpriseIds.mockResolvedValue(data);

      const { result } = run(ids, { deforestation_period_start: "2023-06-15" }, "annual", false);

      await waitFor(() => expect(result.current).toEqual(data));
    });

    it("falls back to an empty object and logs the error when the fetch fails", async () => {
      const spy = silenceConsoleError();
      fetchMovementStatisticsByEnterpriseIds.mockRejectedValue(new Error("down"));

      const { result } = run(ids, { deforestation_period_start: "2023-06-15" }, "annual");

      await waitFor(() => expect(spy).toHaveBeenCalled());
      expect(result.current).toEqual({});
      expect(tracker.state.value).toBe(0);
      spy.mockRestore();
    });
  });

  describe("cancellation", () => {
    it("does not apply the result if it unmounts before resolving", async () => {
      let resolve;
      fetchMovementStatisticsByEnterpriseIds.mockReturnValue(
        new Promise((r) => {
          resolve = r;
        })
      );

      const { unmount } = run(ids, { deforestation_period_start: "2023-06-15" }, "annual");
      await waitFor(() => expect(fetchMovementStatisticsByEnterpriseIds).toHaveBeenCalled());

      unmount();
      resolve({ e1: {} });

      await waitFor(() => expect(tracker.state.value).toBe(0));
    });
  });

  it("clears the statistics when the enterprise list goes away", async () => {
    const data = { e1: { total_movements: 1 } };
    fetchMovementStatisticsByEnterpriseIds.mockResolvedValue(data);
    const period = { deforestation_period_start: "2023-06-15" };

    const { result, rerender } = renderHook(
      ({ list }) => useEnterpriseMovementStats(list, period, "annual", tracker.setPendingTasks),
      { initialProps: { list: ids } }
    );
    await waitFor(() => expect(result.current).toEqual(data));

    rerender({ list: [] });

    await waitFor(() => expect(result.current).toEqual({}));
  });
});
