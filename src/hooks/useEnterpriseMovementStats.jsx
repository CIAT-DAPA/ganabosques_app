import { useEffect, useState } from "react";
import { fetchMovementStatisticsByEnterpriseIds } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";

export function useEnterpriseMovementStats(enterpriseIds, period, setPendingTasks) {
  const { token } = useAuth();
  const [movementStats, setMovementStats] = useState({});

  useEffect(() => {
    if (!token) {
      setMovementStats({});
      return;
    }

    if (!Array.isArray(enterpriseIds) || enterpriseIds.length === 0) {
      setMovementStats({});
      return;
    }

    const ids = enterpriseIds.filter(Boolean);
    if (ids.length === 0) {
      setMovementStats({});
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
      setPendingTasks?.((prev) => prev + 1);  

      try {
        const data = await fetchMovementStatisticsByEnterpriseIds(token, ids, startDate, endDate);
        if (!cancelled) {
          setMovementStats(data || {});
        }
      } catch (err) {
        if (!cancelled) {
          console.error("❗ Error obteniendo estadísticas de movilización por empresa:", err);
          setMovementStats({});
        }
      } finally {
        setPendingTasks?.((prev) => Math.max(0, prev - 1));
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [enterpriseIds, token, period, setPendingTasks]);

  return movementStats;
}
