"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  GeoJSON,
  Popup,
  useMap,
  WMSTileLayer,
  LayersControl,
  useMapEvent,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import FilterBar from "@/components/FilterBar";
import RiskLegend from "@/components/Legend";
import {
  searchAdmByName,
  fetchFarmPolygonsByIds,
  fetchMovementStatisticsByFarmIds,
  fetchAdm3RisksByAnalysisAndAdm3,
  fetchFarmRiskByDeforestationId,
  fetchAdm3DetailsByIds,
  fetchFarmRiskByAnalysisAndFarm
  
} from "@/services/apiService";
import MovementCharts from "@/components/MovementChart";
import LoadingSpinner from "@/components/LoadingSpinner";
import RiskPopup from "@/components/Adm3Risk";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function LeafletMap({ enterpriseRisk, farmRisk, nationalRisk }) {
  // Opciones de riesgo memorizadas
  const riskOptions = useMemo(() => {
    if (enterpriseRisk) return [{ value: "risk_total", label: "Riesgo Total" }];
    /*if (farmRisk)
      return [
        { value: "risk_total", label: "Riesgo anual" },
        { value: "risk_direct", label: "Riesgo acumulado" },
      ];*/
    return [
      { value: "annual", label: "Riesgo anual" },
      { value: "cumulative", label: "Riesgo acumulado" },
    ];
  }, [enterpriseRisk, farmRisk]);

  // Estado centralizado (fuente de la verdad)
  const [risk, setRisk] = useState(() => riskOptions[0]?.value || "");
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
  const [movement, setMovement] = useState([]);
  const [yearStart, setYearStart] = useState(2023);
  const [yearEnd, setYearEnd] = useState(2024);
  const [originalMovement, setOriginalMovement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [riskFarm, setRiskFarm] = useState(null);
  const [adm3Risk, setAdm3Risk] = useState(null);
  const [adm3Details, setAdm3Details] = useState([]);
  const [popupData, setPopupData] = useState(null);

  useEffect(() => {
    import("leaflet");
  }, []);

  useEffect(() => {
    setLoading(pendingTasks > 0);
  }, [pendingTasks]);

  // Buscar ADM memorizado
  const handleAdmSearch = useCallback(async (searchText, level) => {
    try {
      const results = await searchAdmByName(searchText, level);
      if (!results || results.length === 0) return;

      setAdmResults(results);
      const geometry = results[0]?.geometry;
      if (geometry && mapRef.current) {
        const layer = L.geoJSON(geometry);
        mapRef.current.fitBounds(layer.getBounds());
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error al buscar nivel administrativo:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (!foundFarms || foundFarms.length === 0) {
      setFarmPolygons([]);
      return;
    }

    const loadPolygons = async () => {
      const ids = foundFarms.map((farm) => farm.id).filter(Boolean);
      if (ids.length === 0) return;

      try {
        setPendingTasks((prev) => prev + 1);
        const data = await fetchFarmPolygonsByIds(ids);
        setFarmPolygons(data);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error obteniendo polígonos de fincas:", err);
        }
      } finally {
        setPendingTasks((prev) => prev - 1);
      }
    };

    loadPolygons();
  }, [foundFarms]);

  useEffect(() => {
    const loadMovementStats = async () => {
      const ids = foundFarms.map((farm) => farm.id).filter(Boolean);
      if (ids.length === 0) return;

      try {
        setPendingTasks((prev) => prev + 1);
        const data = await fetchMovementStatisticsByFarmIds(ids);
        setOriginalMovement(data);
        setMovement(data);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error obteniendo estadísticas de movimiento:", err);
        }
      } finally {
        setPendingTasks((prev) => prev - 1);
      }
    };

    loadMovementStats();
  }, [foundFarms]);

  // Filtro por año simple
  useEffect(() => {
    if (!yearStart || !originalMovement) return;

    const filtered = {};

    Object.entries(originalMovement).forEach(([farmId, data]) => {
      const filteredInputs = {
        ...data.inputs,
        statistics: {
          [yearStart]: data.inputs.statistics?.[yearStart] || {},
        },
      };

      const filteredOutputs = {
        ...data.outputs,
        statistics: {
          [yearStart]: data.outputs.statistics?.[yearStart] || {},
        },
      };

      filtered[farmId] = {
        ...data,
        inputs: filteredInputs,
        outputs: filteredOutputs,
      };
    });

    setMovement(filtered);
  }, [yearStart, originalMovement]);

  // Limpiar si no hay fincas
  useEffect(() => {
    if (!foundFarms || foundFarms.length === 0) {
      setFarmPolygons([]);
      setMovement({});
      setOriginalMovement({});
      return;
    }
  }, [foundFarms]);

  // Filtro por año avanzado (con farms/enterprises involucrados)
  useEffect(() => {
    if (!yearStart || !originalMovement) return;

    const filtered = {};
    const yearKey = String(yearStart);

    Object.entries(originalMovement).forEach(([farmId, data]) => {
      const inputStats = data.inputs.statistics?.[yearKey];
      const outputStats = data.outputs.statistics?.[yearKey];

      const involvedInputFarms = inputStats?.farms?.map(String) || [];
      const involvedInputEnterprises =
        inputStats?.enterprises?.map(String) || [];

      const involvedOutputFarms = outputStats?.farms?.map(String) || [];
      const involvedOutputEnterprises =
        outputStats?.enterprises?.map(String) || [];

      const filteredInputs = {
        ...data.inputs,
        statistics: {
          [yearKey]: inputStats,
        },
        farms:
          data.inputs.farms
            ?.filter(Boolean)
            .filter((f) =>
              involvedInputFarms.includes(String(f.destination?.farm_id))
            ) || [],
        enterprises:
          data.inputs.enterprises
            ?.filter(Boolean)
            .filter((e) =>
              involvedInputEnterprises.includes(String(e.destination?._id))
            ) || [],
      };

      const filteredOutputs = {
        ...data.outputs,
        statistics: {
          [yearKey]: outputStats,
        },
        farms:
          data.outputs.farms
            ?.filter(Boolean)
            .filter((f) =>
              involvedOutputFarms.includes(String(f.destination?.farm_id))
            ) || [],
        enterprises:
          data.outputs.enterprises
            ?.filter(Boolean)
            .filter((e) =>
              involvedOutputEnterprises.includes(String(e.destination?._id))
            ) || [],
      };

      filtered[farmId] = {
        ...data,
        inputs: filteredInputs,
        outputs: filteredOutputs,
      };
    });

    setMovement(filtered);
  }, [yearStart, originalMovement]);

  const FlyToFarmPolygons = ({ polygons }) => {
    const map = useMap();

    useEffect(() => {
      if (!polygons || polygons.length === 0 || !map) return;

      const allCoords = [];

      polygons.forEach((item) => {
        let geojson;

        try {
          geojson =
            typeof item.geojson === "string"
              ? JSON.parse(item.geojson)
              : item.geojson;
        } catch {
          return;
        }

        geojson?.features?.forEach((feature) => {
          if (feature.geometry?.type === "Polygon") {
            feature.geometry.coordinates[0]?.forEach(([lon, lat]) => {
              allCoords.push([lat, lon]);
            });
          }

          if (feature.geometry?.type === "MultiPolygon") {
            feature.geometry.coordinates.forEach((polygon) => {
              polygon[0]?.forEach(([lon, lat]) => {
                allCoords.push([lat, lon]);
              });
            });
          }
        });
      });

      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        map.flyToBounds(bounds, { padding: [50, 50], duration: 2 });
      }
    }, [polygons, map]);

    return null;
  };

  const allInputs = Object.values(movement || {}).flatMap((m) => [
    ...(m.inputs?.farms || []),
    ...(m.inputs?.enterprises || []),
  ]);

  const allOutputs = Object.values(movement || {}).flatMap((m) => [
    ...(m.outputs?.farms || []),
    ...(m.outputs?.enterprises || []),
  ]);

  const renderGeoJsons = (entries, color) =>
    entries
      .filter((e) => e.destination?.geojson)
      .map((entry, idx) => {
        try {
          const data = JSON.parse(entry.destination.geojson);

          return (
            <GeoJSON
              key={`geojson-${color}-${idx}`}
              data={data}
              style={{ color, weight: 2, fillOpacity: 0.3 }}
            >
              <Popup>
                <strong>Codigo SIT de la finca:</strong>{" "}
                {entry.sit_code || entry.destination.id}
              </Popup>
            </GeoJSON>
          );
        } catch {
          return null;
        }
      });

  const renderMarkers = (movements, color) => {
    return movements
      ?.filter(
        (m) =>
          m.destination?.latitude &&
          m.destination?.longitud &&
          !m.destination?.farm_id // ⛔️ Excluye fincas
      )
      .map((m, idx) => {
        const dest = m.destination;
        const lat = dest.latitude;
        const lon = dest.longitud;
        const name = dest.name || "Sin nombre";
        const id = dest._id || "Sin ID";
        const type = "Empresa";

        return (
          <Marker
            key={`marker-${idx}`}
            position={[lat, lon]}
            icon={L.divIcon({
              className: "custom-marker",
              html: `<div style="background:${color};width:10px;height:10px;border-radius:50%;border:2px solid white;"></div>`,
            })}
          >
            <Popup>
              <strong>Tipo:</strong> {type}
              <br />
              <strong>ID:</strong> {id}
              <br />
              <strong>Nombre:</strong> {name}
            </Popup>
          </Marker>
        );
      });
  };

  useEffect(() => {
    if (
      !Array.isArray(analysis) ||
      analysis.length === 0 ||
      !Array.isArray(foundAdms) ||
      foundAdms.length === 0
    ) {
      return;
    }

    const loadAdm3Risks = async () => {
      const analysisId = analysis[0]?.id;
      const adm3Ids = foundAdms.map((adm) => adm.id).filter(Boolean);
      if (!analysisId || adm3Ids.length === 0) return;

      try {
        setPendingTasks((prev) => prev + 1);
        const data = await fetchAdm3RisksByAnalysisAndAdm3(analysisId, adm3Ids);
        setAdm3Risk(data);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error adm3 risks:", err);
        }
      } finally {
        setPendingTasks((prev) => prev - 1);
      }
    };

    loadAdm3Risks();
  }, [analysis, foundAdms]);

  // Cargar análisis por deforestación cuando cambie `year`
  useEffect(() => {
    if (!year) return;

    const loadFarmRisk = async () => {
      try {
        setPendingTasks((prev) => prev + 1);
        const data = await fetchFarmRiskByDeforestationId(year);
        setAnalysis(data);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error obteniendo análisis por deforestación:", err);
        }
      } finally {
        setPendingTasks((prev) => prev - 1);
      }
    };

    loadFarmRisk();
  }, [year]);

useEffect(() => {
  if (!Array.isArray(analysis) || analysis.length === 0) return;
  if (!Array.isArray(foundFarms) || foundFarms.length === 0) return;

  const analysisId = analysis[0]?.id;
  const farmIds = foundFarms.map((f) => f.id).filter(Boolean);
  if (!analysisId || farmIds.length === 0) return;

  const loadFarmRisk = async () => {
    try {
      setPendingTasks((prev) => prev + 1);
      const data = await fetchFarmRiskByAnalysisAndFarm(analysisId, farmIds);
      setRiskFarm(data);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error al obtener farmRisk:", err);
      }
    } finally {
      setPendingTasks((prev) => prev - 1);
    }
  };

  loadFarmRisk();
}, [analysis, foundFarms]);

  const renderFarmRiskPolygons = (
    polygons,
    farmRiskData,
    foundFarmsList = []
  ) => {
    if (!farmRiskData) return null;

    return polygons.map((farm, idx) => {
      let geojson;
      try {
        geojson =
          typeof farm.geojson === "string"
            ? JSON.parse(farm.geojson)
            : farm.geojson;
      } catch {
        return null;
      }

      const farmId = farm.farm_id || farm.id;

      // Buscar riesgo asociado
      const riskObject = Object.values(farmRiskData)
        .flat()
        .find((r) => r.farm_id === farmId);

      const riskVal = riskObject?.risk_total ?? 0;

      // Obtener sit_code
      const matchedFarm = foundFarmsList.find((f) => f.id === farmId);
      const sitCode = matchedFarm?.code || "Sin código";

      let color = "#00C853"; // Verde por defecto (sin riesgo)
      if (riskVal > 2.5) color = "#D50000"; // Rojo - Alto
      else if (riskVal > 1.5) color = "#FF6D00"; // Naranja - Medio
      else if (riskVal > 0) color = "#FFD600"; // Amarillo - Bajo

      return (
        <GeoJSON
          key={`farmrisk-${idx}`}
          data={geojson}
          style={{ color, weight: 2, fillColor: color, fillOpacity: 0.3 }}
        >
          <Popup>
            <strong>Finca</strong>
            <br />
            Código SIT: {sitCode}
            <br />
            Riesgo total: {riskVal}
          </Popup>
        </GeoJSON>
      );
    });
  };

  useEffect(() => {
    if (!adm3Risk) return;

    const flatRisks = Object.values(adm3Risk).flat();
    const adm3Ids = [
      ...new Set(flatRisks.map((risk) => risk.adm3_id).filter(Boolean)),
    ];

    if (adm3Ids.length === 0) return;

    const loadAdm3Details = async () => {
      try {
        setPendingTasks((prev) => prev + 1);
        const data = await fetchAdm3DetailsByIds(adm3Ids);
        setAdm3Details(data);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error al consultar adm3 details:", err);
        }
      } finally {
        setPendingTasks((prev) => prev - 1);
      }
    };

    loadAdm3Details();
  }, [adm3Risk]);

  // Callback estable para año inicio/fin
  const handleYearStartEndChange = useCallback((start, end) => {
    setYearStart(start);
    setYearEnd(end);
  }, []);

  function WMSRiskClickHandler({ adm3Risk, adm3Details, showPopup }) {
    const [clickLatLng, setClickLatLng] = useState(null);

    const map = useMapEvent("click", async (e) => {
      const { lat, lng } = e.latlng;
      setClickLatLng([lat, lng]);

      const bbox = map.getBounds().toBBoxString();
      const size = map.getSize();
      const point = map.latLngToContainerPoint(e.latlng);

      const params = new URLSearchParams({
        SERVICE: "WMS",
        VERSION: "1.1.1",
        REQUEST: "GetFeatureInfo",
        FORMAT: "image/png",
        TRANSPARENT: "true",
        QUERY_LAYERS: "administrative:admin_3",
        LAYERS: "administrative:admin_3",
        STYLES: "",
        SRS: "EPSG:4326",
        BBOX: bbox,
        WIDTH: size.x,
        HEIGHT: size.y,
        X: Math.floor(point.x),
        Y: Math.floor(point.y),
        INFO_FORMAT: "application/json",
      });

      // ✅ Aplica proxy para evitar CORS (sin cambiar nada más)
      const rawUrl = `https://ganageo.alliance.cgiar.org/geoserver/administrative/wms?${params.toString()}`;
      const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(rawUrl)}`;

      try {
        const response = await fetch(proxiedUrl);
        const data = await response.json();

        const cod_ver = data?.features?.[0]?.properties?.cod_ver;
        if (!cod_ver) return;

        const detail = adm3Details.find((d) => d.ext_id === cod_ver);
        if (!detail) return;

        const riskArray = Object.values(adm3Risk).flat();
        const riskData = riskArray.find((r) => r.adm3_id === detail.id);
        if (!riskData) return;

        showPopup({
          lat,
          lng,
          detail,
          riskData,
        });
      } catch (err) {
        console.error("Error al hacer GetFeatureInfo:", err.message);
      }
    });

    return null;
  }

  return (
    <>
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
          enterpriseRisk={enterpriseRisk}
          farmRisk={farmRisk}
          selectedEnterprise={selectedEnterprise}
          setSelectedEnterprise={setSelectedEnterprise}
          foundFarms={foundFarms}
          setFoundFarms={setFoundFarms}
          nationalRisk={nationalRisk}
          admLevel={admLevel}
          setAdmLevel={setAdmLevel}
          onAdmSearch={handleAdmSearch}
          foundAdms={foundAdms}
          setFoundAdms={setFoundAdms}
          onYearStartEndChange={handleYearStartEndChange}
          riskOptions={riskOptions}
          period={period}
          setPeriod={setPeriod/*handlePeriodChanged*/}
        />

        {loading && <LoadingSpinner message="Cargando datos y polígonos..." />}

        <RiskLegend
          enterpriseRisk={enterpriseRisk}
          farmRisk={farmRisk}
          nationalRisk={nationalRisk}
        />

        <MapContainer
          center={[4.5709, -74.2973]}
          zoom={6}
          scrollWheelZoom={true}
          className="h-[80vh] w-full"
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
        >
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LayersControl position="bottomleft">
            <LayersControl.Overlay
              name={`Deforestación ${period.deforestation_year_start}-${period.deforestation_year_end}`}
            >
              <WMSTileLayer
                url="https://ganageo.alliance.cgiar.org/geoserver/deforestation/wms"
                layers={`${source}_deforestation_${risk}`}
                format="image/png"
                transparent
                version="1.1.1"
                time={`${period.deforestation_year_start}-${period.deforestation_year_end}`}
                zIndex={1000}
              />
            </LayersControl.Overlay>
            <LayersControl.Overlay name="Áreas protegidas">
              <WMSTileLayer
                url="https://ganageo.alliance.cgiar.org/geoserver/administrative/wms"
                layers="administrative:pnn_areas"
                format="image/png"
                transparent={true}
                attribution="IDEAM"
                zIndex={1001}
              />
            </LayersControl.Overlay>
            <LayersControl.Overlay name="Frontera agrícola">
              <WMSTileLayer
                url="https://ganageo.alliance.cgiar.org/geoserver/administrative/wms"
                layers="administrative:upra_boundaries"
                format="image/png"
                transparent={true}
                attribution="IDEAM"
                zIndex={1001}
              />
            </LayersControl.Overlay>
            {farmRisk && (
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
          )}
          </LayersControl>

          {loading && (
            <LoadingSpinner message="Cargando datos y polígonos..." />
          )}

          <FlyToFarmPolygons polygons={farmPolygons} />

          {renderMarkers(allInputs, "#8B4513")}
          {renderGeoJsons(allInputs, "#8B4513")}

          {renderMarkers(allOutputs, "purple")}
          {renderGeoJsons(allOutputs, "purple")}

          {renderFarmRiskPolygons(farmPolygons, riskFarm, foundFarms)}

          {adm3Details.map((detail) => {
            const riskArray = Object.values(adm3Risk).flat();
            const riskData = riskArray.find((r) => r.adm3_id === detail.id);
            if (!riskData) return null;
            const risk = riskData.risk_total; 
            let styleName = "norisk"; 

            if (risk > 2.5) styleName = "hightrisk";
            else if (risk > 1.5) styleName = "mediumrisk";
            else if (risk > 0) styleName = "lowrisk";

            return (
              <>
                <WMSTileLayer
                  key={detail.ext_id}
                  url="https://ganageo.alliance.cgiar.org/geoserver/administrative/wms"
                  layers="administrative:admin_3"
                  format="image/png"
                  transparent={true}
                  cql_filter={`cod_ver='${detail.ext_id}'`}
                  styles={styleName}
                  zIndex={10000}
                />
                <WMSRiskClickHandler
                  adm3Risk={adm3Risk}
                  adm3Details={adm3Details}
                  showPopup={setPopupData}
                />

                {/* Renderizas el popup si hay datos */}
                {popupData && (
                  <Popup position={[popupData.lat, popupData.lng]}>
                    <RiskPopup
                      detail={popupData.detail}
                      riskData={popupData.riskData}
                      yearStart={yearStart}
                    />
                  </Popup>
                )}
              </>
            );
          })}
        </MapContainer>
      </div>

      <MovementCharts
        summary={movement}
        foundFarms={foundFarms}
        riskFarm={riskFarm}
        yearStart={yearStart}
      />
    </>
  );
}
