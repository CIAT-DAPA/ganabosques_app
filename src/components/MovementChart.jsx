"use client";

import React, { useState } from "react";
import Chart from "react-apexcharts";

export default function MovementCharts({ summary = {}, foundFarms = [], yearStart }) {
  const baseColors = [
    "#a3d977", "#7ab86b", "#568c5e", "#366f50", "#1f5043",
    "#e9a25f", "#de7c48", "#cc5a33", "#b3411f", "#993014",
    "#7a9e9f", "#d2c29d", "#d26a5c", "#8c8c8c", "#546e7a"
  ];

  console.log("📊 Datos recibidos:", summary);
  console.log("📅 Año de inicio:", yearStart);

  const [legendEntradaMap, setLegendEntradaMap] = useState({});
  const [legendSalidaMap, setLegendSalidaMap] = useState({});

  const toggleLegendEntrada = (id) => {
    setLegendEntradaMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleLegendSalida = (id) => {
    setLegendSalidaMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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
      chart: {
        type: "bar",
        height: 350,
      },
      title: {
        text: yearStart ? `${title} (${yearStart})` : title,
        style: { fontSize: "16px", fontWeight: 600 },
      },
      xaxis: {
        categories,
        labels: { show: false },
        axisTicks: { show: false },
        axisBorder: { show: false },
      },
      colors: categories.map((_, i) => baseColors[i % baseColors.length]),
      legend: {
        show: showLegend,
      },
      plotOptions: {
        bar: {
          distributed: true,
          borderRadius: 0,
          horizontal: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        x: { show: true },
      },
    };

    return { options, series };
  };

  if (!Array.isArray(foundFarms) || foundFarms.length === 0) {
    return <p className="text-gray-500 p-4">No hay predios seleccionados.</p>;
  }

  return (
    <>
      {foundFarms.map((farm) => {
        const data = summary[farm.id];
        if (!data) return null;

        const filterStatsExactYear = (stats) => {
          if (!stats || !yearStart) return stats;
          return Object.fromEntries(
            Object.entries(stats).filter(([year]) => parseInt(year) === yearStart)
          );
        };

        const filteredInputsStats = filterStatsExactYear(data.inputs?.statistics);
        const filteredOutputsStats = filterStatsExactYear(data.outputs?.statistics);

        const showLegendEntrada = legendEntradaMap[farm.id] || false;
        const showLegendSalida = legendSalidaMap[farm.id] || false;

        const hasEntradaData =
          filteredInputsStats &&
          Object.keys(filteredInputsStats).length > 0 &&
          Object.values(filteredInputsStats).some((speciesGroup) =>
            Object.values(speciesGroup || {}).some((categoryGroup) =>
              Object.values(categoryGroup || {}).some(
                (v) => v && typeof v.headcount === "number" && v.headcount > 0
              )
            )
          );

        const hasSalidaData =
          filteredOutputsStats &&
          Object.keys(filteredOutputsStats).length > 0 &&
          Object.values(filteredOutputsStats).some((speciesGroup) =>
            Object.values(speciesGroup || {}).some((categoryGroup) =>
              Object.values(categoryGroup || {}).some(
                (v) => v && typeof v.headcount === "number" && v.headcount > 0
              )
            )
          );

        const entradaChart = hasEntradaData
          ? buildChartData(filteredInputsStats, "Movilizaciones de Entrada", showLegendEntrada)
          : null;

        const salidaChart = hasSalidaData
          ? buildChartData(filteredOutputsStats, "Movilizaciones de Salida", showLegendSalida)
          : null;

        const label = foundFarms.find((f) => f.id === farm.id)?.sit_code || farm.code;

        return (
          <div
            key={farm.id}
            className="bg-white rounded-xl border border-green-300 p-6 m-10"
          >
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="w-full md:w-1/4 border-r pr-6">
                <p className="text-sm text-gray-500 mb-2">Predio</p>
                <h2 className="text-2xl font-semibold text-green-800 mb-4">
                  SIT - {label}
                </h2>
              </div>

              <div className="w-full md:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {entradaChart ? (
                    <>
                      <Chart
                        options={entradaChart.options}
                        series={entradaChart.series}
                        type="bar"
                        height={300}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => toggleLegendEntrada(farm.id)}
                          className="text-sm text-black flex items-center gap-1 cursor-pointer"
                        >
                          {showLegendEntrada ? "Ocultar leyendas" : "Mostrar leyendas"}
                          <span className={showLegendEntrada ? "rotate-180" : "rotate-0"}>
                            ▼
                          </span>
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
                  {salidaChart ? (
                    <>
                      <Chart
                        options={salidaChart.options}
                        series={salidaChart.series}
                        type="bar"
                        height={300}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => toggleLegendSalida(farm.id)}
                          className="text-sm text-black flex items-center gap-1 cursor-pointer"
                        >
                          {showLegendSalida ? "Ocultar leyendas" : "Mostrar leyendas"}
                          <span className={showLegendSalida ? "rotate-180" : "rotate-0"}>
                            ▼
                          </span>
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
      })}
    </>
  );
}
