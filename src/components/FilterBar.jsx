"use client";

import { useEffect, useState, useMemo } from "react";
import Toast from "@/components/Toast";
import {
  fetchEnterprises,
  fetchAnalysisYearRanges,
  fetchFarmBySITCode,
  searchAdmByName,
} from "@/services/apiService";

export default function FilterBar({
  risk,
  setRisk,
  year,
  setYear,
  source,
  setSource,
  search,
  setSearch,
  onSearch,
  enterpriseRisk = false,
  farmRisk = false,
  nationalRisk = false,
  admLevel,
  setAdmLevel,
  onAdmSearch,
  selectedEnterprise,
  setSelectedEnterprise,
  foundFarms,
  setFoundFarms,
  foundAdms,
  setFoundAdms,
  onYearStartEndChange,
  riskOptions,
  period,
  setPeriod
}) {
  const [yearRanges, setYearRanges] = useState([]);
  const [toast, setToast] = useState(null);
  const [enterpriseList, setEnterpriseList] = useState([]);
  const [filteredEnterprises, setFilteredEnterprises] = useState([]);
  const [admSuggestions, setAdmSuggestions] = useState([]);

  // Utilidad: normaliza a string seguro
  const asId = (v) => (v == null ? "" : String(v));

  // ====== Empresas (solo si enterpriseRisk) ======
  useEffect(() => {
    if (!enterpriseRisk) return;
    fetchEnterprises()
      .then(setEnterpriseList)
      .catch(() =>
        setToast({ type: "alert", message: "Error al cargar empresas" })
      );
  }, [enterpriseRisk]);

  useEffect(() => {
    if (enterpriseRisk && search.trim() !== "") {
      const term = search.toLowerCase();
      const filtered = enterpriseList.filter((ent) =>
        ent.name.toLowerCase().includes(term)
      );
      setFilteredEnterprises(filtered);
    } else {
      setFilteredEnterprises([]);
    }
  }, [search, enterpriseList, enterpriseRisk]);

  // ====== Rangos de años (reactivo a source/risk) ======
  useEffect(() => {
    let aborted = false;

    async function loadYears() {
      try {
        const data = await fetchAnalysisYearRanges(source, risk);
        if (aborted) return;

        const arr = Array.isArray(data) ? data : [];
        setYearRanges(arr);

        // Autoselección del primer rango si no hay `year` aún
        if ((!year || year === "") && arr.length > 0) {
          const first = arr[0];
          const firstId = asId(first.id);
          setPeriod(first);
          setYear(firstId);
          onYearStartEndChange?.(first.deforestation_year_start, first.deforestation_year_end);
        }

        if (!arr.length) {
          setToast({
            type: "alert",
            message: "No se encontraron años disponibles",
          });
        }
      } catch {
        if (!aborted) {
          setToast({
            type: "alert",
            message: "No se encontraron años disponibles",
          });
        }
      }
    }

    loadYears();
    return () => {
      aborted = true;
    };
  }, [source, risk]); // 👈 ahora responde cuando cambian source/risk

  // ====== Sugerencias ADM (debounced) ======
  useEffect(() => {
    if (!search) return;
    const delay = setTimeout(async () => {
      try {
        const results = await searchAdmByName(search, admLevel);
        setAdmSuggestions(results || []);
      } catch (error) {
        // Evitar ruido de log en producción
        if (process.env.NODE_ENV !== "production") {
          console.error("Error al buscar sugerencias ADM:", error);
        }
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [search, admLevel, nationalRisk]);

  // Limpiar sugerencias si búsqueda está vacía
  useEffect(() => {
    if (search.trim() === "") {
      setAdmSuggestions([]);
    }
  }, [search]);

  // ====== Búsqueda diferida (SIT_CODE) ======
  useEffect(() => {
    if (!farmRisk || foundFarms.length === 0) return;

    const delay = setTimeout(async () => {
      const pendingCodes = foundFarms
        .filter((f) => !f.id && f.code)
        .map((f) => f.code)
        .join(",");

      if (!pendingCodes) return;

      try {
        const data = await fetchFarmBySITCode(pendingCodes);

        if (!data || data.length === 0) {
          setToast({
            type: "alert",
            message: `No se encontraron fincas para: ${pendingCodes}`,
          });

          // Eliminar los SIT CODE no válidos
          setFoundFarms((prev) =>
            prev.filter((f) => !pendingCodes.split(",").includes(f.code))
          );

          return;
        }

        const updatedFarms = data.map((f) => {
          const code = f.ext_id.find((ext) => ext.source === "SIT_CODE")
            ?.ext_code;
          return { id: f.id, code };
        });

        setFoundFarms((prev) => {
          const confirmed = prev.filter((f) => f.id);
          const combined = [...confirmed];

          updatedFarms.forEach((newFarm) => {
            if (!combined.find((f) => f.id === newFarm.id)) {
              combined.push(newFarm);
            }
          });

          return combined;
        });
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error fetching SIT_CODE:", error);
        }
        setToast({
          type: "alert",
          message: "Error de red al buscar los SIT CODE",
        });
      }
    }, 4000);

    return () => clearTimeout(delay);
  }, [foundFarms, farmRisk, setFoundFarms]);

  // ====== Submit principal ======
  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (!trimmed) return;

    if (farmRisk) {
      if (!risk || !year || !source) {
        setToast({
          type: "warning",
          message: "Debes seleccionar Riesgo, Año y Fuente antes de buscar",
        });
        return;
      }

      if (foundFarms.length >= 5) {
        setToast({ type: "warning", message: "Máximo 5 SIT CODE permitidos" });
        return;
      }

      if (!foundFarms.find((f) => f.code === trimmed)) {
        setFoundFarms((prev) => [...prev, { id: null, code: trimmed }]);
      }

      setSearch("");
      return;
    }

    if (enterpriseRisk) return;

    if (nationalRisk) {
      console.log("buscando" + trimmed);
      onAdmSearch(trimmed, admLevel);
      return;
    }

    onSearch?.(e);
  };

  const selectStyle =
    "appearance-none bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-full py-2 px-4 pr-8 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500";

  const icon = (
    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  return (
    <div className="absolute top-4 left-[88px] right-4 z-[1000] flex gap-4 items-center">
      {/* Select source */}
      <div className="relative">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className={selectStyle}
        >
          <option value="smbyc">SMBYC</option>
        </select>
        {icon}
      </div>

      {/* Select risk/modality */}
      <div className="relative">
        <select
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          className={selectStyle}
        >
          {riskOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {icon}
      </div>

      {/* Select period */}
      <div className="relative">
        <select
          value={asId(year)}
          onChange={(e) => {
            const selectedId = e.target.value; // string
            setYear(selectedId);
            const selected = yearRanges.find((y) => asId(y.id) === selectedId);
            setPeriod(selected);
            if (selected) {
              onYearStartEndChange?.(selected.deforestation_year_start, selected.deforestation_year_end);
            } else {
              onYearStartEndChange?.(null, null);
            }
          }}
          className={selectStyle}
        >
          {yearRanges.map((item) => (
            <option key={item.id} value={asId(item.id)}>
              {item.deforestation_year_start} - {item.deforestation_year_end}
            </option>
          ))}
        </select>
        {icon}
      </div>

      {/* Search input */}
      <form onSubmit={handleSearch} className="flex flex-col gap-2 flex-grow min-w-[200px]">
        <div className="relative w-full max-w-md">
          <div className="flex items-center bg-white rounded-full shadow-md overflow-hidden border border-gray-300">
            <input
              type="text"
              placeholder={
                farmRisk
                  ? "Buscar SIT CODE"
                  : enterpriseRisk
                  ? "Buscar empresa"
                  : "Buscar sitio"
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-grow px-4 py-2 text-sm text-gray-700 bg-transparent focus:outline-none"
            />
            <button
              type="submit"
              className="bg-green-700 hover:bg-green-800 text-white p-2 rounded-full m-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
                />
              </svg>
            </button>
          </div>

          {/* Sugerencias empresa */}
          {enterpriseRisk &&
            filteredEnterprises.length > 0 &&
            !selectedEnterprise && (
              <ul className="absolute left-0 right-0 top-full mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-[1000] max-h-48 overflow-y-auto">
                {filteredEnterprises.map((ent) => (
                  <li
                    key={ent.id}
                    onClick={() => {
                      setSelectedEnterprise(ent);
                      setSearch("");
                      setFilteredEnterprises([]);
                    }}
                    className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                  >
                    {ent.name}
                  </li>
                ))}
              </ul>
            )}

          {/* Sugerencias ADM */}
          {nationalRisk && admSuggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-[1000] max-h-48 overflow-y-auto">
              {admSuggestions.map((item) => (
                <li
                  key={item.id}
                  onClick={() => {
                    if (foundAdms.length >= 5) {
                      setToast({
                        type: "warning",
                        message: "Máximo 5 elementos permitidos",
                      });
                      return;
                    }
                    if (!foundAdms.find((adm) => adm.id === item.id)) {
                      setFoundAdms((prev) => [
                        ...prev,
                        { id: item.id, adm3name: item.name },
                      ]);
                    }
                    setSearch("");
                    setAdmSuggestions([]);
                    onAdmSearch(item.name, admLevel);
                  }}
                  className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                >
                  {item.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Chips SIT_CODE */}
        {farmRisk && foundFarms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {foundFarms.map((farm) => (
              <span
                key={farm.id || farm.code}
                className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center"
              >
                {farm.code}
                <button
                  type="button"
                  onClick={() =>
                    setFoundFarms((prev) => prev.filter((f) => f.code !== farm.code))
                  }
                  className="ml-2 text-red-500 hover:text-red-700 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Chip empresa seleccionada */}
        {enterpriseRisk && selectedEnterprise && (
          <div className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center w-fit">
            {selectedEnterprise.name}
            <button
              type="button"
              onClick={() => setSelectedEnterprise(null)}
              className="ml-2 text-red-500 hover:text-red-700 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Chips ADM seleccionados */}
        {nationalRisk && foundAdms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {foundAdms.map((adm) => (
              <span
                key={adm.id}
                className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center"
              >
                {adm.adm3name}
                <button
                  type="button"
                  onClick={() =>
                    setFoundAdms((prev) => prev.filter((a) => a.id !== adm.id))
                  }
                  className="ml-2 text-red-500 hover:text-red-700 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </form>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
