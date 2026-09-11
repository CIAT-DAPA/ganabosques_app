import { renderHook } from "@testing-library/react";
import { useFilteredMovement } from "../useFilteredMovement";

// Shape the hook guarantees for inputs/outputs when the API omits them.
const EMPTY_FLOW = {
  farms: [],
  enterprises: [],
  statistics: {},
  movements_by_type: {},
  total_movements: 0,
};

describe("useFilteredMovement", () => {
  describe("unusable input", () => {
    it("returns an empty object for undefined", () => {
      const { result } = renderHook(() => useFilteredMovement(undefined));
      expect(result.current).toEqual({});
    });

    it("returns an empty object for null", () => {
      const { result } = renderHook(() => useFilteredMovement(null));
      expect(result.current).toEqual({});
    });

    it("returns an empty object for non-object values", () => {
      expect(renderHook(() => useFilteredMovement("text")).result.current).toEqual({});
      expect(renderHook(() => useFilteredMovement(42)).result.current).toEqual({});
      expect(renderHook(() => useFilteredMovement(true)).result.current).toEqual({});
    });

    it("returns an empty object for an object with no farms", () => {
      const { result } = renderHook(() => useFilteredMovement({}));
      expect(result.current).toEqual({});
    });
  });

  describe("per-farm normalization", () => {
    it("fills in summary, inputs, outputs and mixed when missing", () => {
      const { result } = renderHook(() => useFilteredMovement({ f1: {} }));

      expect(result.current.f1).toEqual({
        summary: {},
        inputs: EMPTY_FLOW,
        outputs: EMPTY_FLOW,
        mixed: { farms: [], enterprises: [] },
      });
    });

    it("keeps the values the response does provide", () => {
      const movement = {
        f1: {
          summary: { total: 3 },
          inputs: {
            farms: [{ id: "a" }],
            enterprises: [{ id: "e" }],
            statistics: { n: 1 },
            movements_by_type: { FARM: 2 },
            total_movements: 5,
          },
          outputs: {
            farms: [],
            enterprises: [{ id: "e2" }],
            statistics: {},
            movements_by_type: {},
            total_movements: 1,
          },
          mixed: { farms: [{ id: "m" }], enterprises: [] },
        },
      };

      const { result } = renderHook(() => useFilteredMovement(movement));

      expect(result.current.f1.summary).toEqual({ total: 3 });
      expect(result.current.f1.inputs.total_movements).toBe(5);
      expect(result.current.f1.inputs.farms).toHaveLength(1);
      expect(result.current.f1.outputs.enterprises).toHaveLength(1);
      expect(result.current.f1.mixed.farms).toHaveLength(1);
    });

    it("fills only the missing sections and respects the present ones", () => {
      const { result } = renderHook(() =>
        useFilteredMovement({ f1: { summary: { total: 9 } } })
      );

      expect(result.current.f1.summary).toEqual({ total: 9 });
      expect(result.current.f1.inputs).toEqual(EMPTY_FLOW);
      expect(result.current.f1.outputs).toEqual(EMPTY_FLOW);
    });

    it("processes several farms independently", () => {
      const { result } = renderHook(() =>
        useFilteredMovement({
          f1: { summary: { total: 1 } },
          f2: { summary: { total: 2 } },
        })
      );

      expect(Object.keys(result.current)).toEqual(["f1", "f2"]);
      expect(result.current.f1.summary.total).toBe(1);
      expect(result.current.f2.summary.total).toBe(2);
    });

    it("skips farms whose value is falsy instead of including them empty", () => {
      const { result } = renderHook(() =>
        useFilteredMovement({ f1: null, f2: undefined, f3: { summary: {} } })
      );

      expect(Object.keys(result.current)).toEqual(["f3"]);
    });
  });

  describe("memoization", () => {
    it("returns the same reference when the input does not change", () => {
      const movement = { f1: { summary: {} } };
      const { result, rerender } = renderHook(
        ({ data }) => useFilteredMovement(data),
        { initialProps: { data: movement } }
      );
      const first = result.current;

      rerender({ data: movement });

      expect(result.current).toBe(first);
    });

    it("recomputes when the input reference changes", () => {
      const { result, rerender } = renderHook(
        ({ data }) => useFilteredMovement(data),
        { initialProps: { data: { f1: { summary: { total: 1 } } } } }
      );
      const first = result.current;

      rerender({ data: { f1: { summary: { total: 2 } } } });

      expect(result.current).not.toBe(first);
      expect(result.current.f1.summary.total).toBe(2);
    });
  });
});
