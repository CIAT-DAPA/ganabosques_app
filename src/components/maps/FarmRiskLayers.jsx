"use client";

import { GeoJSON, Popup } from "react-leaflet";
import proj4 from "proj4";

// Definiciones de CRS
proj4.defs(
  "EPSG:3116",
  "+proj=tmerc +lat_0=4.59620041666667 +lon_0=-74.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
);
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs +type=crs");

const toWGS84 = (xy) => proj4("EPSG:3116", "EPSG:4326", xy);

const isLikelyWGS84 = (xy) => {
  const [x, y] = xy || [];
  return (
    Array.isArray(xy) &&
    typeof x === "number" &&
    typeof y === "number" &&
    Math.abs(x) <= 180 &&
    Math.abs(y) <= 90
  );
};

// Transforma arrays de coordenadas de cualquier profundidad
function transformCoords(coords, depth) {
  if (depth === 1) {
    const xy = coords;
    return isLikelyWGS84(xy) ? xy : toWGS84(xy);
  }
  return (coords || []).map((c) => transformCoords(c, depth - 1));
}

// Reproyección por tipo de geometría
function reprojectGeometry(geometry) {
  if (!geometry) return geometry;

  switch (geometry.type) {
    case "Point":
      return { ...geometry, coordinates: transformCoords(geometry.coordinates, 1) };
    case "MultiPoint":
      return { ...geometry, coordinates: transformCoords(geometry.coordinates, 2) };
    case "LineString":
      return { ...geometry, coordinates: transformCoords(geometry.coordinates, 2) };
    case "MultiLineString":
      return { ...geometry, coordinates: transformCoords(geometry.coordinates, 3) };
    case "Polygon":
      return { ...geometry, coordinates: transformCoords(geometry.coordinates, 3) };
    case "MultiPolygon":
      return { ...geometry, coordinates: transformCoords(geometry.coordinates, 4) };
    case "GeometryCollection":
      return {
        ...geometry,
        geometries: (geometry.geometries || []).map((g) => reprojectGeometry(g)),
      };
    default:
      return geometry;
  }
}

function reprojectFeature(feature) {
  if (!feature || feature.type !== "Feature") return feature;
  return { ...feature, geometry: reprojectGeometry(feature.geometry) };
}

function reprojectGeoJSON3116to4326(geojson) {
  if (!geojson) return geojson;

  if (geojson.type === "FeatureCollection") {
    return {
      ...geojson,
      features: (geojson.features || []).map((f) => reprojectFeature(f)),
    };
  }

  if (geojson.type === "Feature") {
    return reprojectFeature(geojson);
  }

  if (geojson.type && geojson.coordinates) {
    return reprojectGeometry(geojson);
  }

  return geojson;
}

export default function FarmRiskLayers({ farmPolygons, riskFarm, foundFarms }) {
  if (!riskFarm || !farmPolygons) return null;

  const renderFarmRiskPolygons = (polygons, farmRiskData, foundFarmsList = []) => {
    if (!farmRiskData) return null;

    return (polygons || []).map((farm) => {
      let geojson3116;
      try {
        geojson3116 =
          typeof farm.geojson === "string" ? JSON.parse(farm.geojson) : farm.geojson;
      } catch (err) {
        console.warn("Error parseando geojson de farm:", farm, err);
        return null;
      }

      // Reproyectar 3116 → 4326
      const geojson4326 = reprojectGeoJSON3116to4326(geojson3116);
      const farmId = farm.farm_id || farm.id;

      // Buscar riesgo
      const riskObject = Object.values(farmRiskData)
        .flat()
        .find((r) => r.farm_id === farmId);

      const isAlert = Boolean(
        riskObject?.risk_direct || riskObject?.risk_input || riskObject?.risk_output
      );
      const color = isAlert ? "#D50000" : "#00C853";

      // SIT (opcional)
      const matchedFarm = (foundFarmsList || []).find((f) => f.id === farmId);
      const sitCode = matchedFarm?.code || "Sin código";

      return (
        <GeoJSON
          key={`farmrisk-${farmId}`}
          data={geojson4326}
          style={{ color, weight: 2, fillColor: color, fillOpacity: 0.3 }}
        >
          <Popup>
            <div className="p-3 bg-white text-sm space-y-1">
              <div className="font-semibold text-green-700">Finca</div>
              <div>
                <span className="font-medium">Código SIT:</span> {sitCode || "N/A"}
              </div>
              <div>
                <span className="font-medium">Alerta Directa:</span>{" "}
                {isAlert ? "Con alerta" : "Sin alerta"}
              </div>
            </div>
          </Popup>
        </GeoJSON>
      );
    });
  };

  return <>{renderFarmRiskPolygons(farmPolygons, riskFarm, foundFarms)}</>;
}
