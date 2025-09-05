"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faTree,
  faShieldHalved,
  faBorderTopLeft,
} from "@fortawesome/free-solid-svg-icons";
import React, { useState, useMemo } from "react";
import Chart from "react-apexcharts";

// Constantes
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
  "#7a9e9f",
  "#d2c29d",
  "#d26a5c",
  "#8c8c8c",
  "#546e7a",
];

const CHART_CONFIG = {
  height: 250,
  colors: {
    primary: "#082C14",
    grid: "#f1f1f1",
  },
};

const RISK_LEVELS = {
  HIGH: {
    threshold: 2.5,
    color: "red-500",
    label: "Riesgo alto",
    bgClass: "bg-red-500/20",
    borderClass: "border-red-500",
    textClass: "text-red-700",
  },
  MEDIUM: {
    threshold: 1.5,
    color: "orange-400",
    label: "Riesgo medio",
    bgClass: "bg-orange-400/20",
    borderClass: "border-orange-400",
    textClass: "text-orange-700",
  },
  LOW: {
    threshold: 0,
    color: "yellow-400",
    label: "Riesgo bajo",
    bgClass: "bg-yellow-400/20",
    borderClass: "border-yellow-400",
    textClass: "text-yellow-700",
  },
  NONE: {
    color: "green-500",
    label: "Sin riesgo",
    bgClass: "bg-green-500/20",
    borderClass: "border-green-500",
    textClass: "text-green-700",
  },
};

// Utilidades
const getRiskLevel = (value) => {
  let riskType;
  if (value > RISK_LEVELS.HIGH.threshold) riskType = RISK_LEVELS.HIGH;
  else if (value > RISK_LEVELS.MEDIUM.threshold) riskType = RISK_LEVELS.MEDIUM;
  else if (value > RISK_LEVELS.LOW.threshold) riskType = RISK_LEVELS.LOW;
  else riskType = RISK_LEVELS.NONE;

  return {
    color: `bg-${riskType.color}`,
    label: riskType.label,
    bgClass: riskType.bgClass,
    borderClass: riskType.borderClass,
    textClass: riskType.textClass,
  };
};

const formatValue = (value, decimals = 2) => (value || 0).toFixed(decimals);

const getFarmLabel = (farm) => farm?.sit_code || farm.code || farm.id;

// Componentes reutilizables
const SectionHeader = ({ icon, title }) => (
  <div className="flex items-center gap-2 text-custom-dark">
    <FontAwesomeIcon icon={icon} />
    <span className="font-semibold">{title}</span>
  </div>
);

const InfoItem = ({ label, value, suffix = "" }) => (
  <div className="flex justify-between">
    <span>{label}:</span>
    <span>
      {value}
      {suffix}
    </span>
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
    <span
      className={`transition-transform ${
        isVisible ? "rotate-180" : "rotate-0"
      }`}
    >
      ▼
    </span>
  </button>
);

const EmptyChart = ({ message }) => (
  <div className="h-[250px] flex items-center justify-center bg-gray-50 rounded-lg">
    <p className="text-custom-dark opacity-60 text-sm">{message}</p>
  </div>
);

const ChartSection = ({
  title,
  chart,
  hasData,
  showLegend,
  onToggleLegend,
}) => (
  <div className="space-y-2">
    <h3 className="text-lg font-semibold text-custom-dark">{title}</h3>
    {hasData ? (
      <>
        <Chart
          options={chart.options}
          series={chart.series}
          type="bar"
          height={CHART_CONFIG.height}
        />
        <div className="flex justify-end">
          <ToggleButton
            isVisible={showLegend}
            onToggle={onToggleLegend}
            label="leyendas"
          />
        </div>
      </>
    ) : (
      <EmptyChart message={`No hay datos de ${title.toLowerCase()}`} />
    )}
  </div>
);

// Componente para la información de riesgos
const RiskSection = ({ risks, year }) => (
  <div className="space-y-3">
    <SectionHeader icon={faTriangleExclamation} title="Riesgos" />
    <div className="space-y-2">
      {[
        { label: "Riesgo directo:", level: risks.direct },
        { label: "Riesgo entrada:", level: risks.input },
        { label: "Riesgo salida:", level: risks.output },
        { label: `Riesgo total ${year}:`, level: risks.total },
      ].map((item, idx) => (
        <div key={idx} className="flex items-center justify-between">
          <span className="text-sm text-custom-dark">{item.label}</span>
          <RiskBadge level={item.level} />
        </div>
      ))}
    </div>
  </div>
);

// Componente para información ambiental
const EnvironmentalSection = ({ riskObj }) => (
  <div className="space-y-4">
    {/* Deforestación */}
    <div className="space-y-2">
      <SectionHeader icon={faTree} title="Deforestación" />
      <div className="space-y-1 text-sm text-custom-dark">
        <InfoItem
          label="Proporción"
          value={formatValue(riskObj?.deforestation?.prop * 100)}
          suffix="%"
        />
        <InfoItem
          label="Hectáreas"
          value={formatValue(riskObj?.deforestation?.ha)}
        />
        <InfoItem
          label="Distancia"
          value={formatValue(riskObj?.deforestation?.distance)}
        />
      </div>
    </div>

    {/* Área Protegida */}
    <div className="space-y-2">
      <SectionHeader icon={faShieldHalved} title="Área protegida" />
      <div className="space-y-1 text-sm text-custom-dark">
        <InfoItem
          label="Proporción"
          value={formatValue(riskObj?.protected?.prop * 100)}
          suffix="%"
        />
        <InfoItem
          label="Hectáreas"
          value={formatValue(riskObj?.protected?.ha)}
        />
        <InfoItem
          label="Distancia"
          value={formatValue(riskObj?.protected?.distance)}
        />
      </div>
    </div>

    {/* Frontera Agrícola */}
    <div className="space-y-2">
      <SectionHeader icon={faBorderTopLeft} title="Frontera agrícola" />
      <div>
        <span
          className={`text-xs px-3 py-1 rounded-full ${
            riskObj?.farming
              ? "bg-green-100 text-green-700 border-1 border-green-700"
              : "bg-red-100 text-red-700 border-1 border-red-700"
          }`}
        >
          {riskObj?.farming
            ? "Dentro de frontera agrícola"
            : "Fuera de frontera agrícola"}
        </span>
      </div>
    </div>
  </div>
);

// Componente principal para cada farm/year
const FarmYearCard = ({
  farm,
  year,
  farmData,
  riskData,
  getFarmRiskLevels,
  buildChartData,
  legendEntradaMap,
  legendSalidaMap,
  toggleLegend,
}) => {
  const statsEntrada = farmData?.inputs?.statistics?.[year];
  const statsSalida = farmData?.outputs?.statistics?.[year];
  const showLegendEntrada = legendEntradaMap[`${farm.id}-${year}`] || false;
  const showLegendSalida = legendSalidaMap[`${farm.id}-${year}`] || false;

  const entradaChart = statsEntrada
    ? buildChartData(
        { [year]: statsEntrada.species },
        "Entradas",
        showLegendEntrada
      )
    : null;

  const salidaChart = statsSalida
    ? buildChartData(
        { [year]: statsSalida.species },
        "Salidas",
        showLegendSalida
      )
    : null;

  const label = getFarmLabel(farm);
  const riskObj = riskData[farm.id];
  const risks = getFarmRiskLevels(farm.id);

  const hasEntrada = entradaChart?.series[0]?.data?.some((d) => d > 0);
  const hasSalida = salidaChart?.series[0]?.data?.some((d) => d > 0);

  return (
    <div className="bg-custom border-b border-[#082C14] p-6 m-10">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* PANEL IZQUIERDO - Información del predio */}
        <div className="w-full lg:w-1/3">
          <div className="grid grid-cols-2 gap-4">
            {/* COLUMNA 1: Predio y Riesgos */}
            <div className="space-y-4">
              {/* Título del predio */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-custom-dark">
                  <div className="w-4 h-4 bg-custom-dark rounded-full"></div>
                  <h2 className="text-lg font-bold">Predio {label}</h2>
                </div>
                <div className="text-lg text-custom-dark text-medium">
                  {year}
                </div>
              </div>

              <RiskSection risks={risks} year={year} />
            </div>

            {/* COLUMNA 2: Información Ambiental */}
            <EnvironmentalSection riskObj={riskObj} />
          </div>
        </div>

        {/* PANEL DERECHO - Gráficos */}
        <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartSection
            title="Entradas"
            chart={entradaChart}
            hasData={hasEntrada}
            showLegend={showLegendEntrada}
            onToggleLegend={() => toggleLegend("entrada", farm.id, year)}
          />
          <ChartSection
            title="Salidas"
            chart={salidaChart}
            hasData={hasSalida}
            showLegend={showLegendSalida}
            onToggleLegend={() => toggleLegend("salida", farm.id, year)}
          />
        </div>
      </div>
    </div>
  );
};

export default function MovementCharts({
  summary = {},
  foundFarms = [],
  riskFarm = {},
}) {
  const [legendEntradaMap, setLegendEntradaMap] = useState({});
  const [legendSalidaMap, setLegendSalidaMap] = useState({});

  const toggleLegend = (type, id, year) => {
    const setterMap = {
      entrada: setLegendEntradaMap,
      salida: setLegendSalidaMap,
    };
    const setter = setterMap[type];
    setter((prev) => ({
      ...prev,
      [`${id}-${year}`]: !prev[`${id}-${year}`],
    }));
  };

  const buildChartData = (dataByYear, title, showLegend) => {
    const aggregated = {};

    Object.values(dataByYear || {}).forEach((speciesGroup) => {
      Object.values(speciesGroup || {}).forEach((categoryGroup) => {
        Object.entries(categoryGroup || {}).forEach(([category, values]) => {
          aggregated[category] =
            (aggregated[category] || 0) + (values.headcount || 0);
        });
      });
    });

    const categories = Object.keys(aggregated);
    const series = [
      {
        name: title,
        data: categories.map((label) => aggregated[label]),
      },
    ];

    const options = {
      chart: {
        type: "bar",
        height: CHART_CONFIG.height,
        toolbar: { show: false },
        background: "transparent",
      },
      title: { text: "" },
      xaxis: {
        categories,
        labels: { show: false, style: { colors: CHART_CONFIG.colors.primary } },
        axisTicks: { show: false },
        axisBorder: { show: false },
      },
      yaxis: {
        labels: { style: { colors: CHART_CONFIG.colors.primary } },
      },
      colors: categories.map((_, i) => BASE_COLORS[i % BASE_COLORS.length]),
      legend: {
        show: showLegend,
        labels: { colors: CHART_CONFIG.colors.primary },
      },
      plotOptions: {
        bar: { distributed: true, borderRadius: 4, horizontal: false },
      },
      dataLabels: { enabled: false },
      tooltip: { x: { show: true }, theme: "light" },
      grid: {
        borderColor: CHART_CONFIG.colors.grid,
        strokeDashArray: 3,
      },
    };

    return { options, series };
  };

  // Memoizar datos de riesgo para optimizar rendimiento
  const riskData = useMemo(() => {
    const flatRisk = Object.values(riskFarm || {}).flat();
    return flatRisk.reduce((acc, risk) => {
      acc[risk.farm_id] = risk;
      return acc;
    }, {});
  }, [riskFarm]);

  const getFarmRiskLevels = (farmId) => {
    const riskObj = riskData[farmId];
    return {
      direct: getRiskLevel(riskObj?.risk_direct),
      input: getRiskLevel(riskObj?.risk_input),
      output: getRiskLevel(riskObj?.risk_output),
      total: getRiskLevel(riskObj?.risk_total),
    };
  };

  return (
    <>
      {foundFarms.map((farm) => {
        const farmData = summary[farm.id];
        if (!farmData) return null;

        const allYears = Object.keys(farmData?.inputs?.statistics || {})
          .filter((k) => !isNaN(k))
          .sort();

        return allYears.map((year) => (
          <FarmYearCard
            key={`${farm.id}-${year}`}
            farm={farm}
            year={year}
            farmData={farmData}
            riskData={riskData}
            getFarmRiskLevels={getFarmRiskLevels}
            buildChartData={buildChartData}
            legendEntradaMap={legendEntradaMap}
            legendSalidaMap={legendSalidaMap}
            toggleLegend={toggleLegend}
          />
        ));
      })}
    </>
  );
}
