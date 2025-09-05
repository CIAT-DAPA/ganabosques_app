import Image from "next/image";
import Link from "next/link";

// Constantes
const FOOTER_LINKS = [
  {
    name: "Acerca de",
    href: "/acercade",
    external: false,
  },
  {
    name: "Metodología",
    href: "https://cerodeforestacioncolombia.co/tfa/protocolo-de-monitoreo-reporte-y-verificacion-mrv-de-la-no-deforestacion-asociada-a-predios-de-cadenas-de-suministro-agropecuario-cacao-cafe-leche-carne-palma/",
    external: true,
  },
];

const PARTNERS = [
  {
    src: "/partner1.png",
    alt: "Ministerio de Agricultura y Desarrollo Rural",
  },
  {
    src: "/partner2.png",
    alt: "Alliance Bioversity & CIAT",
  },
  {
    src: "/partner3.png",
    alt: "UK PACT",
  },
  {
    src: "/partner4.png",
    alt: "CGIAR",
  },
];

// Clases CSS reutilizables
const CSS_CLASSES = {
  sectionTitle: "text-lg font-raleway font-semibold mb-6 text-custom-light",
  footerLink:
    "font-plus-jakarta text-custom-light py-2 transition-colors duration-200 relative hover:text-[#C5F642] hover:after:content-[''] hover:after:absolute hover:after:bottom-0 hover:after:left-0 hover:after:right-0 hover:after:h-0.5 hover:after:bg-[#C5F642]",
  partnerLogo: "object-contain max-h-16",
  copyright: "text-sm font-plus-jakarta text-custom-light",
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Componente para renderizar enlaces
  const renderFooterLink = ({ name, href, external }) => {
    const linkProps = external
      ? { target: "_blank", rel: "noopener noreferrer" }
      : {};

    return (
      <Link href={href} {...linkProps} className={CSS_CLASSES.footerLink}>
        {name}
      </Link>
    );
  };

  // Componente para renderizar logos de socios
  const renderPartnerLogo = ({ src, alt }, index) => (
    <Image
      key={index}
      src={src}
      alt={alt}
      height={50}
      width={50}
      className={CSS_CLASSES.partnerLogo}
      style={{ width: "auto", height: "50px" }}
    />
  );

  return (
    <footer className="bg-custom-dark text-custom-light py-12">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Contenido principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-12">
          {/* Secciones */}
          <div>
            <h3 className={CSS_CLASSES.sectionTitle}>Secciones</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.map((link, index) => (
                <li key={index}>{renderFooterLink(link)}</li>
              ))}
            </ul>
          </div>

          {/* Socios */}
          <div className="md:col-span-2">
            <h3 className={CSS_CLASSES.sectionTitle}>Socios</h3>
            <div className="flex items-center justify-center md:justify-start gap-8 lg:gap-12 flex-wrap">
              {PARTNERS.map(renderPartnerLogo)}
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <hr className="border-[#FCFFF5] mb-6" />

        {/* Copyright */}
        <div className="text-center">
          <p className={CSS_CLASSES.copyright}>
            &copy; Ganabosques {currentYear} Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
