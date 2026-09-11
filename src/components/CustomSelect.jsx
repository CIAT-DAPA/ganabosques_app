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
    options.length > 0 
      ? options.find(opt => opt.value === value) || options[0]  // 👈 default al primero
      : null
  );
  const selectRef = useRef(null);

  // Mantiene onChange en una ref: no debe ser dependencia del efecto de
  // sincronizacion, porque un padre que pase una funcion nueva en cada
  // render volveria a dispararlo y notificaria en bucle.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Recuerda el value ya notificado al padre, para no avisar repetidamente
  // del mismo fallback mientras el value siga siendo invalido.
  const notifiedFallbackRef = useRef(null);

  // Actualiza cuando cambian value u options.
  // Los setState comparan por value/label y devuelven el estado previo si no
  // hay cambio real, de modo que un `options` con identidad nueva en cada
  // render no provoque el ciclo render -> efecto -> setState -> render.
  useEffect(() => {
    const keep = (prev, next) =>
      prev && prev.value === next.value && prev.label === next.label ? prev : next;

    const option = options.find((opt) => opt.value === value);

    if (option) {
      notifiedFallbackRef.current = null;
      setSelectedOption((prev) => keep(prev, option));
      return;
    }

    if (options.length > 0) {
      // si no hay value valido, ponemos el primero
      const fallback = options[0];
      setSelectedOption((prev) => keep(prev, fallback));
      if (notifiedFallbackRef.current !== fallback.value) {
        notifiedFallbackRef.current = fallback.value;
        onChangeRef.current?.({ target: { value: fallback.value } });
      }
      return;
    }

    notifiedFallbackRef.current = null;
    setSelectedOption((prev) => (prev === null ? prev : null));
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
    onChange?.({ target: { value: option.value } });
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