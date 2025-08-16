'use client';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import Banner from '@/components/Banner';
import { useAuth } from '@/hooks/useAuth';
import UnauthorizedPage from "@/components/Unauthorized";
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false, 
});

export default function RiesgosPredios() {
  //const { validatedPayload } = useAuth();
   // if (!validatedPayload || !validatedPayload?.client_roles?.includes('Admin')) {
   // return <UnauthorizedPage />;
 // }
  return (
    <>
      <article className="relative bg-cover bg-center shadow-md overflow-hidden">
        <div className="relative z-10 p-8 md:p-12 max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight drop-shadow-lg">
            Riesgos de predios
          </h1>
          <p className="text-lg md:text-xl font-medium drop-shadow-sm">
            Consulta el nivel de riesgo asociado a un predio específico mediante diferentes códigos. 
            Este módulo te permite identificar focos de presión sobre los bosques vinculados a la actividad 
            ganadera y evaluar patrones acumulados o anuales de riesgo por finca. 
          </p>
        </div>
      </article>
      <Map farmRisk />
    </>
  );
}
