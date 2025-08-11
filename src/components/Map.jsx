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

  const startTask = () => setPendingTasks((prev) => prev + 1);
  const endTask = () => setPendingTasks((prev) => Math.max(prev - 1, 0));
  useEffect(() => {
    import("leaflet");
  }, []);

  useEffect(() => {
    const fetchFarmPolygons = async () => {
      if (!foundFarms || foundFarms.length === 0) {
        setFarmPolygons([]);
        return;
      }

      startTask();

      const ids = foundFarms.map((f) => f.id).join(",");
      try {
        const res = await fetch(
          `http://localhost:8000/farmpolygons/by-farm?ids=${encodeURIComponent(
            ids
          )}`
        );
        const data = await res.json();
        const validGeojsons = data
          .filter((p) => p.geojson)
          .map((p) => JSON.parse(p.geojson));
        setFarmPolygons(validGeojsons);
      } catch (err) {
        console.error("Error al cargar polígonos de fincas:", err);
        setFarmPolygons([]);
      } finally {
        endTask();
      }
    };

    fetchFarmPolygons();
  }, [foundFarms]);

  useEffect(() => {
    setLoading(pendingTasks > 0);
  }, [pendingTasks]);

  useEffect(() => {
    const fetchMovementStats = async () => {
      if (!risk || !year || !source || foundFarms.length === 0) return;
      startTask(); //
      const ids = foundFarms.map((f) => f.id).join(",");

      try {
        const res = await fetch(
          `http://localhost:8000/movement/statistics-by-farmid?ids=${encodeURIComponent(
            ids
          )}`
        );
        const data = await res.json();

        const sitCodeMap = Object.fromEntries(
          foundFarms.map((farm) => [farm.id, farm.code])
        );

        const enrichFarmsWithSIT = (farms) =>
          farms.map((entry) => ({
            ...entry,
            sit_code: sitCodeMap[entry.destination?._id] || null,
          }));

        const sumByLabel = (statsSection) => {
          const summary = {};

          Object.values(statsSection || {}).forEach((speciesGroup) => {
            Object.entries(speciesGroup || {}).forEach(([label, values]) => {
              if (!summary[label]) {
                summary[label] = { headcount: 0, movements: 0 };
              }
              summary[label].headcount += values.headcount || 0;
              summary[label].movements += values.movements || 0;
            });
          });

          return summary;
        };

        const sumAllYears = (stats) =>
          sumByLabel(
            Object.values(stats || {}).reduce((acc, yearGroup) => {
              Object.entries(yearGroup).forEach(([species, values]) => {
                acc[species] = { ...(acc[species] || {}), ...values };
              });
              return acc;
            }, {})
          );

        const enrichedData = {
          searched_farms: foundFarms.map((farm) => ({
            id: farm.id,
            sit_code: farm.code,
          })),
          ...data,
          inputs: {
            ...data.inputs,
            farms: enrichFarmsWithSIT(data.inputs?.farms || []),
          },
          outputs: {
            ...data.outputs,
            farms: enrichFarmsWithSIT(data.outputs?.farms || []),
          },
          summary: {
            inputs: sumAllYears(data.inputs?.statistics),
            outputs: sumAllYears(data.outputs?.statistics),
          },
        };

        setOriginalMovement(enrichedData);
        console.log("Original movement:", enrichedData);

        setMovement(enrichedData);
      } catch (err) {
        console.error("Error al obtener estadísticas de movimiento:", err);
        setMovement([]);
      } finally {
        endTask();
      }
    };

    fetchMovementStats();
  }, [risk, year, source, foundFarms]);
  useEffect(() => {
    if (!originalMovement || !yearStart) return;

    const filterStatsFromYear = (stats) => {
      if (!stats) return {};
      return Object.fromEntries(
        Object.entries(stats).filter(([year]) => parseInt(year) >= yearStart)
      );
    };

    const sumByLabel = (statsSection) => {
      const summary = {};
      Object.values(statsSection || {}).forEach((speciesGroup) => {
        Object.entries(speciesGroup || {}).forEach(([label, values]) => {
          if (!summary[label]) {
            summary[label] = { headcount: 0, movements: 0 };
          }
          summary[label].headcount += values.headcount || 0;
          summary[label].movements += values.movements || 0;
        });
      });
      return summary;
    };

    const sumAllYears = (stats) =>
      sumByLabel(
        Object.values(stats || {}).reduce((acc, yearGroup) => {
          Object.entries(yearGroup).forEach(([species, values]) => {
            acc[species] = { ...(acc[species] || {}), ...values };
          });
          return acc;
        }, {})
      );

    const filtered = {
      ...originalMovement,
      inputs: {
        ...originalMovement.inputs,
        statistics: filterStatsFromYear(originalMovement.inputs?.statistics),
      },
      outputs: {
        ...originalMovement.outputs,
        statistics: filterStatsFromYear(originalMovement.outputs?.statistics),
      },
      summary: {
        inputs: sumAllYears(
          filterStatsFromYear(originalMovement.inputs?.statistics)
        ),
        outputs: sumAllYears(
          filterStatsFromYear(originalMovement.outputs?.statistics)
        ),
      },
    };

    setMovement(filtered);
  }, [yearStart, originalMovement]);

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
  const FlyToFarmPolygons = ({ polygons }) => {
    const map = useMap();

    useEffect(() => {
      if (!polygons || polygons.length === 0) return;

      const allCoords = [];

      polygons.forEach((geojson) => {
        geojson.features.forEach((feature) => {
          if (feature.geometry?.type === "Polygon") {
            feature.geometry.coordinates[0].forEach(([lon, lat]) => {
              allCoords.push([lat, lon]); // Leaflet espera [lat, lon]
            });
          }

          if (feature.geometry?.type === "MultiPolygon") {
            feature.geometry.coordinates.forEach((polygon) => {
              polygon[0].forEach(([lon, lat]) => {
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
  console.log(movement, "Movement data in Map.jsx");

  const MarkersAndPolygons = ({ movementData }) => {
    if (!movementData) return null;

    const allInputs = [];
    const allOutputs = [];

    Object.values(movementData).forEach((record) => {
      if (record.inputs) {
        allInputs.push(...(record.inputs.enterprises || []));
        allInputs.push(...(record.inputs.farms || []));
      }
      if (record.outputs) {
        allOutputs.push(...(record.outputs.enterprises || []));
        allOutputs.push(...(record.outputs.farms || []));
      }
    });

    const renderMarkers = (entries, color) => {
      const filtered = entries.filter(
        (e) => e.destination?.latitude && e.destination?.longitud
      );

      console.log(`🧾 ${color.toUpperCase()} enterprises:`, filtered);

      return filtered.map((entry, idx) => (
        <Marker
          key={`marker-${color}-${idx}`}
          position={[entry.destination.latitude, entry.destination.longitud]}
          icon={L.divIcon({
            className: "",
            html: `<div style="background-color:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;"></div>`,
          })}
        >
          <Popup>
            <div className="text-sm text-gray-800">
              {(() => {
                return (
                  entry.destination?.name ||
                  entry.label ||
                  entry.enterprise?.name ||
                  entry.name ||
                  "Centrode de la finca"
                );
              })()}
            </div>
          </Popup>
        </Marker>
      ));
    };

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
              />
            );
          } catch (err) {
            console.warn(
              "❌ Error parsing geojson:",
              entry.destination.geojson
            );
            return null;
          }
        });

    return (
      <>
        {renderMarkers(allInputs, "#8B4513")}
        {renderGeoJsons(allInputs, "#8B4513")}

        {renderMarkers(allOutputs, "purple")}
        {renderGeoJsons(allOutputs, "purple")}
      </>
    );
  };

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

          {farmPolygons.map((geo, idx) => (
            <GeoJSON key={idx} data={geo} />
          ))}
          <FlyToFarmPolygons polygons={farmPolygons} />
          <MarkersAndPolygons movementData={movement} />
          
        </MapContainer>
      </div>

      {movement?.searched_farms?.length > 0 && yearStart && (
        <MovementCharts
          yearStart={yearStart}
          summary={movement}
          foundFarms={movement.searched_farms}
        />
      )}
    </>
  );
}
