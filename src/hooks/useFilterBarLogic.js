// Filter bar logic hooks
import { useState, useEffect } from "react";
import {
  fetchAnalysisYearRanges,
  fetchFarmBySITCode,
  fetchEnums,
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

    let aborted = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchEnterprisesByName(token, search, activity);
        if (aborted) return;
        const sorted = (results || []).slice().sort((a, b) =>
          (a.name || "").localeCompare(b.name || "", "es", { sensitivity: "base" })
        );
        setEnterpriseSuggestions(sorted);
      } catch (error) {
        if (!aborted && process.env.NODE_ENV !== "production") {
          console.error("Error al buscar sugerencias de empresas:", error);
        }
        if (!aborted) setEnterpriseSuggestions([]);
      } finally {
        if (!aborted) setLoading(false);
      }
    }, delay);

    return () => {
      aborted = true;
      clearTimeout(timer);
    };
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

        // Auto-select first period when yearRanges reload (activity/source/risk change)
        if (arr.length > 0) {
          const first = arr[0];
          setYear?.(String(first.id));
          setPeriod?.(first);
          onYearStartEndChange?.(first.deforestation_period_start, first.deforestation_period_end);
        } else {
          setYear?.("");
          setPeriod?.("");
          onYearStartEndChange?.(null, null);
        }
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
  // NOTE: `year` is intentionally excluded — this hook *sets* year, so including it
  // would cause a re-fetch loop (especially noticeable on first login).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, source, risk, activity, setYear, setPeriod, onYearStartEndChange]);

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
        const sorted = (results || []).slice().sort((a, b) =>
          (a.label || a.name || "").localeCompare(b.label || b.name || "", "es", { sensitivity: "base" })
        );
        setAdmSuggestions(sorted);
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

// Source labels from enums endpoint
export const useSourceLabels = () => {
  const { token } = useAuth();
  const [sourceLabels, setSourceLabels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    let aborted = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchEnums(token, "source");
        if (!aborted && Array.isArray(data)) {
          setSourceLabels(data);
        }
      } catch (err) {
        if (!aborted) console.error("Error fetching source labels:", err);
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    load();
    return () => { aborted = true; };
  }, [token]);

  return { sourceLabels, loading };
};

// Farm code search
export const useFarmCodeSearch = (farmRisk, foundFarms, setFoundFarms, setToast, activity = null, sourceLabel = null) => {
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
        const effectiveLabel = sourceLabel || (activity === "cacao" || activity === "cafe" ? "GEOFARMER_ID" : "SIT_CODE");
        const data = await fetchFarmBySITCode(token, pendingCodes, activity, effectiveLabel);

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
          const code = f.ext_id.find((ext) => ext.source === effectiveLabel)?.ext_code;
          return { id: f.id, code, ext_id: f.ext_id };
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
          console.error("Error fetching farm code:", error);
        }
        setToast({
          type: "alert",
          message: `Error de red al buscar los ${sourceLabel || "códigos"}`,
        });
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [foundFarms, farmRisk, setFoundFarms, setToast, token, activity, sourceLabel]);
};
