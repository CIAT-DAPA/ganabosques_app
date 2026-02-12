"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import BaseMap from "./BaseMap";
import FilterBar from "@/components/FilterBar";
import RiskLegend from "@/components/Legend";
import LoadingSpinner from "@/components/LoadingSpinner";
import EnterpriseChart from "@/components/EnterpriseChart";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import EnterpriseMovementLayers from "./EnterpriseMovementLayers";
import { getEnterpriseRiskDetails } from "@/services/apiService";
import { useFilteredMovement } from "@/hooks/useFilteredMovement";
import { useMovementStats } from "@/hooks/useMovementStats";
import { useFarmPolygons } from "@/hooks/useFarmPolygons";
import { useFarmRisk } from "@/hooks/useFarmRisk";
import { useDeforestationAnalysis } from "@/hooks/useDeforestationAnalysis";
import { useEnterpriseMovementStats } from "@/hooks/useEnterpriseMovementStats";
import { useMapState } from "@/hooks/useMapState";
import { useLoadingState } from "@/hooks/useLoadingState";
import { useFilterState } from "@/hooks/useFilterState";
import { asYear } from "@/utils";
import { getEnterpriseIcon } from "@/utils/mapUtils";
import { RISK_OPTIONS } from "@/contexts/MapFiltersContext";

import { Marker, Popup, useMap } from "react-leaflet";

function getEnterprisesArray(enterpriseDetails) {
  if (!enterpriseDetails) return [];
  if (Array.isArray(enterpriseDetails)) return enterpriseDetails;
  if (Array.isArray(enterpriseDetails.enterprises)) return enterpriseDetails.enterprises;
  if (enterpriseDetails.data && Array.isArray(enterpriseDetails.data.enterprises))
    return enterpriseDetails.data.enterprises;
  return [];
}

function hasProviderAlert(p = {}) {
  const r = p?.risk || {};
  return r?.risk_direct === true || r?.risk_input === true || r?.risk_output === true;
}

function EnterpriseOverlays({ enterpriseDetails }) {
  const map = useMap();

  const { markers, bounds } = useMemo(() => {
    const enterprises = getEnterprisesArray(enterpriseDetails);
    const mks = [];
    const b = L.latLngBounds();

    for (const ent of enterprises) {
      const entLat = ent?.latitude ?? ent?.lat;
      const entLng = ent?.longitud ?? ent?.lng ?? ent?.lon ?? ent?.long;
      const entType = ent?.type_enterprise || ent?.type || "ENTERPRISE";

      if (Number.isFinite(entLat) && Number.isFinite(entLng)) {
        const entPos = [entLat, entLng];
        mks.push({
          pos: entPos,
          name: ent?.name || "—",
          dep: ent?.adm1?.name || "—",
          mun: ent?.adm2?.name || "—",
          iconType: entType,
          alert:
            (ent?.providers?.inputs ?? []).some(hasProviderAlert) ||
            (ent?.providers?.outputs ?? []).some(hasProviderAlert),
        });
        b.extend(entPos);
      }
    }

    return { markers: mks, bounds: b };
  }, [enterpriseDetails]);

  useEffect(() => {
    if (bounds && bounds.isValid && bounds.isValid()) {
      map.flyToBounds(bounds, {
        padding: [30, 30],
        animate: true,
        duration: 2.0,
        easeLinearity: 0.2,
      });
    }
  }, [bounds, map]);

  return (
    <>
      {markers.map((m, i) => (
        <Marker key={`mk-${i}`} position={m.pos} icon={getEnterpriseIcon(m.iconType)}>
          <Popup>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{m.name}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Depto: {m.dep} · Municipio: {m.mun}
            </div>
            <div style={{ fontSize: 12, marginTop: 2 }}>
              Alertas en proveedores: {m.alert ? "Sí" : "No"}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default function EnterpriseMap() {
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
    admLevel, setAdmLevel,
    yearStart, yearEnd,
    handleYearStartEndChange,
    handleAdmSearch,
    token,
  } = useFilterState();

  const [originalMovement, setOriginalMovement] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [riskFarm, setRiskFarm] = useState(null);
  const [enterpriseDetails, setEnterpriseDetails] = useState(null);

  const movement = useFilteredMovement(originalMovement);
  useMovementStats(foundFarms, setOriginalMovement, setPendingTasks, period, risk);
  useFarmPolygons(foundFarms, setPendingTasks, setOriginalMovement);
  useFarmRisk(period, foundFarms, setRiskFarm, setPendingTasks);
  useDeforestationAnalysis(period, setAnalysis, setPendingTasks);

  const enterpriseIds = useMemo(() => {
    return Array.isArray(selectedEnterprise)
      ? selectedEnterprise.map((e) => e?.id).filter(Boolean)
      : [];
  }, [selectedEnterprise]);
  const enterpriseMovementStats = useEnterpriseMovementStats(enterpriseIds, period, risk, setPendingTasks);

  const onAdmSearch = useCallback(
    (text, level) => handleAdmSearch(text, level, mapRef),
    [handleAdmSearch, mapRef]
  );

  const yearStartVal = asYear(yearStart);
  const yearEndVal = asYear(yearEnd);

  useEffect(() => {
    if (!token) {
      setEnterpriseDetails(null);
      return;
    }

    const analysisId = year && String(year).trim();
    const entIds = Array.isArray(selectedEnterprise)
      ? selectedEnterprise.map((e) => e?.id).filter(Boolean)
      : [];

    if (!analysisId || entIds.length === 0) {
      setEnterpriseDetails(null);
      return;
    }

    let cancelled = false;
    setPendingTasks((p) => p + 1);

    (async () => {
      try {
        const data = await getEnterpriseRiskDetails(token, analysisId, entIds);
        if (!cancelled) setEnterpriseDetails(data);
      } catch (err) {
        console.error("Error al cargar enterprise risk details:", err);
        if (!cancelled) setEnterpriseDetails(null);
      } finally {
        setPendingTasks((p) => Math.max(0, p - 1));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [year, selectedEnterprise, token, setPendingTasks]);

  const hasEnterpriseData =
    Array.isArray(getEnterprisesArray(enterpriseDetails)) &&
    getEnterprisesArray(enterpriseDetails).length > 0;

  return (
    <>
      <div id="enterprise-risk-export">
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
            enterpriseRisk={true}
            farmRisk={false}
            nationalRisk={false}
            selectedEnterprise={selectedEnterprise}
            setSelectedEnterprise={setSelectedEnterprise}
            foundFarms={foundFarms}
            setFoundFarms={setFoundFarms}
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

          <RiskLegend enterpriseRisk={true} farmRisk={false} nationalRisk={false} />

          <BaseMap
            onMapCreated={handleMapCreated}
            showDeforestation={true}
            period={period}
            source={source}
            risk={risk}
            deforestationLayers={period?.deforestation_path}
          >
            <EnterpriseOverlays enterpriseDetails={enterpriseDetails} />
            <EnterpriseMovementLayers
              movementStats={enterpriseMovementStats}
              enterpriseDetails={enterpriseDetails}
            />
          </BaseMap>
        </div>

        {hasEnterpriseData && (
          <EnterpriseChart
            yearStart={
              risk === "atd" || risk === "nad" ? yearStart : yearStartVal
            }
            yearEnd={risk === "atd" || risk === "nad" ? yearEnd : yearEndVal}
            enterpriseDetails={enterpriseDetails}
            risk={risk}
            movementStats={enterpriseMovementStats}
          />
        )}
      </div>

      {hasEnterpriseData && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-4 mb-8 flex justify-end">
          <DownloadPdfButton
            targetId="enterprise-risk-export"
            filename="alerta_empresa.pdf"
            label="Descargar (PDF)"
          />
        </div>
      )}
    </>
  );
}