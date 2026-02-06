"use client";

import { Marker, Popup, Polyline } from "react-leaflet";
import { useMemo, useCallback } from "react";
import ArrowLayer from "./ArrowLayer";
import { ARROW_CONFIG, calculateDistance, calculateAngle, interpolatePoints, getFarmIcon, getEnterpriseIcon, getTypeLabel, getGeojsonName } from "@/utils";

// Movement markers and arrows for farm risk view
export default function FarmMovementLayers({ movement, farmPolygons, yearStart, useArrows = true }) {
  const { allInputs, allOutputs } = useMemo(() => {
    if (!movement) return { allInputs: [], allOutputs: [] };

    const inputs = Object.entries(movement).flatMap(([farmId, m]) => [
      ...(m.inputs?.farms || []).map((e) => ({ ...e, __farmId: farmId })),
      ...(m.inputs?.enterprises || []).map((e) => ({ ...e, __farmId: farmId })),
    ]);

    const outputs = Object.entries(movement).flatMap(([farmId, m]) => [
      ...(m.outputs?.farms || []).map((e) => ({ ...e, __farmId: farmId })),
      ...(m.outputs?.enterprises || []).map((e) => ({ ...e, __farmId: farmId })),
    ]);

    return { allInputs: inputs, allOutputs: outputs };
  }, [movement]);

  const createPopupContent = useCallback(
    (type, extIds, name) => (
      <div className="p-3 bg-white text-sm space-y-2">
        <div><span className="font-semibold">Tipo:</span> {getTypeLabel(type)}</div>
        {extIds && Array.isArray(extIds) && extIds.length > 0 && (
          <div className="space-y-1">
            {extIds.map((ext, idx) => (
              <div key={idx}>
                <span className="font-semibold">{ext.source}:</span> {ext.ext_code}
              </div>
            ))}
          </div>
        )}
        {name && <div><span className="font-semibold">Nombre:</span> {name}</div>}
      </div>
    ),
    []
  );

  const isMixedMovement = useCallback(
    (originFarmId, targetId, kind) => {
      if (!originFarmId || !targetId || !movement?.[originFarmId]?.mixed) return false;
      const mixedData = movement[originFarmId].mixed;
      const mixedItems = kind === "enterprise" ? mixedData.enterprises || [] : mixedData.farms || [];
      return mixedItems.map(String).includes(String(targetId));
    },
    [movement]
  );

  const renderEnterpriseMarkers = useCallback(
    (movements, flow, lineColor, farm_main) =>
      movements
        .filter((m) => m?.destination?.latitude && m?.destination?.longitud && !m?.destination?.farm_id)
        .map((m, idx) => {
          const { destination: dest } = m;
          const { latitude: lat, longitud: lon, _id: id, type_enterprise: type, name } = dest;

          const originFarmId = String(m.__farmId ?? m.source?.farm_id ?? "");
          const mixed = isMixedMovement(originFarmId, id, "enterprise");

          const icon = getEnterpriseIcon(type);
          const finalLineColor = mixed ? "purple" : lineColor;
          const farm_tmp = farm_main?.[0];
          const sitFromGeojson = getGeojsonName(dest.geojson);

          return (
            <div key={`ent-${idx}-${id || "noid"}`}>
              <Marker position={[lat, lon]} icon={icon}>
                <Popup>{createPopupContent(type, sitFromGeojson, name)}</Popup>
              </Marker>

              {farm_tmp &&
                (useArrows ? (
                  <ArrowLayer
                    fromLat={farm_tmp.latitude}
                    fromLon={farm_tmp.longitud}
                    toLat={lat}
                    toLon={lon}
                    color={finalLineColor}
                    flow={flow}
                    isMixed={mixed}
                  />
                ) : (
                  <Polyline
                    positions={[[farm_tmp.latitude, farm_tmp.longitud], [lat, lon]]}
                    pathOptions={{ color: finalLineColor }}
                  />
                ))}
            </div>
          );
        }),
    [useArrows, createPopupContent, isMixedMovement]
  );

  const renderFarmMarkers = useCallback(
    (movements, flow, lineColor, farm_main) =>
      movements
        .filter((m) => m?.destination?.latitude && m?.destination?.longitud && m?.destination?.farm_id)
        .map((m, idx) => {
          const { destination: dest } = m;
          const { latitude: lat, longitud: lon, farm_id: targetFarmId, ext_id } = dest;

          const originFarmId = String(m.__farmId ?? m.source?.farm_id ?? "");
          const mixed = isMixedMovement(originFarmId, targetFarmId, "farm");

          const icon = getFarmIcon();
          const finalLineColor = mixed ? "purple" : lineColor;
          const farm_tmp = farm_main?.[0];

          return (
            <div key={`farm-${idx}-${targetFarmId || "noid"}`}>
              <Marker position={[lat, lon]} icon={icon}>
                <Popup>{createPopupContent("FARM", ext_id)}</Popup>
              </Marker>

              {farm_tmp &&
                (useArrows ? (
                  <ArrowLayer
                    fromLat={farm_tmp.latitude}
                    fromLon={farm_tmp.longitud}
                    toLat={lat}
                    toLon={lon}
                    color={finalLineColor}
                    flow={flow}
                    isMixed={mixed}
                  />
                ) : (
                  <Polyline
                    positions={[[farm_tmp.latitude, farm_tmp.longitud], [lat, lon]]}
                    pathOptions={{ color: finalLineColor }}
                  />
                ))}
            </div>
          );
        }),
    [useArrows, createPopupContent, isMixedMovement]
  );

  if (!movement) return null;

  return (
    <>
      {renderEnterpriseMarkers(allInputs, "entrada", "#8B4513", farmPolygons)}
      {renderFarmMarkers(allInputs, "entrada", "#8B4513", farmPolygons)}
      {renderEnterpriseMarkers(allOutputs, "salida", "purple", farmPolygons)}
      {renderFarmMarkers(allOutputs, "salida", "purple", farmPolygons)}
    </>
  );
}