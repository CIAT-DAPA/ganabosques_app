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

// Configuración de iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Componente para mover controles de zoom a la derecha superior
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

export default function BaseMap({ 
  center = [4.5709, -74.2973], 
  zoom = 6,
  className = "h-[80vh] w-full",
  children,
  onMapCreated,
  showDeforestation = false,
  period = null,
  source = "smbyc",
  risk = ""
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

  const start = period?.deforestation_year_start ?? null;
  const end = period?.deforestation_year_end ?? null;
  const hasPeriod = start != null && end != null;
  const defLabel = hasPeriod
    ? `Deforestación ${start}-${end}`
    : "Deforestación";

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      zoomControl={false}
      className={className}
      whenCreated={handleMapCreated}
    >
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <LayersControl position="topright">
        {showDeforestation && (
          <LayersControl.Overlay
            key={`def-${start ?? "na"}-${end ?? "na"}-${source}-${risk}`}
            name={defLabel}
          >
            <WMSTileLayer
              key={`wms-${start ?? "na"}-${end ?? "na"}-${source}-${risk}`}
              url="https://ganageo.alliance.cgiar.org/geoserver/deforestation/wms"
              layers={`${source}`}
              format="image/png"
              transparent
              version="1.1.1"
              {...(hasPeriod ? { time: `${start}` } : {})}
              zIndex={1000}
            />
          </LayersControl.Overlay>
        )}

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
