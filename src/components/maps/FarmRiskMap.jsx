"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import BaseMap from "./BaseMap";
import FilterBar from "@/components/FilterBar";
import RiskLegend from "@/components/Legend";
import LoadingSpinner from "@/components/LoadingSpinner";
import MovementCharts from "@/components/MovementChart";
import { searchAdmByName } from "@/services/apiService";
import { useFilteredMovement } from "@/hooks/useFilteredMovement";
import { useMovementStats } from "@/hooks/useMovementStats";
import { useFarmPolygons } from "@/hooks/useFarmPolygons";
import { useFarmRisk } from "@/hooks/useFarmRisk";
import { useDeforestationAnalysis } from "@/hooks/useDeforestationAnalysis";
import FarmMovementLayers from "./FarmMovementLayers";
import FarmRiskLayers from "./FarmRiskLayers";
import FarmNavigationHelpers from "./FarmNavigationHelpers";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import { useAuth } from "@/hooks/useAuth";

export default function FarmRiskMap() {
  const riskOptions = useMemo(
    () => [
      { value: "annual", label: "Riesgo anual" },
      { value: "cumulative", label: "Riesgo acumulado" },
    ],
    []
  );

  const [risk, setRisk] = useState(riskOptions[0]?.value || "");
  const [year, setYear] = useState("");
  const [period, setPeriod] = useState("");
  const [source, setSource] = useState("smbyc");
  const [search, setSearch] = useState("");
  const [selectedEnterprise, setSelectedEnterprise] = useState(null);
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

  const { token } = useAuth();

  const movement = useFilteredMovement(originalMovement, yearStart, yearEnd, risk);
  useMovementStats(foundFarms, setOriginalMovement, setPendingTasks);
  useFarmPolygons(foundFarms, setFarmPolygons, setPendingTasks, setOriginalMovement);
  useFarmRisk(analysis, foundFarms, setRiskFarm, setPendingTasks);
  useDeforestationAnalysis(period, setAnalysis, setPendingTasks);

  // 🔥 loading depende solo de pendingTasks
  useEffect(() => {
    setLoading(pendingTasks > 0);
  }, [pendingTasks]);

  // ✅ Cada vez que cambian los predios encontrados,
  // consideramos que terminó la "tarea" de búsqueda de predios
  useEffect(() => {
    setPendingTasks((prev) => Math.max(0, prev - 1)); // 👈 resta 1 a la tarea manual de búsqueda (si existía)
  }, [foundFarms]);

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

  const handleYearStartEndChange = useCallback((start, end) => {
    setYearStart(start);
    setYearEnd(end);
  }, []);

  const handleMapCreated = (mapInstance) => {
    mapRef.current = mapInstance;
  };

  // 👇 Nuevo: cuando el usuario da clic en Buscar, contamos una tarea más
  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setPendingTasks((prev) => prev + 1); // 👈 dispara el loading de inmediato
      // FilterBar hará su lógica y actualizará foundFarms; cuando eso pase,
      // el useEffect de arriba restará 1 a pendingTasks.
    },
    []
  );
console.log(handleSearchSubmit)
  return (
    <>
      <div id="farm-risk-export">
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
  onSearch={handleSearchSubmit} 
  enterpriseRisk={false}
  farmRisk={true}
  selectedEnterprise={selectedEnterprise}
  setSelectedEnterprise={setSelectedEnterprise}
  foundFarms={foundFarms}
  setFoundFarms={setFoundFarms}
  nationalRisk={false}
  admLevel={admLevel}
  setAdmLevel={setAdmLevel}
  onAdmSearch={handleAdmSearch}
  foundAdms={foundAdms}
  setFoundAdms={setFoundAdms}
  onYearStartEndChange={handleYearStartEndChange}
  riskOptions={riskOptions}
  period={period}
  setPeriod={setPeriod}
  // 👇 AGREGA ESTA LÍNEA
  setPendingTasks={setPendingTasks}
/>

          {loading && (
            <LoadingSpinner message="Cargando datos y polígonos..." />
          )}

          <RiskLegend
            enterpriseRisk={false}
            farmRisk={true}
            nationalRisk={false}
          />

          <BaseMap
            onMapCreated={handleMapCreated}
            showDeforestation={true}
            period={period}
            source={source}
            risk={risk}
          >
            <FarmNavigationHelpers farmPolygons={farmPolygons} />

            <FarmMovementLayers
              movement={movement}
              farmPolygons={farmPolygons}
              yearStart={yearStart}
            />

            <FarmRiskLayers
              farmPolygons={farmPolygons}
              riskFarm={riskFarm}
              foundFarms={foundFarms}
              yearStart={yearStart}
            />
          </BaseMap>
        </div>

        {foundFarms?.length > 0 && (
          <MovementCharts
            summary={movement}
            foundFarms={foundFarms}
            riskFarm={riskFarm}
            yearStart={yearStart}
            yearEnd={yearEnd}
          />
        )}
      </div>

      {foundFarms?.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-4 mb-8 flex justify-end">
          <DownloadPdfButton
            targetId="farm-risk-export"
            filename="alerta_predios.pdf"
            label="Descargar (PDF)"
          />
        </div>
      )}
    </>
  );
}