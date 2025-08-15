"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { userInfo, login, logout, token } = useAuth();

  const navItems = [
    { name: "Inicio", path: "/" },
    { name: "Riesgos nacionales", path: "/riesgosnacionales" },
    { name: "Riesgo de predios", path: "/riesgopredios" },
    { name: "Riesgo de empresas", path: "/riesgoempresas" },
    {
      name: "Metodología",
      path: "https://cerodeforestacioncolombia.co/tfa/protocolo-de-monitoreo-reporte-y-verificacion-mrv-de-la-no-deforestacion-asociada-a-predios-de-cadenas-de-suministro-agropecuario-cacao-cafe-leche-carne-palma/",
      external: true,
    },
    { name: "Acerca de", path: "/acercade" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="w-full flex items-center justify-between px-6 sm:px-8 md:px-12 lg:px-20 py-3">
        
        {/* Logo */}
        <Link href="/" className="text-xl font-semibold text-black py-2">
          Ganabosques
        </Link>

        {/* Botón hamburguesa */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden text-gray-700"
        >
          <FontAwesomeIcon icon={isOpen ? faXmark : faBars} size="lg" />
        </button>

        {/* Menú horizontal en escritorio */}
        <ul className="hidden lg:flex font-medium space-x-6 items-center">
          {navItems.map(({ name, path, external }) => (
            <li key={path}>
              {external ? (
                <a
                  href={path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 text-gray-900 hover:text-green-700"
                >
                  {name}
                </a>
              ) : token || path === "/" ? (
                <Link
                  href={path}
                  className={`py-2 px-3 rounded ${
                    pathname === path
                      ? "text-green-700 font-semibold"
                      : "text-gray-900 hover:text-green-700"
                  }`}
                >
                  {name}
                </Link>
              ) : (
                <span
                  className="py-2 px-3 text-gray-400 cursor-not-allowed"
                  title="Inicia sesión para acceder"
                >
                  {name}
                </span>
              )}
            </li>
          ))}
        </ul>

        {/* Botón sesión escritorio */}
        <div className="hidden lg:flex items-center">
          {userInfo ? (
            <button
              onClick={logout}
              className="text-sm text-white bg-green-600 hover:bg-green-700 rounded-full px-3 py-1"
            >
              Cerrar sesión
            </button>
          ) : (
            <button
              onClick={login}
              className="text-sm text-white bg-green-600 hover:bg-green-700 rounded-full px-3 py-1"
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </div>

      {/* Menú móvil */}
      {isOpen && (
        <div className="lg:hidden px-6 sm:px-8 md:px-12 py-3 space-y-2">
          <ul className="flex flex-col space-y-2">
            {navItems.map(({ name, path, external }) => (
              <li key={path}>
                {external ? (
                  <a
                    href={path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-gray-900 hover:text-green-700"
                  >
                    {name}
                  </a>
                ) : token || path === "/" ? (
                  <Link
                    href={path}
                    className={`block ${
                      pathname === path
                        ? "text-green-700 font-semibold"
                        : "text-gray-900 hover:text-green-700"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {name}
                  </Link>
                ) : (
                  <span
                    className="block text-gray-400 cursor-not-allowed"
                    title="Inicia sesión para acceder"
                  >
                    {name}
                  </span>
                )}
              </li>
            ))}
          </ul>

          {/* Botón sesión móvil */}
          <div className="mt-3">
            {userInfo ? (
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="text-sm text-white bg-green-600 hover:bg-green-700 rounded-full px-3 py-1"
              >
                Cerrar sesión
              </button>
            ) : (
              <button
                onClick={() => {
                  login();
                  setIsOpen(false);
                }}
                className="text-sm text-white bg-green-600 hover:bg-green-700 rounded-full px-3 py-1"
              >
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
