"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";

export default function RiskLegend({
  enterpriseRisk = false,
  farmRisk = false,
}) {
  const riskLevels = [
    { label: "Sin Riesgo", color: "bg-green-600" },
    { label: "Riesgo Bajo", color: "bg-yellow-400" },
    { label: "Riesgo Medio", color: "bg-orange-400" },
    { label: "Riesgo Alto", color: "bg-red-600" },
  ];

  const mobilityTypes = [
    { label: "Movilización de Entrada", color: "text-[#8B4513]" },
    { label: "Movilización de Salida", color: "text-[#6B21A8]" },
    { label: "Movilización Mixta", color: "text-[#e91e63]" },
  ];

  return (
    <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-3">
      {/* Leyenda de Niveles de Riesgo */}
      <div className="bg-custom rounded-xl shadow-lg border border-gray-200/50 px-4 py-3 backdrop-blur-sm space-y-1">
        <div className="flex items-center gap-2 text-sm text-custom-dark mb-2">
          <b>Nivel de riesgo</b>
        </div>
        {riskLevels.map((risk) => (
          <div
            key={risk.label}
            className="flex items-center gap-3 text-sm text-custom-dark px-1 py-1"
          >
            <span
              className={`w-4 h-4 rounded-full ${risk.color} shadow-sm border border-white/20`}
            ></span>
            <span className="font-medium">{risk.label}</span>
          </div>
        ))}
      </div>

      {/* Leyenda de Proveedores */}
      {enterpriseRisk && (
        <div className="bg-custom rounded-xl shadow-lg border border-gray-200/50 px-4 py-2 backdrop-blur-sm text-sm text-custom-dark flex items-center gap-3 transition-all duration-200 hover:bg-gray-50/50">
          <svg
            className="w-5 h-5 text-orange-500 drop-shadow-sm"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            />
            <circle cx="12" cy="9" r="2.5" fill="currentColor" />
          </svg>
          <span className="font-medium">Proveedor</span>
        </div>
      )}

      {/* Leyenda de Tipos de Movilización */}
      {farmRisk && (
        <div className="bg-custom rounded-xl shadow-lg border border-gray-200/50 px-4 py-3 backdrop-blur-sm space-y-1">
          <div className="flex items-center gap-2 text-sm text-custom-dark mb-2">
            <b>Tipo de relación</b>
          </div>
          {mobilityTypes.map((mobility) => (
            <div
              key={mobility.label}
              className="flex items-center gap-3 text-sm text-custom-dark px-1 py-1"
            >
              <FontAwesomeIcon
                icon={faLocationDot}
                className={`${mobility.color} drop-shadow-sm`}
                size="lg"
              />
              <span className="font-medium">{mobility.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
