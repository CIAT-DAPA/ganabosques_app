"use client";

import React, { useState } from "react";
import Chart from "react-apexcharts";

export default function MovementCharts({
  summary = {},
  foundFarms = [],
  riskFarm = {},
}) {
  const baseColors = ["#a3d977", "#7ab86b", "#568c5e", "#366f50", "#1f5043", "#e9a25f", "#de7c48", "#cc5a33", "#b3411f", "#993014", "#7a9e9f", "#d2c29d", "#d26a5c", "#8c8c8c", "#546e7a"];

  const [legendEntradaMap, setLegendEntradaMap] = useState({});
  const [legendSalidaMap, setLegendSalidaMap] = useState({});
console.log("Resumen de movimientos:", summary);
  console.log("Fincas encontradas:", foundFarms);
  console.log("Riesgo de fincas:", riskFarm);
  const toggleLegendEntrada = (id, year) => {
    setLegendEntradaMap((prev) => ({ ...prev, [`${id}-${year}`]: !prev[`${id}-${year}`] }));
  };

  const toggleLegendSalida = (id, year) => {
    setLegendSalidaMap((prev) => ({ ...prev, [`${id}-${year}`]: !prev[`${id}-${year}`] }));
  };

  const buildChartData = (dataByYear, title, showLegend) => {
    const aggregated = {};

    Object.values(dataByYear || {}).forEach((speciesGroup) => {
      Object.values(speciesGroup || {}).forEach((categoryGroup) => {
        Object.entries(categoryGroup || {}).forEach(([category, values]) => {
          aggregated[category] = (aggregated[category] || 0) + (values.headcount || 0);
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
      chart: { type: "bar", height: 350 },
      title: { text: title, style: { fontSize: "16px", fontWeight: 600 } },
      xaxis: {
        categories,
        labels: { show: false },
        axisTicks: { show: false },
        axisBorder: { show: false },
      },
      colors: categories.map((_, i) => baseColors[i % baseColors.length]),
      legend: { show: showLegend },
      plotOptions: {
        bar: {
          distributed: true,
          borderRadius: 0,
          horizontal: false,
        },
      },
      dataLabels: { enabled: false },
      tooltip: { x: { show: true } },
    };

    return { options, series };
  };

  return (
    <>
      {foundFarms.map((farm) => {
        const farmData = summary[farm.id];
        if (!farmData) return null;

        const allYears = Object.keys(farmData?.inputs?.statistics || {})
          .filter((k) => !isNaN(k))
          .sort();

        return allYears.map((year) => {
          const statsEntrada = farmData?.inputs?.statistics?.[year];
          const statsSalida = farmData?.outputs?.statistics?.[year];
          const showLegendEntrada = legendEntradaMap[`${farm.id}-${year}`] || false;
          const showLegendSalida = legendSalidaMap[`${farm.id}-${year}`] || false;

          const entradaChart = statsEntrada
            ? buildChartData({ [year]: statsEntrada.species }, `Entradas (${year})`, showLegendEntrada)
            : null;

          const salidaChart = statsSalida
            ? buildChartData({ [year]: statsSalida.species }, `Salidas (${year})`, showLegendSalida)
            : null;

          const label = farm?.sit_code || farm.code || farm.id;

          const flatRisk = Object.values(riskFarm || {}).flat();
          const riskObj = flatRisk.find((r) => r.farm_id === farm.id);

          const getRiskLevel = (value) => {
            if (value > 2.5) return { color: "bg-red-500", label: "Riesgo alto" };
            if (value > 1.5) return { color: "bg-orange-400", label: "Riesgo medio" };
            if (value > 0) return { color: "bg-yellow-400", label: "Riesgo bajo" };
            return { color: "bg-green-500", label: "Sin riesgo" };
          };

          const direct = getRiskLevel(riskObj?.risk_direct);
          const input = getRiskLevel(riskObj?.risk_input);
          const output = getRiskLevel(riskObj?.risk_output);
          const total = getRiskLevel(riskObj?.risk_total);

          const hasEntrada = entradaChart && entradaChart.series[0]?.data?.some((d) => d > 0);
          const hasSalida = salidaChart && salidaChart.series[0]?.data?.some((d) => d > 0);

          return (
            <div key={`${farm.id}-${year}`} className="bg-white rounded-xl border border-green-300 p-6 m-10">
              <div className="flex flex-col md:flex-row justify-between gap-6">

                {/* PANEL IZQUIERDO */}
                <div className="w-full md:w-1/4 border-r pr-6">
                  <p className="text-sm text-gray-500 mb-2">Predio</p>
                  <h2 className="text-2xl font-semibold text-green-800 mb-4">
                    SIT - {label} / Año: {year}
                  </h2>

                  {/* BLOQUE RIESGO E INDICADORES EN LÍNEA */}
                  <div className="flex flex-col gap-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Riesgos */}
                      <div className="space-y-3">
                        <div className="font-semibold text-gray-600">Riesgos</div>
                        {[
                          { label: "Riesgo Directo", level: direct },
                          { label: "Riesgo Entrada", level: input },
                          { label: "Riesgo Salida", level: output },
                          { label: `Riesgo Total ${year}`, level: total },
                        ].map((item, idx) => (
                          <div key={idx} className="space-y-1">
                            <div>{item.label}</div>
                            <div className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded-full ${item.level.color}`}></span>
                              <span>{item.level.label}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Indicadores adicionales */}
                      <div className="space-y-6">
                        {[{ title: "Deforestación", key: "deforestation" }, { title: "Área Protegida", key: "protected" }].map((section) => (
                          <div key={section.key}>
                            <div className="font-semibold text-gray-600 mb-1">{section.title}</div>
                            <div className="text-sm grid grid-cols-2 gap-y-1">
                              <span>Proporción:</span>
                              <span className="text-right">{(riskObj?.[section.key]?.prop * 100).toFixed(2)}%</span>
                              <span>Hectáreas:</span>
                              <span className="text-right">{riskObj?.[section.key]?.ha.toFixed(2)}</span>
                              <span>Distancia:</span>
                              <span className="text-right">{riskObj?.[section.key]?.distance.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                        <div>
                          <div className="font-semibold text-gray-600 mb-1">Frontera Agrícola</div>
                          <div className={`text-sm font-medium ${riskObj?.farming ? "text-green-600" : "text-red-600"}`}>
                            {riskObj?.farming ? "Dentro de frontera agrícola" : "Fuera de frontera agrícola"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PANEL DERECHO */}
                <div className="w-full md:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {hasEntrada ? (
                      <>
                        <Chart options={entradaChart.options} series={entradaChart.series} type="bar" height={300} />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => toggleLegendEntrada(farm.id, year)}
                            className="text-sm text-black flex items-center gap-1 cursor-pointer"
                          >
                            {showLegendEntrada ? "Ocultar leyendas" : "Mostrar leyendas"}
                            <span className={showLegendEntrada ? "rotate-180" : "rotate-0"}>▼</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No hay datos disponibles para entradas en este periodo.
                      </p>
                    )}
                  </div>

                  <div>
                    {hasSalida ? (
                      <>
                        <Chart options={salidaChart.options} series={salidaChart.series} type="bar" height={300} />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => toggleLegendSalida(farm.id, year)}
                            className="text-sm text-black flex items-center gap-1 cursor-pointer"
                          >
                            {showLegendSalida ? "Ocultar leyendas" : "Mostrar leyendas"}
                            <span className={showLegendSalida ? "rotate-180" : "rotate-0"}>▼</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No hay datos disponibles para salidas en este periodo.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        });
      })}
    </>
  );
}