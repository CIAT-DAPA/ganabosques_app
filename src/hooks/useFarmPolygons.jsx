import { useEffect } from "react";
import { fetchFarmPolygonsByIds } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";

export function useFarmPolygons(foundFarms, setFarmPolygons, setPendingTasks, setOriginalMovement) {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      setFarmPolygons([]);
      if (setOriginalMovement) setOriginalMovement({});
      return;
    }

    if (!Array.isArray(foundFarms) || foundFarms.length === 0) {
      setFarmPolygons([]);
      if (setOriginalMovement) setOriginalMovement({});
      return;
    }

    const ids = foundFarms.map((farm) => farm?.id).filter(Boolean);
    if (ids.length === 0) {
      setFarmPolygons([]);
      if (setOriginalMovement) setOriginalMovement({});
      return;
    }

    let cancelled = false;

    const loadPolygons = async () => {
      setPendingTasks((prev) => prev + 1);
      try {
        const data = await fetchFarmPolygonsByIds(token, ids);
        if (!cancelled) {
          setFarmPolygons(data);
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error obteniendo polígonos de fincas:", err);
        }
        if (!cancelled) {
          setFarmPolygons([]);
        }
      } finally {
        // 👇 siempre se decrementa
        setPendingTasks((prev) => Math.max(0, prev - 1));
      }
    };

    loadPolygons();

    return () => {
      cancelled = true;
    };
  }, [foundFarms, token, setFarmPolygons, setPendingTasks, setOriginalMovement]);
}