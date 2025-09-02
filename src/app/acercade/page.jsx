"use client";

import { useEffect } from "react";
import Image from "next/image";

// Constantes
const CONTRIBUCIONES = [
  "Política Nacional de Lucha contra la Deforestación (CONPES 4021)",
  "Monitoreo y verificación de compromisos de Cero Deforestación",
  "Priorización de acciones y alertas tempranas",
];

const SOCIOS_ESTRATEGICOS = [
  {
    src: "/partner1.png",
    alt: "Ministerio de Agricultura y Desarrollo Rural",
    url: "https://www.minagricultura.gov.co/",
  },
  {
    src: "/alliancedark.png",
    alt: "Alliance Bioversity & CIAT",
    url: "https://alliancebioversityciat.org/",
  },
  {
    src: "/partner3.png",
    alt: "UK PACT",
    url: "https://www.ukpact.co.uk/",
  },
  {
    src: "/cgiardark.jpg",
    alt: "CGIAR",
    url: "https://www.cgiar.org/",
  },
];

// Clases CSS reutilizables
const CSS_CLASSES = {
  container: "max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-16",
  mainTitle: "text-4xl md:text-5xl font-heading font-bold mb-3 text-[#082C14]",
  sectionTitle: "text-2xl md:text-3xl font-bold mb-4 text-[#082C14]",
  separator: "border-[#082C14] border-t-1 mb-4",
  bodyText: "text-[#082C14] font-plus-jakarta text-medium",
  sectionMargin: "mb-10",
  contributionItem: "flex items-start",
  contributionBullet: "text-[#082C14] mr-2",
  partnerLink: "hover:opacity-80 transition-opacity duration-200",
  partnerImage: "object-contain max-h-24 cursor-pointer",
  partnersGrid: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center",
  partnersLogos: "flex flex-wrap items-center justify-center gap-8",
};

export default function AcercaDe() {
  // Configurar el título de la página
  useEffect(() => {
    document.title = "Ganabosques - Acerca de";
  }, []);

  // Componente para renderizar una contribución
  const ContribucionItem = ({ texto }) => (
    <li className={CSS_CLASSES.contributionItem}>
      <span className={CSS_CLASSES.contributionBullet}>•</span>
      {texto}
    </li>
  );

  // Componente para renderizar un socio estratégico
  const SocioEstrategico = ({ src, alt, url }) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={CSS_CLASSES.partnerLink}
    >
      <Image
        src={src}
        alt={alt}
        width={200}
        height={100}
        className={CSS_CLASSES.partnerImage}
      />
    </a>
  );

  return (
    <main className={CSS_CLASSES.container}>
      {/* Título principal */}
      <header className={CSS_CLASSES.sectionMargin}>
        <h1 className={CSS_CLASSES.mainTitle}>Acerca de Ganabosques</h1>
        <hr className={CSS_CLASSES.separator} />
        <p className={CSS_CLASSES.bodyText}>
          <strong>Ganabosques</strong> es una plataforma tecnológica diseñada
          para ayudar a Colombia en la lucha contra la deforestación asociada a
          la actividad ganadera. Su objetivo es evaluar, caracterizar y
          gestionar los niveles de riesgo de deforestación, apoyando la toma de
          decisiones de entidades públicas, gremios, productores y verificadores
          independientes.
        </p>
      </header>

      {/* Propósito y alcance */}
      <section className={CSS_CLASSES.sectionMargin}>
        <h2 className={CSS_CLASSES.sectionTitle}>Propósito y alcance</h2>
        <p className={`${CSS_CLASSES.bodyText} mb-4`}>
          El producto busca ajustar, escalar e implementar el sistema de
          información Ganabosques como herramienta para{" "}
          <strong>evaluar, caracterizar y gestionar</strong> los niveles de
          riesgo de deforestación asociados a la actividad ganadera, siguiendo
          los lineamientos del <strong>Protocolo MRV</strong> de los{" "}
          <strong>Acuerdos de Cero Deforestación (ACD)</strong>.
        </p>
        <p className={CSS_CLASSES.bodyText}>
          La herramienta integra información oficial del Sistema de Monitoreo de
          Bosques y Carbono (SMByC) del IDEAM, junto con datos geoespaciales y
          administrativos de predios ganaderos, registros sanitarios, ciclos de
          vacunación, trazabilidad de movilización animal y áreas protegidas.
          Con esta combinación de datos, Ganabosques calcula indicadores
          precisos de riesgo a nivel predial, territorial y empresarial.
        </p>
      </section>

      {/* Contribuye a */}
      <section className={CSS_CLASSES.sectionMargin}>
        <h2 className={CSS_CLASSES.sectionTitle}>Contribuye a</h2>
        <ul className={`space-y-3 ${CSS_CLASSES.bodyText}`}>
          {CONTRIBUCIONES.map((contribucion, index) => (
            <ContribucionItem key={index} texto={contribucion} />
          ))}
        </ul>
      </section>

      {/* Socios estratégicos */}
      <section>
        <h2 className={CSS_CLASSES.sectionTitle}>Socios estratégicos</h2>
        <div className={CSS_CLASSES.partnersGrid}>
          {/* Texto lado izquierdo */}
          <div>
            <p className={CSS_CLASSES.bodyText}>
              Ganabosques trabaja de la mano con socios clave que aportan
              conocimiento, datos y respaldo institucional para fortalecer la
              lucha contra la deforestación. A continuación, presentamos algunas
              de las organizaciones aliadas:
            </p>
          </div>

          {/* Logos lado derecho */}
          <div className={CSS_CLASSES.partnersLogos}>
            {SOCIOS_ESTRATEGICOS.map((socio, index) => (
              <SocioEstrategico key={index} {...socio} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
