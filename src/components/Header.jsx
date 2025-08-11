"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
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
    external: true, // <- Indica que es un enlace externo
  },
  { name: "Acerca de", path: "/acercade" },
];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between px-6 sm:px-8 md:px-12 lg:px-20 py-2">
        <Link href="/" className="text-xl font-semibold text-black">
          Ganabosques
        </Link>

        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-600 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-controls="navbar-default"
          aria-expanded={isOpen}
        >
          <span className="sr-only">Open main menu</span>
          <svg
            className="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 17 14"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M1 1h15M1 7h15M1 13h15"
            />
          </svg>
        </button>

        <div
          className={`${isOpen ? "block" : "hidden"} w-full md:block md:w-auto`}
          id="navbar-default"
        >
          <ul className="font-medium flex flex-col md:flex-row md:space-x-6 lg:space-x-8 mt-4 md:mt-0 items-center">
            {navItems.map(({ name, path, external }) => (
  <li key={path}>
    {external ? (
      <a
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        className="block py-2 px-3 rounded md:p-0 text-gray-900 hover:text-green-700"
      >
        {name}
      </a>
    ) : token || path === "/" ? (
      <Link
        href={path}
        className={`block py-2 px-3 rounded md:p-0 ${
          pathname === path
            ? "text-green-700 font-semibold"
            : "text-gray-900 hover:text-green-700"
        }`}
      >
        {name}
      </Link>
    ) : (
      <span
        className="block py-2 px-3 rounded md:p-0 text-gray-400 cursor-not-allowed"
        title="Inicia sesión para acceder"
      >
        {name}
      </span>
    )}
  </li>
))}


            <li className="mt-2 md:mt-0 relative" ref={dropdownRef}>
              {userInfo ? (
                <div>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-9 h-9 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold hover:bg-green-700 cursor-pointer focus:outline-none"
                  >
                    {userInfo.preferred_username?.charAt(0).toUpperCase() ||
                      "U"}
                  </button>

                  {dropdownOpen && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-36 bg-white border border-gray-200 rounded shadow-md z-50">
                      <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={login}
                  className="text-sm text-white bg-green-600 hover:bg-green-700 rounded-full px-3 py-1 cursor-pointer"
                >
                  Iniciar sesión
                </button>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
