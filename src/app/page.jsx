// app/page.tsx
'use client';

import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMap, faChartBar, faUserCheck } from '@fortawesome/free-solid-svg-icons';

export default function Home() {
  return (
    <main className="px-6 md:px-12 lg:px-20 py-12 max-w-7xl mx-auto">
  {/* Encabezado */}
  <section className="text-center mb-12">
    <h1 className="text-3xl font-bold mb-10">Ganabosques</h1>
    <h2 className="text-sm text-gray-700 tracking-widest uppercase">
      Tecnología al servicio del monitoreo ambiental
    </h2>
  </section>

  {/* Imagen principal */}
  <div className="overflow-hidden rounded-2xl shadow-lg mb-16">
    <Image
      src="/bosque.png"
      alt="Imagen aérea del bosque"
      width={1400}
      height={768}
      layout="responsive"
    />
  </div>

  {/* Sección de contenido */}
  <section className="grid grid-cols-1 md:grid-cols-3 gap-10">
    <div className="text-left">
      <div className="mb-4">
        <FontAwesomeIcon icon={faMap} className="text-green-700" size="2x" />
      </div>
      <h3 className="font-bold text-lg mb-2">Riesgos Nacionales</h3>
      <p className="text-gray-700 text-justify">
        Consulta el nivel de riesgo de deforestación por departamento, municipio o vereda.
        Una herramienta para tomar decisiones con base en evidencia.
      </p>
    </div>

    <div className="text-left">
      <div className="mb-4">
        <FontAwesomeIcon icon={faChartBar} className="text-green-700" size="2x" />
      </div>
      <h3 className="font-bold text-lg mb-2">Metodología</h3>
      <p className="text-gray-700 text-justify">
        Analiza la metodología empleada para entender el proceso detrás de los datos presentados.
      </p>
    </div>

    <div className="text-left">
      <div className="mb-4">
        <FontAwesomeIcon icon={faUserCheck} className="text-green-700" size="2x" />
      </div>
      <h3 className="font-bold text-lg mb-2">Reportes</h3>
      <p className="text-gray-700 text-justify">
        Explora estadísticas de riesgo de deforestación por regiones y descubre el verdadero
        impacto ambiental que representan.
      </p>
    </div>
  </section>
</main>

  );
}
