"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { useAuth } from "@/hooks/useAuth";
import UnauthorizedPage from "@/components/Unauthorized";

// Importación dinámica del componente Map
const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
});

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
    document.title = "Ganabosques - Alertas nacionales";
  }, []);
const { validatedPayload } = useAuth();
 if (!validatedPayload || !validatedPayload?.client_roles?.includes('Admin')) {
return <UnauthorizedPage />;
  }
  return (
    <main className={CSS_CLASSES.pageContainer}>
      {/* Sección de encabezado */}
      <header className={CSS_CLASSES.headerSection}>
        <div className={CSS_CLASSES.contentWrapper}>
          <h1 className={CSS_CLASSES.title}>Alertas nacionales</h1>

          <hr className={CSS_CLASSES.separator} />

          <p className={CSS_CLASSES.description}>
            Explora las alertas nacionales de deforestación por las diferentes cadenas productivas en Colombia.
            Este mapa interactivo te permite identificar las veredas con alertas y las áreas protegidas del país,
            con datos oficiales y actualizados de distintas fuentes de monitoreo ambiental.
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
