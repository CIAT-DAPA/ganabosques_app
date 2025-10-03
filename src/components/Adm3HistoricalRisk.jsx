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

// Paleta para booleano
const COLOR_TRUE = "#D50000";  
const COLOR_FALSE = "#00C853"; 

function riskBadgeBool(isRisk) {
  return isRisk
    ? {
        label: "Con Alerta",
        color: COLOR_TRUE,
        desc: "Existe alertas de deforestación en este período.",
      }
    : {
        label: "Sin Alerta",
        color: COLOR_FALSE,
        desc: "No se han identificado alertas en este período.",
      };
}

function badgeTextColor(hex) {
  if (!hex) return "#fff";
  return hex.toUpperCase() === "#FFD600" ? "#111827" : "#ffffff";
}

function isoToYear(iso) {
  if (!iso) return null;
  const s = String(iso);

  const hasTZ = /[zZ]|[+\-]\d{2}:?\d{2}$/.test(s);

  const d = new Date(s);
  const y = hasTZ ? d.getUTCFullYear() : d.getFullYear();
  return Number.isFinite(y) ? y : null;
}

function buildLabelFromPeriod(it) {
  const ys = isoToYear(it?.period_start);
  const ye = isoToYear(it?.period_end);
  if (ys != null && ye != null) return `${ys} - ${ye}`;
  if (ys != null) return String(ys);
  if (ye != null) return String(ye);
  return "—";
}

function sortKeyFromPeriod(it) {
  const ys = isoToYear(it?.period_start);
  const ye = isoToYear(it?.period_end);
  return ys != null ? ys : ye != null ? ye : 0;
}

function normalizeBubbleSeries(items = []) {
  const rows = (items || [])
    .map((it) => ({
      label: buildLabelFromPeriod(it),
      isRisk: Boolean(it?.risk_total),
      sortKey: sortKeyFromPeriod(it),
      raw: it,
    }))
    .sort((a, b) => a.sortKey - b.sortKey);

  const points = rows.map((r) => ({
    x: r.label,
    y: 1,         
    z: 28,        
    fillColor: r.isRisk ? COLOR_TRUE : COLOR_FALSE,
  }));

  return { points, rows };
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
        const { points, rows } = normalizeBubbleSeries(group.items || []);

        const title =
          group?.name ||
          (group?.municipality
            ? `Vereda de ${group.municipality}`
            : group?.adm3_id);

        // Último item (por orden temporal)
        const lastRow = rows.length > 0 ? rows[rows.length - 1] : null;
        const lastItem = lastRow?.raw ?? null;
        const lastIsRisk = Boolean(lastItem?.risk_total);
        const lastBadge = riskBadgeBool(lastIsRisk);
        const lastTextColor = badgeTextColor(lastBadge.color);

        const options = {
          chart: {
            type: "bubble",
            toolbar: { show: false },
            parentHeightOffset: 0,
            animations: { enabled: true },
          },
          title: {
            text: "Alertas históricas",
            align: "left",
            offsetY: 6,
            style: { fontSize: "18px", fontWeight: 600 },
          },
          grid: {
            strokeDashArray: 3,
            padding: { left: 0, right: 0 },
          },
          dataLabels: {
            enabled: false, // bubbles limpias
          },
          xaxis: {
            type: "category",
            labels: { rotate: -45 },
            tickPlacement: "between",
          },
          yaxis: {
            min: 0,
            max: 2,          // centra las burbujas en y=1
            tickAmount: 2,
            labels: {
              show: false,   // ocultamos para centrar visualmente
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
          },
          legend: { show: false },
          tooltip: {
            y: {
              formatter: () => "Centro",
            },
            x: {
              formatter: (val) => `Período: ${val}`,
            },
            custom: ({ dataPointIndex, seriesIndex, w }) => {
              const p =
                w.config.series?.[seriesIndex]?.data?.[dataPointIndex] || null;
              const r = rows?.[dataPointIndex] || null;
              const isRisk = r?.isRisk ?? false;
              const b = riskBadgeBool(isRisk);
              const defha =
                r?.raw?.def_ha != null ? `${r.raw.def_ha} ha` : "—";
              const farms =
                r?.raw?.farm_amount != null ? `${r.raw.farm_amount} fincas` : "—";

              return `
                <div style="padding:8px 10px">
                  <div style="font-weight:600;margin-bottom:4px">${p?.x ?? ""}</div>
                  <div style="display:inline-block;padding:2px 6px;border-radius:999px;background:${b.color};color:#fff;font-size:12px;margin-bottom:4px">
                    ${b.label}
                  </div>
                  <div style="font-size:12px;opacity:.9">${b.desc}</div>
                </div>
              `;
            },
          },
          plotOptions: {
            bubble: {
              minBubbleRadius: 8,
              maxBubbleRadius: 28, // ligado a z
            },
          },
          // Los colores de cada punto vienen por 'fillColor' en cada data point
          colors: [COLOR_FALSE, COLOR_TRUE],
        };

        // Una sola serie; cada punto trae su fillColor
        const series = [
          {
            name: "Alerta",
            data: points,
          },
        ];

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
                      Última alerta registrada
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
                    type="bubble"
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