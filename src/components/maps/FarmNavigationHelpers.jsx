"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export default function FarmNavigationHelpers({ farmPolygons }) {
  const FlyToFarmPolygons = ({ polygons }) => {
    const map = useMap();

    useEffect(() => {
      if (!polygons || polygons.length === 0 || !map) return;

      const allCoords = [];

      polygons.forEach((item) => {
        let geojson;

        try {
          geojson =
            typeof item.geojson === "string"
              ? JSON.parse(item.geojson)
              : item.geojson;
        } catch {
          return;
        }

        geojson?.features?.forEach((feature) => {
          if (feature.geometry?.type === "Polygon") {
            feature.geometry.coordinates[0]?.forEach(([lon, lat]) => {
              allCoords.push([lat, lon]);
            });
          }

          if (feature.geometry?.type === "MultiPolygon") {
            feature.geometry.coordinates.forEach((polygon) => {
              polygon[0]?.forEach(([lon, lat]) => {
                allCoords.push([lat, lon]);
              });
            });
          }
        });
      });

      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        map.flyToBounds(bounds, { padding: [50, 50], duration: 2 });
      }
    }, [polygons, map]);

    return null;
  };

  return <FlyToFarmPolygons polygons={farmPolygons} />;
}
