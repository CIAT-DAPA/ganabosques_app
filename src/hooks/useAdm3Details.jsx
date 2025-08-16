import { useEffect } from "react";
import { fetchAdm3DetailsByIds } from "@/services/apiService";

export function useAdm3Details(adm3Risk, setAdm3Details, setPendingTasks) {
  useEffect(() => {
    if (!adm3Risk) return;

    const flatRisks = Object.values(adm3Risk).flat();
    const adm3Ids = [
      ...new Set(flatRisks.map((risk) => risk.adm3_id).filter(Boolean)),
    ];

    if (adm3Ids.length === 0) return;

    const loadDetails = async () => {
      setPendingTasks((prev) => prev + 1);
      try {
        const data = await fetchAdm3DetailsByIds(adm3Ids);
        setAdm3Details(data);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error al consultar adm3 details:", err);
        }
      } finally {
        setPendingTasks((prev) => prev - 1);
      }
    };

    loadDetails();
  }, [adm3Risk, setAdm3Details, setPendingTasks]);
}
