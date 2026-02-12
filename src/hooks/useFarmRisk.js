// Farm risk fetching hook
import { useEffect } from "react";
import { fetchFarmRiskByAnalysisAndFarm } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";

export function useFarmRisk(period, foundFarms, setRiskFarm, setPendingTasks) {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      setRiskFarm([]);
      return;
    }

    const analysisId = period?.id;

    if (!analysisId) {
      setRiskFarm([]);
      return;
    }

    if (!Array.isArray(foundFarms) || foundFarms.length === 0) {
      setRiskFarm([]);
      return;
    }

    const farmIds = foundFarms.map((f) => f?.id).filter(Boolean);

    if (farmIds.length === 0) {
      setRiskFarm([]);
      return;
    }

    let cancelled = false;

    const loadFarmRisk = async () => {
      setPendingTasks((prev) => prev + 1);
      try {
        const data = await fetchFarmRiskByAnalysisAndFarm(token, analysisId, farmIds);
        if (!cancelled) {
          setRiskFarm(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error al obtener farmRisk:", err);
          setRiskFarm([]);
        }
      } finally {
        setPendingTasks((prev) => Math.max(0, prev - 1));
      }
    };

    loadFarmRisk();

    return () => {
      cancelled = true;
    };
  }, [period, foundFarms, token, setRiskFarm, setPendingTasks]);
}