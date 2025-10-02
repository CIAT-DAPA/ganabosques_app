"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import BaseMap from "./BaseMap";
import FilterBar from "@/components/FilterBar";
import RiskLegend from "@/components/Legend";
import LoadingSpinner from "@/components/LoadingSpinner";

import { searchAdmByName } from "@/services/apiService";
import { useFilteredMovement } from "@/hooks/useFilteredMovement";
import { useMovementStats } from "@/hooks/useMovementStats";
import { useFarmPolygons } from "@/hooks/useFarmPolygons";
import { useFarmRisk } from "@/hooks/useFarmRisk";
import { useDeforestationAnalysis } from "@/hooks/useDeforestationAnalysis";

export default function EnterpriseMap() {
  // Opciones de riesgo
  const riskOptions = useMemo(
    () => [
      { value: "annual", label: "Riesgo anual" },
      { value: "cumulative", label: "Riesgo acumulado" },
    ],
    []
  );

  // Estado centralizado
  const [risk, setRisk] = useState(riskOptions[0]?.value || "");
  const [year, setYear] = useState("");
  const [period, setPeriod] = useState("");
  const [source, setSource] = useState("smbyc");
  const [search, setSearch] = useState("");

  const [selectedEnterprise, setSelectedEnterprise] = useState([]);
  const [foundFarms, setFoundFarms] = useState([]);
  const [foundAdms, setFoundAdms] = useState([]);
  const [admLevel, setAdmLevel] = useState("adm1");
  const [admResults, setAdmResults] = useState([]);

  const [farmPolygons, setFarmPolygons] = useState([]);
  const mapRef = useRef();

  const [yearStart, setYearStart] = useState(2023);
  const [yearEnd, setYearEnd] = useState(2024);
  const [originalMovement, setOriginalMovement] = useState(null);

  const [loading, setLoading] = useState(false);
  const [pendingTasks, setPendingTasks] = useState(0);

  const [analysis, setAnalysis] = useState(null);
  const [riskFarm, setRiskFarm] = useState(null);

  // Hooks personalizados (mueven datos de fincas si llegas a usarlos en esta vista)
  const movement = useFilteredMovement(originalMovement, yearStart, yearEnd, risk);
  useMovementStats(foundFarms, setOriginalMovement, setPendingTasks);
  useFarmPolygons(foundFarms, setFarmPolygons, setPendingTasks, setOriginalMovement);
  useFarmRisk(analysis, foundFarms, setRiskFarm, setPendingTasks);
  useDeforestationAnalysis(period, setAnalysis, setPendingTasks);

  // Spinner global
  useEffect(() => {
    setLoading(pendingTasks > 0);
  }, [pendingTasks]);

  // Buscar y enfocar por nivel administrativo (si lo usas desde la barra)
  const handleAdmSearch = useCallback(async (searchText, level) => {
    try {
      const results = await searchAdmByName(searchText, level);
      if (!results || results.length === 0) return;

      setAdmResults(results);

      const geometry = results[0]?.geometry;
      if (geometry && mapRef.current) {
        const L = await import("leaflet");
        const layer = L.geoJSON(geometry);
        mapRef.current.fitBounds(layer.getBounds());
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error al buscar nivel administrativo:", err);
      }
    }
  }, []); // <- no depende del estado 'search'; usa el argumento 'searchText'

  const handleYearStartEndChange = useCallback((start, end) => {
    setYearStart(start);
    setYearEnd(end);
  }, []);

  const handleMapCreated = (mapInstance) => {
    mapRef.current = mapInstance;
  };
console.log("EnterpriseRiskMap render with search:", selectedEnterprise);
  return (
    <div className="relative">
      <FilterBar
        risk={risk}
        setRisk={setRisk}
        year={year}
        setYear={setYear}
        source={source}
        setSource={setSource}
        search={search}
        setSearch={setSearch}
        onSearch={(e) => e.preventDefault()}
        /* 👇 Modo EMPRESAS activo; otros modos off */
        enterpriseRisk={true}
        farmRisk={false}
        nationalRisk={false}
        /* Empresas (selección) */
        selectedEnterprise={selectedEnterprise}
        setSelectedEnterprise={setSelectedEnterprise}
        /* Fincas/ADMs (si las usas desde chips) */
        foundFarms={foundFarms}
        setFoundFarms={setFoundFarms}
        admLevel={admLevel}
        setAdmLevel={setAdmLevel}
        onAdmSearch={handleAdmSearch}
        foundAdms={foundAdms}
        setFoundAdms={setFoundAdms}
        /* Rango de años / período */
        onYearStartEndChange={handleYearStartEndChange}
        riskOptions={riskOptions}
        period={period}
        setPeriod={setPeriod}
      />

      {loading && <LoadingSpinner message="Cargando datos y polígonos..." />}

      {/* Leyenda coherente con modo EMPRESAS */}
      <RiskLegend enterpriseRisk={true} farmRisk={false} nationalRisk={false} />

      <BaseMap
        onMapCreated={handleMapCreated}
        showDeforestation={true}
        period={period}
        source={source}
        risk={risk}
        /* Flags por si tus capas internas los requieren */
        enterpriseRisk={true}
        farmRisk={false}
        nationalRisk={false}
        /* Si el mapa necesita conocer el término de búsqueda actual (opcional) */
        search={search}
      >
        {/* Añade aquí tus layers si corresponde */}
      </BaseMap>
    </div>
  );
}