jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/apiService", () => ({ fetchFarmPolygonsByIds: jest.fn() }));

import { renderHook, waitFor } from "@testing-library/react";
import { fetchFarmPolygonsByIds } from "@/services/apiService";
import { useFarmPolygons } from "../useFarmPolygons";
import { mockToken, makePendingTracker, silenceConsoleError } from "./helpers";

describe("useFarmPolygons", () => {
  let setFarmPolygons;
  let setOriginalMovement;
  let tracker;

  beforeEach(() => {
    jest.clearAllMocks();
    setFarmPolygons = jest.fn();
    setOriginalMovement = jest.fn();
    tracker = makePendingTracker();
    mockToken();
  });

  const run = (foundFarms, withMovement = true) =>
    renderHook(() =>
      useFarmPolygons(
        foundFarms,
        setFarmPolygons,
        tracker.setPendingTasks,
        withMovement ? setOriginalMovement : undefined
      )
    );

  describe("does not fetch and clears state", () => {
    it("when there is no token", () => {
      mockToken(null);
      run([{ id: "f1" }]);
      expect(fetchFarmPolygonsByIds).not.toHaveBeenCalled();
      expect(setFarmPolygons).toHaveBeenCalledWith([]);
      expect(setOriginalMovement).toHaveBeenCalledWith({});
    });

    it("when the farm list is empty", () => {
      run([]);
      expect(fetchFarmPolygonsByIds).not.toHaveBeenCalled();
      expect(setFarmPolygons).toHaveBeenCalledWith([]);
      expect(setOriginalMovement).toHaveBeenCalledWith({});
    });

    it("when the farm list is not an array", () => {
      run(null);
      expect(fetchFarmPolygonsByIds).not.toHaveBeenCalled();
      expect(setFarmPolygons).toHaveBeenCalledWith([]);
    });

    it("when no farm has a usable id", () => {
      run([{ id: null }, {}, { code: "code-only" }]);
      expect(fetchFarmPolygonsByIds).not.toHaveBeenCalled();
      expect(setFarmPolygons).toHaveBeenCalledWith([]);
      expect(setOriginalMovement).toHaveBeenCalledWith({});
    });

    // setOriginalMovement is optional: the farm maps pass it, others do not.
    it("does not fail when setOriginalMovement is omitted", () => {
      expect(() => run([], false)).not.toThrow();
      expect(setFarmPolygons).toHaveBeenCalledWith([]);
    });

    it("does not fail without setOriginalMovement when the token is missing", () => {
      mockToken(null);
      expect(() => run([{ id: "f1" }], false)).not.toThrow();
    });

    it("does not touch the task counter on the fast path", () => {
      run([]);
      expect(tracker.setPendingTasks).not.toHaveBeenCalled();
    });
  });

  describe("successful fetch", () => {
    it("fetches with the farm ids", async () => {
      fetchFarmPolygonsByIds.mockResolvedValue([]);

      run([{ id: "f1" }, { id: "f2" }]);

      await waitFor(() => expect(fetchFarmPolygonsByIds).toHaveBeenCalledTimes(1));
      expect(fetchFarmPolygonsByIds).toHaveBeenCalledWith("test-token", ["f1", "f2"]);
    });

    it("drops farms without an id and null entries", async () => {
      fetchFarmPolygonsByIds.mockResolvedValue([]);

      run([{ id: "f1" }, null, { id: null }, { id: "f2" }]);

      await waitFor(() => expect(fetchFarmPolygonsByIds).toHaveBeenCalled());
      expect(fetchFarmPolygonsByIds).toHaveBeenCalledWith("test-token", ["f1", "f2"]);
    });

    it("hands the polygons to the setter", async () => {
      const data = [{ type: "Feature" }];
      fetchFarmPolygonsByIds.mockResolvedValue(data);

      run([{ id: "f1" }]);

      await waitFor(() => expect(setFarmPolygons).toHaveBeenCalledWith(data));
    });

    it("leaves the pending-task counter at zero", async () => {
      fetchFarmPolygonsByIds.mockResolvedValue([]);

      run([{ id: "f1" }]);

      await waitFor(() => expect(tracker.state.value).toBe(0));
    });

    it("does not clear the movement when the fetch actually runs", async () => {
      fetchFarmPolygonsByIds.mockResolvedValue([]);

      run([{ id: "f1" }]);

      await waitFor(() => expect(fetchFarmPolygonsByIds).toHaveBeenCalled());
      expect(setOriginalMovement).not.toHaveBeenCalled();
    });
  });

  describe("when the fetch fails", () => {
    it("clears the polygons and logs the error", async () => {
      const spy = silenceConsoleError();
      fetchFarmPolygonsByIds.mockRejectedValue(new Error("down"));

      run([{ id: "f1" }]);

      await waitFor(() => expect(spy).toHaveBeenCalled());
      expect(setFarmPolygons).toHaveBeenLastCalledWith([]);
      expect(tracker.state.value).toBe(0);
      spy.mockRestore();
    });
  });

  describe("cancellation", () => {
    it("does not apply the result if it unmounts before resolving", async () => {
      let resolve;
      fetchFarmPolygonsByIds.mockReturnValue(
        new Promise((r) => {
          resolve = r;
        })
      );

      const { unmount } = run([{ id: "f1" }]);
      await waitFor(() => expect(fetchFarmPolygonsByIds).toHaveBeenCalled());

      unmount();
      resolve([{ type: "Feature" }]);

      await waitFor(() => expect(tracker.state.value).toBe(0));
      expect(setFarmPolygons).not.toHaveBeenCalled();
    });
  });
});
