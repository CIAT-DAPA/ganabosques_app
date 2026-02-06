"use client";

import { ChevronUp, ChevronDown } from "lucide-react";

// Sort indicator icon for table headers
export default function SortIcon({ column, sortConfig }) {
  if (sortConfig.key !== column) {
    return <ChevronUp className="w-3 h-3 text-gray-300 inline ml-1" />;
  }
  
  return sortConfig.direction === "asc" 
    ? <ChevronUp className="w-3 h-3 text-green-600 inline ml-1" />
    : <ChevronDown className="w-3 h-3 text-green-600 inline ml-1" />;
}
