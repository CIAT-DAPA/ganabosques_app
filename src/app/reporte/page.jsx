"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import FilterBar from "@/components/FilterBar";
import { fetchAdm3RiskByAdm3AndType } from "@/services/apiService";
import Adm3HistoricalRisk from "@/components/Adm3HistoricalRisk";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const CSS_CLASSES = {
  pageContainer: "min-h-screen bg-[#FCFFF5]",
  headerSection: "bg-[#FCFFF5] p-6 md:p-12",
  contentWrapper: "max-w-7xl mx-auto",
  title: "text-3xl md:text-5xl font-heading font-bold mb-3 text-[#082C14]",
  separator: "border-[#082C14] border-t-1 mb-4",
  description: "text-lg font-plus-jakarta text-[#082C14] font-medium",
  mapContainer: "w-full",
};


function CsvUpload({ onFile, onData, disabled = false }) {
  const [hover, setHover] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const validateAndSet = (file) => {
    if (!file) return;
    const isCsv =
      file.type === "text/csv" ||
      file.name.toLowerCase().endsWith(".csv") ||
      file.type === "";

    if (!isCsv) {
      setError("Solo se permiten archivos .csv");
      setFileName("");
      onFile?.(null);
      onData?.([]);
      return;
    }

    setError("");
    setFileName(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    onFile?.(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? "");
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        onData?.([]);
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim());
      const rows = lines.slice(1).map((line) => line.split(","));

      const data = rows.map((cols) =>
        headers.reduce((acc, h, i) => {
          acc[h] = (cols[i] ?? "").trim();
          return acc;
        }, {})
      );

      onData?.(data);
    };
    reader.readAsText(file);
  };

  const onChange = (e) => validateAndSet(e.target.files?.[0]);

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHover(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    validateAndSet(file);
  };

  return (
    <div className="mt-6">
      <label className="block text-[#082C14] font-semibold mb-2">
        Sube tu archivo CSV
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setHover(true);
        }}
        onDragLeave={() => setHover(false)}
        onDrop={onDrop}
        className={[
          "rounded-2xl border-2 border-dashed transition-all p-6 md:p-8",
          "bg-white/70 shadow-sm",
          hover ? "border-emerald-600 bg-emerald-50" : "border-[#082C14]/20",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        ].join(" ")}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        aria-disabled={disabled}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M12 16V4m0 0l-3 3m3-3l3 3M4 16a4 4 0 004 4h8a4 4 0 004-4"
              strokeWidth="1.5"
            />
          </svg>
          <p className="text-[#082C14] font-medium">
            Arrastra y suelta tu archivo .csv aquí
          </p>
          <p className="text-[#082C14]/70 text-sm">
            o haz clic para seleccionar desde tu dispositivo
          </p>

          <button
            type="button"
            className="mt-3 px-4 py-2 rounded-xl border border-[#082C14] text-[#082C14] hover:bg-[#082C14] hover:text-white transition"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            disabled={disabled}
          >
            Elegir archivo CSV
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onChange}
            className="hidden"
            aria-label="Seleccionar archivo CSV"
            disabled={disabled}
          />

          {fileName && (
            <p className="mt-3 text-sm text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              {fileName}
            </p>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-700 bg-red-50 px-3 py-1 rounded-md">
              {error}
            </p>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-[#082C14]/70">
        Formato aceptado: <span className="font-semibold">.csv</span>
      </p>
    </div>
  );
}


function normalizeId(val) {
  if (typeof val !== "string") return val ?? "";
  const m = val.match(/ObjectId\(['"]?([0-9a-fA-F]{24})['"]?\)/);
  if (m?.[1]) return m[1];
  return val.trim().replace(/^"|"$/g, "");
}

function getAdm3IdsFromCsv(csvRows) {
  if (!Array.isArray(csvRows)) return [];
  const out = [];
  for (const r of csvRows) {
    if (r && r.id) {
      const v = normalizeId(String(r.id));
      if (v) out.push(v);
    }
  }
  return Array.from(new Set(out));
}

async function fetchAdm3Batched(ids, type, batchSize = 400) {
  if (ids.length <= batchSize) {
    return fetchAdm3RiskByAdm3AndType(ids, type);
  }
  const parts = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    parts.push(ids.slice(i, i + batchSize));
  }
  const results = await Promise.all(
    parts.map((slice) => fetchAdm3RiskByAdm3AndType(slice, type))
  );
  if (results.every((r) => typeof r === "object" && !Array.isArray(r))) {
    return Object.assign({}, ...results);
  }
  if (results.every((r) => Array.isArray(r))) {
    return results.flat();
  }
  return results;
}

/* ============
   Helpers de filtro
   ============ */
function yearFromDateLike(v) {
  if (!v) return null;
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) return d.getFullYear();
  const m = String(v).match(/(\d{4})/);
  return m ? Number(m[1]) : null;
}

function yearsFromLabels(labels, pick) {
  const years = new Set();
  for (const lab of labels || []) {
    const parts = String(lab).split("-");
    if (parts.length >= 2) {
      const y = pick === "start" ? Number(parts[0]) : Number(parts[1]);
      if (!Number.isNaN(y)) years.add(y);
    }
  }
  return years;
}

function filterAnalysisByLabels(analysis, labels, risk) {
  if (!analysis || !labels?.length) return [];
  const pick = risk === "annual" ? "start" : "end";
  const targetYears = yearsFromLabels(labels, pick);

  const out = [];
  for (const [adm3Id, rec] of Object.entries(analysis)) {
    const items = Array.isArray(rec.items)
      ? rec.items.filter((it) => {
          const yr =
            pick === "start"
              ? yearFromDateLike(it?.period_start)
              : yearFromDateLike(it?.period_end);
          return yr != null && targetYears.has(yr);
        })
      : [];
    if (items.length > 0) {
      out.push({ ...rec, items });
    }
  }
  return out;
}

/* ============
   Página
   ============ */
export default function Reporte() {
  useEffect(() => {
    document.title = "Ganabosques - Alertas nacionales";
  }, []);

  const riskOptions = useMemo(
    () => [
      { value: "annual", label: "Riesgo anual" },
      { value: "cumulative", label: "Riesgo acumulado" },
    ],
    []
  );

  const [risk, setRisk] = useState(riskOptions[0]?.value || "annual");
  const [year, setYear] = useState("");
  const [period, setPeriod] = useState("");
  const [source, setSource] = useState("smbyc");
  const [search, setSearch] = useState("");
  const [selectedEnterprise, setSelectedEnterprise] = useState(null);
  const [foundFarms, setFoundFarms] = useState([]);
  const [foundAdms, setFoundAdms] = useState([]);
  const [admLevel, setAdmLevel] = useState("adm1");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [yearStart, setYearStart] = useState(2023);
  const [yearEnd, setYearEnd] = useState(2024);
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [reportType, setReportType] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const handleYearStartEndChange = useCallback((start, end) => {
    setYearStart(start);
    setYearEnd(end);
  }, []);

  const periodLabels = useMemo(() => {
    return selectedPeriods.map((p) => {
      const start = p.deforestation_period_start
        ? new Date(p.deforestation_period_start).getFullYear()
        : "";
      const end = p.deforestation_period_end
        ? new Date(p.deforestation_period_end).getFullYear()
        : "";
      return `${start}-${end}`;
    });
  }, [selectedPeriods]);

  const handleGenerateReport = useCallback(async () => {
    if (!csvData?.length || !reportType) return;
    setLoading(true);
    setErrorMsg("");
    setAnalysis(null);

    try {
      if (reportType === "vereda") {
        const adm3Ids = getAdm3IdsFromCsv(csvData);
        if (adm3Ids.length === 0) {
          throw new Error("No se encontraron IDs en la columna 'id' del CSV.");
        }
        const data = await fetchAdm3Batched(adm3Ids, risk, 400);
        setAnalysis(data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Error generando el reporte.");
    } finally {
      setLoading(false);
    }
  }, [csvData, reportType, risk]);

  const handleDownloadPdf = useCallback(async () => {
  const el = document.getElementById("report-results");
  if (!el) return;

  try {
    const { jsPDF } = await import("jspdf");
    const html2canvas = (await import("html2canvas-pro")).default;

    // Renderizar el elemento a canvas (usa oklch sin fallar)
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    const imgW = pdfW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let position = 0;
    let heightLeft = imgH;

    pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
    heightLeft -= pdfH;

    // Añadir más páginas si hace falta
    while (heightLeft > 0) {
      position = heightLeft - imgH;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
      heightLeft -= pdfH;
    }

    pdf.save("reporte_adm3.pdf");
  } catch (err) {
    console.error("Error generando PDF:", err);
  }
}, []);

  const filteredAnalysis = useMemo(() => {
    return filterAnalysisByLabels(analysis, periodLabels, risk);
  }, [analysis, periodLabels, risk]);

  return (
    <main className={`${CSS_CLASSES.pageContainer} flex flex-col`}>
      <header className={CSS_CLASSES.headerSection}>
        <div className={CSS_CLASSES.contentWrapper}>
          <h1 className={CSS_CLASSES.title}>Reporte</h1>
          <hr className={CSS_CLASSES.separator} />
          <p className={CSS_CLASSES.description}>
            En esta Sección podrás generar reportes asociados a deforestación y ganadería en Colombia, solo debes subir un archivo CSV con los códigos SIT de las veredas que deseas analizar. Puedes descargar una plantilla de ejemplo <a href="/adm3ids.csv" className="underline font-semibold">aquí</a>.
          </p>

          <p className={CSS_CLASSES.description}>
            Por favor seleccione el tipo de riesgo, tipo de reporte  y los periodos de deforestación que desea analizar.
          </p>
        </div>
        
      </header>

      <section className={CSS_CLASSES.mapContainer}>
        <div className="relative max-w-7xl mx-auto p-6 md:p-12">
          <FilterBar
            risk={risk}
            setRisk={setRisk}
            year={year}
            setYear={setYear}
            source={source}
            setSource={setSource}
            search={search}
            setSearch={setSearch}
            onSearch={(e) => e.preventDefault()}
            enterpriseRisk={false}
            farmRisk={false}
            selectedEnterprise={selectedEnterprise}
            setSelectedEnterprise={setSelectedEnterprise}
            foundFarms={foundFarms}
            setFoundFarms={setFoundFarms}
            nationalRisk={false}
            admLevel={admLevel}
            setAdmLevel={setAdmLevel}
            foundAdms={foundAdms}
            setFoundAdms={setFoundAdms}
            onYearStartEndChange={handleYearStartEndChange}
            riskOptions={riskOptions}
            period={period}
            setPeriod={setPeriod}
            report={true}
            reportType={reportType}
            setReportType={setReportType}
            multiPeriod={true}
            onPeriodsChange={setSelectedPeriods}
          />

          {reportType !== "" && (
            <>
              <CsvUpload onFile={(file) => setCsvFile(file)} onData={setCsvData} disabled={loading} />
              {errorMsg && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  {errorMsg}
                </div>
              )}

              {csvData?.length > 0 && (
                <div className="mt-6 flex items-center justify-between gap-4">
                  <div className="text-sm text-[#082C14]/70">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                      {csvData.length} fila{csvData.length === 1 ? "" : "s"} listas
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className="relative inline-flex items-center gap-3 rounded-2xl px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg"
                  >
                    {loading ? "Generando..." : "Generar reporte"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {filteredAnalysis?.length > 0 && !loading && (
          <>
            <div className="w-4/5 mx-auto bg-white rounded-2xl shadow-md p-6 mt-8" id="report-results">
              <h3 className="text-xl font-semibold text-[#082C14] mb-4">Resultados del análisis</h3>
              <Adm3HistoricalRisk adm3RiskHistory={filteredAnalysis} />
            </div>

            <div className="w-4/5 mx-auto mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 bg-[#082C14] text-white shadow-md hover:shadow-lg hover:bg-[#0b3b1b] transition mb-8"
              >
                Descargar reporte (PDF)
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}