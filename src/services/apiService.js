
export async function fetchEnterprises() {
  const res = await fetch("https://ganaapi.alliance.cgiar.org/enterprise/");
  if (!res.ok) throw new Error("Error al cargar empresas");
  return res.json();
}

export async function fetchAnalysisYearRanges(source, type) {
  const res = await fetch("https://ganaapi.alliance.cgiar.org/analysis/");
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
  const res = await fetch("https://ganaapi.alliance.cgiar.org/deforestation/");
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
    `https://ganaapi.alliance.cgiar.org/farm/by-extid?ext_codes=${code}&labels=SIT_CODE`
  );
  if (!res.ok) throw new Error("Error de red al buscar el SIT CODE");
  return res.json();
}

export async function searchAdmByName(name, level) {
  /*const url = `https://ganaapi.alliance.cgiar.org/${level}/by-name?name=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error al buscar en ${level}`);
  return res.json();*/
  const url = `https://ganaapi.alliance.cgiar.org/adm3/by-label?label=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error al buscar en sitios`);
  return res.json();
}
