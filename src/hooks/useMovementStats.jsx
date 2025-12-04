import { useEffect } from "react";
import { fetchMovementStatisticsByFarmIds } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";

export function useMovementStats(foundFarms, setOriginalMovement, setPendingTasks) {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      setOriginalMovement({});
      return;
    }

    if (!Array.isArray(foundFarms) || foundFarms.length === 0) {
      setOriginalMovement({});
      return;
    }

    const ids = foundFarms.map((farm) => farm && farm.id).filter(Boolean);
    if (ids.length === 0) {
      setOriginalMovement({});
      return;
    }

    let cancelled = false;

    const loadStats = async () => {
      setPendingTasks((prev) => prev + 1);  

      try {
        const data = await fetchMovementStatisticsByFarmIds(token, ids);
        if (!cancelled) {
          setOriginalMovement(data || {});
        }
      } catch (err) {
        if (!cancelled) {
          console.error("❗ Error obteniendo estadísticas:", err);
          setOriginalMovement({});
        }
      } finally {
        setPendingTasks((prev) => Math.max(0, prev - 1));
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [foundFarms, token, setOriginalMovement, setPendingTasks]);
}