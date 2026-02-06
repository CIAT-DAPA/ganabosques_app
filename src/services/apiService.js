// API Service - Centralized API calls
import { API_URL } from "./config";

// Create auth headers
function authHeaders(token, extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

// Generic API request helper
async function apiRequest(url, options = {}, errorMessage = "Error en la solicitud") {
  const res = await fetch(url, options);
  if (!res.ok) {
    let detail = "";
    try {
      const err = await res.json();
      detail = err?.detail ? `: ${err.detail}` : "";
    } catch (_) {}
    throw new Error(`${errorMessage}${detail}`);
  }
  return res.json();
}

// GET request with auth
async function authGet(token, endpoint, errorMessage) {
  return apiRequest(
    API_URL + endpoint,
    { headers: authHeaders(token, { Accept: "application/json" }) },
    errorMessage
  );
}

// POST request with auth
async function authPost(token, endpoint, body, errorMessage) {
  return apiRequest(
    API_URL + endpoint,
    {
      method: "POST",
      headers: authHeaders(token, {
        "Content-Type": "application/json",
        Accept: "application/json",
      }),
      body: JSON.stringify(body),
    },
    errorMessage
  );
}

// Enterprise APIs
export async function fetchEnterprises(token) {
  return authGet(token, "enterprise/", "Error al cargar empresas");
}

export async function searchEnterprisesByName(token, name) {
  const endpoint = `enterprise/by-name?name=${encodeURIComponent(name)}`;
  return authGet(token, endpoint, "Error al buscar empresas por nombre");
}

export async function getEnterpriseRiskDetails(token, analysisId, enterpriseIds = []) {
  return authPost(
    token,
    "enterprise-risk/details/by-enterprise",
    { analysis_id: analysisId, enterprise_ids: enterpriseIds },
    "Error al obtener detalles de riesgo de la empresa"
  );
}

// Analysis APIs
export async function fetchAnalysisYearRanges(token, source, type) {
  const data = await authGet(token, "analysis/", "No se encontró el analysis");
  if (!Array.isArray(data)) return [];

  const s = source ? source.toString().trim().toLowerCase() : null;
  const t = type ? type.toString().trim().toLowerCase() : null;
  
  return data.filter((item) => {
    const bySource = !s || (item.deforestation_source?.toLowerCase() === s);
    const byType = !t || (item.deforestation_type?.toLowerCase() === t);
    return bySource && byType;
  });
}

export async function fetchYearRanges(token, source, type) {
  const data = await authGet(token, "deforestation/", "No se encontró el periodo de tiempo");
  if (!Array.isArray(data)) return [];

  const s = source ? source.toString().trim().toLowerCase() : null;
  const t = type ? type.toString().trim().toLowerCase() : null;
  
  return data.filter((item) => {
    const bySource = !s || (item.deforestation_source?.toLowerCase() === s);
    const byType = !t || (item.deforestation_type?.toLowerCase() === t);
    return bySource && byType;
  });
}

// Farm APIs
export async function fetchFarmBySITCode(token, code) {
  const endpoint = `farm/by-extid?ext_codes=${code}&labels=SIT_CODE`;
  return authGet(token, endpoint, "Error de red al buscar el SIT CODE");
}

export async function fetchFarmPolygonsByIds(token, ids) {
  if (!ids || ids.length === 0) return [];
  const endpoint = `farmpolygons/by-farm?ids=${ids}`;
  return authGet(token, endpoint, "Error al obtener polígonos de fincas");
}

export async function fetchFarmRiskByAnalysisAndFarm(token, analysisId, farmIds) {
  if (!analysisId || !Array.isArray(farmIds) || farmIds.length === 0) return [];
  return authPost(
    token,
    "farmrisk/by-analysis-and-farm",
    { analysis_ids: [analysisId], farm_ids: farmIds },
    "Error al consultar riesgo de fincas"
  );
}

export async function fetchFarmRiskByDeforestationId(token, deforestationId) {
  if (!deforestationId) return [];
  const endpoint = `analysis/by-deforestation?deforestation_id=${deforestationId}`;
  return authGet(token, endpoint, "Error en la respuesta del servidor");
}

export async function fetchFarmRiskByAnalysisId(token, analysisId, pageSize = 20, page = 1) {
  if (!analysisId) return { items: [], page: 1, page_size: pageSize };
  const endpoint = `farmrisk/by-analysis-id?analysis_id=${analysisId}&page=${page}&page_size=${pageSize}`;
  return authGet(token, endpoint, "Error al obtener farm risks por analysis ID");
}

// Movement Statistics APIs
export async function fetchMovementStatisticsByFarmIds(token, ids, startDate, endDate) {
  if (!ids || ids.length === 0) return {};
  let endpoint = `movement/statistics-by-farmid?ids=${ids.join(",")}`;
  if (startDate) endpoint += `&start_date=${startDate}`;
  if (endDate) endpoint += `&end_date=${endDate}`;
  return authGet(token, endpoint, "Error al obtener estadísticas de movimiento");
}

export async function fetchMovementStatisticsByEnterpriseIds(token, ids, startDate, endDate) {
  if (!ids || ids.length === 0) return {};
  let endpoint = `movement/statistics-by-enterpriseid?ids=${ids.join(",")}`;
  if (startDate) endpoint += `&start_date=${startDate}`;
  if (endDate) endpoint += `&end_date=${endDate}`;
  return authGet(token, endpoint, "Error al obtener estadísticas de movimiento por empresa");
}

// ADM APIs
export async function searchAdmByName(token, name, level) {
  const endpoint = `adm3/by-label?label=${encodeURIComponent(name)}`;
  return authGet(token, endpoint, "Error al buscar en sitios");
}

export async function fetchAdm3DetailsByIds(token, ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const endpoint = `adm3/by-ids?ids=${ids.join(",")}`;
  return authGet(token, endpoint, "Error al obtener detalles de adm3");
}

export async function fetchAdm3RisksByAnalysisAndAdm3(token, analysisId, adm3Ids) {
  if (!analysisId || !Array.isArray(adm3Ids) || adm3Ids.length === 0) return [];
  return authPost(
    token,
    "adm3risk/by-analysis-and-adm3",
    { analysis_ids: [analysisId], adm3_ids: adm3Ids },
    "Error al obtener adm3 risks"
  );
}

export async function fetchAdm3RiskByAdm3AndType(token, adm3Ids, type) {
  if (!Array.isArray(adm3Ids) || adm3Ids.length === 0) return {};
  const t = (type || "").toString().trim().toLowerCase();
  if (t !== "annual" && t !== "cumulative") {
    throw new Error("El parámetro 'type' debe ser 'annual' o 'cumulative'");
  }
  return authPost(
    token,
    "adm3risk/by-adm3-and-type",
    { adm3_ids: adm3Ids, type: t },
    "Error al obtener adm3 risks"
  );
}

// Global Risk API
export async function fetchRiskGlobal(
  token,
  entityType,
  ids = [],
  { type = null, analysisIds = null, deforestationIds = null } = {}
) {
  if (!entityType) throw new Error("entityType es requerido");
  if (!Array.isArray(ids) || ids.length === 0) return {};

  const payload = { entity_type: entityType, ids };

  if (Array.isArray(analysisIds) && analysisIds.length > 0) {
    payload.analysis_ids = analysisIds;
  } else if (Array.isArray(deforestationIds) && deforestationIds.length > 0) {
    payload.deforestation_ids = deforestationIds;
  } else {
    const t = (type || "").toString().trim().toLowerCase();
    if (!t) throw new Error("Debes enviar type o analysisIds o deforestationIds");
    payload.type = t;
  }

  return authPost(token, "risk/by-ids-and-type", payload, "Error al obtener riesgos globales");
}