'use client';

import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMap, faChartBar, faUserCheck, faTractor, faBuilding } from '@fortawesome/free-solid-svg-icons';


export default function Home() {
  return (
    <>
      {/* Hero Section con imagen de fondo y texto alineado a la izquierda */}
      <section className="relative w-full h-[80vh] md:h-[90vh] overflow-hidden">
        <Image
          src="/bosque.png"
          alt="Imagen aérea del bosque"
          layout="fill"
          objectFit="cover"
          quality={100}
          className="absolute inset-0 z-0"
        />
        <div className="absolute inset-0 z-10 flex items-center bg-black/40">
          {/* Texto alineado a la izquierda con padding */}
          <div className="text-white px-6 md:px-20 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Ganabosques</h1>
            <h2 className="text-sm md:text-base tracking-widest uppercase">
              Tecnología al servicio del monitoreo ambiental
            </h2>
          </div>
        </div>
      </section>

      {/* Contenido inferior */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-12">
  <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
    {/* Riesgo Nacional */}
    <div className="text-left">
      <div className="mb-4">
        <FontAwesomeIcon icon={faMap} className="text-green-700" size="2x" />
      </div>
      <h3 className="font-bold text-lg mb-2">Riesgo Nacional</h3>
      <p className="text-gray-700 text-justify">
        Consulta el nivel de riesgo de deforestación por departamento, municipio o vereda.
        Una herramienta para tomar decisiones con base en evidencia.
      </p>
    </div>

    {/* Riesgo de Predios */}
    <div className="text-left">
      <div className="mb-4">
        <FontAwesomeIcon icon={faTractor} className="text-green-700" size="2x" />
      </div>
      <h3 className="font-bold text-lg mb-2">Riesgo de Predios</h3>
      <p className="text-gray-700 text-justify">
        Accede a información detallada sobre riesgo de deforestación a nivel de predios
        específicos, con visualización geoespacial integrada.
      </p>
    </div>

    {/* Riesgo de Empresas */}
    <div className="text-left">
      <div className="mb-4">
        <FontAwesomeIcon icon={faBuilding} className="text-green-700" size="2x" />
      </div>
      <h3 className="font-bold text-lg mb-2">Riesgo de Empresas</h3>
      <p className="text-gray-700 text-justify">
        Analiza cómo ciertas actividades económicas y empresas se relacionan con zonas
        de riesgo y contribuyen a la presión sobre los ecosistemas.
      </p>
    </div>

    {/* Metodología */}
    <div className="text-left">
      <div className="mb-4">
        <FontAwesomeIcon icon={faChartBar} className="text-green-700" size="2x" />
      </div>
      <h3 className="font-bold text-lg mb-2">Metodología</h3>
      <p className="text-gray-700 text-justify">
        Conoce la metodología técnica y científica empleada para construir los mapas de riesgo,
        priorización y análisis de impactos ambientales.
      </p>
    </div>
  </section>
</main>


    </>
  );
}
