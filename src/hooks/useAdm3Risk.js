import { useEffect } from "react";
import { fetchAdm3RisksByAnalysisAndAdm3 } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";

export function useAdm3Risk(period, foundAdms, setAdm3Risk, setPendingTasks) {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const analysisId = period?.id;
    const adm3Ids = (foundAdms || []).map((adm) => adm.id).filter(Boolean);

    if (!analysisId || adm3Ids.length === 0) return;

    let cancelled = false;

    const loadAdm3Risks = async () => {
      setPendingTasks((prev) => prev + 1);
      try {
        const data = await fetchAdm3RisksByAnalysisAndAdm3(token, analysisId, adm3Ids);
        if (!cancelled) {
          setAdm3Risk(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error adm3 risks:", err);
        }
      } finally {

          setPendingTasks((prev) => Math.max(0, prev - 1));

      }
    };

    loadAdm3Risks();

    return () => {
      cancelled = true;
    };
  }, [period, foundAdms, token, setAdm3Risk, setPendingTasks]);
}