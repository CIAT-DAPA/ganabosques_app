import { useEffect } from "react";
import { fetchAdm3DetailsByIds } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";

export function useAdm3Details(adm3Risk, setAdm3Details, setPendingTasks) {
  const { token } = useAuth();

  useEffect(() => {
    if (!adm3Risk || !token) return;

    const flatRisks = Object.values(adm3Risk).flat();
    const adm3Ids = [
      ...new Set(flatRisks.map((risk) => risk.adm3_id).filter(Boolean)),
    ];

    if (adm3Ids.length === 0) return;

    const loadDetails = async () => {
      setPendingTasks((prev) => prev + 1);
      try {
        const data = await fetchAdm3DetailsByIds(token, adm3Ids);
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
  }, [adm3Risk, token, setAdm3Details, setPendingTasks]);
}