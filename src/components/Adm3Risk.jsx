import React from "react";

const getRiskLabel = (risk) => {
  if (risk > 2.5)
    return { label: "Riesgo alto", color: "#D50000" };
  if (risk > 1.5)
    return { label: "Riesgo medio", color: "#FF6D00" };
  if (risk > 0)
    return { label: "Riesgo bajo", color: "#FFD600" };
  return { label: "Sin riesgo", color: "#00C853" };
};

const RiskPopup = ({ detail, riskData, yearStart }) => {
  if (!detail || !riskData) return null;

  const riesgoTotal = riskData.risk_total;
  const risk = getRiskLabel(riesgoTotal);

  const get_departamento = () => {
    return detail.label.split(",")[0].trim() || "Desconocido";
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column", // 👉 todo vertical
        minWidth: 300,
        maxWidth: 400,
        background: "#fff",
        borderRadius: 12,
        overflow: "hidden",
        fontSize: "15px",
        padding: "20px",
      }}
    >
      <h3 style={{ marginBottom: 8 }}>Departamento: {get_departamento()}</h3>
      <h4 style={{ marginBottom: 8 }}>Municipio: {detail.adm2_name}</h4>
      <h2 style={{ margin: 0 }}>Vereda: {detail.name}</h2>
      <p style={{ marginTop: 12, marginBottom: 6 }}>
        <strong>Riesgo Total {yearStart}</strong>
      </p>
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
      <p style={{ margin: "6px 0" }}>
        <strong>Área deforestada</strong>
      </p>
      <p style={{ margin: "6px 0" }}> {riskData.def_ha} (ha)</p>
      <p style={{ margin: "6px 0" }}>
        <strong>Cantidad de fincas</strong>
      </p>
      <p style={{ margin: "6px 0" }}>{riskData.farm_amount} Fincas</p>
    </div>
  );
};

export default RiskPopup;
