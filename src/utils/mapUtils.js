// Map utilities and constants
import L from "leaflet";
import { TYPE_ALIASES, ENTERPRISE_TYPES } from "@/components/shared";

// Arrow config
export const ARROW_CONFIG = {
  ROTATION_ADJUSTMENT: 180,
  ANIMATION_DURATION: "1.5s",
  ICON_SIZES: { HIGH_ZOOM: 24, MEDIUM_ZOOM: 20, LOW_ZOOM: 16 },
  ZOOM_THRESHOLDS: { HIGH: 14, MEDIUM: 12, LOW: 10 },
  SPACING: { HIGH_ZOOM: 1500, MEDIUM_ZOOM: 3000, LOW_ZOOM: 6000, VERY_LOW_ZOOM: 12000 },
  MIXED_SIZE_RATIO: 0.8,
  MIXED_OPACITY: 0.7,
  NORMAL_OPACITY: 0.8,
};

// Enterprise icon base names
export const ENTERPRISE_BASES = {
  SLAUGHTERHOUSE: "planta",
  COLLECTION_CENTER: "acopio",
  CATTLE_FAIR: "feria",
  ENTERPRISE: "empresa",
  FARM: "finca",
};

// Normalize enterprise type
export const normalizeType = (type) => {
  if (!type) return "ENTERPRISE";
  const t = String(type).trim().toUpperCase().replace(/\s+/g, " ");
  const t2 = t.replace(/-/g, "_");
  return TYPE_ALIASES[t2] || t2;
};

// Get enterprise base name
export const getEnterpriseBase = (type) => {
  const canon = normalizeType(type);
  return ENTERPRISE_BASES[canon] || "empresa";
};

// Get type label
export const getTypeLabel = (type) => ENTERPRISE_TYPES[normalizeType(type)] || type;

// Create leaflet icon
export const createIcon = (iconUrl, className) =>
  L.icon({
    iconUrl,
    iconSize: [42, 57],
    iconAnchor: [21, 57],
    popupAnchor: [0, -36],
    className,
  });

// Get enterprise marker icon
export const getEnterpriseIcon = (type) => {
  const base = getEnterpriseBase(type);
  return createIcon(`/${base}.png`, "enterprise-marker");
};

// Get farm marker icon
export const getFarmIcon = () => createIcon("/finca.png", "farm-marker");

// Calculate distance between coordinates
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate angle between coordinates
export const calculateAngle = (lat1, lon1, lat2, lon2) => {
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const dLonRad = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLonRad) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLonRad);
  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
};

// Interpolate points between coordinates
export const interpolatePoints = (lat1, lon1, lat2, lon2, numPoints) => {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const r = i / numPoints;
    points.push([lat1 + (lat2 - lat1) * r, lon1 + (lon2 - lon1) * r]);
  }
  return points;
};

// Get arrow spacing based on zoom
export const getArrowSpacing = (zoom) => {
  if (zoom >= ARROW_CONFIG.ZOOM_THRESHOLDS.HIGH) return ARROW_CONFIG.SPACING.HIGH_ZOOM;
  if (zoom >= ARROW_CONFIG.ZOOM_THRESHOLDS.MEDIUM) return ARROW_CONFIG.SPACING.MEDIUM_ZOOM;
  if (zoom >= ARROW_CONFIG.ZOOM_THRESHOLDS.LOW) return ARROW_CONFIG.SPACING.LOW_ZOOM;
  return ARROW_CONFIG.SPACING.VERY_LOW_ZOOM;
};

// Get icon size based on zoom
export const getIconSize = (zoom) => {
  if (zoom >= ARROW_CONFIG.ZOOM_THRESHOLDS.MEDIUM) return ARROW_CONFIG.ICON_SIZES.HIGH_ZOOM;
  if (zoom >= ARROW_CONFIG.ZOOM_THRESHOLDS.LOW) return ARROW_CONFIG.ICON_SIZES.MEDIUM_ZOOM;
  return ARROW_CONFIG.ICON_SIZES.LOW_ZOOM;
};

// Extract name from GeoJSON
export const getGeojsonName = (geojson) => {
  try {
    const data = typeof geojson === "string" ? JSON.parse(geojson) : geojson;
    if (!data) return null;
    return data.name || data.properties?.name || (Array.isArray(data.features) && data.features[0]?.properties?.name) || null;
  } catch {
    return null;
  }
};
