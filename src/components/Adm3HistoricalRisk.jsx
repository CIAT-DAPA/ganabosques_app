// components/Adm3HistoricalRisk.jsx
"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Building2,
  Map as MapIcon,
  Activity,
  Trees,
  Home,
} from "lucide-react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

function riskBadge(risk) {
  if (risk > 2.5)
    return {
      label: "Riesgo alto",
      color: "#D50000",
      desc: "Riesgo alto de deforestación. Se requiere atención inmediata.",
    };
  if (risk > 1.5)
    return {
      label: "Riesgo medio",
      color: "#FF6D00",
      desc: "Riesgo medio. Se requiere acción oportuna con mitigación y control.",
    };
  if (risk > 0)
    return {
      label: "Riesgo bajo",
      color: "#FFD600",
      desc: "Riesgo bajo. Se recomienda monitoreo.",
    };
  return {
    label: "Sin riesgo",
    color: "#00C853",
    desc: "No se han identificado riesgos en esta zona.",
  };
}

function normalizeSeries(items = []) {
  const rows = (items || []).map((it) => {
    const ys = Number.isFinite(+it.year_start) ? +it.year_start : null;
    const ye = Number.isFinite(+it.year_end) ? +it.year_end : null;

    const label =
      ys != null && ye != null
        ? `${ys} - ${ye}`
        : ys != null
        ? String(ys)
        : ye != null
        ? String(ye)
        : "—";

    const risk =
      typeof it.risk_total === "number" && !Number.isNaN(it.risk_total)
        ? it.risk_total
        : 0;

    // Usamos el inicio (o fin) para ordenar
    const sortKey = ys != null ? ys : ye != null ? ye : 0;

    return { label, risk, sortKey, _id: it._id };
  });

  rows.sort((a, b) => a.sortKey - b.sortKey);

  return {
    categories: rows.map((r) => r.label),
    data: rows.map((r) => r.risk),
  };
}

function getBarColors(values = []) {
  return values.map((v) => riskBadge(v).color);
}

function badgeTextColor(hex) {
  if (!hex) return "#fff";
  return hex.toUpperCase() === "#FFD600" ? "#111827" : "#ffffff";
}

export default function Adm3HistoricalRisk({
  adm3RiskHistory = [],
  className = "",
}) {
  if (!Array.isArray(adm3RiskHistory) || adm3RiskHistory.length === 0) {
    return <p className="text-sm text-gray-500"></p>;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {adm3RiskHistory.map((group, idx) => {
        const { categories, data } = normalizeSeries(group.items || []);
        const barColors = getBarColors(data);

        const title =
          group?.name ||
          (group?.municipality
            ? `Vereda de ${group.municipality}`
            : group?.adm3_id);
        const lastRisk = data.length > 0 ? data[data.length - 1] : 0;
        const lastBadge = riskBadge(lastRisk);
        const lastTextColor = badgeTextColor(lastBadge.color);
        const lastItem =
          group.items && group.items.length > 0
            ? group.items[group.items.length - 1]
            : null;

        const options = {
          chart: {
            type: "bar",
            toolbar: { show: false },
            parentHeightOffset: 0,
          },
          title: {
            text: "Riesgos históricos",
            align: "left",
            offsetY: 6,
            style: { fontSize: "18px", fontWeight: 600 },
          },
          grid: { strokeDashArray: 3, padding: { left: 0, right: 0 } },
          plotOptions: { bar: { borderRadius: 6, columnWidth: "25%" } },
          dataLabels: {
            enabled: true,
            formatter: (val) =>
              typeof val === "number" ? val.toFixed(3) : val,
            offsetY: -12,
            style: { fontSize: "11px" },
          },
          xaxis: {
            categories,
            labels: { rotate: -45 },
          },
          yaxis: {
            title: { text: "Riesgo" },
            min: 0,
            max: 3,
            tickAmount: 4,
            decimalsInFloat: 0,
            labels: {
              formatter: (val) =>
                typeof val === "number" ? Math.round(val) : val,
            },
          },
          tooltip: {
            y: {
              formatter: (val) =>
                typeof val === "number" ? val.toFixed(6) : val,
            },
            x: { formatter: (val) => `Año: ${val}` },
          },
          colors: barColors,
        };

        const series = [{ name: "Riesgo total", data }];

        return (
          <div
            key={group.adm3_id}
            className={`px-10 py-6 mb-6 border-b border-gray-400 ${
              idx === adm3RiskHistory.length - 1
                ? "last:border-b-0 last:mb-0 last:pb-0"
                : ""
            }`}
          >
            <h3 className="text-lg font-semibold mb-3">{title}</h3>

            <div className="grid grid-cols-1 md:grid-cols-[240px_1px_minmax(0,1fr)] gap-4 md:gap-0">
              {/* Izquierda */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-xs uppercase text-gray-500">
                      Departamento
                    </div>
                    <div className="font-medium">{group.department || "—"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-xs uppercase text-gray-500">
                      Municipio
                    </div>
                    <div className="font-medium">
                      {group.municipality || "—"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-xs uppercase text-gray-500">
                      Vereda
                    </div>
                    <div className="font-medium">{group.name || "—"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-xs uppercase text-gray-500">
                      Último riesgo total
                    </div>
                    <div
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: lastBadge.color,
                        color: lastTextColor,
                      }}
                      title={lastBadge.desc}
                    >
                      {lastBadge.label}
                      {typeof lastRisk === "number" && (
                        <span className="ml-2 opacity-90">
                          ({lastRisk.toFixed(3)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Trees className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-xs uppercase text-gray-500">
                      Área deforestada
                    </div>
                    <div className="font-medium">
                      {lastItem?.def_ha != null ? `${lastItem.def_ha} ha` : "—"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Home className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-xs uppercase text-gray-500">
                      Cantidad de fincas
                    </div>
                    <div className="font-medium">
                      {lastItem?.farm_amount != null
                        ? `${lastItem.farm_amount} Fincas`
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div
                className="hidden md:block bg-gray-200 md:self-stretch"
                style={{ width: 1 }}
              />

              {/* Derecha */}
              <div className="md:pl-4 md:min-w-0">
                <div className="w-full" style={{ height: 260 }}>
                  <ReactApexChart
                    options={options}
                    series={series}
                    type="bar"
                    height="100%"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
