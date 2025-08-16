import { useEffect } from "react";
import { fetchFarmRiskByDeforestationId } from "@/services/apiService";

export function useDeforestationAnalysis(period, setAnalysis, setPendingTasks) {
  useEffect(() => {
    if (!period) return;

    const loadAnalysis = async () => {
      setPendingTasks((prev) => prev + 1);
      try {
        const data = await fetchFarmRiskByDeforestationId(period.deforestation_id);
        setAnalysis(data);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error obteniendo análisis por deforestación:", err);
        }
      } finally {
        setPendingTasks((prev) => prev - 1);
      }
    };

    loadAnalysis();
  }, [period, setAnalysis, setPendingTasks]);
}
