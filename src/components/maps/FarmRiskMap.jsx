"use client";

import { useState, useCallback } from "react";
import BaseMap from "./BaseMap";
import FilterBar from "@/components/FilterBar";
import RiskLegend from "@/components/Legend";
import LoadingSpinner from "@/components/LoadingSpinner";
import MovementCharts from "@/components/MovementChart";
import { useFilteredMovement } from "@/hooks/useFilteredMovement";
import { useMovementStats } from "@/hooks/useMovementStats";
import { useFarmPolygons } from "@/hooks/useFarmPolygons";
import { useFarmRisk } from "@/hooks/useFarmRisk";
import { useDeforestationAnalysis } from "@/hooks/useDeforestationAnalysis";
import { useMapState } from "@/hooks/useMapState";
import { useLoadingState } from "@/hooks/useLoadingState";
import { useFilterState } from "@/hooks/useFilterState";
import FarmMovementLayers from "./FarmMovementLayers";
import FarmRiskLayers from "./FarmRiskLayers";
import FarmNavigationHelpers from "./FarmNavigationHelpers";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import { RISK_OPTIONS } from "@/contexts/MapFiltersContext";

export default function FarmRiskMap() {
  const { mapRef, handleMapCreated } = useMapState();
  const { loading, setPendingTasks } = useLoadingState();
  const {
    risk, setRisk,
    year, setYear,
    period, setPeriod,
    source, setSource,
    search, setSearch,
    selectedEnterprise, setSelectedEnterprise,
    foundFarms, setFoundFarms,
    foundAdms, setFoundAdms,
    admLevel,
    yearStart, yearEnd,
    handleYearStartEndChange,
    handleAdmSearch,
  } = useFilterState();

  // Map-specific state
  const [farmPolygons, setFarmPolygons] = useState([]);
  const [originalMovement, setOriginalMovement] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [riskFarm, setRiskFarm] = useState(null);

  // Derived data
  const movement = useFilteredMovement(originalMovement);

  // Data fetching hooks
  useMovementStats(foundFarms, setOriginalMovement, setPendingTasks, period, risk);
  useFarmPolygons(foundFarms, setFarmPolygons, setPendingTasks, setOriginalMovement);
  useFarmRisk(period, foundFarms, setRiskFarm, setPendingTasks);
  useDeforestationAnalysis(period, setAnalysis, setPendingTasks);

  // Wrapped ADM search with mapRef
  const onAdmSearch = useCallback(
    (text, level) => handleAdmSearch(text, level, mapRef),
    [handleAdmSearch, mapRef]
  );


  return (
    <>
      <div id="farm-risk-export">
        <div className="relative px-6 md:px-12">
          <FilterBar
            risk={risk}
            setRisk={setRisk}
            year={year}
            setYear={setYear}
            source={source}
            setSource={setSource}
            search={search}
            setSearch={setSearch}
            enterpriseRisk={false}
            farmRisk={true}
            selectedEnterprise={selectedEnterprise}
            setSelectedEnterprise={setSelectedEnterprise}
            foundFarms={foundFarms}
            setFoundFarms={setFoundFarms}
            nationalRisk={false}
            admLevel={admLevel}
            onAdmSearch={onAdmSearch}
            foundAdms={foundAdms}
            setFoundAdms={setFoundAdms}
            onYearStartEndChange={handleYearStartEndChange}
            riskOptions={RISK_OPTIONS}
            period={period}
            setPeriod={setPeriod}
          />

          {loading && <LoadingSpinner message="Cargando datos y polígonos..." />}

          <RiskLegend enterpriseRisk={false} farmRisk={true} nationalRisk={false} />

          <BaseMap
            onMapCreated={handleMapCreated}
            showDeforestation={true}
            period={period}
            source={source}
            risk={risk}
            deforestationLayers={period?.deforestation_path}
          >
            <FarmNavigationHelpers farmPolygons={farmPolygons} />
            <FarmMovementLayers movement={movement} farmPolygons={farmPolygons} yearStart={yearStart} />
            <FarmRiskLayers farmPolygons={farmPolygons} riskFarm={riskFarm} foundFarms={foundFarms} yearStart={yearStart} />
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
          <DownloadPdfButton targetId="farm-risk-export" filename="alerta_predios.pdf" label="Descargar (PDF)" />
        </div>
      )}
    </>
  );
}