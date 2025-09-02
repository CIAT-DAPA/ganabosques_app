"use client";

import { useState, useRef, useEffect } from "react";

export default function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = "Seleccionar...",
  className = "",
  disabled = false 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    options.find(opt => opt.value === value) || null
  );
  const selectRef = useRef(null);

  useEffect(() => {
    const option = options.find(opt => opt.value === value);
    setSelectedOption(option || null);
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    onChange({ target: { value: option.value } });
    setIsOpen(false);
  };

  const toggleOpen = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const selectStyle = `
    appearance-none bg-custom border border-gray-300 text-custom-dark text-sm font-medium 
    rounded-full py-2 px-4 pr-8 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 
    cursor-pointer relative w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <div
        className={selectStyle}
        onClick={toggleOpen}
      >
        <span className="block truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[1001] w-full mt-1 bg-custom border border-gray-300 rounded-2xl shadow-lg max-h-48 overflow-y-auto">
          {options.map((option, index) => (
            <div
              key={option.value}
              className={`
                px-4 py-2 text-sm text-custom-dark cursor-pointer
                hover:bg-gray-100 transition-colors duration-150
                ${index === 0 ? 'rounded-t-2xl' : ''}
                ${index === options.length - 1 ? 'rounded-b-2xl' : ''}
                ${selectedOption?.value === option.value ? 'bg-gray-100' : ''}
              `}
              onClick={() => handleOptionClick(option)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
