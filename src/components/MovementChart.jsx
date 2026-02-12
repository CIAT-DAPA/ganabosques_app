"use client";

import React, { useState, useMemo } from "react";
import Chart from "react-apexcharts";
import { AlertTriangle, Trees, Shield, Sprout, Calendar, Building2, MapPin, Map as MapIcon, TrendingUp } from "lucide-react";
import {
  ALERT_STYLES,
  DESTINATION_TYPE_LABELS,
  MOVEMENT_CHART_COLORS,
  getAlertLevel,
  formatValue,
  formatPeriod,
  translateDestinationType,
  VerificationChip,
} from "./shared";



const CHART_CONFIG = {
  height: 250,
  colors: { primary: "#082C14", grid: "#f1f1f1" },
};

// Helper functions
const getFarmLabel = (farm) => farm?.sit_code || farm.code || farm.id;

// Reusable components
const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 text-custom-dark">
    <Icon className="h-4 w-4" />
    <span className="font-semibold">{title}</span>
  </div>
);

const InfoItem = ({ label, value, suffix = "" }) => (
  <div className="flex justify-between">
    <span>{label}:</span>
    <span>{value}{suffix}</span>
  </div>
);

const RiskBadge = ({ level }) => (
  <span
    className={`text-xs px-2 py-1 ${level.bgClass} ${level.borderClass} ${level.textClass} border rounded-full font-medium`}
  >
    {level.label}
  </span>
);

const ToggleButton = ({ isVisible, onToggle, label }) => (
  <button
    onClick={onToggle}
    className="text-xs text-custom-dark hover:underline flex items-center gap-1"
  >
    {isVisible ? `Ocultar ${label}` : `Mostrar ${label}`}
    <span className={`transition-transform ${isVisible ? "rotate-180" : "rotate-0"}`}>▼</span>
  </button>
);

const EmptyChart = ({ message }) => (
  <div className="h-[250px] flex items-center justify-center bg-gray-50 rounded-lg">
    <p className="text-custom-dark opacity-60 text-sm">{message}</p>
  </div>
);

const ChartSection = ({ title, chart, hasData, showLegend, onToggleLegend, description, summaryData }) => (
  <div className="space-y-2">
    <h3 className="text-lg font-semibold text-custom-dark">{title}</h3>
    <p>{description}</p>
    {summaryData && (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-custom-dark">
          <TrendingUp className="h-4 w-4" />
          <span className="font-semibold text-sm">Resumen de movilización</span>
        </div>
        <div className="text-sm text-custom-dark space-y-1">
          <div className="flex justify-between">
            <span>Cantidad:</span>
            <span className="font-medium">{summaryData.count || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Porcentaje del total:</span>
            <span className="font-medium">{formatValue(summaryData.percentage)}%</span>
          </div>
          {summaryData.by_destination_type && (
            <div className="pt-1 border-t border-gray-200 mt-1">
              <div className="text-xs uppercase text-gray-500 mb-1">Tipos:</div>
              {Object.entries(summaryData.by_destination_type).map(([type, data]) => (
                <div key={type} className="flex justify-between text-xs">
                  <span>{translateDestinationType(type)}:</span>
                  <span>{data.count} ({formatValue(data.percentage_of_total)}%)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}
    {hasData ? (
      <>
        <Chart options={chart.options} series={chart.series} type="bar" height={CHART_CONFIG.height} />
        <div className="flex justify-end">
          <ToggleButton isVisible={showLegend} onToggle={onToggleLegend} label="leyendas" />
        </div>
      </>
    ) : (
      <EmptyChart message={`No hay datos de ${title.toLowerCase()}`} />
    )}
  </div>
);

const AlertSection = ({ risks, verification }) => (
  <div className="space-y-3">
    <SectionHeader icon={AlertTriangle} title="Alertas" />
    <div className="space-y-2">
      {[
        { label: "Directa:", level: risks.direct },
        { label: "Indirecta de entrada:", level: risks.input },
        { label: "Indirecta de salida:", level: risks.output },
      ].map((item, idx) => (
        <div key={idx} className="flex items-center justify-between">
          <span className="text-sm text-custom-dark">{item.label}</span>
          <RiskBadge level={item.level} />
        </div>
      ))}
      <div className="flex items-center justify-between pt-1 border-t border-gray-200 mt-1">
        <span className="text-sm text-custom-dark">Verificación:</span>
        <VerificationChip verification={verification} />
      </div>
    </div>
  </div>
);

const EnvironmentalSection = ({ riskObj }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <SectionHeader icon={Trees} title="Deforestación" />
      <div className="space-y-1 text-sm text-custom-dark">
        <InfoItem label="Proporción" value={(riskObj?.deforestation?.prop * 100)?.toFixed(1)} suffix="%" />
        <InfoItem label="Área" value={`${riskObj?.deforestation?.ha?.toFixed(1)} ha`} />
      </div>
    </div>
    <div className="space-y-2">
      <SectionHeader icon={Shield} title="Área protegida" />
      <div className="space-y-1 text-sm text-custom-dark">
        <InfoItem label="Proporción" value={(riskObj?.protected?.prop * 100)?.toFixed(1)} suffix="%" />
        <InfoItem label="Área" value={`${riskObj?.protected?.ha?.toFixed(1)} ha`} />
      </div>
    </div>
    <div className="space-y-2">
      <SectionHeader icon={Sprout} title="Frontera agrícola" />
      <div className="space-y-1 text-sm text-custom-dark">
        <div className="text-xs uppercase text-gray-500">Dentro de frontera</div>
        <InfoItem label="Proporción" value={(riskObj?.farming_in?.prop * 100)?.toFixed(1)} suffix="%" />
        <InfoItem label="Área" value={`${riskObj?.farming_in?.ha?.toFixed(1)} ha`} />
      </div>
      <div className="space-y-1 text-sm text-custom-dark">
        <div className="text-xs uppercase text-gray-500">Fuera de frontera</div>
        <InfoItem label="Proporción" value={(riskObj?.farming_out?.prop * 100)?.toFixed(1)} suffix="%" />
        <InfoItem label="Área" value={`${riskObj?.farming_out?.ha?.toFixed(1)} ha`} />
      </div>
    </div>
  </div>
);

const MovementSummarySection = ({ summary }) => {
  if (!summary) return null;
  return (
    <div className="space-y-3 mt-4">
      <SectionHeader icon={MapIcon} title="Resumen de Movilizaciones" />
      <div className="space-y-1 text-sm text-custom-dark">
        <InfoItem label="Total movimientos" value={summary.total_movements || 0} />
        {summary.inputs && (
          <div className="mt-2">
            <div className="text-xs uppercase text-gray-500">Entradas</div>
            <InfoItem label="Cantidad" value={summary.inputs.count || 0} />
            <InfoItem label="Porcentaje" value={formatValue(summary.inputs.percentage)} suffix="%" />
            {summary.inputs.by_destination_type && (
              <div className="mt-1 ml-2">
                {Object.entries(summary.inputs.by_destination_type).map(([type, data]) => (
                  <div key={type} className="text-xs">
                    <span>{translateDestinationType(type)}: </span>
                    <span>{data.count} ({formatValue(data.percentage_of_total)}%)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {summary.outputs && (
          <div className="mt-2">
            <div className="text-xs uppercase text-gray-500">Salidas</div>
            <InfoItem label="Cantidad" value={summary.outputs.count || 0} />
            <InfoItem label="Porcentaje" value={formatValue(summary.outputs.percentage)} suffix="%" />
            {summary.outputs.by_destination_type && (
              <div className="mt-1 ml-2">
                {Object.entries(summary.outputs.by_destination_type).map(([type, data]) => (
                  <div key={type} className="text-xs">
                    <span>{translateDestinationType(type)}: </span>
                    <span>{data.count} ({formatValue(data.percentage_of_total)}%)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const FarmCard = ({
  farm, farmData, riskData, getFarmRiskLevels, buildChartData,
  legendEntradaMap, legendSalidaMap, toggleLegend, yearStart, yearEnd,
}) => {
  const statsEntrada = farmData?.inputs?.statistics;
  const statsSalida = farmData?.outputs?.statistics;
  const showLegendEntrada = legendEntradaMap[farm.id] || false;
  const showLegendSalida = legendSalidaMap[farm.id] || false;

  const entradaChart = statsEntrada?.species
    ? buildChartData(statsEntrada.species, "Entradas", showLegendEntrada)
    : null;
  const salidaChart = statsSalida?.species
    ? buildChartData(statsSalida.species, "Salidas", showLegendSalida)
    : null;

  const label = getFarmLabel(farm);
  const riskObj = riskData[farm.id];
  const risks = getFarmRiskLevels(farm.id);
  const hasEntrada = entradaChart?.series[0]?.data?.some((d) => d > 0);
  const hasSalida = salidaChart?.series[0]?.data?.some((d) => d > 0);

  return (
    <div className="bg-custom border-b border-[#082C14] p-6 m-10">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-custom-dark">
                  <div className="w-4 h-4 bg-custom-dark rounded-full"></div>
                  <h2 className="text-lg font-bold">Predio {label}</h2>
                </div>
                <div className="flex items-center gap-2 text-lg text-custom-dark text-medium">
                  <Calendar className="h-4 w-4" />
                  <span>Periodo: {formatPeriod(yearStart, yearEnd)}</span>
                </div>
                <div className="flex items-center gap-2 text-lg text-custom-dark text-medium">
                  <Building2 className="h-4 w-4" />
                  <span>Departamento: {riskObj?.department || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-lg text-custom-dark text-medium">
                  <MapIcon className="h-5 w-5" />
                  <span>Municipio: {riskObj?.municipality || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-lg text-custom-dark text-medium">
                  <MapPin className="h-4 w-4" />
                  <span>vereda: {riskObj?.vereda || "N/A"}</span>
                </div>
              </div>
              <AlertSection risks={risks} verification={riskObj?.verification} />
            </div>
            <EnvironmentalSection riskObj={riskObj} />
          </div>
        </div>
        <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartSection
            title="Movilización de entrada"
            chart={entradaChart}
            hasData={hasEntrada}
            showLegend={showLegendEntrada}
            onToggleLegend={() => toggleLegend("entrada", farm.id)}
            description="Muestra los ingresos al predio según las categorías del sector productivo."
            summaryData={farmData?.summary?.inputs}
          />
          <ChartSection
            title="Movilización de salida"
            chart={salidaChart}
            hasData={hasSalida}
            showLegend={showLegendSalida}
            onToggleLegend={() => toggleLegend("salida", farm.id)}
            description="Indica los movimientos de salida desde el predio."
            summaryData={farmData?.summary?.outputs}
          />
        </div>
      </div>
    </div>
  );
};

export default function MovementCharts({ summary = {}, foundFarms = [], riskFarm = {}, yearStart, yearEnd }) {
  const [legendEntradaMap, setLegendEntradaMap] = useState({});
  const [legendSalidaMap, setLegendSalidaMap] = useState({});

  const toggleLegend = (type, id) => {
    const setter = type === "entrada" ? setLegendEntradaMap : setLegendSalidaMap;
    setter((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const buildChartData = (speciesData, title, showLegend) => {
    const aggregated = {};
    const addToAgg = (label, value) => {
      const v = Number.isFinite(value) ? value : 0;
      aggregated[label] = (aggregated[label] || 0) + v;
    };

    if (!speciesData) return { options: {}, series: [{ name: title, data: [] }] };

    if (Array.isArray(speciesData)) {
      for (const it of speciesData) {
        if (!it) continue;
        const label = String(it?.subcategory ?? it?.name ?? it?.species_name ?? it?.category ?? "N/A");
        const val = it.headcount ?? it.amount ?? it.total ?? 0;
        addToAgg(label, val);
      }
    } else if (typeof speciesData === "object") {
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
      title: { text: "" },
      xaxis: { categories, labels: { show: false } },
      yaxis: { labels: { style: { colors: "#082C14" } } },
      colors: categories.map((_, i) => MOVEMENT_CHART_COLORS[i % MOVEMENT_CHART_COLORS.length]),
      legend: { show: showLegend, labels: { colors: "#082C14" } },
      plotOptions: { bar: { distributed: true, borderRadius: 4, horizontal: false } },
      dataLabels: { enabled: false },
      tooltip: { x: { show: true }, theme: "light" },
      grid: { borderColor: "#f1f1f1", strokeDashArray: 3 },
    };

    return { options, series };
  };

  const riskData = useMemo(() => {
    const flatRisk = Object.values(riskFarm || {}).flat();
    return flatRisk.reduce((acc, risk) => { acc[risk.farm_id] = risk; return acc; }, {});
  }, [riskFarm]);

  const getFarmRiskLevels = (farmId) => {
    const riskObj = riskData[farmId];
    return {
      direct: getAlertLevel(Boolean(riskObj?.risk_direct)),
      input: getAlertLevel(Boolean(riskObj?.risk_input)),
      output: getAlertLevel(Boolean(riskObj?.risk_output)),
    };
  };

  return (
    <>
      {foundFarms.map((farm) => {
        const farmData = summary[farm.id];
        if (!farmData) return null;
        return (
          <FarmCard
            key={farm.id}
            farm={farm}
            farmData={farmData}
            riskData={riskData}
            getFarmRiskLevels={getFarmRiskLevels}
            buildChartData={buildChartData}
            legendEntradaMap={legendEntradaMap}
            legendSalidaMap={legendSalidaMap}
            toggleLegend={toggleLegend}
            yearStart={yearStart}
            yearEnd={yearEnd}
          />
        );
      })}
    </>
  );
}
