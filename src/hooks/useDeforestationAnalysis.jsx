import { useEffect } from "react";
import { fetchFarmRiskByDeforestationId } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";

export function useDeforestationAnalysis(period, setAnalysis, setPendingTasks) {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      setAnalysis([]);
      return;
    }

    if (!period || !period.deforestation_id) {
      setAnalysis([]);
      return;
    }

    let cancelled = false;

    const loadAnalysis = async () => {
      setPendingTasks((prev) => prev + 1);
      try {
        const data = await fetchFarmRiskByDeforestationId(
          token,
          period.deforestation_id
        );
        if (!cancelled) {
          setAnalysis(data);
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error obteniendo análisis por deforestación:", err);
        }
        if (!cancelled) {
          setAnalysis([]);
        }
      } finally {
        // 👇 siempre se decrementa
        setPendingTasks((prev) => Math.max(0, prev - 1));
      }
    };

    loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [period, token, setAnalysis, setPendingTasks]);
}