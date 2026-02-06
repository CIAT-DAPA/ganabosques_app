// Movement statistics hook for enterprises
import { useEffect, useState } from "react";
import { fetchMovementStatisticsByEnterpriseIds } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";

export function useEnterpriseMovementStats(enterpriseIds, period, risk, setPendingTasks) {
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

    // Get year from date
    const getYear = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.getFullYear();
    };

    // Format date to ISO
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
        const targetYear = yEnd - 1;
        startDate = `${targetYear}-01-01`;
        endDate = `${targetYear}-12-31`;
      } else {
        startDate = formatDate(period?.deforestation_period_start);
        endDate = formatDate(period?.deforestation_period_end);
      }
    } else {
      startDate = formatDate(period?.deforestation_period_start);
      endDate = formatDate(period?.deforestation_period_end);
    }

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
          console.error("Error obteniendo estadísticas de movilización por empresa:", err);
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
  }, [enterpriseIds, token, period, risk, setPendingTasks]);

  return movementStats;
}
