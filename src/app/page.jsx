"use client";

import { useEffect } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMap,
  faChartBar,
  faTractor,
  faBuilding,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

// Constantes
const FEATURES_DATA = [
  {
    icon: faMap,
    title: "Riesgo nacional",
    description:
      "Explora el nivel de riesgo de deforestación en Colombia por departamento, municipio o vereda. Una visión clara para tomar decisiones informadas y basadas en evidencia.",
  },
  {
    icon: faTractor,
    title: "Riesgo de predios",
    description:
      "Accede a información detallada y georreferenciada sobre el riesgo de deforestación en predios específicos. Una mirada cercana al territorio.",
  },
  {
    icon: faBuilding,
    title: "Riesgo de empresas",
    description:
      "Descubre cómo las actividades económicas y empresariales se relacionan con zonas de riesgo y cómo impactan nuestros ecosistemas.",
  },
  {
    icon: faChartBar,
    title: "Metodología",
    description:
      "Conoce la base técnica y científica detrás de los mapas de riesgo. Transparencia y rigor para entender cómo se priorizan territorios y se analizan los impactos ambientales.",
  },
];

// Clases CSS reutilizables
const CSS_CLASSES = {
  heroSection: "relative w-full h-[80vh] md:h-[90vh] overflow-hidden",
  heroOverlay:
    "absolute inset-0 z-10 flex items-center bg-gradient-to-r from-black/70 from-25% to-black/20",
  heroContent: "text-white px-6 md:px-20 max-w-2xl",
  heroTitle: "text-5xl md:text-6xl font-heading font-bold mb-4",
  heroDescription:
    "text-lg md:text-xl font-plus-jakarta mb-6 text-custom-light",
  explorarButton:
    "bg-[#C5F642] text-[#082C14] px-6 py-3 rounded-full font-plus-jakarta font-semibold hover:bg-[#B5E632] transition-colors duration-200 cursor-pointer",
  featuresContainer: "max-w-8xl mx-auto px-6 md:px-12 lg:px-20 py-16",
  featuresSection:
    "flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-12",
  featureCard: "text-center flex-1 lg:max-w-xs mx-auto lg:mx-0",
  featureIcon: "mb-6 flex justify-center",
  featureTitle: "font-bold text-xl mb-4 text-[#082C14]",
  featureDescription: "text-[#082C14] font-medium font-plus-jakarta",
  separator: "hidden lg:flex justify-center items-center px-4",
  separatorLine: "w-px h-full bg-[#082C14]/75",
};

export default function Home() {
  // Configurar el título de la página
  useEffect(() => {
    document.title = "Ganabosques";
  }, []);

  const { userInfo, login } = useAuth();
  const router = useRouter();

  const handleExplorarMapas = () => {
    userInfo ? router.push("/alertasnacionales") : login();
  };

  // Componente para renderizar una característica
  const FeatureCard = ({ icon, title, description }) => (
    <div className={CSS_CLASSES.featureCard}>
      <div className={CSS_CLASSES.featureIcon}>
        <FontAwesomeIcon icon={icon} className="text-[#082C14]" size="3x" />
      </div>
      <h3 className={CSS_CLASSES.featureTitle}>{title}</h3>
      <p className={CSS_CLASSES.featureDescription}>{description}</p>
    </div>
  );

  // Componente para renderizar separador
  const Separator = () => (
    <div className={CSS_CLASSES.separator}>
      <div className={CSS_CLASSES.separatorLine}></div>
    </div>
  );

  return (
    <>
      {/* Hero Section */}
      <section className={CSS_CLASSES.heroSection}>
        <Image
          src="/bosque.png"
          alt="Imagen aérea del bosque"
          fill
          style={{ objectFit: "cover" }}
          quality={100}
          className="absolute inset-0 z-0"
          priority
        />
        <div className={CSS_CLASSES.heroOverlay}>
          <div className={CSS_CLASSES.heroContent}>
            <h1 className={CSS_CLASSES.heroTitle}>
              <span className="text-[#C5F642]">Gana</span>
              <span className="text-[#77D094]">Bosques</span>
            </h1>
            <p className={CSS_CLASSES.heroDescription}>
              Visualiza alertas de deforestación y el movimiento de ganado en
              Colombia, fácil y en un solo lugar.
            </p>
            <button
              onClick={handleExplorarMapas}
              className={CSS_CLASSES.explorarButton}
            >
              Explorar mapas
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <main className={CSS_CLASSES.featuresContainer}>
        <section className={CSS_CLASSES.featuresSection}>
          {FEATURES_DATA.map((feature, index) => (
            <>
              <FeatureCard key={feature.title} {...feature} />
              {index < FEATURES_DATA.length - 1 && (
                <Separator key={`separator-${index}`} />
              )}
            </>
          ))}
        </section>
      </main>
    </>
  );
}
