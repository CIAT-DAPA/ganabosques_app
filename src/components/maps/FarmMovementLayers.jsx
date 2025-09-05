"use client";

import { Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";

// === Mapeo de íconos para empresas (se mantiene igual) ===
const TYPE_BASE = {
  SLAUGHTERHOUSE: "planta",
  COLLECTION_CENTER: "acopio",
  CATTLE_FAIR: "feria",
  ENTERPRISE: "empresa",
  FARM: "finca", // por si viene el type
};

function getEnterpriseBase(type) {
  if (!type) return "empresa";
  return TYPE_BASE[type] || "empresa";
}

function getEnterpriseIcon(type, flow, isMixed) {
  const base = getEnterpriseBase(type);
  const variant = isMixed ? "mixta" : flow; // prioridad a mixta
  return L.icon({
    iconUrl: `/${base}_${variant}.png`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -24],
    className: "enterprise-marker",
  });
}

// === Ícono para fincas (nuevo) ===
function getFarmIcon(flow, isMixed) {
  const variant = isMixed ? "mixta" : flow; // 'entrada' | 'salida' | 'mixta'
  return L.icon({
    iconUrl: `/finca_${variant}.png`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -26],
    className: "farm-marker",
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

  const renderEnterpriseMarkers = (movements, flow, lineColor, farm_main) => {
    return (movements || [])
      .filter(
        (m) =>
          m?.destination?.latitude &&
          m?.destination?.longitud &&
          !m?.destination?.farm_id // ← empresas
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

        const icon = getEnterpriseIcon(type, flow, isMixed);
        const finalLineColor = isMixed ? "#e91e63" : lineColor;
        const farm_tmp = farm_main && farm_main.length > 0 ? farm_main[0] : null;

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
                  <div><span className="font-semibold">Nombre:</span> {name}</div>
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
    console.log('Rendering farm markers for', movements);
    return (movements || [])
      .filter(
        (m) =>
          m?.destination?.latitude &&
          m?.destination?.longitud &&
          m?.destination?.farm_id // ← fincas
      )
      .map((m, idx) => {
        const dest = m.destination;
        const lat = dest.latitude;
        const lon = dest.longitud;
        const name = dest.name || dest.code || "Finca";
        const targetFarmId = String(dest.farm_id ?? "");

        const originFarmId = String(m.__farmId ?? m.source?.farm_id ?? "");
        const yearKey = String(yearStart);
        const farmsMixed = (movement?.[originFarmId]?.mixed?.[yearKey]?.farms || []).map(String);
        const isMixed = !!originFarmId && !!targetFarmId && farmsMixed.includes(targetFarmId);

        const icon = getFarmIcon(flow, isMixed);
        const finalLineColor = isMixed ? "#e91e63" : lineColor;
        const farm_tmp = farm_main && farm_main.length > 0 ? farm_main[0] : null;

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
                  <div><span className="font-semibold">Nombre:</span> {name}</div>
                  <div><span className="font-semibold">ID:</span> {targetFarmId || "N/A"}</div>
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
