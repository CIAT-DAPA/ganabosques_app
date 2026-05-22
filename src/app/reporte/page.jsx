"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import FilterBar from "@/components/FilterBar";
import { fetchRiskGlobal, fetchSuppliersByEnterpriseIds } from "@/services/apiService";
import Adm3RiskTable from "@/components/Adm3RiskTable";
import FarmRiskTable from "@/components/FarmRiskTable";
import EnterpriseRiskTable from "@/components/EnterpriseRiskTable";
import FloatingDownloadMenu from "@/components/FloatingDownloadMenu";
import { useAuth } from "@/hooks/useAuth";
import { yearFromDateLike } from "@/utils";
import { RISK_OPTIONS } from "@/contexts/MapFiltersContext";
import { FileText, FileJson } from "lucide-react";
import { fmtProp } from "@/utils";

const CSS_CLASSES = {
  pageContainer: "min-h-screen bg-[#FCFFF5]",
  headerSection: "bg-[#FCFFF5] p-6 md:p-12",
  contentWrapper: "max-w-7xl mx-auto",
  title: "text-3xl md:text-5xl font-heading font-bold mb-3 text-[#082C14]",
  separator: "border-[#082C14] border-t-1 mb-4",
  description: "text-lg font-plus-jakarta text-[#082C14] font-medium",
  mapContainer: "w-full",
};

/* ============
   Helpers de filtro
   ============ */

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
  const { token } = useAuth();

  useEffect(() => {
    document.title = "Ganabosques - Reportes";
  }, []);

  // Use centralized RISK_OPTIONS constant
  const riskOptions = RISK_OPTIONS;

  const [risk, setRisk] = useState(riskOptions[0]?.value || "annual");
  const [year, setYear] = useState("");
  const [period, setPeriod] = useState("");
  const [source, setSource] = useState("smbyc");
  const [search, setSearch] = useState("");
  const [selectedEnterprise, setSelectedEnterprise] = useState([]);
  const [foundFarms, setFoundFarms] = useState([]);
  const [foundAdms, setFoundAdms] = useState([]);
  const [admLevel, setAdmLevel] = useState("adm3");
  const [loading, setLoading] = useState(false);
  const [yearStart, setYearStart] = useState(2023);
  const [yearEnd, setYearEnd] = useState(2024);
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [reportType, setReportType] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);

  // Results state
  const [veredaRiskData, setVeredaRiskData] = useState(null);
  const [farmRiskData, setFarmRiskData] = useState(null);
  const [farmRiskDataForEnterprise, setFarmRiskDataForEnterprise] = useState(null);
  const [enterpriseRiskData, setEnterpriseRiskData] = useState(null);

  // Removed clearing effects to allow partial updates via filtering

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

  // Get analysis IDs from selected periods
  const analysisIds = useMemo(() => {
    return selectedPeriods.map((p) => p.id).filter(Boolean);
  }, [selectedPeriods]);

  // Check if can generate report
  const canGenerateReport = useMemo(() => {
    if (!reportType || analysisIds.length === 0) return false;

    if (reportType === "vereda") {
      return foundAdms.length > 0;
    }
    if (reportType === "finca") {
      return foundFarms.length > 0;
    }
    if (reportType === "empresa") {
      return selectedEnterprise.length > 0;
    }
    return false;
  }, [reportType, analysisIds, foundAdms, foundFarms, selectedEnterprise]);

  const handleGenerateReport = useCallback(async () => {
    if (!canGenerateReport || !token) return;
    setLoading(true);
    setErrorMsg("");
    setVeredaRiskData(null);
    setFarmRiskData(null);
    setEnterpriseRiskData(null);

    try {
      if (reportType === "vereda") {
        const adm3Ids = foundAdms.map((a) => a.id).filter(Boolean);
        if (adm3Ids.length === 0) {
          throw new Error("No se encontraron veredas seleccionadas.");
        }
        const data = await fetchRiskGlobal(token, "adm3", adm3Ids, { analysisIds });
        setVeredaRiskData(data);
      } else if (reportType === "finca") {
        const farmIds = foundFarms.map((f) => f.id).filter(Boolean);
        if (farmIds.length === 0) {
          throw new Error("No se encontraron fincas con IDs válidos.");
        }
        const data = await fetchRiskGlobal(token, "farm", farmIds, { analysisIds });
        setFarmRiskData(data);
      } else if (reportType === "empresa") {
        const enterpriseIds = selectedEnterprise.map((e) => e.id || e._id || e.enterprise_id).filter(Boolean);
        if (enterpriseIds.length === 0) {
          throw new Error("No se encontraron empresas seleccionadas.");
        }
        const data = await fetchRiskGlobal(token, "enterprise", enterpriseIds, { analysisIds });
        const supplers = await fetchSuppliersByEnterpriseIds(token, enterpriseIds);
        const farmIdsByEnterprise = Object.entries(supplers).reduce(
            (acc, [enterpriseId, farms]) => {
              acc[enterpriseId] = farms.map(f => f.farm_id);
              return acc;
            },
            {}
          );
        
        const data_farms = await fetchRiskGlobal(token, "farm", farmIdsByEnterprise[enterpriseIds[0]], { analysisIds });
        setEnterpriseRiskData(data);
        setFarmRiskDataForEnterprise(data_farms);

      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Error generando el reporte.");
    } finally {
      setLoading(false);
    }
  }, [canGenerateReport, token, reportType, foundAdms, foundFarms, selectedEnterprise, analysisIds]);

  const handleDownloadPdf = useCallback(async () => {
    const el = document.getElementById("report-results");
    if (!el) return;

    try {
      setIsPrinting(true);

      // esperar render
      await new Promise((resolve) => setTimeout(resolve, 300));

      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas-pro")).default;

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

      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
        heightLeft -= pdfH;
      }

      pdf.save(`reporte_${reportType}.pdf`);
    } catch (err) {
      console.error("Error generando PDF:", err);
      setIsPrinting(false);
    } finally {
      setIsPrinting(false);
    }
  }, [reportType]);

  const filteredVeredaAnalysis = useMemo(() => {
    if (!veredaRiskData) return [];
    
    // 1. Filter by Period/Label (existing logic)
    const byCriterias = filterAnalysisByLabels(veredaRiskData, periodLabels, risk);
    
    // 2. Filter by currently selected Veredas (IDs)
    // Note: foundAdms have `id`. veredaRiskData keys are IDs or records have adm3_id.
    const selectedIds = new Set(foundAdms.map(a => a.id));
    
    return byCriterias.filter(item => {
      // item is { ...rec, items: ... } returned by filterAnalysisByLabels
      // Assuming rec has adm3_id (checked in Adm3RiskTable logic)
      return selectedIds.has(item.adm3_id);
    });
  }, [veredaRiskData, periodLabels, risk, foundAdms]);

  const filteredFarmData = useMemo(() => {
    if (!farmRiskData) return null;
    const selectedIds = new Set(foundFarms.map(f => f.id));
    
    // Filter object by keys (farm IDs)
    const filtered = {};
    Object.entries(farmRiskData).forEach(([key, val]) => {
      // Check if key is in selectedIds, or if val.farm_id is in selectedIds
      // fetchRiskGlobal usually returns keys as IDs.
      if (selectedIds.has(key)) {
        filtered[key] = val;
      }
    });
    return filtered;
  }, [farmRiskData, foundFarms]);

  const filteredEnterpriseData = useMemo(() => {
    if (!enterpriseRiskData) return null;
    const selectedIds = new Set(selectedEnterprise.map(e => e.id || e._id || e.enterprise_id));
    
    const filtered = {};
    Object.entries(enterpriseRiskData).forEach(([key, val]) => {
       if (selectedIds.has(key)) {
         filtered[key] = val;
       }
    });
    return filtered;
  }, [enterpriseRiskData, selectedEnterprise]);

  // Determine which results to show
  const hasVeredaResults = reportType === "vereda" && filteredVeredaAnalysis?.length > 0;
  const hasFarmResults = reportType === "finca" && filteredFarmData && Object.keys(filteredFarmData).length > 0;
  const hasEnterpriseResults = reportType === "empresa" && filteredEnterpriseData && Object.keys(filteredEnterpriseData).length > 0;
  const hasAnyResults = hasVeredaResults || hasFarmResults || hasEnterpriseResults;

  const formatSitCodes = (sitCodes = {}) => {
    return Object.entries(sitCodes)
      .map(([farmId, farmCodes]) => {
        const codes = farmCodes
          .filter((code) => code?.ext_code)
          .map((code) => `${code.source}: ${code.ext_code}`)
          .join(" | ");

        return `{ ${codes} }`;
      })
      .join("\n");
  };

  const formatFarmCodes = (extIds = []) => {
    if (!Array.isArray(extIds)) return "Sin códigos";

    return (
      extIds
        .filter((c) => c?.ext_code)
        .map((c) => `${c.source}: ${c.ext_code}`)
        .join(", ") || "Sin códigos"
    );
  };

  const escapeCsvCell = (cell) => {
    return `"${String(cell ?? "").replace(/"/g, '""')}"`;
  };

  const exportEnterpriseToCSV = (data) => {
    if (!data || Object.keys(data).length === 0) return "";

    const rows = [];

    rows.push([
      "Departamento",
      "Municipio",
      "Tipo Empresa",
      "ID Empresa",
      "Nombre Empresa",
      "Periodo",
      "Alerta",
      "Alerta Entrada",
      "Alerta Salida",
    ]);

    Object.entries(data).forEach(([enterpriseId, enterpriseData]) => {
      const enterprise = enterpriseData.enterprise;

      enterpriseData.items?.forEach((item) => {
        const startYear = new Date(item.period_start).getFullYear();
        const endYear = new Date(item.period_end).getFullYear();

        const period = `${startYear} - ${endYear}`;

        const inputCodes = formatSitCodes(
          item.sit_codes?.input || {}
        );

        const outputCodes = formatSitCodes(
          item.sit_codes?.output || {}
        );

        rows.push([
          enterprise?.department || "",
          enterprise?.municipality || "",
          enterprise?.type_enterprise || "",
          enterprise?.ext_id?.[0]?.ext_code || enterpriseId,
          enterprise?.name || "",
          period,
          item.risk_input?.length > 0 ||
          item.risk_output?.length > 0
            ? "Con alerta"
            : "Sin alerta",
          inputCodes || "Sin códigos",
          outputCodes || "Sin códigos",
        ]);
      });
    });

    return rows
      .map((row) => row.map(escapeCsvCell).join(","))
      .join("\n");
  };

  const exportFarmToCSV = (data) => {
    if (!data || Object.keys(data).length === 0) return "";

    const rows = [];

    rows.push([
      "Departamento",
      "Municipio",
      "Vereda",
      "Códigos",
      "Periodo",
      "Alerta Directa",
      "Alerta Entrada",
      "Alerta Salida",
      "Verificación",
      "Def. (ha)",
      "Def. (%)",
      "Prot. (ha)",
      "Prot. (%)",
      "F. In (ha)",
      "F. In (%)",
      "F. Out (ha)",
      "F. Out (%)",
    ]);

    Object.entries(data).forEach(([farmId, farmData]) => {
      const farm = farmData.farm;

      const codes = formatFarmCodes(farm?.ext_id);

      farmData.items?.forEach((item) => {
        const startYear = new Date(item.period_start).getFullYear();
        const endYear = new Date(item.period_end).getFullYear();

        const period = `${startYear} - ${endYear}`;

        rows.push([
          farm?.department || "",
          farm?.municipality || "",
          farm?.vereda || "",
          codes,
          period,

          item.risk_direct ? "Con alerta" : "Sin alerta",
          item.risk_input ? "Con alerta" : "Sin alerta",
          item.risk_output ? "Con alerta" : "Sin alerta",

          "No verificado",

          item?.deforestation?.ha?.toFixed(2) || "0.00",
          fmtProp(item?.deforestation?.prop),

          item?.protected?.ha?.toFixed(2) || "0.00",
          fmtProp(item?.protected?.prop),

          item?.farming_in?.ha?.toFixed(2) || "0.00",
          fmtProp(item?.farming_in?.prop),

          item?.farming_out?.ha?.toFixed(2) || "0.00",
          fmtProp(item?.farming_out?.prop),
        ]);
      });
    });

    return rows
      .map((row) => row.map(escapeCsvCell).join(","))
      .join("\n");
  };

  const exportVeredaToCSV = (data) => {
    if (!data || Object.keys(data).length === 0) return "";

    const rows = [];

    rows.push([
      "Departamento",
      "Municipio",
      "Vereda",
      "Periodo",
      "Alerta",
      "Alerta Directa",
      "Alerta Entrada",
      "Alerta Salida",
      "Predios",
      "Deforestación (ha)",
    ]);

    Object.entries(data).forEach(([adm3Id, veredaData]) => {
      veredaData.items?.forEach((item) => {
        const startYear = new Date(item.period_start).getFullYear();
        const endYear = new Date(item.period_end).getFullYear();

        const period = `${startYear} - ${endYear}`;

        const directCodes = formatSitCodes(
          item.sit_codes?.direct || {}
        );

        const inputCodes = formatSitCodes(
          item.sit_codes?.input || {}
        );

        const outputCodes = formatSitCodes(
          item.sit_codes?.output || {}
        );

        rows.push([
          veredaData.department || "",
          veredaData.municipality || "",
          veredaData.name || "",
          period,

          item.risk_total
            ? "Con alerta"
            : "Sin alerta",

          directCodes || "Sin códigos",
          inputCodes || "Sin códigos",
          outputCodes || "Sin códigos",

          item.farm_amount || 0,

          item.def_ha?.toFixed(2) || "0.00",
        ]);
      });
    });

    return rows
      .map((row) => row.map(escapeCsvCell).join(","))
      .join("\n");
  };

  const handleDownloadCsv = useCallback(() => {
    let csvContent = "";
    let farmDetails = "";
    let filename = "";

    try {
      if (reportType === "vereda" && filteredVeredaAnalysis?.length > 0) {
        // Exportar veredas
        csvContent = exportVeredaToCSV(filteredVeredaAnalysis);
        filename = "reporte_veredas.csv";
      } else if (reportType === "finca" && filteredFarmData) {
        // Exportar fincas
        csvContent = exportFarmToCSV(filteredFarmData);
        filename = "reporte_fincas.csv";
      } else if (reportType === "empresa" && filteredEnterpriseData) {
        // Exportar empresas
        csvContent = exportEnterpriseToCSV(filteredEnterpriseData);
        farmDetails = exportFarmToCSV(farmRiskDataForEnterprise);
        filename = "reporte_empresas.csv";
      }
      console.log( filteredFarmData, "Filtered Farm Data for CSV export"); // Debug: Ver datos filtrados para fincas
      console.log("Filtered Vereda Analysis for CSV export:", filteredVeredaAnalysis); // Debug: Ver datos filtrados para veredas
      console.log( "Filtered Enterprise Data for CSV export", filteredEnterpriseData); // Debug: Ver datos filtrados para empresas
      console.log("Report Type:", reportType); // Debug: Ver tipo de reporte
      console.log("CSV Content:", csvContent); // Debug: Ver contenido CSV generado
      console.log("Farm Details:", farmDetails); // Debug: Ver detalles de las fincas

      if (csvContent && filename) {
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      if (reportType === "empresa" && farmDetails) {
        const blob = new Blob(["\uFEFF" + farmDetails], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "detalles_fincas.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Error generando CSV:", err);
    }
  }, [reportType, filteredVeredaAnalysis, filteredFarmData, filteredEnterpriseData]);

  // Helper: Convertir análisis a CSV (para veredas)
  const exportAnalysisToCSV = (data, type) => {
    if (!data || data.length === 0) return "";

    const rows = [];
    rows.push(["ID", "Nombre", "Deforestación (ha)", "Riesgo Directo", "Riesgo Entrada", "Riesgo Salida"]);

    data.forEach((item) => {
      const items = item.items || [];
      items.forEach((subItem) => {
        rows.push([
          item.adm3_id || "",
          item.adm3_name || "",
          subItem.deforestation?.ha || "",
          subItem.risk_direct ? "Sí" : "No",
          subItem.risk_input ? "Sí" : "No",
          subItem.risk_output ? "Sí" : "No",
        ]);
      });
    });

    return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
  };

  // Opciones de descarga
  const downloadOptions = useMemo(() => {
    const opts = [
      {
        label: "Descargar (PDF)",
        icon: <FileText className="w-4 h-4" />,
        action: handleDownloadPdf,
      },
      {
        label: "Descargar (CSV)",
        icon: <FileJson className="w-4 h-4" />,
        action: handleDownloadCsv,
      },
    ];
    return opts;
  }, [handleDownloadPdf, handleDownloadCsv]);


  // Get count text for button area
  const getCountText = () => {
    if (reportType === "vereda") {
      return `${foundAdms.length} vereda${foundAdms.length === 1 ? "" : "s"} seleccionada${foundAdms.length === 1 ? "" : "s"}`;
    }
    if (reportType === "finca") {
      return `${foundFarms.length} finca${foundFarms.length === 1 ? "" : "s"} seleccionada${foundFarms.length === 1 ? "" : "s"}`;
    }
    if (reportType === "empresa") {
      return `${selectedEnterprise.length} empresa${selectedEnterprise.length === 1 ? "" : "s"} seleccionada${selectedEnterprise.length === 1 ? "" : "s"}`;
    }
    return "";
  };

  return (
    <main className={`${CSS_CLASSES.pageContainer} flex flex-col`}>
      <header className={CSS_CLASSES.headerSection}>
        <div className={CSS_CLASSES.contentWrapper}>
          <h1 className={CSS_CLASSES.title}>Reporte</h1>
          <hr className={CSS_CLASSES.separator} />
          <p className={CSS_CLASSES.description}>
            En esta sección podrás generar reportes detallados para Veredas, Predios y Empresas. Selecciona los periodos de interés, define el tipo de reporte y utiliza los filtros de búsqueda para visualizar la información consolidada de alertas.
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

          {/* Generate button area */}
          {reportType !== "" && (
            <div className="mt-20">
              {errorMsg && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  {errorMsg}
                </div>
              )}

              {canGenerateReport && (
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-[#082C14]/70">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                      {getCountText()}
                    </span>
                    {analysisIds.length > 0 && (
                      <span className="ml-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                        {analysisIds.length} período{analysisIds.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className="relative inline-flex items-center gap-3 rounded-2xl px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {loading ? "Generando..." : "Generar reporte"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vereda Results */}
        {hasVeredaResults && !loading && (
          <>
            <div className="w-4/5 mx-auto bg-white rounded-2xl shadow-md p-6 mt-8" id="report-results">
              <h3 className="text-xl font-semibold text-[#082C14] mb-4">Resultados del análisis - Veredas</h3>
              <Adm3RiskTable data={filteredVeredaAnalysis} isPrinting={isPrinting} />
            </div>
          </>
        )}

        {/* Farm Results */}
        {hasFarmResults && !loading && (
          <>
            <div className="w-4/5 mx-auto bg-white rounded-2xl shadow-md p-6 mt-8" id="report-results">
              <h3 className="text-xl font-semibold text-[#082C14] mb-4">Resultados del análisis - Fincas</h3>
              <FarmRiskTable data={filteredFarmData} />
            </div>
          </>
        )}

        {/* Enterprise Results */}
        {hasEnterpriseResults && !loading && (
          <>
            <div className="mx-6 bg-white rounded-2xl shadow-md p-6 mt-8" id="report-results">
              <h3 className="text-xl font-semibold text-[#082C14] mb-4">Resultados del análisis - Empresas</h3>
              <EnterpriseRiskTable data={filteredEnterpriseData} isPrinting={isPrinting} />
            </div>
            <div className="mx-6 bg-white rounded-2xl shadow-md p-6 mt-8" id="detalle-predios">
              <h3 className="text-xl font-semibold text-[#082C14] mb-4">Detalles Predios</h3>
              {farmRiskDataForEnterprise && Object.keys(farmRiskDataForEnterprise).length > 0 && (
                <FarmRiskTable data={farmRiskDataForEnterprise} paginated={true} />
              )}
            </div>
          </>
        )}
        {hasAnyResults && !loading && (
          <FloatingDownloadMenu options={downloadOptions} position="bottom-right" />
        )}
      </section>
    </main>
  );
}