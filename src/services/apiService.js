const API_URL = "https://ganaapi.alliance.cgiar.org/";
//const API_URL = "http://127.0.0.1:8000//";

export async function fetchEnterprises() {
  const res = await fetch(API_URL + "enterprise/");
  if (!res.ok) throw new Error("Error al cargar empresas");
  return res.json();
}

export async function fetchAnalysisYearRanges(source, type) {
  const res = await fetch(API_URL + "analysis/");
  if (!res.ok) throw new Error("No se encontró el analysis");
  const data = await res.json();
  if (!Array.isArray(data)) return [];

  const s = source ? source.toString().trim().toLowerCase() : null;
  const t = type ? type.toString().trim().toLowerCase() : null;
  return data.filter((item) => {
    const bySource = !s || (item.deforestation_source && item.deforestation_source.toLowerCase() === s);
    const byType = !t || (item.deforestation_type && item.deforestation_type.toLowerCase() === t);
    return bySource && byType;
  });
}

export async function fetchYearRanges(source, type) {
  const res = await fetch(API_URL + "deforestation/");
  if (!res.ok) throw new Error("No se encontró el periodo de tiempo");
  const data = await res.json();
  if (!Array.isArray(data)) return [];

  const s = source ? source.toString().trim().toLowerCase() : null;
  const t = type ? type.toString().trim().toLowerCase() : null;
  return data.filter((item) => {
    const bySource = !s || (item.deforestation_source && item.deforestation_source.toLowerCase() === s);
    const byType = !t || (item.deforestation_type && item.deforestation_type.toLowerCase() === t);
    return bySource && byType;
  });
}

export async function fetchFarmBySITCode(code) {
  const res = await fetch(
    `${API_URL}farm/by-extid?ext_codes=${code}&labels=SIT_CODE`
  );
  if (!res.ok) throw new Error("Error de red al buscar el SIT CODE");
  return res.json();
}

export async function searchAdmByName(name, level) {
  /*const url = `${API_URL}${level}/by-name?name=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error al buscar en ${level}`);
  return res.json();*/
  const url = `${API_URL}adm3/by-label?label=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error al buscar en sitios`);
  return res.json();
}
export async function fetchFarmPolygonsByIds(ids) {
  if (!ids || ids.length === 0) return [];

  const url = `${API_URL}farmpolygons/by-farm?ids=${ids}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener polígonos de fincas");
  return res.json();
}
export async function fetchMovementStatisticsByFarmIds(ids) {
  if (!ids || ids.length === 0) return [];

  const url = `${API_URL}movement/statistics-by-farmid?ids=${ids.join(",")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener estadísticas de movimiento");
  return res.json();
}
export async function fetchAdm3RisksByAnalysisAndAdm3(analysisId, adm3Ids) {
  if (!analysisId || !Array.isArray(adm3Ids) || adm3Ids.length === 0) return [];

  const url = API_URL + "adm3risk/by-analysis-and-adm3";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      analysis_ids: [analysisId],
      adm3_ids: adm3Ids,
    }),
  });

  if (!res.ok) throw new Error("Error al obtener adm3 risks");
  return res.json();
}

export async function fetchFarmRiskByDeforestationId(deforestationId) {
  if (!deforestationId) return [];

  const url = `${API_URL}farmrisk/by-analysis-and-farm?deforestation_id=${deforestationId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error en la respuesta del servidor");

  return res.json();
}

export async function fetchAdm3DetailsByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const url = `${API_URL}adm3/by-ids?ids=${ids.join(",")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener detalles de adm3");

  return res.json();
}

export async function fetchFarmRiskByAnalysisAndFarm(analysisId, farmIds) {
  if (!analysisId || !Array.isArray(farmIds) || farmIds.length === 0) return [];

  const url = API_URL + "farmrisk/by-analysis-and-farm";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      analysis_ids: [analysisId],
      farm_ids: farmIds,
    }),
  });

  if (!res.ok) throw new Error("Error al consultar riesgo de fincas");

  return res.json();
}
export async function fetchAdm3RiskByAdm3AndType(adm3Ids, type) {
  if (!Array.isArray(adm3Ids) || adm3Ids.length === 0) return {};
  const t = (type || "").toString().trim().toLowerCase();
  if (t !== "annual" && t !== "cumulative") {
    throw new Error("El parámetro 'type' debe ser 'annual' o 'cumulative'");
  }

  const url = API_URL + "adm3risk/by-adm3-and-type";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      adm3_ids: adm3Ids,
      type: t,
    }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const err = await res.json();
      detail = err?.detail ? `: ${err.detail}` : "";
    } catch (_) {}
    throw new Error(`Error al obtener adm3 risks${detail}`);
  }

  return res.json();
}
export async function searchEnterprisesByName(name) {
  const url = `${API_URL}enterprise/by-name?name=${encodeURIComponent(
    name
  )}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al buscar empresas por nombre");
  return res.json();
}

export async function getEnterpriseRiskDetails(analysisId, enterpriseIds = []) {
  const url = API_URL + "enterprise-risk/details/by-enterprise";

  const payload = {
    analysis_id: analysisId,
    enterprise_ids: enterpriseIds,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Error al obtener detalles de riesgo de la empresa");
  }

  return res.json();
}
