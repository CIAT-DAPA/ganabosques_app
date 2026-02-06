// Filter bar logic hooks
import { useState, useEffect } from "react";
import {
  fetchAnalysisYearRanges,
  fetchFarmBySITCode,
  searchAdmByName,
  searchEnterprisesByName,
} from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";

// Enterprise suggestions with debounce
export const useEnterpriseSuggestions = (search, enterpriseRisk, delay = 400, activity = null) => {
  const { token } = useAuth();
  const [enterpriseSuggestions, setEnterpriseSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!search || !enterpriseRisk || !token) {
      setEnterpriseSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchEnterprisesByName(token, search, activity);
        setEnterpriseSuggestions(results || []);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error al buscar sugerencias de empresas:", error);
        }
        setEnterpriseSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [search, enterpriseRisk, delay, token, activity]);

  return { enterpriseSuggestions, setEnterpriseSuggestions, loading };
};

// Year ranges fetching
export const useYearRanges = (
  source,
  risk,
  year,
  setYear,
  setPeriod,
  onYearStartEndChange,
  activity = null
) => {
  const { token } = useAuth();
  const [yearRanges, setYearRanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    let aborted = false;

    const loadYears = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchAnalysisYearRanges(token, source, risk, activity);
        if (aborted) return;

        const arr = Array.isArray(data) ? data : [];
        setYearRanges(arr);
      } catch (err) {
        if (!aborted) {
          setError("Error al cargar años disponibles");
          console.error("Error fetching year ranges:", err);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    loadYears();
    return () => {
      aborted = true;
    };
  }, [token, source, risk, activity, year, setYear, setPeriod, onYearStartEndChange]);

  return { yearRanges, loading, error };
};

// ADM suggestions with debounce
export const useAdmSuggestions = (search, admLevel, nationalRisk, delay = 400) => {
  const { token } = useAuth();
  const [admSuggestions, setAdmSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!search || !nationalRisk || !token) {
      setAdmSuggestions([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchAdmByName(token, search, admLevel);
        setAdmSuggestions(results || []);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error al buscar sugerencias ADM:", error);
        }
        setAdmSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => clearTimeout(debounceTimer);
  }, [search, admLevel, nationalRisk, delay, token]);

  return { admSuggestions, setAdmSuggestions, loading };
};

// Farm code search
export const useFarmCodeSearch = (farmRisk, foundFarms, setFoundFarms, setToast, activity = null) => {
  const { token } = useAuth();

  useEffect(() => {
    if (!farmRisk || foundFarms.length === 0 || !token) return;

    const delay = setTimeout(async () => {
      const pendingCodes = foundFarms
        .filter((f) => !f.id && f.code)
        .map((f) => f.code)
        .join(",");

      if (!pendingCodes) return;

      try {
        const data = await fetchFarmBySITCode(token, pendingCodes, activity);

        if (!data || data.length === 0) {
          setToast({
            type: "alert",
            message: `No se encontraron fincas para: ${pendingCodes}`,
          });

          setFoundFarms((prev) =>
            prev.filter((f) => !pendingCodes.split(",").includes(f.code))
          );
          return;
        }

        const updatedFarms = data.map((f) => {
          const code = f.ext_id.find((ext) => ext.source === "SIT_CODE")?.ext_code;
          return { id: f.id, code };
        });

        setFoundFarms((prev) => {
          const confirmed = prev.filter((f) => f.id);
          const combined = [...confirmed];

          updatedFarms.forEach((newFarm) => {
            if (!combined.find((f) => f.id === newFarm.id)) {
              combined.push(newFarm);
            }
          });

          return combined;
        });
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error fetching SIT_CODE:", error);
        }
        setToast({
          type: "alert",
          message: "Error de red al buscar los SIT CODE",
        });
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [foundFarms, farmRisk, setFoundFarms, setToast, token, activity]);
};
