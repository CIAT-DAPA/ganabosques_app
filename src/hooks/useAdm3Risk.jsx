import { useEffect } from "react";
import { fetchAdm3RisksByAnalysisAndAdm3 } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";

export function useAdm3Risk(analysis, foundAdms, setAdm3Risk, setPendingTasks) {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    if (
      !Array.isArray(analysis) || analysis.length === 0 ||
      !Array.isArray(foundAdms) || foundAdms.length === 0
    ) {
      return;
    }

    const analysisId = analysis[0]?.id;
    const adm3Ids = foundAdms.map((adm) => adm.id).filter(Boolean);

    if (!analysisId || adm3Ids.length === 0) return;

    const loadAdm3Risks = async () => {
      setPendingTasks((prev) => prev + 1);
      try {
        const data = await fetchAdm3RisksByAnalysisAndAdm3(token, analysisId, adm3Ids);
        setAdm3Risk(data);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error adm3 risks:", err);
        }
      } finally {
        setPendingTasks((prev) => prev - 1);
      }
    };

    loadAdm3Risks();
  }, [analysis, foundAdms, token, setAdm3Risk, setPendingTasks]);
}