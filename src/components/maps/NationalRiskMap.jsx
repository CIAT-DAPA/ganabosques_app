"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { WMSTileLayer, LayersControl } from "react-leaflet";
import BaseMap from "./BaseMap";
import FilterBar from "@/components/FilterBar";
import RiskLegend from "@/components/Legend";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAdm3Risk } from "@/hooks/useAdm3Risk";
import { useAdm3Details } from "@/hooks/useAdm3Details";
import { useMapState } from "@/hooks/useMapState";
import { useLoadingState } from "@/hooks/useLoadingState";
import { useFilterState } from "@/hooks/useFilterState";
import NationalRiskLayers from "./NationalRiskLayers";
import { useMapFiltersOptional } from "@/contexts/MapFiltersContext";
import NationalNavigationHelpers from "./NationalNavigationHelpers";
import { fetchAdm3RiskByAdm3AndType } from "@/services/apiService";
import Adm3HistoricalRisk from "@/components/Adm3HistoricalRisk";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import { RISK_OPTIONS } from "@/contexts/MapFiltersContext";

export default function NationalRiskMap() {
  const { mapRef, handleMapCreated } = useMapState();
  const { loading, setPendingTasks } = useLoadingState();
  const {
    risk, setRisk,
    year, setYear,
    period, setPeriod,
    source, setSource,
    search, setSearch,
    foundAdms, setFoundAdms,
    admLevel, setAdmLevel,
    admResults, setAdmResults,
    yearStart, yearEnd,
    handleYearStartEndChange,
    handleAdmSearch,
    token,
  } = useFilterState();

  const ctx = useMapFiltersOptional();
  const activity = ctx?.activity || "ganaderia";

  // National-specific state
  const [adm3Risk, setAdm3Risk] = useState(null);
  const [adm3Details, setAdm3Details] = useState([]);
  const [popupData, setPopupData] = useState(null);
  const [lastCenteredExtId, setLastCenteredExtId] = useState(null);
  const [adm3RiskHistory, setAdm3RiskHistory] = useState([]);

  // Data hooks — period.id is the analysisId for the adm3 endpoint
  useAdm3Risk(period, foundAdms, setAdm3Risk, setPendingTasks);
  useAdm3Details(adm3Risk, setAdm3Details, setPendingTasks);

  const prevIdsRef = useRef([]);
  const prevRiskRef = useRef(risk);

  useEffect(() => {
    if (!foundAdms || foundAdms.length === 0) {
      setPopupData(null);
      mapRef.current?.closePopup?.();
    }
  }, [foundAdms, mapRef]);

  // Wrapped ADM search with mapRef
  const onAdmSearch = useCallback(
    (text, level) => handleAdmSearch(text, level, mapRef),
    [handleAdmSearch, mapRef]
  );

  // Fetch ADM3 risk history
  useEffect(() => {
    if (!token) return;

    const currIds = (foundAdms || [])
      .map((a) => a?.id || a?._id || a?.adm3_id)
      .filter(Boolean);
    const prevIds = prevIdsRef.current;
    const removed = prevIds.filter((id) => !currIds.includes(id));
    const added = currIds.filter((id) => !prevIds.includes(id));
    const riskChanged = risk !== prevRiskRef.current;

    if (currIds.length === 0) {
      if (adm3RiskHistory.length > 0) setAdm3RiskHistory([]);
      prevIdsRef.current = currIds;
      prevRiskRef.current = risk;
      return;
    }

    if (riskChanged) {
      setPendingTasks((v) => v + 1);
      (async () => {
        try {
          const data = await fetchAdm3RiskByAdm3AndType(token, currIds, risk, activity);
          setAdm3RiskHistory(Object.values(data || {}));
        } finally {
          setPendingTasks((v) => v - 1);
          prevRiskRef.current = risk;
          prevIdsRef.current = currIds;
        }
      })();
      return;
    }

    if (removed.length > 0) {
      setAdm3RiskHistory((prev) => prev.filter((group) => !removed.includes(group.adm3_id)));
    }

    if (added.length > 0) {
      setPendingTasks((v) => v + 1);
      (async () => {
        try {
          const data = await fetchAdm3RiskByAdm3AndType(token, added, risk, activity);
          setAdm3RiskHistory((prev) => [...prev, ...Object.values(data || {})]);
        } finally {
          setPendingTasks((v) => v - 1);
        }
      })();
    }

    prevIdsRef.current = currIds;
  }, [foundAdms, risk, adm3RiskHistory.length, token, setPendingTasks, activity]);

  return (
    <>
      <div id="national-risk-export">
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
            onSearch={(e) => e.preventDefault()}
            enterpriseRisk={false}
            farmRisk={false}
            selectedEnterprise={null}
            setSelectedEnterprise={() => {}}
            foundFarms={[]}
            setFoundFarms={() => {}}
            nationalRisk={true}
            admLevel={admLevel}
            setAdmLevel={setAdmLevel}
            onAdmSearch={onAdmSearch}
            foundAdms={foundAdms}
            setFoundAdms={setFoundAdms}
            onYearStartEndChange={handleYearStartEndChange}
            riskOptions={RISK_OPTIONS}
            period={period}
            setPeriod={setPeriod}
          />

          {loading && <LoadingSpinner message="Cargando datos y polígonos..." />}

          <RiskLegend enterpriseRisk={false} farmRisk={false} nationalRisk={true} />

          <BaseMap
            onMapCreated={handleMapCreated}
            showDeforestation={true}
            period={period}
            source={source}
            risk={risk}
            deforestationLayers={period?.deforestation_path}
          >
            <LayersControl.Overlay name="Veredas">
              <WMSTileLayer
                url="https://ganageo.alliance.cgiar.org/geoserver/administrative/wms"
                layers="administrative:admin_3"
                format="image/png"
                transparent={true}
                attribution="IDEAM"
                zIndex={1002}
              />
            </LayersControl.Overlay>

            <NationalNavigationHelpers
              adm3Details={adm3Details}
              lastCenteredExtId={lastCenteredExtId}
              setLastCenteredExtId={setLastCenteredExtId}
            />

            <NationalRiskLayers
              foundAdms={foundAdms}
              adm3Details={adm3Details}
              adm3Risk={adm3Risk}
              setPopupData={setPopupData}
              yearStart={yearStart}
            />
          </BaseMap>
        </div>

        {adm3RiskHistory?.length > 0 && (
          <Adm3HistoricalRisk adm3RiskHistory={adm3RiskHistory} yearStart={yearStart} yearEnd={yearEnd} risk={risk} />
        )}
      </div>

      {adm3RiskHistory?.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-4 mb-8 flex justify-end">
          <DownloadPdfButton targetId="national-risk-export" filename="alerta_nacional.pdf" label="Descargar (PDF)" />
        </div>
      )}
    </>
  );
}