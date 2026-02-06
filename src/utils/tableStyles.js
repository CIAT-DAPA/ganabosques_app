// Table color constants
export const COLOR_RISK = "#D50000";
export const COLOR_OK = "#00C853";

// Table CSS classes
export const TABLE_CSS = {
  tableContainer: "bg-white rounded-xl shadow-lg overflow-hidden",
  table: "min-w-full divide-y divide-gray-200",
  tableHeader: "bg-gray-50 border-b border-gray-200",
  th: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap",
  thActive: "px-4 py-3 text-left text-xs font-semibold text-green-700 uppercase tracking-wider cursor-pointer bg-green-50",
  thSortable: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors",
  td: "px-4 py-3 whitespace-nowrap text-sm text-gray-700",
  tdHighlight: "px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900",
  tr: "hover:bg-gray-50 transition-colors",
  trAlt: "hover:bg-gray-50 transition-colors bg-gray-25",
  tbody: "bg-white divide-y divide-gray-200",
  emptyState: "flex flex-col items-center justify-center py-12 text-gray-500",
  
  // Pagination
  pagination: "flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200",
  paginationInfo: "text-sm text-gray-600",
  paginationButtons: "flex items-center gap-2",
  paginationButton: "px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer",
  paginationButtonActive: "px-3 py-1 rounded-md text-sm font-medium bg-green-600 text-white",
  paginationButtonInactive: "px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer",
  
  // Expandable code cell
  codeCell: "max-w-[200px] overflow-hidden transition-all duration-300 ease-in-out cursor-pointer",
  codeCellExpanded: "max-w-none",
  codeContainer: "flex flex-wrap gap-1",
  codeChip: "inline-block px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs",
  expandBtn: "text-blue-600 hover:text-blue-800 text-xs mt-1 cursor-pointer font-medium",
  
  // Action buttons
  viewMapButton: "inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm cursor-pointer",
  viewMapButtonActive: "inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm cursor-pointer",
};
