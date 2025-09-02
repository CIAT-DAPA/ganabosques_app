"use client";

import { GeoJSON, Popup } from "react-leaflet";

export default function FarmRiskLayers({ farmPolygons, riskFarm, foundFarms }) {
  if (!riskFarm || !farmPolygons) return null;

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
            <div className="p-3 bg-white text-sm space-y-1">
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

  return <>{renderFarmRiskPolygons(farmPolygons, riskFarm, foundFarms)}</>;
}
