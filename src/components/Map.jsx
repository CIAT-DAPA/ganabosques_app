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
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import FilterBar from "@/components/FilterBar";
import RiskLegend from "@/components/Legend";
import { searchAdmByName } from "@/services/apiService";
import MovementCharts from "@/components/MovementChart";
import LoadingSpinner from "@/components/LoadingSpinner";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function LeafletMap({ enterpriseRisk, farmRisk, nationalRisk }) {
  const [risk, setRisk] = useState("");
  const [year, setYear] = useState("");
  const [source, setSource] = useState("");
  const [search, setSearch] = useState("");
  const [selectedEnterprise, setSelectedEnterprise] = useState(null);
  const [foundFarms, setFoundFarms] = useState([]);
  const [foundAdms, setFoundAdms] = useState([]);
  const [admLevel, setAdmLevel] = useState("adm1");
  const [admResults, setAdmResults] = useState([]);
  const [farmPolygons, setFarmPolygons] = useState([]);
  const mapRef = useRef();
  const [movement, setMovement] = useState([]);
  const [yearStart, setYearStart] = useState(null);
  const [yearEnd, setYearEnd] = useState(null);
  const [originalMovement, setOriginalMovement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [riskFarm, setRiskFarm] = useState(null);

  useEffect(() => {
    import("leaflet");
  }, []);
useEffect(() => {
  setLoading(pendingTasks > 0);
}, [pendingTasks]);

  const handleAdmSearch = async (searchText, level) => {
    try {
      const results = await searchAdmByName(searchText, level);
      if (!results || results.length === 0) {
        console.warn("No se encontraron resultados");
        return;
      }

      setAdmResults(results);
      const geometry = results[0]?.geometry;
      if (geometry && mapRef.current) {
        const layer = L.geoJSON(geometry);
        mapRef.current.fitBounds(layer.getBounds());
      }
    } catch (err) {
      console.error("Error al buscar nivel administrativo:", err);
    }
  };
  useEffect(() => {
    if (!foundFarms || foundFarms.length === 0) {
    setFarmPolygons([]); 
    return;
  }
    const fetchFarmPolygons = async () => {
      const ids = foundFarms
        .map((farm) => farm.id)
        .filter((id) => id) 

      if (!ids || ids.length === 0) return;

      try {
        setPendingTasks((prev) => prev + 1); 
        const response = await fetch(
          `http://localhost:8000/farmpolygons/by-farm?ids=${ids}`
        );
        const data = await response.json();
        setFarmPolygons(data); 
      } catch (err) {
        console.error("Error obteniendo polígonos de fincas:", err);
      } finally {
        setPendingTasks((prev) => prev - 1);
      }
    };

    fetchFarmPolygons();
  }, [foundFarms]);

  useEffect(() => {
    const fetchMovementStatistics = async () => {
      const ids = foundFarms
        .map((farm) => farm.id)
        .filter((id) => id)
        .join(",");

      if (!ids || ids.length === 0) return;

      try {
        setPendingTasks((prev) => prev + 1);
        const response = await fetch(
          `http://localhost:8000/movement/statistics-by-farmid?ids=${ids}`
        );
        const data = await response.json();

        setOriginalMovement(data); 
        setMovement(data); 
      } catch (err) {
        console.error("Error obteniendo estadísticas de movimiento:", err);
      } finally {
        setPendingTasks((prev) => prev - 1);
      }
    };

    fetchMovementStatistics();
  }, [foundFarms]);
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
useEffect(() => {
  if (!foundFarms || foundFarms.length === 0) {
    setFarmPolygons([]);    
    setMovement({});         
    setOriginalMovement({}); 
    return;
  }
}, [foundFarms]);

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
        } catch (err) {
          console.error("❌ Error al parsear geojson:", item.geojson);
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
      } else {
        console.warn("⚠️ No se encontraron coordenadas válidas");
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
              <strong>Codigo SIT de la finca:</strong> {entry.sit_code || entry.destination.id}
            </Popup>
          </GeoJSON>
        );
      } catch (err) {
        console.warn("❌ Error parsing geojson:", entry.destination.geojson);
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

console.log(foundFarms)

  useEffect(() => {
    if (!year) return; 

    const fetchAnalysisByDeforestation = async () => {
      try {
        setPendingTasks((prev) => prev + 1); 
        const response = await fetch(
          `http://localhost:8000/farmrisk/by-analysis-and-farm?deforestation_id=${year}`
        );

        if (!response.ok) {
          throw new Error("Error en la respuesta del servidor");
        }

        const data = await response.json();
        setAnalysis(data);
      } catch (err) {
        console.error("❌ Error obteniendo análisis por deforestación:", err);
      } finally {
        setPendingTasks((prev) => prev - 1);
      }
    };

    fetchAnalysisByDeforestation();
  }, [year]);
  useEffect(() => {
    if (!analysis || !Array.isArray(analysis) || analysis.length === 0) return;
    if (!foundFarms || foundFarms.length === 0) return;

    const analysisId = analysis[0]?.id;
    const farmIds = foundFarms.map((f) => f.id).filter(Boolean);

    if (!analysisId || farmIds.length === 0) return;

    const fetchFarmRisk = async () => {
      try {
        setPendingTasks((prev) => prev + 1);

        const response = await fetch(
          "http://localhost:8000/farmrisk/by-analysis-and-farm",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              analysis_ids: [analysisId],
              farm_ids: farmIds,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Error al consultar riesgo de fincas");
        }

        const data = await response.json();
        setRiskFarm(data);
      } catch (err) {
        console.error("❌ Error al obtener farmRisk:", err);
      } finally {
        setPendingTasks((prev) => prev - 1);
      }
    };

    fetchFarmRisk();
  }, [analysis, foundFarms]);
  const renderFarmRiskPolygons = (polygons, farmRisk, foundFarms = []) => {
  if (!farmRisk) return null;

  return polygons.map((farm, idx) => {
    let geojson;
    try {
      geojson =
        typeof farm.geojson === "string" ? JSON.parse(farm.geojson) : farm.geojson;
    } catch (err) {
      console.error("❌ Error parsing geojson:", farm.geojson);
      return null;
    }

    const farmId = farm.farm_id || farm.id;

    // Buscar riesgo asociado
    const riskObject = Object.values(farmRisk)
      .flat()
      .find((r) => r.farm_id === farmId);

    const risk = riskObject?.risk_total ?? 0;

    // Obtener sit_code
    const matchedFarm = foundFarms.find((f) => f.id === farmId);
    const sitCode = matchedFarm?.code || "Sin código";

    
    let color = "green";
    if (risk > 2.5) {
      color = "#B60205"; 
    } else if (risk > 1.5) {
      color = "#FBCA04";
    } else if (risk > 0) {
      color = "#F9D0C4"; 
    }

    return (
      <GeoJSON
        key={`farmrisk-${idx}`}
        data={geojson}
        style={{
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.3,
        }}
      >
        <Popup>
          <strong>Finca</strong>
          <br />
          Código SIT: {sitCode}
          <br />
          Riesgo total: {risk}
        </Popup>
      </GeoJSON>
    );
  });
};

console.log(movement)

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
          onYearStartEndChange={(start, end) => {
            setYearStart(start);
            setYearEnd(end);
          }}
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
          {farmRisk && (
            <LayersControl position="bottomleft">
              <LayersControl.Overlay name="Ver niveles administrativos" checked>
                <WMSTileLayer
                  url="http://localhost:8600/geoserver/administrative/wms"
                  layers="administrative:admin_2"
                  format="image/png"
                  transparent={true}
                  attribution="IDEAM"
                  zIndex={1000}
                />
              </LayersControl.Overlay>
            </LayersControl>
          )}
{loading && <LoadingSpinner message="Cargando datos y polígonos..." />}
          <FlyToFarmPolygons polygons={farmPolygons} />
          {renderMarkers(allInputs, "#8B4513")}
          {renderGeoJsons(allInputs, "#8B4513")}

          {renderMarkers(allOutputs, "purple")}
          {renderGeoJsons(allOutputs, "purple")}
          {renderFarmRiskPolygons(farmPolygons, riskFarm, foundFarms)}
        </MapContainer>
      </div>

    
        <MovementCharts
          summary={movement}
          foundFarms={foundFarms}
          riskFarm={riskFarm}
        />
    
    </>
  );
}
