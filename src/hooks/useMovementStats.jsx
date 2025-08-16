import { useEffect } from "react";
import { fetchMovementStatisticsByFarmIds } from "@/services/apiService";

export function useMovementStats(foundFarms, setOriginalMovement, setPendingTasks) {
  useEffect(() => {
    if (!foundFarms || foundFarms.length === 0) {
      setOriginalMovement({});
      return;
    }

    const ids = foundFarms.map((farm) => farm.id).filter(Boolean);
    if (ids.length === 0) return;

    const loadStats = async () => {
      setPendingTasks((prev) => prev + 1);
      try {
        const data = await fetchMovementStatisticsByFarmIds(ids);
        setOriginalMovement(data);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error obteniendo estadísticas de movimiento:", err);
        }
      } finally {
        setPendingTasks((prev) => prev - 1);
      }
    };

    loadStats();
  }, [foundFarms, setOriginalMovement, setPendingTasks]);
}
