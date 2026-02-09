"use client";

import { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { searchAdmByName } from "@/services/apiService";

const MapFiltersContext = createContext(null);

// Risk options for filters - Single source of truth
export const RISK_OPTIONS = [
  { value: "annual", label: "Alerta anual" },
  { value: "cumulative", label: "Alerta acumulada" },
  { value: "nad", label: "Núcleos activos" },
  { value: "atd", label: "Alerta temprana" },
];

// Provider for map filter state
export function MapFiltersProvider({ children }) {
  const { token } = useAuth();
  
  const [risk, setRisk] = useState(RISK_OPTIONS[0]?.value || "annual");
  const [year, setYear] = useState("");
  const [period, setPeriod] = useState("");
  const [source, setSource] = useState("smbyc");
  const [activity, setActivity] = useState("ganaderia");
  const [search, setSearch] = useState("");
  
  const [selectedEnterprise, setSelectedEnterprise] = useState([]);
  const [foundFarms, setFoundFarms] = useState([]);
  const [foundAdms, setFoundAdms] = useState([]);
  const [admLevel, setAdmLevel] = useState("adm1");
  const [admResults, setAdmResults] = useState([]);
  
  const [yearStart, setYearStart] = useState(2023);
  const [yearEnd, setYearEnd] = useState(2024);
  
  const [pendingTasks, setPendingTasks] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [analysis, setAnalysis] = useState(null);
  
  const mapRef = useRef(null);

  useEffect(() => {
    setLoading(pendingTasks > 0);
  }, [pendingTasks]);

  const handleYearStartEndChange = useCallback((start, end) => {
    setYearStart(start);
    setYearEnd(end);
  }, []);

  const handleMapCreated = useCallback((mapInstance) => {
    mapRef.current = mapInstance;
  }, []);

  const handleAdmSearch = useCallback(
    async (searchText, level) => {
      try {
        if (!token) return;
        const results = await searchAdmByName(token, searchText, level);
        if (!results?.length) return;
        setAdmResults(results);
        const geometry = results[0]?.geometry;
        if (geometry && mapRef.current) {
          const L = await import("leaflet");
          const layer = L.geoJSON(geometry);
          mapRef.current.fitBounds(layer.getBounds());
        }
      } catch (err) {
        console.error("Error al buscar nivel administrativo:", err);
      }
    },
    [token]
  );

  const resetSearchResults = useCallback(() => {
    setSelectedEnterprise([]);
    setFoundFarms([]);
    setFoundAdms([]);
    setSearch("");
  }, []);

  const value = useMemo(() => ({
    riskOptions: RISK_OPTIONS,
    risk,
    setRisk,
    year,
    setYear,
    period,
    setPeriod,
    source,
    setSource,
    activity,
    setActivity,
    search,
    setSearch,
    selectedEnterprise,
    setSelectedEnterprise,
    foundFarms,
    setFoundFarms,
    foundAdms,
    setFoundAdms,
    admLevel,
    setAdmLevel,
    admResults,
    setAdmResults,
    yearStart,
    yearEnd,
    handleYearStartEndChange,
    pendingTasks,
    setPendingTasks,
    loading,
    analysis,
    setAnalysis,
    mapRef,
    handleMapCreated,
    handleAdmSearch,
    resetSearchResults,
    token,
  }), [
    risk, year, period, source, activity, search,
    selectedEnterprise, foundFarms, foundAdms, admLevel, admResults,
    yearStart, yearEnd, handleYearStartEndChange,
    pendingTasks, loading, analysis,
    handleMapCreated, handleAdmSearch, resetSearchResults, token,
  ]);

  return (
    <MapFiltersContext.Provider value={value}>
      {children}
    </MapFiltersContext.Provider>
  );
}

// Hook to access map filter context
export function useMapFilters() {
  const context = useContext(MapFiltersContext);
  if (!context) {
    throw new Error("useMapFilters must be used within a MapFiltersProvider");
  }
  return context;
}

// Optional hook that returns null if outside provider
export function useMapFiltersOptional() {
  return useContext(MapFiltersContext);
}

export default MapFiltersContext;
