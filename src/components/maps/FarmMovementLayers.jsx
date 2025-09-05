"use client";

import { Marker, GeoJSON, Popup, Polyline } from "react-leaflet";
import L from "leaflet";

const TYPE_BASE = {
  SLAUGHTERHOUSE: "planta",
  COLLECTION_CENTER: "acopio",
  CATTLE_FAIR: "feria",
  ENTERPRISE: "empresa",
  FARM: "empresa",
};

function getEnterpriseBase(type) {
  if (!type) return "empresa";
  return TYPE_BASE[type] || "empresa";
}

function getIconUrl(type, flow, isMixed) {
  const base = getEnterpriseBase(type);
  const variant = isMixed ? "mixta" : flow; // prioridad a mixta
  return `/${base}_${variant}.png`;
}

function getLeafletIcon(type, flow, isMixed) {
  const url = getIconUrl(type, flow, isMixed);
  return L.icon({
    iconUrl: url,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -24],
    className: "enterprise-marker",
  });
}

function getTypeLabel(type) {
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
}

export default function FarmMovementLayers({ movement, farmPolygons, yearStart }) {
  if (!movement) return null;

  const allInputs = Object.entries(movement || {}).flatMap(([farmId, m]) => [
    ...(m.inputs?.farms || []).map((entry) => ({ ...entry, __farmId: farmId })),
    ...(m.inputs?.enterprises || []).map((entry) => ({ ...entry, __farmId: farmId })),
  ]);

  const allOutputs = Object.entries(movement || {}).flatMap(([farmId, m]) => [
    ...(m.outputs?.farms || []).map((entry) => ({ ...entry, __farmId: farmId })),
    ...(m.outputs?.enterprises || []).map((entry) => ({ ...entry, __farmId: farmId })),
  ]);

  const renderGeoJsons = (entries, color) => {
    return (entries || [])
      .filter((e) => e?.destination?.geojson)
      .map((entry, idx) => {
        try {
          const originFarmId = String(entry.__farmId ?? "");
          const targetFarmId = String(entry.destination?.farm_id ?? "");
          if (!originFarmId || !targetFarmId || originFarmId === targetFarmId) return null;

          const data =
            typeof entry.destination.geojson === "string"
              ? JSON.parse(entry.destination.geojson)
              : entry.destination.geojson;

          const yearKey = String(yearStart);
          const farmsMixed = (movement?.[originFarmId]?.mixed?.[yearKey]?.farms || []).map(String);
          const isMixed = farmsMixed.includes(targetFarmId);
          const finalColor = isMixed ? "#e91e63" : color;

          return (
            <GeoJSON
              key={`geojson-${targetFarmId || idx}`}
              data={data}
              style={{ color: finalColor, weight: 2, fillOpacity: 0.3 }}
            >
              <Popup>
                <div className="p-3 bg-white text-sm space-y-1">
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

  const renderMarkers = (movements, flow, lineColor, farm_main) => {
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
        const enterprisesMixed = (movement?.[originFarmId]?.mixed?.[yearKey]?.enterprises || []).map(String);
        const isMixed = !!originFarmId && !!id && enterprisesMixed.includes(id);

        const icon = getLeafletIcon(type, flow, isMixed);
        const finalLineColor = isMixed ? "#e91e63" : lineColor;
        const farm_tmp = farm_main && farm_main.length > 0 ? farm_main[0] : null;

        return (
          <>
            <Marker
              key={`marker-${idx}-${id || "noid"}`}
              position={[lat, lon]}
              icon={icon}
            >
              <Popup>
                <div className="p-3 bg-white text-sm space-y-2">
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
                pathOptions={{ color: finalLineColor }}
              />
            )}
          </>
        );
      });
  };

  return (
    <>
      {/* ENTRADAS */}
      {renderMarkers(allInputs, "entrada", "#8B4513", farmPolygons)}
      {renderGeoJsons(allInputs, "#8B4513")}

      {/* SALIDAS */}
      {renderMarkers(allOutputs, "salida", "purple", farmPolygons)}
      {renderGeoJsons(allOutputs, "purple")}
    </>
  );
}
