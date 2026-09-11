jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/apiService", () => ({
  fetchMovementStatisticsByFarmIds: jest.fn(),
}));

import { renderHook, waitFor } from "@testing-library/react";
import { fetchMovementStatisticsByFarmIds } from "@/services/apiService";
import { useMovementStats } from "../useMovementStats";
import { mockToken, makePendingTracker, silenceConsoleError } from "./helpers";

// Arguments the API was called with: [token, ids, startDate, endDate].
const lastWindow = () => {
  const call = fetchMovementStatisticsByFarmIds.mock.calls.at(-1);
  return { start: call[2], end: call[3] };
};

describe("useMovementStats", () => {
  let setOriginalMovement;
  let tracker;
  const farms = [{ id: "f1" }];

  beforeEach(() => {
    jest.clearAllMocks();
    setOriginalMovement = jest.fn();
    tracker = makePendingTracker();
    mockToken();
    fetchMovementStatisticsByFarmIds.mockResolvedValue({});
  });

  const run = (foundFarms, period, risk) =>
    renderHook(() =>
      useMovementStats(foundFarms, setOriginalMovement, tracker.setPendingTasks, period, risk)
    );

  describe("does not fetch and clears the movement", () => {
    it("when there is no token", () => {
      mockToken(null);
      run(farms, { deforestation_period_start: "2023-06-15" }, "annual");
      expect(fetchMovementStatisticsByFarmIds).not.toHaveBeenCalled();
      expect(setOriginalMovement).toHaveBeenCalledWith({});
    });

    it("when the farm list is empty", () => {
      run([], {}, "annual");
      expect(fetchMovementStatisticsByFarmIds).not.toHaveBeenCalled();
      expect(setOriginalMovement).toHaveBeenCalledWith({});
    });

    it("when the farm list is not an array", () => {
      run(null, {}, "annual");
      expect(fetchMovementStatisticsByFarmIds).not.toHaveBeenCalled();
      expect(setOriginalMovement).toHaveBeenCalledWith({});
    });

    it("when no farm has a usable id", () => {
      run([{ id: null }, {}], {}, "annual");
      expect(fetchMovementStatisticsByFarmIds).not.toHaveBeenCalled();
      expect(setOriginalMovement).toHaveBeenCalledWith({});
    });
  });

  describe("date window for annual risk", () => {
    it("covers the full year of the period start", async () => {
      run(farms, { deforestation_period_start: "2023-06-15" }, "annual");

      await waitFor(() => expect(fetchMovementStatisticsByFarmIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: "2023-01-01", end: "2023-12-31" });
    });

    it("uses the UTC year when the period starts on January 1st", async () => {
      run(farms, { deforestation_period_start: "2023-01-01" }, "annual");

      await waitFor(() => expect(fetchMovementStatisticsByFarmIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: "2023-01-01", end: "2023-12-31" });
    });

    it("uses the UTC year for a Z-suffixed timestamp", async () => {
      run(farms, { deforestation_period_start: "2023-01-01T00:00:00Z" }, "annual");

      await waitFor(() => expect(fetchMovementStatisticsByFarmIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: "2023-01-01", end: "2023-12-31" });
    });

    it("matches the risk name regardless of case", async () => {
      run(farms, { deforestation_period_start: "2023-06-15" }, "ANNUAL");

      await waitFor(() => expect(fetchMovementStatisticsByFarmIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: "2023-01-01", end: "2023-12-31" });
    });

    it("falls back to the raw period range when the start date is invalid", async () => {
      run(
        farms,
        { deforestation_period_start: "no-date", deforestation_period_end: "2024-06-15" },
        "annual"
      );

      await waitFor(() => expect(fetchMovementStatisticsByFarmIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: null, end: "2024-06-15" });
    });
  });

  describe("date window for cumulative risk", () => {
    it("covers the year before the period end", async () => {
      run(farms, { deforestation_period_end: "2024-06-15" }, "cumulative");

      await waitFor(() => expect(fetchMovementStatisticsByFarmIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: "2023-01-01", end: "2023-12-31" });
    });

    it("uses the UTC year when the period ends on January 1st", async () => {
      run(farms, { deforestation_period_end: "2024-01-01" }, "cumulative");

      await waitFor(() => expect(fetchMovementStatisticsByFarmIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: "2023-01-01", end: "2023-12-31" });
    });

    it("falls back to the raw period range when the end date is invalid", async () => {
      run(
        farms,
        { deforestation_period_start: "2022-06-15", deforestation_period_end: "no-date" },
        "cumulative"
      );

      await waitFor(() => expect(fetchMovementStatisticsByFarmIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: "2022-06-15", end: null });
    });
  });

  describe("date window for other risks", () => {
    it("uses the range as-is for nad", async () => {
      run(
        farms,
        { deforestation_period_start: "2023-04-01", deforestation_period_end: "2023-06-30" },
        "nad"
      );

      await waitFor(() => expect(fetchMovementStatisticsByFarmIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: "2023-04-01", end: "2023-06-30" });
    });

    it("uses the range as-is for atd", async () => {
      run(
        farms,
        { deforestation_period_start: "2023-07-01", deforestation_period_end: "2023-09-30" },
        "atd"
      );

      await waitFor(() => expect(fetchMovementStatisticsByFarmIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: "2023-07-01", end: "2023-09-30" });
    });

    it("sends null when risk is undefined and there is no period", async () => {
      run(farms, undefined, undefined);

      await waitFor(() => expect(fetchMovementStatisticsByFarmIds).toHaveBeenCalled());
      expect(lastWindow()).toEqual({ start: null, end: null });
    });
  });

  describe("result", () => {
    it("hands the data to the setter", async () => {
      const data = { f1: { summary: {} } };
      fetchMovementStatisticsByFarmIds.mockResolvedValue(data);

      run(farms, { deforestation_period_start: "2023-06-15" }, "annual");

      await waitFor(() => expect(setOriginalMovement).toHaveBeenCalledWith(data));
    });

    it("normalizes an empty response to an empty object", async () => {
      fetchMovementStatisticsByFarmIds.mockResolvedValue(null);

      run(farms, { deforestation_period_start: "2023-06-15" }, "annual");

      await waitFor(() => expect(setOriginalMovement).toHaveBeenCalledWith({}));
    });

    it("leaves the pending-task counter at zero", async () => {
      run(farms, { deforestation_period_start: "2023-06-15" }, "annual");

      await waitFor(() => expect(tracker.state.value).toBe(0));
    });

    it("clears the movement and logs the error when the fetch fails", async () => {
      const spy = silenceConsoleError();
      fetchMovementStatisticsByFarmIds.mockRejectedValue(new Error("down"));

      run(farms, { deforestation_period_start: "2023-06-15" }, "annual");

      await waitFor(() => expect(spy).toHaveBeenCalled());
      expect(setOriginalMovement).toHaveBeenLastCalledWith({});
      expect(tracker.state.value).toBe(0);
      spy.mockRestore();
    });
  });

  describe("cancellation", () => {
    it("does not apply the result if it unmounts before resolving", async () => {
      let resolve;
      fetchMovementStatisticsByFarmIds.mockReturnValue(
        new Promise((r) => {
          resolve = r;
        })
      );

      const { unmount } = run(farms, { deforestation_period_start: "2023-06-15" }, "annual");
      await waitFor(() => expect(fetchMovementStatisticsByFarmIds).toHaveBeenCalled());

      unmount();
      resolve({ f1: {} });

      await waitFor(() => expect(tracker.state.value).toBe(0));
      expect(setOriginalMovement).not.toHaveBeenCalled();
    });
  });

  it("refetches when the risk type changes", async () => {
    const period = {
      deforestation_period_start: "2023-06-15",
      deforestation_period_end: "2024-06-15",
    };

    const { rerender } = renderHook(
      ({ risk }) =>
        useMovementStats(farms, setOriginalMovement, tracker.setPendingTasks, period, risk),
      { initialProps: { risk: "annual" } }
    );
    await waitFor(() => expect(fetchMovementStatisticsByFarmIds).toHaveBeenCalledTimes(1));
    expect(lastWindow()).toEqual({ start: "2023-01-01", end: "2023-12-31" });

    rerender({ risk: "cumulative" });

    await waitFor(() => expect(fetchMovementStatisticsByFarmIds).toHaveBeenCalledTimes(2));
    expect(lastWindow()).toEqual({ start: "2023-01-01", end: "2023-12-31" });
  });
});
