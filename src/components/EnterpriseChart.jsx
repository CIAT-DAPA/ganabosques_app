// Enterprise Chart component
"use client";

import React, { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import {
  Building2,
  Briefcase,
  Tag,
  AlertTriangle,
  Map as MapIcon,
  Calendar,
  TrendingUp,
  ArrowRightLeft,
} from "lucide-react";
import {
  CHART_COLORS,
  MOVEMENT_CHART_COLORS,
  translateEnterpriseType,
  translateDestinationType,
  formatValue,
  formatHa,
} from "./shared";

// Get ext code by source
function getExtCodeBySource(item, source = "SIT_CODE") {
  const arr = item?.ext_id || item?.extId || [];
  const found = Array.isArray(arr)
    ? arr.find((e) => e?.source === source || e?.label === source)
    : null;
  return found?.ext_code ?? null;
}

// Get producer ID
function getProducerId(item) {
  const arr = item?.ext_id || item?.extId || [];
  const found = Array.isArray(arr)
    ? arr.find((e) => e?.source === "PRODUCER_ID" || e?.label === "PRODUCER_ID")
    : null;
  return found?.ext_code ?? null;
}

// Get provider alert flags
function providerAlertFlags(provider = {}) {
  const r = provider?.risk || {};
  return {
    direct: r?.risk_direct === true,
    input: r?.risk_input === true,
    output: r?.risk_output === true,
    defHa: r?.deforestation?.ha ?? null,
  };
}

// Check if provider has any alert
function hasAnyAlert(provider = {}) {
  const f = providerAlertFlags(provider);
  return f.direct || f.input || f.output;
}

// Check if array has any alert
function hasAnyAlertInArray(arr = []) {
  return (arr || []).some(hasAnyAlert);
}

// Badge component
function Badge({ active, className = "" }) {
  const color = active ? CHART_COLORS.RISK : CHART_COLORS.OK;
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

// Cell chip component
function CellChip({ active, title }) {
  const color = active ? CHART_COLORS.RISK : CHART_COLORS.OK;
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

// Tab button component
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

// Toggle button component
const ToggleButton = ({ isVisible, onToggle, label }) => (
  <button
    onClick={onToggle}
    className="text-xs text-gray-700 hover:text-[#082C14] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
  >
    {isVisible ? `Ocultar ${label}` : `Mostrar ${label}`}
    <span className={`transition-transform duration-200 ${isVisible ? "rotate-180" : "rotate-0"}`}>▼</span>
  </button>
);

// Movement section component
function MovementSection({ movementStats, enterpriseId }) {
  const [showLegendInput, setShowLegendInput] = useState(false);
  const [showLegendOutput, setShowLegendOutput] = useState(false);

  const data = movementStats?.[enterpriseId];
  if (!data) {
    return <div className="text-center py-8 text-gray-500">No hay datos de movilizaciones disponibles</div>;
  }

  const { summary, inputs, outputs } = data;

  const buildChartData = (speciesData, title, showLegend = false) => {
    const aggregated = {};
    const addToAgg = (label, value) => {
      const v = Number.isFinite(value) ? value : 0;
      aggregated[label] = (aggregated[label] || 0) + v;
    };

    if (!speciesData) return { options: {}, series: [{ name: title, data: [] }] };

    if (typeof speciesData === "object" && !Array.isArray(speciesData)) {
      for (const [group, sub] of Object.entries(speciesData)) {
        if (typeof sub === "number") { addToAgg(group, sub); continue; }
        if (!sub || typeof sub !== "object") continue;
        for (const [subcat, values] of Object.entries(sub)) {
          if (!values || typeof values !== "object") continue;
          const v = values.headcount ?? values.amount ?? values.total ?? 0;
          addToAgg(String(subcat), v);
        }
      }
    }

    const categories = Object.keys(aggregated);
    const series = [{ name: title, data: categories.map((l) => aggregated[l]) }];

    const options = {
      chart: { type: "bar", height: 250, toolbar: { show: false }, background: "transparent" },
      xaxis: { categories, labels: { show: false } },
      yaxis: { labels: { style: { colors: "#082C14" } } },
      colors: categories.map((_, i) => MOVEMENT_CHART_COLORS[i % MOVEMENT_CHART_COLORS.length]),
      legend: { show: showLegend, labels: { colors: "#082C14" } },
      plotOptions: { bar: { distributed: true, borderRadius: 4, horizontal: false } },
      dataLabels: { enabled: false },
      grid: { borderColor: "#f1f1f1", strokeDashArray: 3 },
    };

    return { options, series };
  };

  const inputChart = buildChartData(inputs?.statistics?.species, "Entradas", showLegendInput);
  const outputChart = buildChartData(outputs?.statistics?.species, "Salidas", showLegendOutput);
  const hasInputData = inputChart?.series[0]?.data?.some((d) => d > 0);
  const hasOutputData = outputChart?.series[0]?.data?.some((d) => d > 0);

  return (
    <div className="space-y-6">
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

        {summary?.inputs?.by_destination_type && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-600 mb-2">Entradas por tipo de origen:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.inputs.by_destination_type).map(([type, data]) => (
                <span key={type} className="inline-flex items-center px-2 py-1 bg-white rounded-md text-xs border border-gray-200">
                  <span className="font-medium">{translateDestinationType(type)}: </span>
                  <span className="ml-1">{data.count} ({formatValue(data.percentage_of_total)}%)</span>
                </span>
              ))}
            </div>
          </div>
        )}

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

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-semibold text-gray-700">Movilización de entrada</h4>
            <p className="text-xs text-gray-500">Ingresos a la empresa por categorías</p>
          </div>
          {hasInputData ? (
            <>
              <Chart options={inputChart.options} series={inputChart.series} type="bar" height={250} />
              <div className="flex justify-end mt-1">
                <ToggleButton isVisible={showLegendInput} onToggle={() => setShowLegendInput(!showLegendInput)} label="leyenda" />
              </div>
            </>
          ) : (
            <div className="h-[250px] flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">No hay datos de entradas</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-semibold text-gray-700">Movilización de salida</h4>
            <p className="text-xs text-gray-500">Salidas de la empresa por categorías</p>
          </div>
          {hasOutputData ? (
            <>
              <Chart options={outputChart.options} series={outputChart.series} type="bar" height={250} />
              <div className="flex justify-end mt-1">
                <ToggleButton isVisible={showLegendOutput} onToggle={() => setShowLegendOutput(!showLegendOutput)} label="leyenda" />
              </div>
            </>
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

// Enterprise Card component
function EnterpriseCard({
  ent,
  yearStart,
  yearEnd,
  movementStats,
  risk,
  defaultActiveTab = "alertas",
}) {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);

  const enterpriseId = ent?._id || ent?.id;
  const department = ent?.adm1?.name || "—";
  const municipality = ent?.adm2?.name || "—";
  const enterpriseName = ent?.name || "—";
  const rawType = ent?.type_enterprise || ent?.type || null;
  const enterpriseType = translateEnterpriseType(rawType);

  const inputs = ent?.providers?.inputs ?? [];
  const outputs = ent?.providers?.outputs ?? [];
  const inputAlert = hasAnyAlertInArray(inputs);
  const outputAlert = hasAnyAlertInArray(outputs);

  // Format period label based on risk type
  const periodLabel = useMemo(() => {
    // For ATD/NAD, show quarterly format (YYYY-Q#)
    if (risk === "atd" || risk === "nad") {
      const formatQuarterly = (val) => {
        if (!val) return "";
        const d = new Date(val);
        if (isNaN(d.getTime())) return val;
        const y = d.getUTCFullYear();
        const m = d.getUTCMonth();
        const q = Math.floor(m / 3) + 1;
        return `${y}0${q}`;
      };

      const start = formatQuarterly(yearStart);
      const end = formatQuarterly(yearEnd);

      if (start && end && start !== end) return `${start} - ${end}`;
      return start || end || "—";
    }

    // Default: Annual/Cumulative (YYYY or YYYY-YYYY)
    if (yearStart && yearEnd && yearStart !== yearEnd) {
      return `${yearStart} - ${yearEnd}`;
    }
    return yearStart || yearEnd || "—";
  }, [yearStart, yearEnd, risk]);

  const inputsRows = useMemo(
    () =>
      (inputs || []).map((p) => ({
        scope: "entrada",
        sit: getExtCodeBySource(p, "SIT_CODE"),
        producerId: getProducerId(p),
        ...providerAlertFlags(p), // returns { direct: bool, input: bool, output: bool, ... }
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
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
      </div>
      <div className="rounded-xl border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold text-gray-700">Predio</th>
              <th className="px-3 py-2 font-semibold text-gray-700">
                Alerta directa
              </th>
              <th className="px-3 py-2 font-semibold text-gray-700">
                Alerta de entrada
              </th>
              <th className="px-3 py-2 font-semibold text-gray-700">
                Alerta de salida
              </th>
              <th className="px-3 py-2 font-semibold text-gray-700">
                Área deforestada (ha)
              </th>
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
              rows.map((r, idx) => (
                <tr key={r._id || `${r.sit || "S"}-${idx}`}>
                  <td className="px-3 py-2">
                    {(r.sit || r.producerId) && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {r.sit && (
                          <>
                            <span className="font-semibold">SIT:</span> {r.sit}
                          </>
                        )}
                        {r.sit && r.producerId && <span>, </span>}
                        {r.producerId && (
                          <>
                            <span className="font-semibold">PRODUCER_ID:</span>{" "}
                            {r.producerId}
                          </>
                        )}
                      </div>
                    )}
                  </td>
                  {/* Use explicit boolean checks for active prop */}
                  <td className="px-3 py-2">
                    <CellChip
                      active={r.direct === true}
                      title="Alerta Directa"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <CellChip
                      active={r.input === true}
                      title="Alerta de Entrada"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <CellChip
                      active={r.output === true}
                      title="Alerta de Salida"
                    />
                  </td>
                  <td className="px-3 py-2">{formatHa(r.defHa)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="px-10 py-6 mb-6 border-b border-gray-400">
      <div className="grid grid-cols-1 md:grid-cols-[240px_1px_minmax(0,1fr)] gap-4 md:gap-0">
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
              <div className="text-xs uppercase text-gray-500">
                Tipo de empresa
              </div>
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
              <div className="font-medium">{periodLabel}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <div className="text-xs uppercase text-gray-500">
                Alerta de entrada
              </div>
              <Badge active={inputAlert} className="mt-1" />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <div className="text-xs uppercase text-gray-500">
                Alerta de salida
              </div>
              <Badge active={outputAlert} className="mt-1" />
            </div>
          </div>
        </div>

        <div
          className="hidden md:block bg-gray-200 md:self-stretch"
          style={{ width: 1 }}
        />

        <div className="md:pl-4 md:min-w-0 space-y-4">
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
          {activeTab === "alertas" ? (
            <div className="space-y-8">
              <Table title="Predios con alerta de entrada" rows={inputsRows} />
              <Table title="Predios con alerta de salida" rows={outputsRows} />
            </div>
          ) : (
            <MovementSection
              movementStats={movementStats}
              enterpriseId={enterpriseId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Main component
export default function EnterpriseChart({
  yearStart,
  yearEnd,
  enterpriseDetails = [],
  movementStats = {},
  risk,
}) {
  if (!enterpriseDetails || enterpriseDetails.length === 0) return null;

  return (
    <div className="space-y-6">
      {enterpriseDetails.map((ent, idx) => (
        <EnterpriseCard
          key={ent?._id || ent?.id || idx}
          ent={ent}
          yearStart={yearStart}
          yearEnd={yearEnd}
          movementStats={movementStats}
          risk={risk}
        />
      ))}
    </div>
  );
}