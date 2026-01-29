import { useEffect } from "react";
import { fetchMovementStatisticsByFarmIds } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";

export function useMovementStats(foundFarms, setOriginalMovement, setPendingTasks, period, risk) {
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

    // Helper para obtener el año de una fecha
    const getYear = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.getFullYear();
    };

    // Helper original por si acaso
    const formatDate = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().split('T')[0];
    };

    let startDate, endDate;
    const r = (risk || "").toLowerCase();

    if (r === "annual") {
      const y = getYear(period?.deforestation_period_start);
      if (y) {
        startDate = `${y}-01-01`;
        endDate = `${y}-12-31`;
      } else {
        startDate = formatDate(period?.deforestation_period_start);
        endDate = formatDate(period?.deforestation_period_end);
      }
    } else if (r === "cumulative") {
      const yEnd = getYear(period?.deforestation_period_end);
      if (yEnd) {
        // user req: end year - 1
        const targetYear = yEnd - 1;
        startDate = `${targetYear}-01-01`;
        endDate = `${targetYear}-12-31`;
      } else {
        startDate = formatDate(period?.deforestation_period_start);
        endDate = formatDate(period?.deforestation_period_end);
      }
    } else {
      // Default / Fallback
      startDate = formatDate(period?.deforestation_period_start);
      endDate = formatDate(period?.deforestation_period_end);
    }

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
  }, [foundFarms, token, setOriginalMovement, setPendingTasks, period, risk]);
}