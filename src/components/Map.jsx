'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';

// Corrige los íconos en Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function LeafletMap() {
  const [riesgo, setRiesgo] = useState('');
  const [ano, setAno] = useState('');
  const [fuente, setFuente] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    import('leaflet');
  }, []);

  const selectStyle =
    'appearance-none bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-full py-2 px-4 pr-8 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="relative">
      <div className="absolute top-4 left-[88px] right-4 z-[1000] flex gap-4 items-center">
        {/* Riesgo */}
        <div className="relative">
          <select value={riesgo} onChange={(e) => setRiesgo(e.target.value)} className={selectStyle}>
            <option value="">Riesgo</option>
            <option value="total">Riesgo Total</option>
            <option value="parcial">Riesgo Directo</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Año */}
        <div className="relative">
          <select value={ano} onChange={(e) => setAno(e.target.value)} className={selectStyle}>
            <option value="">Año</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="relative">
          <select value={fuente} onChange={(e) => setFuente(e.target.value)} className={selectStyle}>
            <option value="">Fuente</option>
            <option value="oficial">Oficial</option>
            <option value="secundaria">Secundaria</option>
            <option value="ciudadana">Ciudadana</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            console.log('Buscando:', busqueda);
          }}
          className="flex items-center flex-grow bg-white rounded-full shadow-md overflow-hidden border border-gray-300 min-w-[200px]"
        >
          <input
            type="text"
            placeholder="Buscar empresa"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-grow px-4 py-2 text-sm text-gray-700 bg-transparent focus:outline-none"
          />
          <button
            type="submit"
            className="bg-green-700 hover:bg-green-800 text-white p-2 rounded-full m-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
            </svg>
          </button>
        </form>
      </div>

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
        <Marker position={[4.5709, -74.2973]}>
          <Popup>Riesgo Nacional Central</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
