"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export default function NationalNavigationHelpers({ 
  adm3Details, 
  lastCenteredExtId, 
  setLastCenteredExtId 
}) {
  const FlyToAdm3Detail = ({
    adm3Details,
    lastCenteredExtId,
    setLastCenteredExtId,
  }) => {
    const map = useMap();

    useEffect(() => {
      if (!map || !adm3Details || adm3Details.length === 0) return;

      const latest = adm3Details[adm3Details.length - 1];
      const extId = latest?.ext_id || latest?.cod_ver || latest?.id;
      if (!extId) return;

      if (extId === lastCenteredExtId) {
        return;
      }

      setLastCenteredExtId(extId);

      const wfsUrl = `https://ganageo.alliance.cgiar.org/geoserver/administrative/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=administrative:admin_3&outputFormat=application/json&CQL_FILTER=cod_ver='${extId}'&srsName=EPSG:4326`;
      const fullUrl = `https://corsproxy.io/?${encodeURIComponent(wfsUrl)}`;

      fetch(fullUrl)
        .then((res) => res.json())
        .then((geojson) => {
          const coords = [];

          geojson?.features?.forEach((feature) => {
            const geom = feature.geometry;

            if (geom?.type === "Polygon") {
              geom.coordinates[0].forEach(([lon, lat]) => {
                coords.push([lat, lon]);
              });
            }

            if (geom?.type === "MultiPolygon") {
              geom.coordinates.forEach((polygon) => {
                polygon[0].forEach(([lon, lat]) => {
                  coords.push([lat, lon]);
                });
              });
            }
          });

          if (coords.length > 0) {
            const bounds = L.latLngBounds(coords);
            map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
          }
        })
        .catch((err) => {
          console.error("❌ Error al centrar en adm3:", err);
        });
    }, [adm3Details, lastCenteredExtId, setLastCenteredExtId]);

    return null;
  };

  // Reset cuando no hay detalles
  useEffect(() => {
    if (adm3Details.length === 0) {
      setLastCenteredExtId(null);
    }
  }, [adm3Details, setLastCenteredExtId]);

  return (
    <FlyToAdm3Detail
      adm3Details={adm3Details}
      lastCenteredExtId={lastCenteredExtId}
      setLastCenteredExtId={setLastCenteredExtId}
    />
  );
}
