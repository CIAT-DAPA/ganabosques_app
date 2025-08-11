
export async function fetchEnterprises() {
  const res = await fetch("http://127.0.0.1:8000/enterprise/");
  if (!res.ok) throw new Error("Error al cargar empresas");
  return res.json();
}

export async function fetchYearRanges() {
  const res = await fetch("http://127.0.0.1:8000/deforestation/");
  if (!res.ok) throw new Error("No se encontró el SIT CODE");
  return res.json();
}

export async function fetchFarmBySITCode(code) {
  const res = await fetch(
    `http://127.0.0.1:8000/farm/by-extid?ext_codes=${code}&labels=SIT_CODE`
  );
  if (!res.ok) throw new Error("Error de red al buscar el SIT CODE");
  return res.json();
}

export async function searchAdmByName(name, level) {
  const url = `http://127.0.0.1:8000/${level}/by-name?name=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error al buscar en ${level}`);
  return res.json();
}
