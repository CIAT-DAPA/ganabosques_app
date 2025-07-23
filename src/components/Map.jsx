"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import FilterBar from "@/components/FilterBar";
import RiskLegend from "@/components/Legend";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function LeafletMap({ enterpriseRisk, farmRisk }) {
  const [risk, setRisk] = useState("");
  const [year, setYear] = useState("");
  const [source, setSource] = useState("");
  const [search, setSearch] = useState("");
  const [selectedEnterprise, setSelectedEnterprise] = useState(null);
  const [foundFarms, setFoundFarms] = useState([]);

  useEffect(() => {
    import("leaflet");
  }, []);
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
      />

      <RiskLegend enterpriseRisk={enterpriseRisk} farmRisk={farmRisk} />
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
