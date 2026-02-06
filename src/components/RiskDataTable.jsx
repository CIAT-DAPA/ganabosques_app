"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TABLE_CSS, SortIcon, InfoTooltip } from "./shared";

// Generic data table with sorting and pagination
export default function RiskDataTable({
  data = [],
  columns = [],
  getRowKey = (row, index) => index,
  emptyMessage = "No hay datos para mostrar.",
  sortable = false,
  paginated = false,
  defaultPageSize = 20,
  pageSizeOptions = [10, 20, 50],
  // External pagination props for backend pagination
  externalPage = null,
  setExternalPage = null,
  hasMore = false,
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [internalPage, setInternalPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Use external or internal pagination
  const isExternalPagination = externalPage !== null && setExternalPage !== null;
  const currentPage = isExternalPagination ? externalPage : internalPage;
  const setCurrentPage = isExternalPagination ? setExternalPage : setInternalPage;

  const handleSort = useCallback((key) => {
    if (!sortable) return;
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  }, [sortable]);

  const sortedData = useMemo(() => {
    if (!sortable || !sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      const col = columns.find(c => c.key === sortConfig.key);
      const aVal = col?.getValue ? col.getValue(a) : a[sortConfig.key];
      const bVal = col?.getValue ? col.getValue(b) : b[sortConfig.key];
      
      if (aVal == null) return sortConfig.direction === "asc" ? 1 : -1;
      if (bVal == null) return sortConfig.direction === "asc" ? -1 : 1;
      
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [data, columns, sortConfig, sortable]);

  // For external pagination, use data directly (already paginated from backend)
  const paginatedData = useMemo(() => {
    if (isExternalPagination) return sortedData;
    if (!paginated) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, paginated, currentPage, pageSize, isExternalPagination]);

  // Calculate total pages (for external pagination, assume infinite if hasMore)
  const totalPages = isExternalPagination 
    ? (hasMore ? currentPage + 1 : currentPage)
    : Math.ceil(sortedData.length / pageSize);
  const startRecord = sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = isExternalPagination 
    ? (currentPage - 1) * pageSize + sortedData.length
    : Math.min(currentPage * pageSize, sortedData.length);

  // Reset page when data changes (only for internal pagination)
  useMemo(() => {
    if (!isExternalPagination) {
      setInternalPage(1);
    }
  }, [data.length, isExternalPagination]);

  if (!data || data.length === 0) {
    return (
      <div className={TABLE_CSS.tableContainer}>
        <div className={TABLE_CSS.emptyState}>
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={TABLE_CSS.tableContainer}>
      <div className="overflow-x-auto">
        <table className={TABLE_CSS.table}>
          <thead className={TABLE_CSS.tableHeader}>
            <tr>
              {columns.map((col) => {
                const isSortable = sortable && col.sortable !== false;
                const isActive = sortConfig.key === col.key;
                
                return (
                  <th
                    key={col.key}
                    className={isActive ? TABLE_CSS.thActive : (isSortable ? TABLE_CSS.thSortable : TABLE_CSS.th)}
                    onClick={() => isSortable && handleSort(col.key)}
                    style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                  >
                    <span className="flex items-center">
                      {col.label}
                      {col.info && <InfoTooltip text={col.info} />}
                      {isSortable && <SortIcon column={col.key} sortConfig={sortConfig} />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className={TABLE_CSS.tbody}>
            {paginatedData.map((row, index) => (
              <tr 
                key={getRowKey(row, index)} 
                className={index % 2 === 0 ? TABLE_CSS.tr : TABLE_CSS.trAlt}
              >
                {columns.map((col) => {
                  const value = col.getValue ? col.getValue(row) : row[col.key];
                  const cellClass = col.highlight ? TABLE_CSS.tdHighlight : TABLE_CSS.td;
                  
                  return (
                    <td key={col.key} className={cellClass}>
                      {col.render ? col.render(value, row, index) : value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paginated && (
        <div className={TABLE_CSS.pagination}>
          <div className={TABLE_CSS.paginationInfo}>
            Mostrando <span className="font-medium">{startRecord}</span> a{" "}
            <span className="font-medium">{endRecord}</span> registros
          </div>
          <div className={TABLE_CSS.paginationButtons}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={TABLE_CSS.paginationButton}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {(() => {
              const pages = [];
              const maxVisible = 5;
              let start = Math.max(1, currentPage - 2);
              let end = Math.min(totalPages, start + maxVisible - 1);
              if (end - start < maxVisible - 1) {
                start = Math.max(1, end - maxVisible + 1);
              }
              for (let i = start; i <= end; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={currentPage === i 
                      ? TABLE_CSS.paginationButtonActive 
                      : TABLE_CSS.paginationButtonInactive}
                  >
                    {i}
                  </button>
                );
              }
              return pages;
            })()}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className={TABLE_CSS.paginationButton}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
