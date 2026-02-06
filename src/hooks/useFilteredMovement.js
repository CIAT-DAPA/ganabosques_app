import { useMemo } from "react";


export function useFilteredMovement(originalMovement) {
  const processedMovement = useMemo(() => {
    if (!originalMovement || typeof originalMovement !== 'object') {
      return {};
    }

    const result = {};

    Object.entries(originalMovement).forEach(([farmId, data]) => {
      if (!data) return;

      result[farmId] = {
        summary: data.summary || {},
        inputs: data.inputs || { farms: [], enterprises: [], statistics: {}, movements_by_type: {}, total_movements: 0 },
        outputs: data.outputs || { farms: [], enterprises: [], statistics: {}, movements_by_type: {}, total_movements: 0 },
        mixed: data.mixed || { farms: [], enterprises: [] },
      };
    });

    return result;
  }, [originalMovement]);

  return processedMovement;
}