'use client';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import Banner from '@/components/Banner';
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false, 
});

export default function RiesgosPredios() {
  return (
    <>
    <Banner
        image="/vacas.png"
        title="Riesgo de Predios"
        text="Este módulo permite consultar los niveles de riesgo asociados a las empresas registradas a nivel nacional. Proporciona información detallada sobre su nivel de riesgo y datos relevantes sobre su red de proveeduría."
      />
      <Map />
    </>
  );
}
