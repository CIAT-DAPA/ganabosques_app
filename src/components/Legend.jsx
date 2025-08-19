'use client';

export default function RiskLegend({ enterpriseRisk = false, farmRisk = false }) {
  const riskLevels = [
    { label: 'Sin Riesgo', color: 'bg-green-600' },
    { label: 'Riesgo Bajo', color: 'bg-yellow-400' },
    { label: 'Riesgo Medio', color: 'bg-orange-400' },
    { label: 'Riesgo Alto', color: 'bg-red-600' }
  ];

  const mobilityTypes = [
  { label: 'Movilización de Entrada', color: '#8B4513' }, // café oscuro
  { label: 'Movilización de Salida', color: '#6B21A8' }, // morado fuerte
  { label: 'Movilización Mixta', color: '#e91e63' }, // amarillo fuerte
];


  return (
    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">

      <div className="bg-white rounded-xl shadow-md px-4 py-3 space-y-2">
        <div key={"lblRisk"} className="flex items-center gap-2 text-sm text-gray-800">
            <b>Nivel de riesgo</b>
        </div>
        {riskLevels.map((risk) => (
          <div key={risk.label} className="flex items-center gap-2 text-sm text-gray-800">
            <span className={`w-3 h-3 rounded-full ${risk.color}`}></span>
            {risk.label}
          </div>
        ))}
      </div>

      {enterpriseRisk && (
        <div className="bg-white rounded-xl shadow-md px-4 py-2 text-sm text-gray-800 flex items-center gap-2">
          <svg className={`w-4 h-4 text-orange-500`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" fill="currentColor" />
              </svg>
              Provedor
        </div>
      )}

      {farmRisk && (
  <div className="bg-white rounded-xl shadow-md px-4 py-3 space-y-2">
    <div key={"lblRelations"} className="flex items-center gap-2 text-sm text-gray-800">
            <b>Tipo de relación</b>
        </div>
    {mobilityTypes.map((mob) => (
      <div key={mob.label} className="flex items-center gap-2 text-sm text-gray-800">
        <span
          className="w-3 h-3 rounded-full inline-block"
          style={{ backgroundColor: mob.color }}
        ></span>
        {mob.label}
      </div>
    ))}
  </div>
)}



    </div>
  );
}
