"use client";

import {
  MapContainer,
  TileLayer,
  LayersControl,
  WMSTileLayer,
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

function ZoomControlTopRight() {
  const { useMap } = require("react-leaflet");
  const map = useMap();

  useEffect(() => {
    const zoom = L.control.zoom({ position: "topright" });
    zoom.addTo(map);
    return () => {
      zoom.remove();
    };
  }, [map]);

  return null;
}

// Component to capture map reference using useMap hook
function MapRefHandler({ onMapCreated }) {
  const { useMap } = require("react-leaflet");
  const map = useMap();

  useEffect(() => {
    if (onMapCreated && map) {
      onMapCreated(map);
    }
  }, [map, onMapCreated]);

  return null;
}

export default function BaseMap({ 
  center = [4.5709, -74.2973], 
  zoom = 6,
  className = "h-[80vh] w-full rounded-xl overflow-hidden",
  children,
  onMapCreated,
  showDeforestation = false,
  period = null,
  source = "smbyc",
  risk = "",
  deforestationLayers = null
}) {
  const mapRef = useRef();
  useEffect(() => {
    import("leaflet");
  }, []);

  const handleMapCreated = (mapInstance) => {
    mapRef.current = mapInstance;
    if (onMapCreated) {
      onMapCreated(mapInstance);
    }
  };

const deforestationType = period?.deforestation_type;
const isMonthlyType = deforestationType === "atd" || deforestationType === "nad";

// Format dates based on type
const formatDateForLabel = (dateStr, monthly) => {
  if (!dateStr) return null;
  if (monthly) {
    // Format: YYYY-MM
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }
  // Format: YYYY
  return dateStr.slice(0, 4);
};

const start = formatDateForLabel(period?.deforestation_period_start, isMonthlyType);
const end = formatDateForLabel(period?.deforestation_period_end, isMonthlyType);
const hasPeriod = start != null;

const defName = period?.deforestation_name ?? null;
let timeValue = defName ? defName.split("_").pop() : null;

if (isMonthlyType && timeValue && /^\d{6}$/.test(timeValue)) {
  timeValue = `${timeValue.slice(0, 4)}-${timeValue.slice(4)}`;
}

// For atd/nad show only timeValue, for annual/cumulative show range
const defLabel = hasPeriod
  ? isMonthlyType
    ? `Deforestación ${timeValue}`
    : `Deforestación ${start}-${end}`
  : "Deforestación";
  
  // Use prop if provided, otherwise fallback to constructed path
  const layersPath = deforestationLayers || `${source}_deforestation_${risk}`;
  
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      zoomControl={false}
      className={className}
    >
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Capture map reference */}
      <MapRefHandler onMapCreated={handleMapCreated} />

      <LayersControl position="topright">
        {showDeforestation && (
          <LayersControl.Overlay
            key={`def-${start ?? "na"}-${end ?? "na"}-${layersPath}`}
            name={defLabel}
          >
            <WMSTileLayer
              key={`wms-${start ?? "na"}-${end ?? "na"}-${layersPath}`}
              url="https://ganageo.alliance.cgiar.org/geoserver/deforestation/wms"
              layers={layersPath}
              format="image/png"
              transparent
              version="1.1.1"
              params={{ time: timeValue }}
              zIndex={1000}
            />
          </LayersControl.Overlay>
        )}

        <LayersControl.Overlay name="Departamentos">
          <WMSTileLayer
            url="https://ganageo.alliance.cgiar.org/geoserver/administrative/wms"
            layers="administrative:admin_1"
            format="image/png"
            transparent={true}
            attribution=""
            zIndex={1001}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="Municipios">
          <WMSTileLayer
            url="https://ganageo.alliance.cgiar.org/geoserver/administrative/wms"
            layers="administrative:admin_2"
            format="image/png"
            transparent={true}
            attribution=""
            zIndex={1001}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="Veredas">
          <WMSTileLayer
            url="https://ganageo.alliance.cgiar.org/geoserver/administrative/wms"
            layers="administrative:admin_3"
            format="image/png"
            transparent={true}
            attribution=""
            zIndex={1001}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="Áreas protegidas">
          <WMSTileLayer
            url="https://ganageo.alliance.cgiar.org/geoserver/administrative/wms"
            layers="administrative:pnn_areas"
            format="image/png"
            transparent={true}
            attribution="IDEAM"
            zIndex={1001}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="Frontera agrícola">
          <WMSTileLayer
            url="https://ganageo.alliance.cgiar.org/geoserver/administrative/wms"
            layers="administrative:upra_boundaries"
            format="image/png"
            transparent={true}
            attribution="IDEAM"
            zIndex={1001}
          />
        </LayersControl.Overlay>
      </LayersControl>

      <ZoomControlTopRight />
      
      {children}
    </MapContainer>
  );
}
