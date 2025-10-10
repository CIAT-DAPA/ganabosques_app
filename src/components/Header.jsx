"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faXmark,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

// ===== Navegación =====
const NAV_ITEMS = [
  { name: "Alertas nacionales", path: "/alertasnacionales", loginRequired: false },
  { name: "Alertas de predio", path: "/alertapredios", loginRequired: true },
  { name: "Reporte", path: "/reporte", loginRequired: true },
  
  {
    name: "Metodología",
    path: "https://cerodeforestacioncolombia.co/tfa/protocolo-de-monitoreo-reporte-y-verificacion-mrv-de-la-no-deforestacion-asociada-a-predios-de-cadenas-de-suministro-agropecuario-cacao-cafe-leche-carne-palma/",
    external: true,
    loginRequired: false,
  },
  
  { name: "Acerca de", path: "/acercade", loginRequired: false },
];

// ===== Clases CSS =====
const CSS_CLASSES = {
  primaryButton:
    "px-4 py-2 border-2 border-[#C5F642] text-[#FCFFF5] rounded-full flex items-center justify-center font-body font-semibold text-sm hover:bg-[#C5F642] hover:text-[#082C14] transition-all duration-200 cursor-pointer",
  navLink: {
    base: "py-2 px-3 transition-colors duration-200 relative",
    active:
      "text-[#C5F642] font-semibold after:content-[''] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-[#C5F642]",
    inactive:
      "text-custom-light hover:text-[#C5F642] hover:after:content-[''] hover:after:absolute hover:after:bottom-0 hover:after:left-3 hover:after:right-3 hover:after:h-0.5 hover:after:bg-[#C5F642]",
    external:
      "py-2 px-3 text-custom-light hover:text-[#C5F642] transition-colors duration-200 relative hover:after:content-[''] hover:after:absolute hover:after:bottom-0 hover:after:left-3 hover:after:right-3 hover:after:h-0.5 hover:after:bg-[#C5F642]",
  },
  disabledLink:
    "py-2 px-3 text-gray-400 cursor-not-allowed font-body transition-colors duration-200",
  avatar:
    "w-10 h-10 border-2 border-[#C5F642] text-[#FCFFF5] rounded-full flex items-center justify-center font-body font-semibold text-sm group-hover:bg-[#C5F642] group-hover:text-[#082C14] transition-all duration-200",
  avatarMobile:
    "w-8 h-8 border-2 border-[#C5F642] text-custom-light rounded-full flex items-center justify-center font-body font-semibold text-sm",
  dropdown:
    "absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50",
  dropdownItem:
    "w-full text-left px-4 py-2 font-body text-sm text-custom hover:bg-[#C5F642] hover:bg-opacity-10 hover:text-custom-dark transition-colors duration-200 cursor-pointer",
};

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { userInfo, login, logout, token, validatedPayload } = useAuth();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Roles
  const isAdmin =
    Array.isArray(validatedPayload?.client_roles) &&
    validatedPayload.client_roles.includes("Admin");
  const canAccess = (loginRequired) =>
    !loginRequired || (token && isAdmin);

  // Iniciales de usuario
  const getUserInitials = () => {
    if (!userInfo) return "SL";
    const { given_name, family_name, name, preferred_username } = userInfo;
    const firstName = given_name || name || "";
    const lastName = family_name || "";
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    if (preferred_username) return preferred_username.substring(0, 2).toUpperCase();
    return "U";
  };

  const getNavLinkClasses = (isActive) => {
    const baseClasses = CSS_CLASSES.navLink.base;
    return `${baseClasses} ${
      isActive ? CSS_CLASSES.navLink.active : CSS_CLASSES.navLink.inactive
    }`;
  };

  // Desktop links
  const renderNavLink = ({ name, path, external, loginRequired }) => {
    const allowed = canAccess(loginRequired);
    const isActive = pathname === path;

    if (external) {
      return allowed ? (
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className={CSS_CLASSES.navLink.external}
        >
          {name}
        </a>
      ) : (
        <span className={CSS_CLASSES.disabledLink} title="Requiere rol admin">
          {name}
        </span>
      );
    }

    return allowed ? (
      <Link href={path} className={getNavLinkClasses(isActive)}>
        {name}
      </Link>
    ) : (
      <span className={CSS_CLASSES.disabledLink} title="Requiere rol admin">
        {name}
      </span>
    );
  };

  // Mobile links
  const renderMobileNavLink = ({ name, path, external, loginRequired }) => {
    const allowed = canAccess(loginRequired);
    const isActive = pathname === path;

    if (external) {
      return allowed ? (
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className={`block font-body ${isActive ? "text-[#C5F642]" : "text-custom-light hover:text-[#C5F642]"}`}
          onClick={() => setIsOpen(false)}
        >
          {name}
        </a>
      ) : (
        <span className="block text-gray-400 cursor-not-allowed font-body" title="Requiere rol admin">
          {name}
        </span>
      );
    }

    return allowed ? (
      <Link
        href={path}
        className={`block font-body ${isActive ? "text-[#C5F642]" : "text-custom-light hover:text-[#C5F642]"}`}
        onClick={() => setIsOpen(false)}
      >
        {name}
      </Link>
    ) : (
      <span className="block text-gray-400 cursor-not-allowed font-body" title="Requiere rol admin">
        {name}
      </span>
    );
  };

  // Handlers
  const handleDropdownToggle = () => setIsDropdownOpen(!isDropdownOpen);
  const handleMobileMenuToggle = () => setIsOpen(!isOpen);
  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };
  const handleMobileLogout = () => {
    logout();
    setIsOpen(false);
  };
  const handleMobileLogin = () => {
    login();
    setIsOpen(false);
  };

  return (
    <nav className="bg-custom-dark border-b border-custom-dark">
      <div className="w-full flex items-center justify-between px-6 sm:px-8 md:px-12 lg:px-20 py-4">
        {/* Logo */}
        <Link
  href="/"
  className="flex items-center gap-2 font-heading text-2xl font-bold text-custom-light py-2 hover:text-green-300 transition-colors"
>
  <Image
    src="/logo.png"
    alt="Logo Ganabosques"
    width={40}   // ajusta tamaño
    height={40}  // ajusta tamaño
    priority
  />
  Ganabosques
</Link>

        {/* Botón hamburguesa */}
        <button
          onClick={handleMobileMenuToggle}
          className="lg:hidden text-custom-light"
        >
          <FontAwesomeIcon icon={isOpen ? faXmark : faBars} size="lg" />
        </button>

        {/* Menú y usuario en escritorio */}
        <div className="hidden lg:flex items-center space-x-2">
          <ul className="flex font-body font-medium space-x-1 items-center">
            {NAV_ITEMS.map((item) => (
              <li key={item.path}>{renderNavLink(item)}</li>
            ))}
          </ul>

          {/* Usuario */}
          <div className="flex items-center relative">
            {userInfo ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={handleDropdownToggle}
                  className="flex items-center space-x-2 focus:outline-none group cursor-pointer"
                >
                  <div className={CSS_CLASSES.avatar}>{getUserInitials()}</div>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`text-custom-light text-sm transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isDropdownOpen && (
                  <div className={CSS_CLASSES.dropdown}>
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-body font-semibold text-custom text-sm">
                        {userInfo.given_name || userInfo.preferred_username || "Usuario"}
                      </p>
                      <p className="font-body text-gray-500 text-xs">
                        {userInfo.email || ""}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className={CSS_CLASSES.dropdownItem}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={login} className={CSS_CLASSES.primaryButton}>
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {isOpen && (
        <div className="lg:hidden bg-custom-dark px-6 sm:px-8 md:px-12 py-4 space-y-3">
          <ul className="flex flex-col space-y-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.path}>{renderMobileNavLink(item)}</li>
            ))}
          </ul>

          <div className="pt-3 border-t border-green-600">
            {userInfo ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={CSS_CLASSES.avatarMobile}>{getUserInitials()}</div>
                  <span className="text-custom-light font-body text-sm">
                    {userInfo.given_name || userInfo.preferred_username || "Usuario"}
                  </span>
                </div>
                <button
                  onClick={handleMobileLogout}
                  className="text-sm px-2 py-1 border-2 border-[#C5F642] text-custom-light rounded-full hover:text-[#C5F642]"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <button onClick={handleMobileLogin} className="flex items-center space-x-3">
                <div className="px-2 py-1 border-2 border-[#C5F642] text-custom-light rounded-full font-body font-semibold text-sm">
                  Iniciar sesión
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}