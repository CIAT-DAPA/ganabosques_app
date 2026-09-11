jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/apiService", () => ({ fetchAdm3DetailsByIds: jest.fn() }));

import { renderHook, waitFor } from "@testing-library/react";
import { fetchAdm3DetailsByIds } from "@/services/apiService";
import { useAdm3Details } from "../useAdm3Details";
import { mockToken, makePendingTracker, silenceConsoleError } from "./helpers";

describe("useAdm3Details", () => {
  let setAdm3Details;
  let tracker;

  beforeEach(() => {
    jest.clearAllMocks();
    setAdm3Details = jest.fn();
    tracker = makePendingTracker();
    mockToken();
  });

  const run = (adm3Risk) =>
    renderHook(() => useAdm3Details(adm3Risk, setAdm3Details, tracker.setPendingTasks));

  describe("does not fetch", () => {
    it("when adm3Risk is null", () => {
      run(null);
      expect(fetchAdm3DetailsByIds).not.toHaveBeenCalled();
    });

    it("when there is no token", () => {
      mockToken(null);
      run({ a: [{ adm3_id: "x" }] });
      expect(fetchAdm3DetailsByIds).not.toHaveBeenCalled();
    });

    it("when no usable adm3_id is present", () => {
      run({ a: [{ adm3_id: null }, {}] });
      expect(fetchAdm3DetailsByIds).not.toHaveBeenCalled();
    });

    it("when the risk object is empty", () => {
      run({});
      expect(fetchAdm3DetailsByIds).not.toHaveBeenCalled();
    });
  });

  describe("successful fetch", () => {
    it("flattens the groups and fetches with the ids found", async () => {
      fetchAdm3DetailsByIds.mockResolvedValue([{ id: "a1" }]);

      run({ g1: [{ adm3_id: "a1" }], g2: [{ adm3_id: "a2" }] });

      await waitFor(() => expect(fetchAdm3DetailsByIds).toHaveBeenCalledTimes(1));
      expect(fetchAdm3DetailsByIds).toHaveBeenCalledWith("test-token", ["a1", "a2"]);
    });

    it("deduplicates ids repeated across groups", async () => {
      fetchAdm3DetailsByIds.mockResolvedValue([]);

      run({ g1: [{ adm3_id: "a1" }, { adm3_id: "a1" }], g2: [{ adm3_id: "a1" }] });

      await waitFor(() => expect(fetchAdm3DetailsByIds).toHaveBeenCalled());
      expect(fetchAdm3DetailsByIds).toHaveBeenCalledWith("test-token", ["a1"]);
    });

    it("drops falsy adm3_id values and keeps the rest", async () => {
      fetchAdm3DetailsByIds.mockResolvedValue([]);

      run({ g1: [{ adm3_id: "a1" }, { adm3_id: null }, { adm3_id: "" }, { adm3_id: "a2" }] });

      await waitFor(() => expect(fetchAdm3DetailsByIds).toHaveBeenCalled());
      expect(fetchAdm3DetailsByIds).toHaveBeenCalledWith("test-token", ["a1", "a2"]);
    });

    it("hands the result to the setter", async () => {
      const data = [{ id: "a1", name: "Vereda 1" }];
      fetchAdm3DetailsByIds.mockResolvedValue(data);

      run({ g1: [{ adm3_id: "a1" }] });

      await waitFor(() => expect(setAdm3Details).toHaveBeenCalledWith(data));
    });

    it("leaves the pending-task counter balanced at zero", async () => {
      fetchAdm3DetailsByIds.mockResolvedValue([]);

      run({ g1: [{ adm3_id: "a1" }] });

      await waitFor(() => expect(tracker.state.value).toBe(0));
      expect(tracker.setPendingTasks).toHaveBeenCalledTimes(2);
    });
  });

  describe("when the fetch fails", () => {
    it("does not propagate the error and returns the counter to zero", async () => {
      const spy = silenceConsoleError();
      fetchAdm3DetailsByIds.mockRejectedValue(new Error("network down"));

      run({ g1: [{ adm3_id: "a1" }] });

      await waitFor(() => expect(tracker.state.value).toBe(0));
      expect(setAdm3Details).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it("logs the error outside production", async () => {
      const spy = silenceConsoleError();
      fetchAdm3DetailsByIds.mockRejectedValue(new Error("network down"));

      run({ g1: [{ adm3_id: "a1" }] });

      await waitFor(() => expect(spy).toHaveBeenCalled());
      expect(spy.mock.calls[0][0]).toContain("adm3 details");
      spy.mockRestore();
    });

    it("does not log the error in production", async () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      const spy = silenceConsoleError();
      fetchAdm3DetailsByIds.mockRejectedValue(new Error("network down"));

      run({ g1: [{ adm3_id: "a1" }] });

      await waitFor(() => expect(tracker.state.value).toBe(0));
      expect(spy).not.toHaveBeenCalled();

      spy.mockRestore();
      process.env.NODE_ENV = original;
    });
  });

  it("fetches once a token arrives", async () => {
    fetchAdm3DetailsByIds.mockResolvedValue([]);
    mockToken(null);

    const risk = { g1: [{ adm3_id: "a1" }] };
    const { rerender } = renderHook(() =>
      useAdm3Details(risk, setAdm3Details, tracker.setPendingTasks)
    );
    expect(fetchAdm3DetailsByIds).not.toHaveBeenCalled();

    mockToken("new-token");
    rerender();

    await waitFor(() => expect(fetchAdm3DetailsByIds).toHaveBeenCalledWith("new-token", ["a1"]));
  });
});
