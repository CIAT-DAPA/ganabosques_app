import { useEffect } from "react";
import { fetchFarmPolygonsByIds } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";

export function useFarmPolygons(foundFarms, setFarmPolygons, setPendingTasks, setOriginalMovement) {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    if (!foundFarms || foundFarms.length === 0) {
      setFarmPolygons([]);
      if (setOriginalMovement) setOriginalMovement({});
      return;
    }

    const ids = foundFarms.map((farm) => farm.id).filter(Boolean);
    if (ids.length === 0) return;

    const loadPolygons = async () => {
      setPendingTasks((prev) => prev + 1);
      try {
        const data = await fetchFarmPolygonsByIds(token, ids);
        setFarmPolygons(data);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error obteniendo polígonos de fincas:", err);
        }
      } finally {
        setPendingTasks((prev) => prev - 1);
      }
    };

    loadPolygons();
  }, [foundFarms, token, setFarmPolygons, setPendingTasks, setOriginalMovement]);
}