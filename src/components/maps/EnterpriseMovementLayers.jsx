"use client";

import { Marker, Popup, Polyline } from "react-leaflet";
import { useMemo, useCallback } from "react";
import ArrowLayer from "./ArrowLayer";
import { ARROW_CONFIG, calculateDistance, calculateAngle, interpolatePoints, getEnterpriseIcon, getFarmIcon, getTypeLabel } from "@/utils";

// Movement markers and arrows for enterprise risk view
export default function EnterpriseMovementLayers({ movementStats, enterpriseDetails, useArrows = true }) {
  const mainEnterprise = useMemo(() => {
    if (!enterpriseDetails || enterpriseDetails.length === 0) return null;
    const ent = enterpriseDetails[0];
    return {
      id: ent?._id || ent?.id,
      latitude: ent?.latitude ?? ent?.lat,
      longitud: ent?.longitud ?? ent?.lng ?? ent?.lon,
      name: ent?.name,
      type: ent?.type_enterprise || ent?.type,
    };
  }, [enterpriseDetails]);

  const { allInputs, allOutputs } = useMemo(() => {
    if (!movementStats || !mainEnterprise?.id) return { allInputs: [], allOutputs: [] };

    const data = movementStats[mainEnterprise.id];
    if (!data) return { allInputs: [], allOutputs: [] };

    const inputs = [
      ...(data.inputs?.farms || []).map((e) => ({ ...e, __enterpriseId: mainEnterprise.id })),
      ...(data.inputs?.enterprises || []).map((e) => ({ ...e, __enterpriseId: mainEnterprise.id })),
    ];

    const outputs = [
      ...(data.outputs?.farms || []).map((e) => ({ ...e, __enterpriseId: mainEnterprise.id })),
      ...(data.outputs?.enterprises || []).map((e) => ({ ...e, __enterpriseId: mainEnterprise.id })),
    ];

    return { allInputs: inputs, allOutputs: outputs };
  }, [movementStats, mainEnterprise]);

  const createPopupContent = useCallback(
    (type, extIds, name) => (
      <div className="p-3 bg-white text-sm space-y-2">
        <div><span className="font-semibold">Tipo:</span> {getTypeLabel(type)}</div>
        {extIds && Array.isArray(extIds) && extIds.length > 0 && (
          <div className="space-y-1">
            {extIds.map((ext, idx) => (
              <div key={idx}>
                <span className="font-semibold">{ext.source || ext.label}:</span> {ext.ext_code}
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
    (targetId, kind) => {
      if (!mainEnterprise?.id || !targetId || !movementStats?.[mainEnterprise.id]?.mixed) return false;
      const mixedData = movementStats[mainEnterprise.id].mixed;
      const mixedItems = kind === "enterprise" ? mixedData.enterprises || [] : mixedData.farms || [];
      return mixedItems.map(String).includes(String(targetId));
    },
    [movementStats, mainEnterprise]
  );

  const renderEnterpriseMarkers = useCallback(
    (movements, flow, lineColor, showArrows) =>
      movements
        .filter((m) => m?.destination?.latitude && m?.destination?.longitud && !m?.destination?.farm_id)
        .map((m, idx) => {
          const { destination: dest } = m;
          const { latitude: lat, longitud: lon, _id: id, type_enterprise: type, name } = dest;

          const mixed = isMixedMovement(id, "enterprise");
          const icon = getEnterpriseIcon(type);
          const finalLineColor = mixed ? "purple" : lineColor;

          return (
            <div key={`ent-${idx}-${id || "noid"}`}>
              <Marker position={[lat, lon]} icon={icon}>
                <Popup>{createPopupContent(type, dest.ext_id, name)}</Popup>
              </Marker>

              {mainEnterprise?.latitude && mainEnterprise?.longitud &&
                (showArrows ? (
                  <ArrowLayer
                    fromLat={mainEnterprise.latitude}
                    fromLon={mainEnterprise.longitud}
                    toLat={lat}
                    toLon={lon}
                    color={finalLineColor}
                    flow={flow}
                    isMixed={mixed}
                  />
                ) : (
                  // If not showing arrows (optimization or disabled), do not render Polyline either
                  null
                ))}
            </div>
          );
        }),
    [createPopupContent, isMixedMovement, mainEnterprise]
  );

  const renderFarmMarkers = useCallback(
    (movements, flow, lineColor, showArrows) =>
      movements
        .filter((m) => m?.destination?.latitude && m?.destination?.longitud && m?.destination?.farm_id)
        .map((m, idx) => {
          const { destination: dest } = m;
          const { latitude: lat, longitud: lon, farm_id: targetFarmId, ext_id } = dest;

          const mixed = isMixedMovement(targetFarmId, "farm");
          const icon = getFarmIcon();
          const finalLineColor = mixed ? "purple" : lineColor;

          return (
            <div key={`farm-${idx}-${targetFarmId || "noid"}`}>
              <Marker position={[lat, lon]} icon={icon}>
                <Popup>{createPopupContent("FARM", ext_id)}</Popup>
              </Marker>

              {mainEnterprise?.latitude && mainEnterprise?.longitud &&
                (showArrows ? (
                  <ArrowLayer
                    fromLat={mainEnterprise.latitude}
                    fromLon={mainEnterprise.longitud}
                    toLat={lat}
                    toLon={lon}
                    color={finalLineColor}
                    flow={flow}
                    isMixed={mixed}
                  />
                ) : (
                  null
                ))}
            </div>
          );
        }),
    [createPopupContent, isMixedMovement, mainEnterprise]
  );

  // Calculate total movements
  const totalMovements = (allInputs?.length || 0) + (allOutputs?.length || 0);
  
  // Optimization: If too many movements, hide everything (arrows AND markers)
  // to prevent map saturation. Only the main enterprise marker (handled in parent) remains.
  if (totalMovements > 100) return null;

  const shouldRenderArrows = useArrows;

  if (!movementStats || !mainEnterprise) return null;

  return (
    <>
      {renderEnterpriseMarkers(allInputs, "entrada", "#8B4513", shouldRenderArrows)}
      {renderFarmMarkers(allInputs, "entrada", "#8B4513", shouldRenderArrows)}
      {renderEnterpriseMarkers(allOutputs, "salida", "purple", shouldRenderArrows)}
      {renderFarmMarkers(allOutputs, "salida", "purple", shouldRenderArrows)}
    </>
  );
}
