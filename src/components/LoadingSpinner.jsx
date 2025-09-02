// components/LoadingSpinner.jsx
"use client";

export default function LoadingSpinner({ message = "Cargando..." }) {
  return (
    <div className="fixed inset-0 z-[3000] bg-black/10 pointer-events-auto flex items-center justify-center">
      <div className="flex flex-col items-center bg-white shadow-md rounded-lg px-6 py-4 border border-gray-200">
        <img src="/cow2.gif" alt="Cargando..." className="w-16 h-16 mb-3" />
        <p className="text-sm text-gray-800">{message}</p>
      </div>
    </div>
  );
}
