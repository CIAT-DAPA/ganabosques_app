import { useEffect } from "react";
import { fetchMovementStatisticsByFarmIds } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";

export function useMovementStats(foundFarms, setOriginalMovement, setPendingTasks, period) {
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

    // Extraer fechas del period en formato YYYY-MM-DD
    const formatDate = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    const startDate = formatDate(period?.deforestation_period_start);
    const endDate = formatDate(period?.deforestation_period_end);

    let cancelled = false;

    const loadStats = async () => {
      setPendingTasks((prev) => prev + 1);  

      try {
        const data = await fetchMovementStatisticsByFarmIds(token, ids, startDate, endDate);
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
  }, [foundFarms, token, setOriginalMovement, setPendingTasks, period]);
}