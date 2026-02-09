"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import {
  ARROW_CONFIG,
  calculateDistance,
  calculateAngle,
  interpolatePoints,
  getArrowSpacing,
  getIconSize,
} from "@/utils/mapUtils";

// Animated arrow layer between two map points
export default function ArrowLayer({
  fromLat,
  fromLon,
  toLat,
  toLon,
  color = "#8B4513",
  flow = "salida",
  isMixed = false,
}) {
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
    if (!fromLat || !fromLon || !toLat || !toLon) return;

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
}
