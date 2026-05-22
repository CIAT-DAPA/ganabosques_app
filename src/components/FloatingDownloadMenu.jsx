"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronUp, Download, Loader2 } from "lucide-react";

/**
 * FloatingDownloadMenu - Componente de botón flotante con menú de opciones de descarga
 * 
 * Props:
 * - options: Array de objetos { label, icon, action }
 *   - label: string - Texto del botón
 *   - icon: ReactNode - Ícono (lucide-react)
 *   - action: function - Función a ejecutar al hacer clic
 * - position: string - Posición en la pantalla (bottom-right, bottom-left, top-right, top-left)
 * - disabled: boolean - Deshabilita el botón
 */
export default function FloatingDownloadMenu({ 
  options = [], 
  position = "bottom-right",
  disabled = false 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);

  // Cerrar menú si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Mapeo de posiciones
  const positionClasses = {
    "bottom-right": "bottom-8 right-8",
    "bottom-left": "bottom-8 left-8",
    "top-right": "top-8 right-8",
    "top-left": "top-8 left-8",
  };

  // Determinar dirección del menú según la posición
  const menuDirection = {
    "bottom-right": "bottom-full mb-3 right-0",
    "bottom-left": "bottom-full mb-3 left-0",
    "top-right": "top-full mt-3 right-0",
    "top-left": "top-full mt-3 left-0",
  };

  const handleOptionClick = async (action) => {
    try {
      setLoading(true);
      await action();
    } catch (error) {
      console.error("Error al ejecutar acción:", error);
      setLoading(false);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={menuRef}
      className={`fixed ${positionClasses[position]} z-40 flex flex-col items-end`}
    >
      {/* Menú de opciones */}
        <div
          className={`
            absolute ${menuDirection[position]}
            bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100
            origin-bottom-right
            transition-all duration-300 ease-out
            ${
              isOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 translate-y-2 pointer-events-none"
            }
          `}
        >
          {options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionClick(option.action)}
              className={`
                w-full px-4 py-3 text-left text-sm font-medium
                text-[#082C14] hover:bg-[#FCFFF5]
                transition-all duration-300
                flex items-center gap-3 whitespace-nowrap group
                ${
                  isOpen
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2"
                }
              `}
              style={{
                transitionDelay: `${idx * 50}ms`,
              }}
            >
              <span className="text-[#082C14] group-hover:text-[#00C853] transition-colors">
                {option.icon}
              </span>
              <span className="group-hover:text-[#00C853] transition-colors">
                {option.label}
              </span>
            </button>
          ))}
        </div>

      {/* Botón flotante principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || options.length === 0 || loading }
        className={`
          w-14 h-14 rounded-full shadow-lg hover:shadow-xl
          transition-all duration-200
          flex items-center justify-center
          bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-500
          ${disabled || options.length === 0
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-[#082C14] hover:bg-[#0b3b1b] text-white cursor-pointer"
          }
          group
        `}
        title="Descargar"
      >
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : isOpen ? (
          <ChevronUp className="w-6 h-6 transition-transform group-hover:scale-110" />
        ) : (
          <Download className="w-6 h-6 transition-transform group-hover:scale-110" />
        )}
      </button>
    </div>
  );
}
