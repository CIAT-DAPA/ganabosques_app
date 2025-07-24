"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import FilterBar from "@/components/FilterBar";
import RiskLegend from "@/components/Legend";
import { searchAdmByName } from "@/services/apiService";
import { GeoJSON } from "react-leaflet";
import { useRef } from "react";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function LeafletMap({ enterpriseRisk, farmRisk, nationalRisk }) {
  const [risk, setRisk] = useState("");
  const [year, setYear] = useState("");
  const [source, setSource] = useState("");
  const [search, setSearch] = useState("");
  const [selectedEnterprise, setSelectedEnterprise] = useState(null);
  const [foundFarms, setFoundFarms] = useState([]);
  const [admLevel, setAdmLevel] = useState("adm1");
  const [admResults, setAdmResults] = useState([]);
  const mapRef = useRef(); // ← permite centrar el mapa después de buscar


  useEffect(() => {
    import("leaflet");
  }, []);

  const handleAdmSearch = async (searchText, level) => {
    try {
      const results = await searchAdmByName(searchText, level);
      if (!results || results.length === 0) {
        console.warn("No se encontraron resultados");
        return;
      }

      setAdmResults(results);

      // Centra el mapa en la geometría encontrada
      const geometry = results[0]?.geometry;
      if (geometry && mapRef.current) {
        const layer = L.geoJSON(geometry);
        mapRef.current.fitBounds(layer.getBounds());
      }
    } catch (err) {
      console.error("Error al buscar nivel administrativo:", err);
    }
  };


 console.log(year)
 console.log(risk)
 console.log(source)
 console.log(search)
 console.log(selectedEnterprise)
 console.log(foundFarms)

  return (
    <div className="relative">
      <FilterBar
        risk={risk}
        setRisk={setRisk}
        year={year}
        setYear={setYear}
        source={source}
        setSource={setSource}
        search={search}
        setSearch={setSearch}
        onSearch={(e) => {
          e.preventDefault();
        }}
        enterpriseRisk={enterpriseRisk}
        farmRisk={farmRisk}
        selectedEnterprise={selectedEnterprise}
        setSelectedEnterprise={setSelectedEnterprise}
        foundFarms={foundFarms}
        setFoundFarms={setFoundFarms}
        nationalRisk={nationalRisk}
        admLevel={admLevel}
        setAdmLevel={setAdmLevel}
        onAdmSearch={handleAdmSearch}
      />

      <RiskLegend enterpriseRisk={enterpriseRisk} farmRisk={farmRisk} nationalRisk={nationalRisk}/>
      <MapContainer
        center={[4.5709, -74.2973]}
        zoom={6}
        scrollWheelZoom={true}
        className="h-[80vh] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[4.5709, -74.2973]}></Marker>
      </MapContainer>
    </div>
  );
}
