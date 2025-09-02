"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { WMSTileLayer, LayersControl, Popup } from "react-leaflet";
import BaseMap from "./BaseMap";
import FilterBar from "@/components/FilterBar";
import RiskLegend from "@/components/Legend";
import LoadingSpinner from "@/components/LoadingSpinner";
import RiskPopup from "@/components/Adm3Risk";
import { searchAdmByName } from "@/services/apiService";
import { useAdm3Risk } from "@/hooks/useAdm3Risk";
import { useDeforestationAnalysis } from "@/hooks/useDeforestationAnalysis";
import { useAdm3Details } from "@/hooks/useAdm3Details";
import NationalRiskLayers from "./NationalRiskLayers";
import NationalNavigationHelpers from "./NationalNavigationHelpers";

export default function NationalRiskMap() {
  // Opciones de riesgo para nacional
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
  const [foundAdms, setFoundAdms] = useState([]);
  const [admLevel, setAdmLevel] = useState("adm1");
  const [admResults, setAdmResults] = useState([]);
  const mapRef = useRef();
  const [yearStart, setYearStart] = useState(2023);
  const [loading, setLoading] = useState(false);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [adm3Risk, setAdm3Risk] = useState(null);
  const [adm3Details, setAdm3Details] = useState([]);
  const [popupData, setPopupData] = useState(null);
  const [lastCenteredExtId, setLastCenteredExtId] = useState(null);

  // Hooks personalizados
  useAdm3Risk(analysis, foundAdms, setAdm3Risk, setPendingTasks);
  useDeforestationAnalysis(period, setAnalysis, setPendingTasks);
  useAdm3Details(adm3Risk, setAdm3Details, setPendingTasks);

  useEffect(() => {
    setLoading(pendingTasks > 0);
  }, [pendingTasks]);

  // Limpieza del popup
  useEffect(() => {
    if (!foundAdms || foundAdms.length === 0) {
      setPopupData(null);
      mapRef.current?.closePopup?.();
    }
  }, [foundAdms]);

  useEffect(() => {
    if (popupData && Array.isArray(adm3Details)) {
      const stillExists = adm3Details.some(
        (d) => d.ext_id === popupData.detail?.ext_id
      );
      if (!stillExists) {
        setPopupData(null);
        mapRef.current?.closePopup?.();
      }
    }
  }, [adm3Details, popupData]);

  useEffect(() => {
    setPopupData(null);
    mapRef.current?.closePopup?.();
  }, [admLevel, period, source, risk, yearStart]);

  const handleAdmSearch = useCallback(
    async (searchText, level) => {
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
    },
    [search]
  );

  const handleMapCreated = (mapInstance) => {
    mapRef.current = mapInstance;
  };

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
        onYearStartEndChange={() => {}}
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

        {/* Popup controlado por estado */}
        {popupData && (
          <Popup
            position={[popupData.lat, popupData.lng]}
            key={`popup-${popupData.detail.ext_id}`}
          >
            <RiskPopup
              detail={popupData.detail}
              riskData={popupData.riskData}
              yearStart={yearStart}
            />
          </Popup>
        )}
      </BaseMap>
    </div>
  );
}
