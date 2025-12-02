import { useEffect } from "react";
import { fetchMovementStatisticsByFarmIds } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";

export function useMovementStats(foundFarms, setOriginalMovement, setPendingTasks) {
  const { token } = useAuth();

  useEffect(() => {
    // Si no hay token, reseteamos y salimos
    if (!token) {
      setOriginalMovement({});
      return;
    }

    // Asegurarnos de que foundFarms sea SIEMPRE un array
    if (!Array.isArray(foundFarms) || foundFarms.length === 0) {
      setOriginalMovement({});
      return;
    }

    const ids = foundFarms
      .map((farm) => farm && farm.id)
      .filter(Boolean);

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
        if (process.env.NODE_ENV !== "production") {
          console.error("Error obteniendo estadísticas de movimiento:", err);
        }
        if (!cancelled) {
          setOriginalMovement({});
        }
      } finally {
        if (!cancelled) {
          setPendingTasks((prev) => Math.max(0, prev - 1));
        }
      }
    };

    loadStats();

    // Cleanup para evitar actualizar estado si el efecto ya se desmontó
    return () => {
      cancelled = true;
    };
  }, [foundFarms, token, setOriginalMovement, setPendingTasks]);
}