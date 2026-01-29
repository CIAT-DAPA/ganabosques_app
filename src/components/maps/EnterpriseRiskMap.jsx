"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import BaseMap from "./BaseMap";
import FilterBar from "@/components/FilterBar";
import RiskLegend from "@/components/Legend";
import LoadingSpinner from "@/components/LoadingSpinner";
import EnterpriseChart from "@/components/EnterpriseChart";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import EnterpriseMovementLayers from "./EnterpriseMovementLayers";

import { searchAdmByName, getEnterpriseRiskDetails } from "@/services/apiService";
import { useFilteredMovement } from "@/hooks/useFilteredMovement";
import { useMovementStats } from "@/hooks/useMovementStats";
import { useFarmPolygons } from "@/hooks/useFarmPolygons";
import { useFarmRisk } from "@/hooks/useFarmRisk";
import { useDeforestationAnalysis } from "@/hooks/useDeforestationAnalysis";
import { useEnterpriseMovementStats } from "@/hooks/useEnterpriseMovementStats";

import { Marker, Popup, useMap } from "react-leaflet";
import * as L from "leaflet";
import { useAuth } from "@/hooks/useAuth";

// ------------------------------
// Utils datos
// ------------------------------
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

// ------------------------------
// Íconos dinámicos
// ------------------------------
const TYPE_ALIASES = {
  COLLECTIONCENTER: "COLLECTION_CENTER",
  "CENTRO_ACOPIO": "COLLECTION_CENTER",
  "CENTRO DE ACOPIO": "COLLECTION_CENTER",
  ACOPIO: "COLLECTION_CENTER",
  PLANTA: "SLAUGHTERHOUSE",
  FERIA: "CATTLE_FAIR",
  EMPRESA: "ENTERPRISE",
  FINCA: "FARM",
};

const normalizeType = (type) => {
  if (!type) return "ENTERPRISE";
  const t = String(type).trim().toUpperCase().replace(/\s+/g, " ").replace(/-/g, "_");
  return TYPE_ALIASES[t] || t;
};

const baseForType = (type) => {
  switch (normalizeType(type)) {
    case "SLAUGHTERHOUSE":
      return "planta";
    case "COLLECTION_CENTER":
      return "acopio";
    case "CATTLE_FAIR":
      return "feria";
    case "FARM":
      return "finca";
    case "ENTERPRISE":
    default:
      return "empresa";
  }
};

const iconForType = (type) =>
  L.icon({
    iconUrl: `/${baseForType(type)}.png`,
    iconSize: [42, 57],
    iconAnchor: [21, 57],
    popupAnchor: [0, -36],
    className: "enterprise-marker",
  });

// ------------------------------
// Overlays
// ------------------------------
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
        <Marker key={`mk-${i}`} position={m.pos} icon={iconForType(m.iconType)}>
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

// ------------------------------
// Componente principal
// ------------------------------
export default function EnterpriseMap() {
  const riskOptions = useMemo(
    () => [
      { value: "annual", label: "Alerta anual" },
      { value: "cumulative", label: "Alerta acumulada" },
    ],
    []
  );

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

  const mapRef = useRef();
  const [yearStart, setYearStart] = useState(2023);
  const [yearEnd, setYearEnd] = useState(2024);
  const [originalMovement, setOriginalMovement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [riskFarm, setRiskFarm] = useState(null);
  const [enterpriseDetails, setEnterpriseDetails] = useState(null);

  const { token } = useAuth();

  const movement = useFilteredMovement(originalMovement);
  useMovementStats(foundFarms, setOriginalMovement, setPendingTasks, period, risk);
  useFarmPolygons(foundFarms, setPendingTasks, setOriginalMovement);
  useFarmRisk(analysis, foundFarms, setRiskFarm, setPendingTasks);
  useDeforestationAnalysis(period, setAnalysis, setPendingTasks);

  // Hook para obtener estadísticas de movilización por empresa
  const enterpriseIds = useMemo(() => {
    return Array.isArray(selectedEnterprise)
      ? selectedEnterprise.map((e) => e?.id).filter(Boolean)
      : [];
  }, [selectedEnterprise]);
  const enterpriseMovementStats = useEnterpriseMovementStats(enterpriseIds, period, risk, setPendingTasks);

  useEffect(() => setLoading(pendingTasks > 0), [pendingTasks]);

  const handleAdmSearch = useCallback(
    async (searchText, level) => {
      try {
        if (!token) return;
        const results = await searchAdmByName(token, searchText, level);
        if (!results || results.length === 0) return;
        setAdmResults(results);
        const geometry = results[0]?.geometry;
        if (geometry && mapRef.current) {
          const Lm = await import("leaflet");
          const layer = Lm.geoJSON(geometry);
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

  const asYear = (v) =>
    v instanceof Date
      ? v.getFullYear()
      : typeof v === "number"
      ? v
      : typeof v === "string"
      ? parseInt(v.slice(0, 4), 10)
      : NaN;

  const yearStartVal = asYear(yearStart);
  const yearEndVal = asYear(yearEnd);

  // 🔧 EFECTO ARREGLADO: sin `risk` en deps y siempre decrementa pendingTasks
  useEffect(() => {
    if (!token) {
      setEnterpriseDetails(null);
      return;
    }

    const analysisId = year && String(year).trim();
    const enterpriseIds = Array.isArray(selectedEnterprise)
      ? selectedEnterprise.map((e) => e?.id).filter(Boolean)
      : [];

    if (!analysisId || enterpriseIds.length === 0) {
      setEnterpriseDetails(null);
      return;
    }

    let cancelled = false;
    setPendingTasks((p) => p + 1);

    (async () => {
      try {
        const data = await getEnterpriseRiskDetails(token, analysisId, enterpriseIds);
        if (!cancelled) setEnterpriseDetails(data);
      } catch (err) {
        console.error("Error al cargar enterprise risk details:", err);
        if (!cancelled) setEnterpriseDetails(null);
      } finally {
        // 👇 Siempre decrementamos, aunque se haya cancelado
        setPendingTasks((p) => Math.max(0, p - 1));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [year, selectedEnterprise, token]); // 👈 risk eliminado de las deps

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
            onAdmSearch={handleAdmSearch}
            foundAdms={foundAdms}
            setFoundAdms={setFoundAdms}
            onYearStartEndChange={handleYearStartEndChange}
            riskOptions={riskOptions}
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
            enterpriseRisk={true}
            farmRisk={false}
            nationalRisk={false}
            search={search}
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
            yearStart={yearStartVal}
            yearEnd={yearEndVal}
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