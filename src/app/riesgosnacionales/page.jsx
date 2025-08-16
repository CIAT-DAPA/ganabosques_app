'use client';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false, 
});

export default function RiesgosNacionales() {
  return (
    <section>
      <article className="relative bg-cover bg-center shadow-md overflow-hidden">
        <div className="relative z-10 p-8 md:p-12 max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight drop-shadow-lg">
            Riesgos nacionales
          </h1>
          <p className="text-lg md:text-xl font-medium drop-shadow-sm">
            Esta herramienta presenta un análisis de los niveles de riesgo
            relacionados con la actividad ganadera, la deforestación y áreas protegidas
            a nivel administrativo en Colombia.
            La visualización permite identificar regiones críticas a nivel nacional
            según diferentes fuentes y periodos de monitoreo.
          </p>
        </div>
      </article>
      <Map nationalRisk={true} />
    </section>
  );
}
