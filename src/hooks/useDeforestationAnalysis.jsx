import { useEffect } from "react";
import { fetchFarmRiskByDeforestationId } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";

export function useDeforestationAnalysis(period, setAnalysis, setPendingTasks) {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    if (!period) return;

    const loadAnalysis = async () => {
      setPendingTasks((prev) => prev + 1);
      try {
        const data = await fetchFarmRiskByDeforestationId(token, period.deforestation_id);
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
  }, [period, token, setAnalysis, setPendingTasks]);
}