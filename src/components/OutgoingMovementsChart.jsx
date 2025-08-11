"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function OutgoingMovementsByFarmChart({ movement, foundFarms }) {
  const [charts, setCharts] = useState([]);
console.log(foundFarms)
  useEffect(() => {
    if (!movement || Object.keys(movement).length === 0) {
      setCharts([]);
      return;
    }

    const chartsData = [];

    for (const [farmId, farmMovements] of Object.entries(movement)) {
      const sitCode = foundFarms.find(f => f.id === farmId)?.code || "SIN SIT";
      const salidaCounts = {};

      farmMovements.forEach(entry => {
        if (
          entry.type_origin === "FARM" &&
          entry.movement &&
          Array.isArray(entry.movement)
        ) {
          entry.movement.forEach(mov => {
            const label = mov.label || "Sin etiqueta";
            const amount = Number(mov.amount) || 0;

            if (!salidaCounts[label]) {
              salidaCounts[label] = 0;
            }
            salidaCounts[label] += amount;
          });
        }
      });

      const labels = Object.keys(salidaCounts);
      const values = labels.map(label => salidaCounts[label]);

      if (labels.length === 0) continue;

      chartsData.push({
        farmId,
        sitCode,
        chart: {
          series: [{ name: "Cantidad", data: values }],
          options: {
            chart: { type: "bar", toolbar: { show: false } },
            title: {
              text: `SIT - ${sitCode}`,
              align: "left",
              style: { fontSize: "16px", fontWeight: "600" },
            },
            xaxis: {
              categories: labels,
              labels: { show: false }, // ❌ oculta los labels del eje X
            },
            plotOptions: {
              bar: {
                borderRadius: 4,
                horizontal: false,
                columnWidth: "45%",
                distributed: false, // ✅ usa solo un color para todas las barras
              },
            },
            dataLabels: { enabled: true },
            colors: ["#e67e22"], // 🟠 color único para todas las barras
          },
        },
      });
    }

    setCharts(chartsData);
  }, [movement, foundFarms]);

  return (
    <div className="w-full flex flex-wrap gap-6 mt-8">
      {charts.map(({ farmId, sitCode, chart }) => (
        <div
          key={farmId}
          className="bg-white rounded-lg shadow p-4 w-full max-w-md"
        >
          <div className="text-gray-800 font-semibold mb-2">
            SIT - {sitCode}
          </div>
          <ApexChart
            options={chart.options}
            series={chart.series}
            type="bar"
            height={300}
          />
        </div>
      ))}
    </div>
  );
}
