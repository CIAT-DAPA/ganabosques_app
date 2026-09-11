import { renderHook, act } from "@testing-library/react";
import { useLoadingState } from "../useLoadingState";

describe("useLoadingState", () => {
  it("starts with no pending tasks and not loading", () => {
    const { result } = renderHook(() => useLoadingState());
    expect(result.current.pendingTasks).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it("startTask increments the counter and turns loading on", () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.startTask();
    });

    expect(result.current.pendingTasks).toBe(1);
    expect(result.current.loading).toBe(true);
  });

  it("accumulates concurrent tasks", () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.startTask();
      result.current.startTask();
      result.current.startTask();
    });

    expect(result.current.pendingTasks).toBe(3);
    expect(result.current.loading).toBe(true);
  });

  it("endTask decrements the counter", () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.startTask();
      result.current.startTask();
    });
    act(() => {
      result.current.endTask();
    });

    expect(result.current.pendingTasks).toBe(1);
    expect(result.current.loading).toBe(true);
  });

  it("turns loading off only when the last task closes", () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.startTask();
      result.current.startTask();
    });
    act(() => {
      result.current.endTask();
    });
    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.endTask();
    });
    expect(result.current.pendingTasks).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  // Math.max(0, ...) keeps an extra endTask from driving the counter negative,
  // which would hold loading off even once new tasks arrive.
  it("never drops below zero even with more endTask than startTask calls", () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.endTask();
      result.current.endTask();
    });

    expect(result.current.pendingTasks).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it("exposes setPendingTasks for direct control of the counter", () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.setPendingTasks(5);
    });

    expect(result.current.pendingTasks).toBe(5);
    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.setPendingTasks(0);
    });

    expect(result.current.loading).toBe(false);
  });

  it("accepts an updater function in setPendingTasks", () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.setPendingTasks((prev) => prev + 2);
    });

    expect(result.current.pendingTasks).toBe(2);
  });

  // Consumer hooks pass startTask/endTask as effect dependencies, so a changing
  // identity would re-run those effects.
  it("keeps startTask and endTask identities stable", () => {
    const { result, rerender } = renderHook(() => useLoadingState());
    const first = { start: result.current.startTask, end: result.current.endTask };

    rerender();

    expect(result.current.startTask).toBe(first.start);
    expect(result.current.endTask).toBe(first.end);
  });
});
