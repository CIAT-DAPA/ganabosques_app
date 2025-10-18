"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { WMSTileLayer, LayersControl, Popup } from "react-leaflet";
import BaseMap from "./BaseMap";
import FilterBar from "@/components/FilterBar";
import RiskLegend from "@/components/Legend";
import LoadingSpinner from "@/components/LoadingSpinner";
import { searchAdmByName } from "@/services/apiService";
import { useAdm3Risk } from "@/hooks/useAdm3Risk";
import { useDeforestationAnalysis } from "@/hooks/useDeforestationAnalysis";
import { useAdm3Details } from "@/hooks/useAdm3Details";
import NationalRiskLayers from "./NationalRiskLayers";
import NationalNavigationHelpers from "./NationalNavigationHelpers";
import { fetchAdm3RiskByAdm3AndType } from "@/services/apiService";
import Adm3HistoricalRisk from "@/components/Adm3HistoricalRisk";
import DownloadPdfButton from "@/components/DownloadPdfButton"; // 👈 import

export default function NationalRiskMap() {
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
  const [foundAdms, setFoundAdms] = useState([]);
  const [admLevel, setAdmLevel] = useState("adm1");
  const [admResults, setAdmResults] = useState([]);
  const mapRef = useRef();
  const [yearStart, setYearStart] = useState(2023);
  const [yearEnd, setYearEnd] = useState(2024);
  const [loading, setLoading] = useState(false);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [adm3Risk, setAdm3Risk] = useState(null);
  const [adm3Details, setAdm3Details] = useState([]);
  const [popupData, setPopupData] = useState(null);
  const [lastCenteredExtId, setLastCenteredExtId] = useState(null);
  const [adm3RiskHistory, setAdm3RiskHistory] = useState([]);

  useAdm3Risk(analysis, foundAdms, setAdm3Risk, setPendingTasks);
  useDeforestationAnalysis(period, setAnalysis, setPendingTasks);
  useAdm3Details(adm3Risk, setAdm3Details, setPendingTasks);

  const prevIdsRef = useRef([]);
  const prevRiskRef = useRef(risk);

  useEffect(() => {
    setLoading(pendingTasks > 0);
  }, [pendingTasks]);

  // limpiar popup
  useEffect(() => {
    if (!foundAdms || foundAdms.length === 0) {
      setPopupData(null);
      mapRef.current?.closePopup?.();
    }
  }, [foundAdms]);

  const handleAdmSearch = useCallback(
    async (searchText, level) => {
      try {
        const results = await searchAdmByName(searchText, level);
        if (!results?.length) return;
        setAdmResults(results);
        const geometry = results[0]?.geometry;
        if (geometry && mapRef.current) {
          const L = await import("leaflet");
          const layer = L.geoJSON(geometry);
          mapRef.current.fitBounds(layer.getBounds());
        }
      } catch (err) {
        console.error("Error buscando nivel administrativo:", err);
      }
    },
    [search]
  );

  const handleMapCreated = (mapInstance) => (mapRef.current = mapInstance);

  // actualizar historial de riesgo
  useEffect(() => {
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
          const data = await fetchAdm3RiskByAdm3AndType(currIds, risk);
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
      setAdm3RiskHistory((prev) =>
        prev.filter((group) => !removed.includes(group.adm3_id))
      );
    }

    if (added.length > 0) {
      setPendingTasks((v) => v + 1);
      (async () => {
        try {
          const data = await fetchAdm3RiskByAdm3AndType(added, risk);
          setAdm3RiskHistory((prev) => [
            ...prev,
            ...Object.values(data || {}),
          ]);
        } finally {
          setPendingTasks((v) => v - 1);
        }
      })();
    }

    prevIdsRef.current = currIds;
  }, [foundAdms, risk, adm3RiskHistory.length]);

  const handleYearStartEndChange = useCallback((start, end) => {
    setYearStart(start);
    setYearEnd(end);
  }, []);

  return (
    <>
      <div id="national-risk-export">
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
            enterpriseRisk={false}
            farmRisk={false}
            selectedEnterprise={null}
            setSelectedEnterprise={() => {}}
            foundFarms={[]}
            setFoundFarms={() => {}}
            nationalRisk={true}
            admLevel={admLevel}
            setAdmLevel={setAdmLevel}
            onAdmSearch={handleAdmSearch}
            foundAdms={foundAdms}
            setFoundAdms={setFoundAdms}
            onYearStartEndChange={handleYearStartEndChange}
            riskOptions={riskOptions}
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

        {/* Solo mostrar si hay datos */}
        {adm3RiskHistory?.length > 0 && (
          <Adm3HistoricalRisk
            adm3RiskHistory={adm3RiskHistory}
            yearStart={yearStart}
            yearEnd={yearEnd}
          />
        )}
      </div>

      {/* 👇 Solo renderiza el botón si hay resultados */}
      {adm3RiskHistory?.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-4 mb-8 flex justify-end">
          <DownloadPdfButton
            targetId="national-risk-export"
            filename="alerta_nacional.pdf"
            label="Descargar (PDF)"
          />
        </div>
      )}
    </>
  );
}