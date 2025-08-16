import { useEffect } from "react";
import { fetchFarmRiskByAnalysisAndFarm } from "@/services/apiService";

export function useFarmRisk(analysis, foundFarms, setRiskFarm, setPendingTasks) {
  useEffect(() => {
    if (!Array.isArray(analysis) || analysis.length === 0) return;
    if (!Array.isArray(foundFarms) || foundFarms.length === 0) return;

    const analysisId = analysis[0]?.id;
    const farmIds = foundFarms.map((f) => f.id).filter(Boolean);
    if (!analysisId || farmIds.length === 0) return;

    const loadFarmRisk = async () => {
      setPendingTasks((prev) => prev + 1);
      try {
        const data = await fetchFarmRiskByAnalysisAndFarm(analysisId, farmIds);
        setRiskFarm(data);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error al obtener farmRisk:", err);
        }
      } finally {
        setPendingTasks((prev) => prev - 1);
      }
    };

    loadFarmRisk();
  }, [analysis, foundFarms, setRiskFarm, setPendingTasks]);
}
