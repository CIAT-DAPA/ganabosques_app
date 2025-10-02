import { useState, useEffect, useCallback } from "react";
import { 
  fetchEnterprises, 
  fetchAnalysisYearRanges, 
  fetchFarmBySITCode, 
  searchAdmByName,
  searchEnterprisesByName
} from "@/services/apiService";

// Hook para manejar empresas
export const useEnterpriseSuggestions = (search, enterpriseRisk, delay = 400) => {
  const [enterpriseSuggestions, setEnterpriseSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Si no hay búsqueda o no aplica riesgo, vaciamos (igual a ADM)
    if (!search || !enterpriseRisk) {
      setEnterpriseSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchEnterprisesByName(search);
        console.log("Enterprise search results:", results);
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

    // Limpieza del debounce
    return () => clearTimeout(timer);
  }, [search, enterpriseRisk, delay]);

  return { enterpriseSuggestions, setEnterpriseSuggestions, loading };
};

// Hook para manejar rangos de años
export const useYearRanges = (source, risk, year, setYear, setPeriod, onYearStartEndChange) => {
  const [yearRanges, setYearRanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const asId = (v) => (v == null ? "" : String(v));

  useEffect(() => {
  let aborted = false;

  const loadYears = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAnalysisYearRanges(source, risk);
      if (aborted) return;


      const arr = Array.isArray(data) ? data : [];
      setYearRanges(arr);

      // ...
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
  return () => { aborted = true; };
}, [source, risk, year, setYear, setPeriod, onYearStartEndChange]);

  return { yearRanges, loading, error };
};

// Hook para manejar sugerencias ADM con debounce
export const useAdmSuggestions = (search, admLevel, nationalRisk, delay = 400) => {
  const [admSuggestions, setAdmSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!search || !nationalRisk) {
      setAdmSuggestions([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchAdmByName(search, admLevel);
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
  }, [search, admLevel, nationalRisk, delay]);

  return { admSuggestions, setAdmSuggestions, loading };
};

// Hook para manejar búsqueda diferida de SIT_CODE
export const useFarmCodeSearch = (farmRisk, foundFarms, setFoundFarms, setToast) => {
  useEffect(() => {
    if (!farmRisk || foundFarms.length === 0) return;

    const delay = setTimeout(async () => {
      const pendingCodes = foundFarms
        .filter((f) => !f.id && f.code)
        .map((f) => f.code)
        .join(",");

      if (!pendingCodes) return;

      try {
        const data = await fetchFarmBySITCode(pendingCodes);

        if (!data || data.length === 0) {
          setToast({
            type: "alert",
            message: `No se encontraron fincas para: ${pendingCodes}`,
          });

          // Remove invalid SIT CODEs
          setFoundFarms((prev) =>
            prev.filter((f) => !pendingCodes.split(",").includes(f.code))
          );
          return;
        }

        const updatedFarms = data.map((f) => {
          const code = f.ext_id.find(
            (ext) => ext.source === "SIT_CODE"
          )?.ext_code;
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
    }, 4000);

    return () => clearTimeout(delay);
  }, [foundFarms, farmRisk, setFoundFarms, setToast]);
};
