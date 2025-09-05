"use client";

import { Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";

const TYPE_BASE = {
  SLAUGHTERHOUSE: "planta",
  COLLECTION_CENTER: "acopio",
  CATTLE_FAIR: "feria",
  ENTERPRISE: "empresa",
  FARM: "finca",
};

function getEnterpriseBase(type) {
  if (!type) return "empresa";
  return TYPE_BASE[type] || "empresa";
}

function getEnterpriseIcon(type, flow, isMixed) {
  const base = getEnterpriseBase(type);
  const variant = isMixed ? "mixta" : flow;
  return L.icon({
    iconUrl: `/${base}_${variant}.png`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -24],
    className: "enterprise-marker",
  });
}

function getFarmIcon(flow, isMixed) {
  const variant = isMixed ? "mixta" : flow;
  return L.icon({
    iconUrl: `/finca_${variant}.png`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -26],
    className: "farm-marker",
  });
}

function getGeojsonName(geojson) {
  try {
    const data = typeof geojson === "string" ? JSON.parse(geojson) : geojson;
    if (!data) return null;
    if (data.name) return String(data.name);
    if (data.properties?.name) return String(data.properties.name);
    if (Array.isArray(data.features) && data.features[0]?.properties?.name)
      return String(data.features[0].properties.name);
    return null;
  } catch (e) {
    console.warn("Error al parsear geojson para name:", e);
    return null;
  }
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

  const renderEnterpriseMarkers = (movements, flow, lineColor, farm_main) => {
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
        const id = String(dest._id ?? "");
        const type = dest.type_enterprise;

        const originFarmId = String(m.__farmId ?? m.source?.farm_id ?? "");
        const yearKey = String(yearStart);
        const enterprisesMixed =
          (movement?.[originFarmId]?.mixed?.[yearKey]?.enterprises || []).map(String);
        const isMixed = !!originFarmId && !!id && enterprisesMixed.includes(id);

        const icon = getEnterpriseIcon(type, flow, isMixed);
        const finalLineColor = isMixed ? "#e91e63" : lineColor;
        const farm_tmp = farm_main && farm_main.length > 0 ? farm_main[0] : null;

        const sitFromGeojson = getGeojsonName(dest.geojson);

        return (
          <>
            <Marker
              key={`ent-${idx}-${id || "noid"}`}
              position={[lat, lon]}
              icon={icon}
            >
              <Popup>
                <div className="p-3 bg-white text-sm space-y-2">
                  <div><span className="font-semibold">Tipo:</span> {getTypeLabel(type)}</div>
                  {sitFromGeojson && (
                    <div><span className="font-semibold">Código SIT:</span> {sitFromGeojson}</div>
                  )}
                  {dest.name && (
                    <div><span className="font-semibold">Nombre:</span> {dest.name}</div>
                  )}
                </div>
              </Popup>
            </Marker>

            {farm_tmp && (
              <Polyline
                key={`ent-line-${idx}-${id || "noid"}`}
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

  const renderFarmMarkers = (movements, flow, lineColor, farm_main) => {
    return (movements || [])
      .filter(
        (m) =>
          m?.destination?.latitude &&
          m?.destination?.longitud &&
          m?.destination?.farm_id
      )
      .map((m, idx) => {
        const dest = m.destination;
        const lat = dest.latitude;
        const lon = dest.longitud;
        const targetFarmId = String(dest.farm_id ?? "");

        const originFarmId = String(m.__farmId ?? m.source?.farm_id ?? "");
        const yearKey = String(yearStart);
        const farmsMixed =
          (movement?.[originFarmId]?.mixed?.[yearKey]?.farms || []).map(String);
        const isMixed = !!originFarmId && !!targetFarmId && farmsMixed.includes(targetFarmId);

        const icon = getFarmIcon(flow, isMixed);
        const finalLineColor = isMixed ? "#e91e63" : lineColor;
        const farm_tmp = farm_main && farm_main.length > 0 ? farm_main[0] : null;

        // AQUÍ: tomar el "name" desde el geojson del destino
        const sitCode = getGeojsonName(dest.geojson);
        const displayName = dest.name || dest.code || "Finca";

        return (
          <>
            <Marker
              key={`farm-${idx}-${targetFarmId || "noid"}`}
              position={[lat, lon]}
              icon={icon}
            >
              <Popup>
                <div className="p-3 bg-white text-sm space-y-2">
                  <div><span className="font-semibold">Tipo:</span> Finca</div>
                  <div><span className="font-semibold">Código SIT:</span> {sitCode || "N/A"}</div>
                </div>
              </Popup>
            </Marker>

            {farm_tmp && (
              <Polyline
                key={`farm-line-${idx}-${targetFarmId || "noid"}`}
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
      {renderEnterpriseMarkers(allInputs, "entrada", "#8B4513", farmPolygons)}
      {renderFarmMarkers(allInputs, "entrada", "#8B4513", farmPolygons)}

      {/* SALIDAS */}
      {renderEnterpriseMarkers(allOutputs, "salida", "purple", farmPolygons)}
      {renderFarmMarkers(allOutputs, "salida", "purple", farmPolygons)}
    </>
  );
}
