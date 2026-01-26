// components/EnterpriseChart.jsx
"use client";

import React, { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import {
  Building2,
  Briefcase,
  Tag,
  AlertTriangle,
  MapIcon,
  Calendar,
  TrendingUp,
  ArrowRightLeft,
} from "lucide-react";

const COLOR_TRUE = "#D50000";   // rojo alerta
const COLOR_FALSE = "#00C853";  // verde sin alerta

// Colores para gráficos
const BASE_COLORS = [
  "#a3d977",
  "#7ab86b",
  "#568c5e",
  "#366f50",
  "#1f5043",
  "#e9a25f",
  "#de7c48",
  "#cc5a33",
  "#b3411f",
  "#993014",
];

// ================================
// 🔵 Traducción de tipos de empresa con alias
// ================================
const TYPE_ALIASES = {
  COLLECTIONCENTER: "COLLECTION_CENTER",
  "CENTRO_ACOPIO": "COLLECTION_CENTER",
  "CENTRO DE ACOPIO": "COLLECTION_CENTER",
  ACOPIO: "COLLECTION_CENTER",

  PLANTA: "SLAUGHTERHOUSE",

  FERIA: "CATTLE_FAIR",

  EMPRESA: "ENTERPRISE",

  FINCA: "FARM",
};

// Valor normalizado → texto en español
const ENTERPRISE_TYPES = {
  FARM: "Finca",
  COLLECTION_CENTER: "Centro de acopio",
  SLAUGHTERHOUSE: "Planta de beneficio",
  CATTLE_FAIR: "Feria ganadera",
  ENTERPRISE: "Empresa",
};

// Función traductora
function translateEnterpriseType(type) {
  if (!type) return "—";

  const raw = type.toString().trim().toUpperCase();
  const normalized = TYPE_ALIASES[raw] || raw;

  return ENTERPRISE_TYPES[normalized] || type;
}

// ================================
// 🧰 Utilidades
// ================================
function getExtCodeBySource(item, source = "SIT_CODE") {
  const arr = item?.ext_id || item?.extId || [];
  const found = Array.isArray(arr)
    ? arr.find((e) => e?.source === source || e?.label === source)
    : null;
  return found?.ext_code ?? null;
}

function getProducerId(item) {
  const arr = item?.ext_id || item?.extId || [];
  const found = Array.isArray(arr)
    ? arr.find((e) => e?.source === "PRODUCER_ID" || e?.label === "PRODUCER_ID")
    : null;
  return found?.ext_code ?? null;
}

function providerAlertFlags(provider = {}) {
  const r = provider?.risk || {};
  return {
    direct: r?.risk_direct === true,
    input: r?.risk_input === true,
    output: r?.risk_output === true,
    defHa: r?.deforestation?.ha ?? null,
  };
}

function hasAnyAlert(provider = {}) {
  const f = providerAlertFlags(provider);
  return f.direct || f.input || f.output;
}

function hasAnyAlertInArray(arr = []) {
  return (arr || []).some(hasAnyAlert);
}

function Badge({ active, className = "" }) {
  const color = active ? COLOR_TRUE : COLOR_FALSE;
  const label = active ? "Con Alerta" : "Sin Alerta";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: color, color: "#fff" }}
    >
      {label}
    </span>
  );
}

function CellChip({ active, title }) {
  const color = active ? COLOR_TRUE : COLOR_FALSE;
  const label = active ? "Con alerta" : "Sin alerta";
  return (
    <span
      title={title}
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color, color: "#fff", whiteSpace: "nowrap" }}
    >
      {label}
    </span>
  );
}

function fmtHa(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  return n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2);
}

function formatValue(value, decimals = 2) {
  return (value || 0).toFixed(decimals);
}

// Mapeo para traducir tipos de destino del API a español
const DESTINATION_TYPE_LABELS = {
  SLAUGHTERHOUSE: "Planta de beneficio",
  COLLECTION_CENTER: "Centro de acopio",
  CATTLE_FAIR: "Feria ganadera",
  ENTERPRISE: "Empresa",
  FARM: "Finca",
  // Aliases
  COLLECTIONCENTER: "Centro de acopio",
  CENTRO_ACOPIO: "Centro de acopio",
  ACOPIO: "Centro de acopio",
  PLANTA: "Planta de beneficio",
  FERIA: "Feria ganadera",
  EMPRESA: "Empresa",
  FINCA: "Finca",
};

function translateDestinationType(type) {
  if (!type) return "Otro";
  const normalized = String(type).trim().toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");
  return DESTINATION_TYPE_LABELS[normalized] || type;
}

// ================================
// 🔵 Componente de Tabs
// ================================
function TabButton({ active, onClick, children, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-[#082C14] text-[#082C14]"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

// ================================
// 🔵 Componente de Movilizaciones
// ================================
function MovementSection({ movementStats, enterpriseId }) {
  const data = movementStats?.[enterpriseId];
  
  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay datos de movilizaciones disponibles
      </div>
    );
  }

  const { summary, inputs, outputs } = data;

  // Construir datos para gráficos
  const buildChartData = (speciesData, title) => {
    const aggregated = {};
    const addToAgg = (label, value) => {
      const v = Number.isFinite(value) ? value : 0;
      aggregated[label] = (aggregated[label] || 0) + v;
    };

    if (!speciesData) {
      return { options: {}, series: [{ name: title, data: [] }] };
    }

    if (typeof speciesData === "object" && !Array.isArray(speciesData)) {
      for (const [group, sub] of Object.entries(speciesData)) {
        if (typeof sub === "number") {
          addToAgg(group, sub);
          continue;
        }
        if (!sub || typeof sub !== "object") continue;

        for (const [subcat, values] of Object.entries(sub)) {
          if (!values || typeof values !== "object") continue;
          const v =
            (typeof values.headcount === "number" && values.headcount) ??
            (typeof values.amount === "number" && values.amount) ??
            (typeof values.total === "number" && values.total) ??
            0;
          addToAgg(String(subcat), v);
        }
      }
    }

    const categories = Object.keys(aggregated);
    const series = [
      { name: title, data: categories.map((label) => aggregated[label]) },
    ];

    const options = {
      chart: {
        type: "bar",
        height: 250,
        toolbar: { show: false },
        background: "transparent",
      },
      title: { text: "" },
      xaxis: {
        categories,
        labels: { show: false, style: { colors: "#082C14" } },
        axisTicks: { show: false },
        axisBorder: { show: false },
      },
      yaxis: { labels: { style: { colors: "#082C14" } } },
      colors: categories.map((_, i) => BASE_COLORS[i % BASE_COLORS.length]),
      legend: { show: true, labels: { colors: "#082C14" } },
      plotOptions: {
        bar: { distributed: true, borderRadius: 4, horizontal: false },
      },
      dataLabels: { enabled: false },
      tooltip: { x: { show: true }, theme: "light" },
      grid: { borderColor: "#f1f1f1", strokeDashArray: 3 },
    };

    return { options, series };
  };

  const inputChart = buildChartData(inputs?.statistics?.species, "Entradas");
  const outputChart = buildChartData(outputs?.statistics?.species, "Salidas");
  
  const hasInputData = inputChart?.series[0]?.data?.some((d) => d > 0);
  const hasOutputData = outputChart?.series[0]?.data?.some((d) => d > 0);

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Resumen de Movilizaciones
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#082C14]">{summary?.total_movements || 0}</div>
            <div className="text-xs text-gray-500">Total Movimientos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary?.inputs?.count || 0}</div>
            <div className="text-xs text-gray-500">Entradas ({formatValue(summary?.inputs?.percentage || 0)}%)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary?.outputs?.count || 0}</div>
            <div className="text-xs text-gray-500">Salidas ({formatValue(summary?.outputs?.percentage || 0)}%)</div>
          </div>
        </div>

        {/* Desglose por tipo de destino */}
        {summary?.outputs?.by_destination_type && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-600 mb-2">Salidas por tipo de destino:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.outputs.by_destination_type).map(([type, data]) => (
                <span key={type} className="inline-flex items-center px-2 py-1 bg-white rounded-md text-xs border border-gray-200">
                  <span className="font-medium">{translateDestinationType(type)}: </span>
                  <span className="ml-1">{data.count} ({formatValue(data.percentage_of_total)}%)</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Entradas */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Movilización de entrada</h4>
          <p className="text-xs text-gray-500">Ingresos a la empresa por categorías</p>
          {hasInputData ? (
            <Chart
              options={inputChart.options}
              series={inputChart.series}
              type="bar"
              height={250}
            />
          ) : (
            <div className="h-[250px] flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">No hay datos de entradas</p>
            </div>
          )}
        </div>

        {/* Salidas */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Movilización de salida</h4>
          <p className="text-xs text-gray-500">Salidas de la empresa por categorías</p>
          {hasOutputData ? (
            <Chart
              options={outputChart.options}
              series={outputChart.series}
              type="bar"
              height={250}
            />
          ) : (
            <div className="h-[250px] flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">No hay datos de salidas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ================================
// 🟢 Componente principal
// ================================
export default function EnterpriseChart({
  yearStart,
  yearEnd,
  enterpriseDetails = [],
  movementStats = {},
}) {
  const [activeTab, setActiveTab] = useState("alertas");

  if (!enterpriseDetails || enterpriseDetails.length === 0)
    return <p className="text-sm text-gray-500"></p>;

  const ent = enterpriseDetails[0];
  const enterpriseId = ent?._id || ent?.id;
  const department = ent?.adm1?.name || "—";
  const municipality = ent?.adm2?.name || "—";
  const enterpriseName = ent?.name || "—";

  // Traducción correcta del tipo
  const rawType = ent?.type_enterprise || ent?.type || null;
  const enterpriseType = translateEnterpriseType(rawType);

  const inputs = ent?.providers?.inputs ?? [];
  const outputs = ent?.providers?.outputs ?? [];

  const inputAlert = hasAnyAlertInArray(inputs);
  const outputAlert = hasAnyAlertInArray(outputs);

  const inputsRows = useMemo(
    () =>
      (inputs || []).map((p) => ({
        scope: "entrada",
        sit: getExtCodeBySource(p, "SIT_CODE"),
        producerId: getProducerId(p),
        ...providerAlertFlags(p),
        _id: p?._id,
      })),
    [inputs]
  );

  const outputsRows = useMemo(
    () =>
      (outputs || []).map((p) => ({
        scope: "salida",
        sit: getExtCodeBySource(p, "SIT_CODE"),
        producerId: getProducerId(p),
        ...providerAlertFlags(p),
        _id: p?._id,
      })),
    [outputs]
  );

  const Table = ({ title, rows }) => (
    <section>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold text-gray-700">Predio</th>
              <th className="px-3 py-2 font-semibold text-gray-700">Alerta directa</th>
              <th className="px-3 py-2 font-semibold text-gray-700">Alerta de entrada</th>
              <th className="px-3 py-2 font-semibold text-gray-700">Alerta de salida</th>
              <th className="px-3 py-2 font-semibold text-gray-700">Área deforestada (ha)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-3 text-gray-500">
                  No hay predios para mostrar.
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => {
                const hasSit = !!r.sit;
                const hasProd = !!r.producerId;
                return (
                  <tr key={r._id || `${r.sit || "S"}-${idx}`}>
                    <td className="px-3 py-2">
                      {(hasSit || hasProd) && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {hasSit && (
                            <>
                              <span className="font-semibold">SIT:</span> {r.sit}
                            </>
                          )}
                          {hasSit && hasProd && <span>, </span>}
                          {hasProd && (
                            <>
                              <span className="font-semibold">PRODUCER_ID:</span> {r.producerId}
                            </>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2"><CellChip active={r.direct} title="Alerta directa" /></td>
                    <td className="px-3 py-2"><CellChip active={r.input} title="Alerta de entrada" /></td>
                    <td className="px-3 py-2"><CellChip active={r.output} title="Alerta de salida" /></td>
                    <td className="px-3 py-2">{fmtHa(r.defHa)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="space-y-6">
      <div className="px-10 py-6 mb-6 border-b border-gray-400">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1px_minmax(0,1fr)] gap-4 md:gap-0">
          {/* Izquierda */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="text-xs uppercase text-gray-500">Empresa</div>
                <div className="font-medium">{enterpriseName}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Tag className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <div className="text-xs uppercase text-gray-500">Tipo de empresa</div>
                <div className="font-medium">{enterpriseType}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <div className="text-xs uppercase text-gray-500">Departamento</div>
                <div className="font-medium">{department}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapIcon className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <div className="text-xs uppercase text-gray-500">Municipio</div>
                <div className="font-medium">{municipality}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <div className="text-xs uppercase text-gray-500">Período</div>
                <div className="font-medium">
                  {yearStart} - {yearEnd}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <div className="text-xs uppercase text-gray-500">Alerta de entrada</div>
                <Badge active={inputAlert} className="mt-1" />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <div className="text-xs uppercase text-gray-500">Alerta de salida</div>
                <Badge active={outputAlert} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="hidden md:block bg-gray-200 md:self-stretch" style={{ width: 1 }} />

          {/* Derecha: Tabs y contenido */}
          <div className="md:pl-4 md:min-w-0 space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <TabButton
                active={activeTab === "alertas"}
                onClick={() => setActiveTab("alertas")}
                icon={AlertTriangle}
              >
                Alertas
              </TabButton>
              <TabButton
                active={activeTab === "movilizaciones"}
                onClick={() => setActiveTab("movilizaciones")}
                icon={ArrowRightLeft}
              >
                Movilizaciones
              </TabButton>
            </div>

            {/* Contenido de los tabs */}
            {activeTab === "alertas" ? (
              <div className="space-y-8">
                <Table title="Predios con alerta de entrada" rows={inputsRows} />
                <Table title="Predios con alerta de salida" rows={outputsRows} />
              </div>
            ) : (
              <MovementSection movementStats={movementStats} enterpriseId={enterpriseId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}