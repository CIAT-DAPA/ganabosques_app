import { useMemo } from "react";

/**
 * Hook para procesar los datos de movimiento del endpoint.
 * El nuevo formato ya no tiene datos por año, sino directamente summary, inputs y outputs.
 */
export function useFilteredMovement(originalMovement) {
  const processedMovement = useMemo(() => {
    if (!originalMovement || typeof originalMovement !== 'object') {
      return {};
    }

    // El endpoint ahora retorna un objeto con farm_id como keys
    // Cada valor contiene: summary, inputs, outputs, mixed
    const result = {};

    Object.entries(originalMovement).forEach(([farmId, data]) => {
      if (!data) return;

      // La nueva estructura ya viene procesada del endpoint
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