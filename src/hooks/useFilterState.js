import { useState, useCallback } from "react";
import { searchAdmByName } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";


export function useFilterState(initialRisk = "annual") {
  const { token } = useAuth();
  
  const [risk, setRisk] = useState(initialRisk);
  const [year, setYear] = useState("");
  const [period, setPeriod] = useState("");
  const [source, setSource] = useState("smbyc");
  const [search, setSearch] = useState("");
  
  const [selectedEnterprise, setSelectedEnterprise] = useState(null);
  const [foundFarms, setFoundFarms] = useState([]);
  const [foundAdms, setFoundAdms] = useState([]);
  const [admLevel, setAdmLevel] = useState("adm1");
  const [admResults, setAdmResults] = useState([]);
  
  const [yearStart, setYearStart] = useState(2023);
  const [yearEnd, setYearEnd] = useState(2024);

  const handleYearStartEndChange = useCallback((start, end) => {
    setYearStart(start);
    setYearEnd(end);
  }, []);

  const handleAdmSearch = useCallback(
    async (searchText, level, mapRef) => {
      try {
        if (!token) return;
        const results = await searchAdmByName(token, searchText, level);
        if (!results?.length) return;
        setAdmResults(results);
        const geometry = results[0]?.geometry;
        if (geometry && mapRef?.current) {
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
    setSelectedEnterprise(null);
    setFoundFarms([]);
    setFoundAdms([]);
    setSearch("");
  }, []);

  return {
    risk, setRisk,
    year, setYear,
    period, setPeriod,
    source, setSource,
    search, setSearch,
    
    selectedEnterprise, setSelectedEnterprise,
    foundFarms, setFoundFarms,
    foundAdms, setFoundAdms,
    admLevel, setAdmLevel,
    admResults, setAdmResults,
    
    yearStart, yearEnd,
    handleYearStartEndChange,
    
    handleAdmSearch,
    resetSearchResults,
    
    token,
  };
}
