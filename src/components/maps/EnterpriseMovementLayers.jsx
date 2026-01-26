"use client";

import { Marker, Popup, Polyline } from "react-leaflet";
import { useMap } from "react-leaflet";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import L from "leaflet";

// ------------------------------
// Config flechas
// ------------------------------
const ARROW_CONFIG = {
  ROTATION_ADJUSTMENT: 180,
  ANIMATION_DURATION: "1.5s",
  ICON_SIZES: { HIGH_ZOOM: 24, MEDIUM_ZOOM: 20, LOW_ZOOM: 16 },
  ZOOM_THRESHOLDS: { HIGH: 14, MEDIUM: 12, LOW: 10 },
  SPACING: { HIGH_ZOOM: 1500, MEDIUM_ZOOM: 3000, LOW_ZOOM: 6000, VERY_LOW_ZOOM: 12000 },
  MIXED_SIZE_RATIO: 0.8,
  MIXED_OPACITY: 0.7,
  NORMAL_OPACITY: 0.8,
};

// Etiquetas para popups
const TYPE_LABELS = {
  SLAUGHTERHOUSE: "Planta de beneficio",
  COLLECTION_CENTER: "Centro de acopio",
  CATTLE_FAIR: "Feria de ganado",
  ENTERPRISE: "Empresa",
  FARM: "Finca",
};

// ------------------------------
// Íconos neutros (mapeo robusto)
// ------------------------------
const ENTERPRISE_BASES = {
  SLAUGHTERHOUSE: "planta",
  COLLECTION_CENTER: "acopio",
  CATTLE_FAIR: "feria",
  ENTERPRISE: "empresa",
  FARM: "finca",
};

const TYPE_ALIASES = {
  "COLLECTIONCENTER": "COLLECTION_CENTER",
  "CENTRO_ACOPIO": "COLLECTION_CENTER",
  "CENTRO DE ACOPIO": "COLLECTION_CENTER",
  "ACOPIO": "COLLECTION_CENTER",
  "PLANTA": "SLAUGHTERHOUSE",
  "FERIA": "CATTLE_FAIR",
  "EMPRESA": "ENTERPRISE",
  "FINCA": "FARM",
};

const normalizeType = (type) => {
  if (!type) return "ENTERPRISE";
  const t = String(type).trim().toUpperCase().replace(/\s+/g, " ");
  const t2 = t.replace(/-/g, "_");
  return TYPE_ALIASES[t2] || t2;
};

const getEnterpriseBase = (type) => {
  const canon = normalizeType(type);
  const base = ENTERPRISE_BASES[canon];
  return base || "empresa";
};

const createIcon = (iconUrl, className) =>
  L.icon({
    iconUrl,
    iconSize: [42, 57],
    iconAnchor: [21, 57],
    popupAnchor: [0, -36],
    className,
  });

const getEnterpriseIcon = (type) => {
  const base = getEnterpriseBase(type);
  return createIcon(`/${base}.png`, "enterprise-marker");
};

const getFarmIcon = () => createIcon(`/finca.png`, "farm-marker");

const getTypeLabel = (type) => TYPE_LABELS[normalizeType(type)] || type;

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateAngle = (lat1, lon1, lat2, lon2) => {
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const dLonRad = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLonRad) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLonRad);
  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
};

const interpolatePoints = (lat1, lon1, lat2, lon2, numPoints) => {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const r = i / numPoints;
    points.push([lat1 + (lat2 - lat1) * r, lon1 + (lon2 - lon1) * r]);
  }
  return points;
};

const getArrowSpacing = (zoom) => {
  if (zoom >= ARROW_CONFIG.ZOOM_THRESHOLDS.HIGH) return ARROW_CONFIG.SPACING.HIGH_ZOOM;
  if (zoom >= ARROW_CONFIG.ZOOM_THRESHOLDS.MEDIUM) return ARROW_CONFIG.SPACING.MEDIUM_ZOOM;
  if (zoom >= ARROW_CONFIG.ZOOM_THRESHOLDS.LOW) return ARROW_CONFIG.SPACING.LOW_ZOOM;
  return ARROW_CONFIG.SPACING.VERY_LOW_ZOOM;
};

const getIconSize = (zoom) => {
  if (zoom >= ARROW_CONFIG.ZOOM_THRESHOLDS.MEDIUM) return ARROW_CONFIG.ICON_SIZES.HIGH_ZOOM;
  if (zoom >= ARROW_CONFIG.ZOOM_THRESHOLDS.LOW) return ARROW_CONFIG.ICON_SIZES.MEDIUM_ZOOM;
  return ARROW_CONFIG.ICON_SIZES.LOW_ZOOM;
};

// ------------------------------
// Capa de flechas
// ------------------------------
const ArrowLayer = ({
  fromLat,
  fromLon,
  toLat,
  toLon,
  color = "#8B4513",
  flow = "salida",
  isMixed = false,
}) => {
  const map = useMap();
  const arrowsRef = useRef([]);
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());

  const directions = useMemo(() => {
    if (isMixed) {
      return [
        { from: [fromLat, fromLon], to: [toLat, toLon], name: "salida" },
        { from: [toLat, toLon], to: [fromLat, fromLon], name: "entrada" },
      ];
    }
    const isEntrada = flow === "entrada";
    return [
      {
        from: isEntrada ? [toLat, toLon] : [fromLat, fromLon],
        to: isEntrada ? [fromLat, fromLon] : [toLat, toLon],
        name: flow,
      },
    ];
  }, [fromLat, fromLon, toLat, toLon, flow, isMixed]);

  const cleanupArrows = useCallback(() => {
    arrowsRef.current.forEach((a) => a && map.hasLayer(a) && map.removeLayer(a));
    arrowsRef.current = [];
  }, [map]);

  const createArrowHTML = useCallback(
    (rotationAngle, adjustedSize, baseOpacity) => {
      const colorFilter = color === "purple" ? "hue-rotate(280deg)" : "hue-rotate(0deg)";
      return `
        <div class="arrow-container" style="
          width:${adjustedSize}px;height:${adjustedSize}px;
          background-image:url('/arrow.gif');background-size:contain;background-repeat:no-repeat;background-position:center;
          transform:rotate(${rotationAngle}deg);transform-origin:center;
          filter:${colorFilter};opacity:${baseOpacity};
        "></div>
      `;
    },
    [color]
  );

  useEffect(() => {
    const onZoom = () => setCurrentZoom(map.getZoom());
    map.on("zoomend", onZoom);
    return () => map.off("zoomend", onZoom);
  }, [map]);

  useEffect(() => {
    if (!fromLat || !fromLon || !toLat || !toLon) {
      return;
    }

    cleanupArrows();

    const distance = calculateDistance(fromLat, fromLon, toLat, toLon);
    const spacing = getArrowSpacing(currentZoom);
    const numArrows = Math.max(1, Math.floor(distance / spacing));
    const iconSize = getIconSize(currentZoom);
    const adjustedSize = isMixed ? iconSize * ARROW_CONFIG.MIXED_SIZE_RATIO : iconSize;
    const baseOpacity = isMixed ? ARROW_CONFIG.MIXED_OPACITY : ARROW_CONFIG.NORMAL_OPACITY;

    directions.forEach((dir) => {
      const angle = calculateAngle(dir.from[0], dir.from[1], dir.to[0], dir.to[1]);
      const rotationAngle = angle + ARROW_CONFIG.ROTATION_ADJUSTMENT;
      const points = interpolatePoints(dir.from[0], dir.from[1], dir.to[0], dir.to[1], numArrows);

      points.slice(1).forEach((pt) => {
        const arrowIcon = L.divIcon({
          html: createArrowHTML(rotationAngle, adjustedSize, baseOpacity),
          className: "arrow-marker",
          iconSize: [adjustedSize, adjustedSize],
          iconAnchor: [adjustedSize / 2, adjustedSize / 2],
        });
        const arrowMarker = L.marker(pt, { icon: arrowIcon, zIndexOffset: -1000 });
        arrowMarker.addTo(map);
        arrowsRef.current.push(arrowMarker);
      });
    });

    return cleanupArrows;
  }, [map, fromLat, fromLon, toLat, toLon, color, currentZoom, flow, isMixed, directions, cleanupArrows, createArrowHTML]);

  return null;
};

// ------------------------------
// Componente principal
// ------------------------------
const EnterpriseMovementLayers = ({ movementStats, enterpriseDetails, useArrows = true }) => {
  // Obtener la posición de la empresa principal
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

  // Extraer todos los inputs y outputs de las estadísticas de movimiento
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
      const mixedItems =
        kind === "enterprise"
          ? mixedData.enterprises || []
          : mixedData.farms || [];
      return mixedItems.map(String).includes(String(targetId));
    },
    [movementStats, mainEnterprise]
  );

  const renderEnterpriseMarkers = useCallback(
    (movements, flow, lineColor) =>
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
                (useArrows ? (
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
                  <Polyline
                    positions={[
                      [mainEnterprise.latitude, mainEnterprise.longitud],
                      [lat, lon],
                    ]}
                    pathOptions={{ color: finalLineColor }}
                  />
                ))}
            </div>
          );
        }),
    [useArrows, createPopupContent, isMixedMovement, mainEnterprise]
  );

  const renderFarmMarkers = useCallback(
    (movements, flow, lineColor) =>
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
                (useArrows ? (
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
                  <Polyline
                    positions={[
                      [mainEnterprise.latitude, mainEnterprise.longitud],
                      [lat, lon],
                    ]}
                    pathOptions={{ color: finalLineColor }}
                  />
                ))}
            </div>
          );
        }),
    [useArrows, createPopupContent, isMixedMovement, mainEnterprise]
  );

  if (!movementStats || !mainEnterprise) return null;

  return (
    <>
      {/* ENTRADAS */}
      {renderEnterpriseMarkers(allInputs, "entrada", "#8B4513")}
      {renderFarmMarkers(allInputs, "entrada", "#8B4513")}

      {/* SALIDAS */}
      {renderEnterpriseMarkers(allOutputs, "salida", "purple")}
      {renderFarmMarkers(allOutputs, "salida", "purple")}
    </>
  );
};

export default EnterpriseMovementLayers;
