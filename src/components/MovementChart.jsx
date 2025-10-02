"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faTree,
  faShieldHalved,
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

// ALERTAS (booleanos)
const ALERT_LEVELS = {
  TRUE: {
    label: "Alerta activa",
    bgClass: "bg-red-500/20",
    borderClass: "border-red-500",
    textClass: "text-red-700",
  },
  FALSE: {
    label: "Sin alerta",
    bgClass: "bg-green-500/20",
    borderClass: "border-green-500",
    textClass: "text-green-700",
  },
};

// Valor booleano -> estilos
const getAlertLevel = (flag) => (flag ? ALERT_LEVELS.TRUE : ALERT_LEVELS.FALSE);

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
      className={`transition-transform ${isVisible ? "rotate-180" : "rotate-0"}`}
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

// Componente para la información de alertas
const AlertSection = ({ risks }) => (
  <div className="space-y-3">
    <SectionHeader icon={faTriangleExclamation} title="Alertas" />
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
      </div>
    </div>

    {/* Frontera Agrícola (unificada) */}
    <div className="space-y-2">
      <SectionHeader icon={faShieldHalved} title="Frontera agrícola" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dentro de frontera */}
        <div className="p-3 rounded-lg border border-gray-200 bg-white/60">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
            Dentro de frontera
          </div>
          <div className="space-y-1 text-sm text-custom-dark">
            <InfoItem
              label="Prop"
              value={formatValue(riskObj?.farming_in?.prop * 100)}
              suffix="%"
            />
            <InfoItem
              label="Ha"
              value={formatValue(riskObj?.farming_in?.ha)}
            />
          </div>
        </div>

        {/* Fuera de frontera */}
        <div className="p-3 rounded-lg border border-gray-200 bg-white/60">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
            Fuera de frontera
          </div>
          <div className="space-y-1 text-sm text-custom-dark">
            <InfoItem
              label="Prop"
              value={formatValue(riskObj?.farming_out?.prop * 100)}
              suffix="%"
            />
            <InfoItem
              label="Ha"
              value={formatValue(riskObj?.farming_out?.ha)}
            />
          </div>
        </div>
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
  const statsSalida  = farmData?.outputs?.statistics?.[year];
  const showLegendEntrada = legendEntradaMap[`${farm.id}-${year}`] || false;
  const showLegendSalida  = legendSalidaMap[`${farm.id}-${year}`] || false;

  // 🔎 Debug del render por tarjeta
  console.log('[FarmYearCard]', {
    farm: farm.id,
    year,
    inHasSpecies: !!statsEntrada?.species,
    outHasSpecies: !!statsSalida?.species,
  });

  const entradaChart = statsEntrada
    ? buildChartData({ [year]: statsEntrada.species }, "Entradas", showLegendEntrada)
    : null;

  const salidaChart = statsSalida
    ? buildChartData({ [year]: statsSalida.species }, "Salidas", showLegendSalida)
    : null;

  const label = getFarmLabel(farm);
  const riskObj = riskData[farm.id];
  const risks = getFarmRiskLevels(farm.id);

  const hasEntrada = entradaChart?.series[0]?.data?.some((d) => d > 0);
  const hasSalida  = salidaChart?.series[0]?.data?.some((d) => d > 0);

  return (
    <div className="bg-custom border-b border-[#082C14] p-6 m-10">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* PANEL IZQUIERDO - Información del predio */}
        <div className="w-full lg:w-1/3">
          <div className="grid grid-cols-2 gap-4">
            {/* COLUMNA 1: Predio y Alertas */}
            <div className="space-y-4">
              {/* Título del predio */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-custom-dark">
                  <div className="w-4 h-4 bg-custom-dark rounded-full"></div>
                  <h2 className="text-lg font-bold">Predio {label}</h2>
                </div>
                <div className="text-lg text-custom-dark text-medium">
                  Periodo: {year}
                </div>
              </div>

              <AlertSection risks={risks} />
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
  const [legendSalidaMap,  setLegendSalidaMap]  = useState({});

  const toggleLegend = (type, id, year) => {
    const setterMap = { entrada: setLegendEntradaMap, salida: setLegendSalidaMap };
    const setter = setterMap[type];
    setter((prev) => ({
      ...prev,
      [`${id}-${year}`]: !prev[`${id}-${year}`],
    }));
  };

  // ✅ buildChartData parcheado: soporta species como OBJETO o ARRAY
  const buildChartData = (dataByYear, title, showLegend) => {
  // dataByYear: { [year]: species }
  const aggregated = {};
  const addToAgg = (label, value) => {
    const v = Number.isFinite(value) ? value : 0;
    aggregated[label] = (aggregated[label] || 0) + v;
  };

  Object.values(dataByYear || {}).forEach((speciesGroup) => {
    if (!speciesGroup) return;

    if (Array.isArray(speciesGroup)) {
      // ARRAY: intenta usar 'subcategory' (si existe) y cae a 'name'
      for (const it of speciesGroup) {
        if (!it) continue;
        const label = String(
          it?.subcategory ?? it?.name ?? it?.species_name ??
          it?.category ?? it?._id ?? it?.id ?? it?.species_id ?? 'N/A'
        );
        const val =
          (typeof it.headcount === 'number' && it.headcount) ??
          (typeof it.amount === 'number' && it.amount) ??
          (typeof it.total === 'number' && it.total) ?? 0;
        addToAgg(label, val);
      }
      return;
    }

    if (typeof speciesGroup === 'object') {
      // OBJETO anidado: { Grupo: { Subcat: { headcount } } }
      for (const [group, sub] of Object.entries(speciesGroup)) {
        if (typeof sub === 'number') {
          // raro, pero sumamos bajo el nombre del grupo
          addToAgg(group, sub);
          continue;
        }
        if (!sub || typeof sub !== 'object') continue;

        for (const [subcat, values] of Object.entries(sub)) {
          if (!values || typeof values !== 'object') continue;
          const v =
            (typeof values.headcount === 'number' && values.headcount) ??
            (typeof values.amount === 'number' && values.amount) ??
            (typeof values.total === 'number' && values.total) ?? 0;
          // ⬅️ usamos la SUBCATEGORÍA como etiqueta (lo de antes)
          addToAgg(String(subcat), v);
        }
      }
      return;
    }
    // Otros tipos: ignorar
  });

  const categories = Object.keys(aggregated);
  const series = [{ name: title, data: categories.map((label) => aggregated[label]) }];

  console.log('[Chart/buildChartData]', {
    title,
    cats: categories.length,
    sum: series[0].data.reduce((a, b) => a + b, 0),
  });

  const options = {
    chart: { type: "bar", height: 250, toolbar: { show: false }, background: "transparent" },
    title: { text: "" },
    xaxis: {
      categories,
      labels: { show: false, style: { colors: "#082C14" } },
      axisTicks: { show: false },
      axisBorder: { show: false },
    },
    yaxis: { labels: { style: { colors: "#082C14" } } },
    colors: categories.map((_, i) => BASE_COLORS[i % BASE_COLORS.length]),
    legend: { show: showLegend, labels: { colors: "#082C14" } },
    plotOptions: { bar: { distributed: true, borderRadius: 4, horizontal: false } },
    dataLabels: { enabled: false },
    tooltip: { x: { show: true }, theme: "light" },
    grid: { borderColor: "#f1f1f1", strokeDashArray: 3 },
  };

  return { options, series };
};
  // Memoizar datos de alerta para optimizar rendimiento
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
      direct: getAlertLevel(Boolean(riskObj?.risk_direct)),
      input:  getAlertLevel(Boolean(riskObj?.risk_input)),
      output: getAlertLevel(Boolean(riskObj?.risk_output)),
    };
  };

  return (
    <>
      {foundFarms.map((farm) => {
        const farmData = summary[farm.id];
        if (!farmData) return null;

        // ✅ Solo claves de año válidas, ordenadas numéricamente
        const allYears = Object.keys(farmData?.inputs?.statistics || {})
          .filter((k) => /^\d{4}$/.test(String(k)))
          .sort((a, b) => Number(a) - Number(b));

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