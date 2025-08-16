import { useEffect } from "react";
import { fetchFarmPolygonsByIds } from "@/services/apiService";

export function useFarmPolygons(foundFarms, setFarmPolygons, setPendingTasks, setOriginalMovement) {
  useEffect(() => {
    if (!foundFarms || foundFarms.length === 0) {
      setFarmPolygons([]);
      if (setOriginalMovement) setOriginalMovement({}); // Limpieza opcional
      return;
    }

    const ids = foundFarms.map((farm) => farm.id).filter(Boolean);
    if (ids.length === 0) return;

    const loadPolygons = async () => {
      setPendingTasks((prev) => prev + 1);
      try {
        const data = await fetchFarmPolygonsByIds(ids);
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
  }, [foundFarms, setFarmPolygons, setPendingTasks, setOriginalMovement]);
}
