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
  <div className="relative w-full flex items-center justify-between px-6 sm:px-8 md:px-12 lg:px-20 py-2">
    
    {/* Logo a la izquierda */}
    <div className="flex-shrink-0">
      <Link href="/" className="text-xl font-semibold text-black py-2 leading-none">
        Ganabosques
      </Link>
    </div>

    {/* Menú centrado */}
    <div className="absolute left-1/2 transform -translate-x-1/2">
      <ul className="font-medium flex space-x-6 lg:space-x-8 items-center">
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
      </ul>
    </div>

    {/* Usuario / Login a la derecha */}
    <div className="flex items-center">
      {userInfo ? (
        <button
          onClick={logout}
          className="text-sm text-white bg-green-600 hover:bg-green-700 rounded-full px-3 py-1 cursor-pointer"
        >
          Cerrar sesión
        </button>
      ) : (
        <button
          onClick={login}
          className="text-sm text-white bg-green-600 hover:bg-green-700 rounded-full px-3 py-1 cursor-pointer"
        >
          Iniciar sesión
        </button>
      )}
    </div>
  </div>
</nav>

  );
}
