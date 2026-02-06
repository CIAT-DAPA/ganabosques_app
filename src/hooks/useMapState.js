"use client";

import { useRef, useCallback } from "react";
import { searchAdmByName } from "@/services/apiService";
import { useAuth } from "./useAuth";

// Map state and handlers hook
export function useMapState() {
  const { token } = useAuth();
  const mapRef = useRef(null);

  const handleMapCreated = useCallback((mapInstance) => {
    mapRef.current = mapInstance;
  }, []);

  const handleAdmSearch = useCallback(
    async (searchText, level, setAdmResults) => {
      try {
        if (!token) return;
        const results = await searchAdmByName(token, searchText, level);
        if (!results?.length) return;
        if (setAdmResults) setAdmResults(results);
        const geometry = results[0]?.geometry;
        if (geometry && mapRef.current) {
          const L = await import("leaflet");
          const layer = L.geoJSON(geometry);
          mapRef.current.fitBounds(layer.getBounds());
        }
      } catch (err) {
        console.error("Error al buscar nivel administrativo:", err);
      }
    },
    [token]
  );

  const flyToBounds = useCallback(async (geojson, padding = [50, 50]) => {
    if (!mapRef.current || !geojson) return;
    
    try {
      const L = await import("leaflet");
      const layer = L.geoJSON(geojson);
      mapRef.current.flyToBounds(layer.getBounds(), { 
        padding, 
        animate: true, 
        duration: 1.5 
      });
    } catch (err) {
      console.error("Error flying to bounds:", err);
    }
  }, []);

  const flyToCoordinates = useCallback((lat, lng, zoom = 12) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([lat, lng], zoom, { animate: true, duration: 1.5 });
  }, []);

  return {
    mapRef,
    handleMapCreated,
    handleAdmSearch,
    flyToBounds,
    flyToCoordinates,
  };
}

export default useMapState;
