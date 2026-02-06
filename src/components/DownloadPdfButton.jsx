"use client";

import { useState, useCallback } from "react";

// PDF download button component
export default function DownloadPdfButton({
  targetId,
  filename = "report.pdf",
  label = "Download PDF",
  className = "",
  scale = 2,
  backgroundColor = "#ffffff",
  onError,
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!targetId) return;
    const el = document.getElementById(targetId);
    if (!el) {
      const msg = `No element found with id="${targetId}"`;
      console.error(msg);
      onError?.(new Error(msg));
      return;
    }

    try {
      setDownloading(true);

      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas-pro")).default;

      const canvas = await html2canvas(el, {
        scale,
        useCORS: true,
        backgroundColor,
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

      pdf.save(filename);
    } catch (err) {
      console.error("Error generating PDF:", err);
      onError?.(err);
    } finally {
      setDownloading(false);
    }
  }, [targetId, filename, scale, backgroundColor, onError]);

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className={[
        "inline-flex items-center gap-2 rounded-xl px-5 py-2.5",
        "bg-[#082C14] text-white shadow-md hover:shadow-lg hover:bg-[#0b3b1b] cursor-pointer",
        "transition disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      ].join(" ")}
      aria-busy={downloading ? "true" : "false"}
    >
      {downloading ? "Generando..." : label}
    </button>
  );
}