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

    return polygons.map((farm) => {
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

      // Buscar el objeto de riesgo de esta finca
      const riskObject = Object.values(farmRiskData)
        .flat()
        .find((r) => r.farm_id === farmId);

      const isAlert = Boolean(riskObject?.risk_direct);
      console.log(riskObject)
      const color = isAlert ? "#D50000" : "#00C853";

      // SIT code opcional
      const matchedFarm = foundFarmsList.find((f) => f.id === farmId);
      const sitCode = matchedFarm?.code || "Sin código";
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