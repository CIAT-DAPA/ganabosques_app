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

// Aliases -> tipo canónico
const TYPE_ALIASES = {
  // Centro de acopio
  "COLLECTIONCENTER": "COLLECTION_CENTER",
  "CENTRO_ACOPIO": "COLLECTION_CENTER",
  "CENTRO DE ACOPIO": "COLLECTION_CENTER",
  "ACOPIO": "COLLECTION_CENTER",
  // Otras variantes comunes
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
  if (!base) console.warn("[Enterprise Icon] Tipo desconocido:", type, "→ canon:", canon);
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
  const base = getEnterpriseBase(type); // planta | acopio | feria | empresa | finca
  return createIcon(`/${base}.png`, "enterprise-marker");
};

const getFarmIcon = () => createIcon(`/finca.png`, "farm-marker");

// ------------------------------
// Utilidades varias
// ------------------------------
const getGeojsonName = (geojson) => {
  try {
    const data = typeof geojson === "string" ? JSON.parse(geojson) : geojson;
    if (!data) return null;
    return (
      data.name ||
      data.properties?.name ||
      (Array.isArray(data.features) && data.features[0]?.properties?.name) ||
      null
    );
  } catch (e) {
    console.warn("Error al parsear geojson para name:", e);
    return null;
  }
};

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
      console.warn("Invalid coordinates provided to ArrowLayer");
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
const FarmMovementLayers = ({ movement, farmPolygons, yearStart, useArrows = true }) => {
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
    (type, sitCode, name) => (
      <div className="p-3 bg-white text-sm space-y-2">
        <div><span className="font-semibold">Tipo:</span> {getTypeLabel(type)}</div>
        {sitCode && <div><span className="font-semibold">Código SIT:</span> {sitCode}</div>}
        {name && <div><span className="font-semibold">Nombre:</span> {name}</div>}
      </div>
    ),
    []
  );

  const isMixedMovement = useCallback(
    (originFarmId, targetId, yearKey, kind) => {
      if (!originFarmId || !targetId || !movement?.[originFarmId]?.mixed?.[yearKey]) return false;
      const mixedItems =
        kind === "enterprise"
          ? movement[originFarmId].mixed[yearKey].enterprises || []
          : movement[originFarmId].mixed[yearKey].farms || [];
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
          const yearKey = String(yearStart);
          const mixed = isMixedMovement(originFarmId, id, yearKey, "enterprise");

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
                    positions={[
                      [farm_tmp.latitude, farm_tmp.longitud],
                      [lat, lon],
                    ]}
                    pathOptions={{ color: finalLineColor }}
                  />
                ))}
            </div>
          );
        }),
    [useArrows, yearStart, createPopupContent, isMixedMovement]
  );

  const renderFarmMarkers = useCallback(
    (movements, flow, lineColor, farm_main) =>
      movements
        .filter((m) => m?.destination?.latitude && m?.destination?.longitud && m?.destination?.farm_id)
        .map((m, idx) => {
          const { destination: dest } = m;
          const { latitude: lat, longitud: lon, farm_id: targetFarmId } = dest;

          const originFarmId = String(m.__farmId ?? m.source?.farm_id ?? "");
          const yearKey = String(yearStart);
          const mixed = isMixedMovement(originFarmId, targetFarmId, yearKey, "farm");

          const icon = getFarmIcon();
          const finalLineColor = mixed ? "purple" : lineColor;
          const farm_tmp = farm_main?.[0];
          const sitCode = getGeojsonName(dest.geojson);

          return (
            <div key={`farm-${idx}-${targetFarmId || "noid"}`}>
              <Marker position={[lat, lon]} icon={icon}>
                <Popup>{createPopupContent("FARM", sitCode)}</Popup>
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
                    positions={[
                      [farm_tmp.latitude, farm_tmp.longitud],
                      [lat, lon],
                    ]}
                    pathOptions={{ color: finalLineColor }}
                  />
                ))}
            </div>
          );
        }),
    [useArrows, yearStart, createPopupContent, isMixedMovement]
  );

  if (!movement) return null;

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
};

export default FarmMovementLayers;