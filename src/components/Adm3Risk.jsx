import React from "react";
import Chart from "react-apexcharts";

const getRiskLabel = (risk) => {
  if (risk > 2.5) return { label: "Riesgo alto", color: "#D50000", desc: "Riesgo alto de deforestación. Se requiere atención inmediata." };
  if (risk > 1.5) return { label: "Riesgo medio", color: "#FF6D00", desc: "Riesgo medio. Se requiere acción oportuna con mitigación y control." };
  if (risk > 0) return { label: "Riesgo bajo", color: "#FFD600", desc: "Riesgo bajo. Se recomienda monitoreo." };
  return { label: "Sin riesgo", color: "#00C853", desc: "No se han identificado riesgos en esta zona." };
};

const RiskPopup = ({ detail, riskData, yearStart }) => {
  if (!detail || !riskData) return null;

  const riesgoTotal = riskData.risk_total;
  const risk = getRiskLabel(riesgoTotal);
  // Solo un dato real de 2024
  const historial = [
    { year: yearStart, value: riesgoTotal }
  ];

  const series = [
    {
      name: "Riesgo",
      data: historial.map((item) => item.value),
    },
  ];

  const get_departamento = () => {
    return detail.label.split(",")[0].trim() || "Desconocido";
  }

  const options = {
    chart: {
      type: "bar",
      height: 250,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        distributed: true,
        borderRadius: 6,
      },
    },
    colors: historial.map((item) => getRiskLabel(item.value).color),
    xaxis: {
      categories: historial.map((item) => item.year),
      labels: { style: { fontSize: "12px" } },
    },
    yaxis: {
      title: { text: "Nivel de Riesgo" },
      labels: { formatter: (val) => val.toFixed(1) },
    },
    tooltip: {
      y: { formatter: (val) => val.toFixed(2) },
    },
    legend: { show: false },
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        minWidth: 600,
        maxWidth: 850,
        background: "#fff",
        borderRadius: 12,
        overflow: "hidden",
        
        fontSize: "15px",
      }}
    >
      <div style={{ flex: 1, padding: "20px", borderRight: "1px solid #eee" }}>
        <h3 style={{ marginBottom: 8 }}>Departamento: {get_departamento()}</h3>
        <h4 style={{ marginBottom: 8 }}>Municipio: {detail.adm2_name}</h4>
        <h2 style={{ margin: 0 }}>Vereda: {detail.name}</h2>
        <p style={{ marginTop: 12, marginBottom: 6 }}><strong>Riesgo Total {yearStart}</strong></p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: risk.color,
            }}
          />
          <span>{risk.label}</span>
        </div>
        {/* <p style={{ marginTop: 10 }}>{risk.desc}</p> */}
        <p style={{ margin: "6px 0" }}><strong>Area deforestada</strong></p>
        <p style={{ margin: "6px 0" }}> {riskData.def_ha} (ha)</p>
        <p style={{ margin: "6px 0" }}><strong>Cantidad de fincas</strong></p>
        <p style={{ margin: "6px 0" }}>{riskData.farm_amount} Fincas</p>
      </div>
      <div style={{ flex: 1.2, padding: "20px" }}>
        <h4 style={{ marginBottom: 12 }}>Riesgos Históricos</h4>
        <Chart options={options} series={series} type="bar" height={250} width="100%" />
      </div>
    </div>
  );
};

export default RiskPopup;
