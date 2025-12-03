// components/Adm3HistoricalRisk.jsx
"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Building2,
  Map as MapIcon,
  Trees,
  Home,
  Calendar,
} from "lucide-react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

// Paleta
const COLOR_TRUE = "#D50000"; // Con Alerta
const COLOR_FALSE = "#00C853"; // Sin Alerta

function riskBadgeBool(isRisk) {
  return isRisk
    ? {
        label: "Con Alerta",
        color: COLOR_TRUE,
        desc: "Se han presentado alertas para este período.",
      }
    : {
        label: "Sin Alerta",
        color: COLOR_FALSE,
        desc: "No se han presentado alertas para este período.",
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

// Normaliza "2020-01-01T..." | "2020" | 2020 -> 2020
function toYear(val) {
  if (val == null) return null;
  if (typeof val === "number" && Number.isFinite(val)) return val;
  const s = String(val);
  const m = s.match(/^(\d{4})/);
  if (m) return parseInt(m[1], 10);
  return isoToYear(s);
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

// Solo construye puntos/filas: asumimos que items ya vienen ordenados
function normalizeBubbleSeries(items = []) {
  const rows = (items || []).map((it) => ({
    label: buildLabelFromPeriod(it),
    isRisk: Boolean(it?.risk_total),
    raw: it,
  }));

  const points = rows.map((r) => ({
    x: r.label,
    y: 1,
    z: 28,
    fillColor: r.isRisk ? COLOR_TRUE : COLOR_FALSE,
    isRisk: r.isRisk,
  }));

  return { points, rows };
}

/* ========= Helpers para las barras ========= */
function formatNumber(val) {
  if (typeof val !== "number") return val;
  try {
    return val.toLocaleString("es-CO");
  } catch {
    return String(val);
  }
}

// Construye categorías y una serie desde items, filtrando valores 0
function buildBarFromItems(
  items = [],
  valueKey = "value",
  seriesName = "Total",
  { round1Decimal = false } = {}
) {
  const cleaned = (items || []).filter((it) => {
    const v = Number(it?.[valueKey] ?? 0);
    return Number.isFinite(v) && v > 0; // excluye 0 y no numéricos
  });

  const categories = cleaned.map((it) => buildLabelFromPeriod(it));
  const values = cleaned.map((it) => {
    let v = Number(it?.[valueKey] ?? 0);
    if (round1Decimal) v = Math.round(v * 10) / 10;
    return v;
  });

  return {
    categories,
    series: [{ name: seriesName, data: values }],
  };
}

function baseBarOptions({ title, categories, yTitle, yFormatter }) {
  return {
    chart: { type: "bar", toolbar: { show: false }, parentHeightOffset: 0 },
    title: { text: title, style: { fontWeight: 600 } },
    xaxis: { categories, title: { text: "Período" }, labels: { rotate: -30 } },
    yaxis: { title: { text: yTitle } },
    dataLabels: { enabled: false },
    grid: { strokeDashArray: 4 },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "30%" } },
    tooltip: {
      y: {
        formatter: (val) =>
          typeof yFormatter === "function"
            ? yFormatter(val)
            : formatNumber(val),
      },
    },
  };
}

export default function Adm3HistoricalRisk({
  adm3RiskHistory = [],
  className = "",
  yearStart,
  yearEnd,
}) {
  const filterStartYear = toYear(yearStart);
  const filterEndYear = toYear(yearEnd);

  if (!Array.isArray(adm3RiskHistory) || adm3RiskHistory.length === 0) {
    return <p className="text-sm text-gray-500"></p>;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {adm3RiskHistory.map((group, idx) => {
        const itemsRaw = Array.isArray(group?.items) ? group.items : [];
        const items = [...itemsRaw].sort(
          (a, b) => sortKeyFromPeriod(a) - sortKeyFromPeriod(b)
        );

        const { points, rows } = normalizeBubbleSeries(items);

        const title =
          group?.name ||
          (group?.municipality
            ? `Vereda de ${group.municipality}`
            : group?.adm3_id);

        let selectedRow = null;
        if (filterStartYear != null && filterEndYear != null) {
          selectedRow =
            rows.find((r) => {
              const ys = isoToYear(r?.raw?.period_start);
              const ye = isoToYear(r?.raw?.period_end);
              return ys === filterStartYear && ye === filterEndYear;
            }) || null;
        }

        const selectedItem = selectedRow?.raw ?? null;
        const hasMatch = Boolean(selectedItem);

        const selYs = selectedItem
          ? isoToYear(selectedItem?.period_start)
          : filterStartYear;
        const selYe = selectedItem
          ? isoToYear(selectedItem?.period_end)
          : filterEndYear;

        const selectedPeriodLabel =
          selYs && selYe
            ? `${selYs} - ${selYe}`
            : selYs
            ? `${selYs}`
            : selYe
            ? `${selYe}`
            : "—";

        const statusBadge = hasMatch
          ? riskBadgeBool(Boolean(selectedItem?.risk_total))
          : riskBadgeBool(false);

        const options = {
          chart: {
            type: "bubble",
            toolbar: { show: false },
            parentHeightOffset: 0,
            animations: { enabled: true },
          },
          grid: { strokeDashArray: 3, padding: { left: 0, right: 0 } },
          dataLabels: { enabled: false },
          xaxis: {
            type: "category",
            labels: { rotate: -45 },
            tickPlacement: "between",
          },
          yaxis: {
            min: 0,
            max: 2,
            tickAmount: 2,
            labels: { show: false },
            axisBorder: { show: false },
            axisTicks: { show: false },
          },
          legend: { show: false },
          tooltip: {
            custom: ({ dataPointIndex, seriesIndex, w }) => {
              const point =
                w.config.series?.[seriesIndex]?.data?.[dataPointIndex];
              if (!point) return "";
              const { x, isRisk } = point;
              const msg = isRisk
                ? "Se han presentado alertas para este período."
                : "No se han presentado alertas para este período.";
              return `
                <div style="padding:8px 10px">
                  <div style="font-weight:600;margin-bottom:4px">Período: ${x}</div>
                  <div style="font-size:12px;opacity:.9">${msg}</div>
                </div>
              `;
            },
          },
          plotOptions: {
            bubble: { minBubbleRadius: 8, maxBubbleRadius: 28 },
          },
          colors: [COLOR_FALSE, COLOR_TRUE],
        };

        const series = [{ name: "Alerta", data: points }];

        const { categories: defoCats, series: defoSeries } = buildBarFromItems(
          items,
          "def_ha",
          "Hectáreas",
          { round1Decimal: true }
        );

        const defoOptions = baseBarOptions({
          categories: defoCats,
          yTitle: "Hectáreas",
          yFormatter: (val) =>
            typeof val === "number"
              ? val.toLocaleString("es-CO", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })
              : val,
        });

        const { categories: farmCats, series: farmSeries } = buildBarFromItems(
          items,
          "farm_amount",
          "Fincas"
        );

        const farmOptions = baseBarOptions({
          categories: farmCats,
          yTitle: "Número de predios",
        });
        // ===============================================================

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
                  <MapIcon className="h-5 w-5 text-gray-500 mt-0.5" />
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
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-xs uppercase text-gray-500">
                      Vereda
                    </div>
                    <div className="font-medium">{group.name || "—"}</div>
                  </div>
                </div>

                {/* Periodo + Estado */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <div className="text-xs uppercase text-gray-500">
                      Periodo seleccionado
                    </div>
                    <div className="font-medium text-gray-800">
                      {selectedPeriodLabel}{" "}
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 w-fit"
                        style={{
                          backgroundColor: statusBadge.color,
                          color: badgeTextColor(statusBadge.color),
                        }}
                        title={statusBadge.desc}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Área deforestada */}
                <div className="flex items-start gap-3">
                  <Trees className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-xs uppercase text-gray-500">
                      Área deforestada por predios
                    </div>
                    <div className="font-medium">
                      {hasMatch && selectedItem?.def_ha != null
                        ? `${(
                            Math.round(Number(selectedItem.def_ha) * 10) / 10
                          ).toLocaleString("es-CO", {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })} ha`
                        : "0 ha"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Home className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-xs uppercase text-gray-500">
                      Predios con alertas
                    </div>
                    <div className="font-medium">
                      {hasMatch && selectedItem?.farm_amount != null
                        ? `${Number(selectedItem.farm_amount).toLocaleString(
                            "es-CO"
                          )} Predios`
                        : "0 predios"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div
                className="hidden md:block bg-gray-200 md:self-stretch"
                style={{ width: 1 }}
              />

              {/* Derecha: burbuja + barras */}
              <div className="md:pl-4 md:min-w-0 space-y-6">
                {/* Burbuja */}
                <div className="w-full">
                  <h2 style={{ fontSize: "18px", fontWeight: 600 }}>
                    Alertas históricas
                  </h2>
                  <p className="mt-4 text-sm text-gray-600 leading-relaxed px-4">
                    Visualiza la tendencia de alertas a lo largo del tiempo.
                    Cada punto representa un periodo de análisis; el color verde
                    indica ausencia de alertas, mientras que los rojos señalarán
                    posibles alertas.
                  </p>
                  <ReactApexChart
                    options={options}
                    series={series}
                    type="bubble"
                    height="100%"
                  />
                </div>

                {/* Barra 1: hectáreas */}
                <div className="w-full">
                  {defoSeries?.[0]?.data?.length ? (
                    <div>
                      <h2 style={{ fontSize: "18px", fontWeight: 600 }}>
                        Hectáreas deforestadas
                      </h2>
                      <p className="mt-4 text-sm text-gray-600 leading-relaxed px-4">
                        Este gráfico muestra la evolución de la deforestación en
                        el territorio a lo largo del tiempo relacionado con la
                        cadena productiva. Cada barra representa el total de
                        hectáreas afectadas en el periodo indicado.
                      </p>
                      <ReactApexChart
                        options={defoOptions}
                        series={defoSeries}
                        type="bar"
                        height={260}
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Sin datos de hectáreas deforestadas.
                    </div>
                  )}
                </div>

                {/* Barra 2: predios */}
                <div className="w-full">
                  {farmSeries?.[0]?.data?.length ? (
                    <div>
                      <h2 style={{ fontSize: "18px", fontWeight: 600 }}>
                        Cantidad de predios con alertas
                      </h2>
                      <p className="mt-4 text-sm text-gray-600 leading-relaxed px-4">
                        Este gráfico muestra el número de predios donde se han
                        identificado alertas durante los periodos analizados,
                        dichas alertas pueden ser directas o indirectas. Cada
                        barra representa un período de tiempo con registros de
                        alerta.
                      </p>
                      <ReactApexChart
                        options={farmOptions}
                        series={farmSeries}
                        type="bar"
                        height={260}
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Sin datos de predios.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
