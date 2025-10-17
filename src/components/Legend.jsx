"use client";

export default function RiskLegend({ enterpriseRisk = false, nationalRisk = false }) {
  const RISK_LEVELS = [
    { label: "Sin alerta", color: "bg-green-600" },
    { label: "Con alerta", color: "bg-red-600" },
  ];

  const ENTERPRISE_TYPES = [
    { label: "Finca", src: "/finca.png" },
    { label: "Centro de acopio", src: "/acopio.png" },
    { label: "Planta de beneficio", src: "/planta.png" },
    { label: "Feria ganadera", src: "/feria.png" },
    { label: "Empresa", src: "/empresa.png" },
  ];

  // Si es enterpriseRisk, filtramos para quitar “Finca”
  const filteredTypes = enterpriseRisk
    ? ENTERPRISE_TYPES.filter((item) => item.label !== "Finca")
    : ENTERPRISE_TYPES;

  return (
    <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-3">
      {/* Leyenda de Niveles de Riesgo (solo si NO es enterpriseRisk) */}
      {!enterpriseRisk && (
        <div className="bg-custom rounded-xl shadow-lg border border-gray-200/50 px-4 py-3 backdrop-blur-sm space-y-1">
          <div className="flex items-center gap-2 text-sm text-custom-dark mb-2">
            <b>Tipo de alerta</b>
          </div>
          {RISK_LEVELS.map((risk) => (
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
      )}

      {/* Leyenda de Tipos de Empresa (solo si NO es nationalRisk) */}
      {!nationalRisk && (
        <div className="bg-custom rounded-xl shadow-lg border border-gray-200/50 px-4 py-3 backdrop-blur-sm space-y-1">
          <div className="flex items-center gap-2 text-sm text-custom-dark mb-2">
            <b>Tipo</b>
          </div>
          {filteredTypes.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 text-sm text-custom-dark px-1 py-1"
            >
              <img
                src={item.src}
                alt={item.label}
                width={20}
                height={20}
                className="shrink-0 rounded"
              />
              <span className="font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}