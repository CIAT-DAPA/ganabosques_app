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
import { searchAdmByName } from "@/services/apiService";
import MovementCharts from "@/components/MovementChart";
import LoadingSpinner from "@/components/LoadingSpinner";
import RiskPopup from "@/components/Adm3Risk";
import { all } from "axios";
import { useFilteredMovement } from "@/hooks/useFilteredMovement";
import { useMovementStats } from "@/hooks/useMovementStats";
import { useFarmPolygons } from "@/hooks/useFarmPolygons";
import { useFarmRisk } from "@/hooks/useFarmRisk";
import { useAdm3Risk } from "@/hooks/useAdm3Risk";
import { useDeforestationAnalysis } from "@/hooks/useDeforestationAnalysis";
import { useAdm3Details } from "@/hooks/useAdm3Details";

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
  const [lastCenteredExtId, setLastCenteredExtId] = useState(null);

  const movement = useFilteredMovement(originalMovement, yearStart);
  useMovementStats(foundFarms, setOriginalMovement, setPendingTasks);
  useFarmPolygons(
    foundFarms,
    setFarmPolygons,
    setPendingTasks,
    setOriginalMovement
  );
  useFarmRisk(analysis, foundFarms, setRiskFarm, setPendingTasks);
  useAdm3Risk(analysis, foundAdms, setAdm3Risk, setPendingTasks);
  useDeforestationAnalysis(period, setAnalysis, setPendingTasks);
  useAdm3Details(adm3Risk, setAdm3Details, setPendingTasks);

  useEffect(() => {
    import("leaflet");
  }, []);

  useEffect(() => {
    setLoading(pendingTasks > 0);
  }, [pendingTasks]);

  // --- Limpieza robusta del popup ---
  useEffect(() => {
    // Si no hay veredas encontradas, cerramos el popup
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

  // (Opcional) Cuando cambian filtros clave, limpiamos el popup
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

  const allInputs = Object.entries(movement || {}).flatMap(([farmId, m]) => [
    ...(m.inputs?.farms || []).map((entry) => ({ ...entry, __farmId: farmId })),
    ...(m.inputs?.enterprises || []).map((entry) => ({
      ...entry,
      __farmId: farmId,
    })),
  ]);

  const allOutputs = Object.entries(movement || {}).flatMap(([farmId, m]) => [
    ...(m.outputs?.farms || []).map((entry) => ({
      ...entry,
      __farmId: farmId,
    })),
    ...(m.outputs?.enterprises || []).map((entry) => ({
      ...entry,
      __farmId: farmId,
    })),
  ]);

  const renderGeoJsons = (entries, color, farm_main) => {
    return (entries || [])
      .filter((e) => e?.destination?.geojson)
      .map((entry, idx) => {
        try {
          const originFarmId = String(entry.__farmId ?? "");
          const targetFarmId = String(entry.destination?.farm_id ?? "");

          if (!originFarmId || !targetFarmId || originFarmId === targetFarmId)
            return null;

          const data =
            typeof entry.destination.geojson === "string"
              ? JSON.parse(entry.destination.geojson)
              : entry.destination.geojson;

          const yearKey = String(yearStart);
          const farmsMixed = (
            movement?.[originFarmId]?.mixed?.[yearKey]?.farms || []
          ).map(String);
          const isMixed = farmsMixed.includes(targetFarmId);
          const finalColor = isMixed ? "#e91e63" : color;

          return (
            <GeoJSON
              key={`geojson-${targetFarmId || idx}`}
              data={data}
              style={{ color: finalColor, weight: 2, fillOpacity: 0.3 }}
            >
              <Popup>
                <div className="p-3  bg-white text-sm space-y-1">
                  <div>
                    <span className="font-semibold">Código SIT:</span>{" "}
                    {data.name || "N/A"}
                  </div>
                </div>
              </Popup>
            </GeoJSON>
          );
        } catch (error) {
          console.warn("Error al parsear geojson:", error);
          return null;
        }
      });
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "SLAUGHTERHOUSE":
        return "Planta de sacrificio";
      case "COLLECTION_CENTER":
        return "Centro de acopio";
      case "CATTLE_FAIR":
        return "Feria de ganado";
      case "ENTERPRISE":
        return "Empresa";
      case "FARM":
        return "Finca";
      default:
        return type;
    }
  };

  const renderMarkers = (movements, color, farm_main) => {
    return (movements || [])
      .filter(
        (m) =>
          m?.destination?.latitude &&
          m?.destination?.longitud &&
          !m?.destination?.farm_id
      )
      .map((m, idx) => {
        const dest = m.destination;
        const lat = dest.latitude;
        const lon = dest.longitud;
        const name = dest.name || "Sin nombre";
        const id = String(dest._id ?? "");
        const type = dest.type_enterprise;

        const originFarmId = String(m.__farmId ?? m.source?.farm_id ?? "");
        const yearKey = String(yearStart);
        const enterprisesMixed = (
          movement?.[originFarmId]?.mixed?.[yearKey]?.enterprises || []
        ).map(String);
        const isMixed = !!originFarmId && !!id && enterprisesMixed.includes(id);

        const finalColor = isMixed ? "#e91e63" : color;
        let farm_tmp = farm_main && farm_main.length > 0 ? farm_main[0] : null;

        return (
          <>
            <Marker
              key={`marker-${idx}-${id || "noid"}`}
              position={[lat, lon]}
              icon={L.divIcon({
                className: "custom-marker",
                html: `<div style="background:${finalColor};width:10px;height:10px;border-radius:50%;border:2px solid white;"></div>`,
              })}
            >
              <Popup>
                <div className="p-3  bg-white text-sm space-y-2">
                  <div>
                    <span className="font-semibold">Tipo:</span>{" "}
                    {getTypeLabel(type)}
                  </div>
                  <div>
                    <span className="font-semibold">Nombre:</span> {name}
                  </div>
                </div>
              </Popup>
            </Marker>
            {farm_tmp && (
              <Polyline
                key={`line-${idx}-${id || "noid"}`}
                positions={[
                  [farm_tmp.latitude, farm_tmp.longitud],
                  [lat, lon],
                ]}
              />
            )}
          </>
        );
      });
  };

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
      } catch (err) {
        console.warn("Error parseando geojson de farm:", farm, err);
        return null;
      }

      const farmId = farm.farm_id || farm.id;
      const riskObject = Object.values(farmRiskData)
        .flat()
        .find((r) => r.farm_id === farmId);
      const riskVal = riskObject?.risk_total ?? 0;

      const matchedFarm = foundFarmsList.find((f) => f.id === farmId);
      const sitCode = matchedFarm?.code || "Sin código";

      let color = "#00C853"; // Verde por defecto (sin riesgo)
      if (riskVal > 2.5) color = "#D50000"; // Rojo - Alto
      else if (riskVal > 1.5) color = "#FF6D00"; // Naranja - Medio
      else if (riskVal > 0) color = "#FFD600"; // Amarillo - Bajo

      return (
        <GeoJSON
          key={`farmrisk-${farmId}`}
          data={geojson}
          style={{ color, weight: 2, fillColor: color, fillOpacity: 0.3 }}
        >
          <Popup>
            <div className="p-3  bg-white text-sm space-y-1">
              <div className="font-semibold text-green-700">Finca</div>
              <div>
                <span className="font-medium">Código SIT:</span>{" "}
                {sitCode || "N/A"}
              </div>
              <div>
                <span className="font-medium">Riesgo total:</span>{" "}
                {riskVal ?? "N/A"}
              </div>
            </div>
          </Popup>
        </GeoJSON>
      );
    });
  };

  const handleYearStartEndChange = useCallback((start, end) => {
    setYearStart(start);
    setYearEnd(end);
  }, []);

  // --- Handler único de clicks WMS con limpieza ---
  function WMSRiskClickHandler({ adm3Risk, adm3Details, showPopup }) {
    const activeReq = useRef(0);

    useMapEvent("click", async (e) => {
      const reqId = ++activeReq.current;

      const map = e.target;
      const { lat, lng } = e.latlng;

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

      const rawUrl = `https://ganageo.alliance.cgiar.org/geoserver/administrative/wms?${params.toString()}`;
      const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(rawUrl)}`;

      try {
        const response = await fetch(proxiedUrl);
        if (activeReq.current !== reqId) return; // Evita carreras si hubo otro click

        const data = await response.json();
        const cod_ver = data?.features?.[0]?.properties?.cod_ver;

        if (!cod_ver) {
          showPopup(null);
          return;
        }

        const detail = adm3Details.find((d) => d.ext_id === cod_ver);
        if (!detail) {
          showPopup(null);
          return;
        }

        const riskArray = Object.values(adm3Risk).flat();
        const riskData = riskArray.find((r) => r.adm3_id === detail.id);
        if (!riskData) {
          showPopup(null);
          return;
        }

        showPopup({ lat, lng, detail, riskData });
      } catch (err) {
        console.error("Error al hacer GetFeatureInfo:", err);
        showPopup(null);
      }
    });

    return null;
  }

  const start = period?.deforestation_year_start ?? null;
  const end = period?.deforestation_year_end ?? null;
  const hasPeriod = start != null && end != null;
  console.log(adm3Details);
  const defLabel = hasPeriod
    ? `Deforestación ${start}-${end}`
    : "Deforestación";

  function FlyToAdm3Detail({
    adm3Details,
    lastCenteredExtId,
    setLastCenteredExtId,
  }) {
    const map = useMap();

    useEffect(() => {
      if (!map || !adm3Details || adm3Details.length === 0) return;

      const latest = adm3Details[adm3Details.length - 1];
      const extId = latest?.ext_id || latest?.cod_ver || latest?.id;
      if (!extId) return;

      if (extId === lastCenteredExtId) {
        console.log("🔁 Ya centrado en", extId);
        return;
      }

      console.log("📍 Volando a nuevo adm3:", extId);
      setLastCenteredExtId(extId); // ✅ marcamos como ya centrado

      const wfsUrl = `https://ganageo.alliance.cgiar.org/geoserver/administrative/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=administrative:admin_3&outputFormat=application/json&CQL_FILTER=cod_ver='${extId}'&srsName=EPSG:4326`;
      const fullUrl = `https://corsproxy.io/?${encodeURIComponent(wfsUrl)}`;

      fetch(fullUrl)
        .then((res) => res.json())
        .then((geojson) => {
          const coords = [];

          geojson?.features?.forEach((feature) => {
            const geom = feature.geometry;

            if (geom?.type === "Polygon") {
              geom.coordinates[0].forEach(([lon, lat]) => {
                coords.push([lat, lon]);
              });
            }

            if (geom?.type === "MultiPolygon") {
              geom.coordinates.forEach((polygon) => {
                polygon[0].forEach(([lon, lat]) => {
                  coords.push([lat, lon]);
                });
              });
            }
          });

          if (coords.length > 0) {
            const bounds = L.latLngBounds(coords);
            map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
          }
        })
        .catch((err) => {
          console.error("❌ Error al centrar en adm3:", err);
        });
    }, [adm3Details, lastCenteredExtId, setLastCenteredExtId]);

    return null;
  }

  useEffect(() => {
    if (adm3Details.length === 0) {
      setLastCenteredExtId(null);
    }
  }, [adm3Details]);

  function ZoomControlTopRight() {
    const map = useMap();

    useEffect(() => {
      const zoom = L.control.zoom({ position: "topright" });
      zoom.addTo(map);
      return () => {
        zoom.remove();
      };
    }, [map]);

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
          setPeriod={setPeriod}
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
          zoomControl={false}
          className="h-[80vh] w-full"
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
        >
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LayersControl position="topright">
            <LayersControl.Overlay
              key={`def-${start ?? "na"}-${end ?? "na"}-${source}-${risk}`}
              name={defLabel}
            >
              <WMSTileLayer
                key={`wms-${start ?? "na"}-${end ?? "na"}-${source}-${risk}`}
                url="https://ganageo.alliance.cgiar.org/geoserver/deforestation/wms"
                layers={`${source}`}
                format="image/png"
                transparent
                version="1.1.1"
                {...(hasPeriod ? { time: `${start}` } : {})}
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
          <ZoomControlTopRight />

          {loading && (
            <LoadingSpinner message="Cargando datos y polígonos..." />
          )}

          <FlyToFarmPolygons polygons={farmPolygons} />
          <FlyToAdm3Detail
            adm3Details={adm3Details}
            lastCenteredExtId={lastCenteredExtId}
            setLastCenteredExtId={setLastCenteredExtId}
          />

          {renderMarkers(allInputs, "#8B4513", farmPolygons)}
          {renderGeoJsons(allInputs, "#8B4513", farmPolygons)}

          {renderMarkers(allOutputs, "purple", farmPolygons)}
          {renderGeoJsons(allOutputs, "purple", farmPolygons)}

          {renderFarmRiskPolygons(farmPolygons, riskFarm, foundFarms)}
          {foundAdms &&
            foundAdms.length > 0 &&
            adm3Details.map((detail) => {
              const riskArray = Object.values(adm3Risk || {}).flat();
              const riskData = riskArray.find((r) => r.adm3_id === detail.id);
              if (!riskData) return null;
              const riskVal = riskData.risk_total;

              let styleName = "norisk";
              if (riskVal > 2.5) styleName = "hightrisk";
              else if (riskVal > 1.5) styleName = "mediumrisk";
              else if (riskVal > 0) styleName = "lowrisk";

              return (
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
              );
            })}

          {adm3Risk && adm3Details?.length > 0 && foundAdms?.length > 0 && (
            <WMSRiskClickHandler
              adm3Risk={adm3Risk}
              adm3Details={adm3Details}
              showPopup={setPopupData}
            />
          )}

          {/* --- Un solo Popup controlado por estado --- */}
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
