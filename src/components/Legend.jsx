"use client";

export default function RiskLegend() {
  const ENTERPRISE_TYPES = [
    { label: "Finca", src: "/finca.png" },
    { label: "Centro de acopio", src: "/acopio.png" },
    { label: "Planta de beneficio", src: "/planta.png" },
    { label: "Feria ganadera", src: "/feria.png" }, // (antes escribiste "fria", asumo es "feria")
  ];

  return (
    <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-3">
      <div className="bg-custom rounded-xl shadow-lg border border-gray-200/50 px-4 py-3 backdrop-blur-sm space-y-1">
        <div className="flex items-center gap-2 text-sm text-custom-dark mb-2">
          <b>Tipo</b>
        </div>

        {ENTERPRISE_TYPES.map((item) => (
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
    </div>
  );
}