"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Importación dinámica del componente Map
const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
});

// Clases CSS reutilizables
const CSS_CLASSES = {
  pageContainer: "min-h-screen bg-[#FCFFF5]",
  headerSection: "bg-[#FCFFF5] p-6 md:p-12",
  contentWrapper: "max-w-7xl mx-auto",
  title: "text-3xl md:text-5xl font-heading font-bold mb-3 text-[#082C14]",
  separator: "border-[#082C14] border-t-1 mb-4",
  description: "text-lg font-plus-jakarta text-[#082C14] font-medium",
  mapContainer: "flex-1",
};

export default function RiesgosNacionales() {
  // Configurar el título de la página
  useEffect(() => {
    document.title = "Ganabosques - Riesgos nacionales";
  }, []);

  return (
    <main className={CSS_CLASSES.pageContainer}>
      {/* Sección de encabezado */}
      <header className={CSS_CLASSES.headerSection}>
        <div className={CSS_CLASSES.contentWrapper}>
          <h1 className={CSS_CLASSES.title}>Riesgos nacionales</h1>

          <hr className={CSS_CLASSES.separator} />

          <p className={CSS_CLASSES.description}>
            Una herramienta que muestra el riesgo asociado a la ganadería, la
            deforestación y las áreas protegidas en Colombia. Con
            visualizaciones simples podrás identificar las regiones más críticas
            del país, usando datos de distintas fuentes y períodos de monitoreo.
          </p>
        </div>
      </header>

      {/* Sección del mapa */}
      <section className={CSS_CLASSES.mapContainer}>
        <Map nationalRisk={true} />
      </section>
    </main>
  );
}
