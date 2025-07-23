'use client';

import { useEffect, useState } from 'react';

export default function Toast({ type = 'info', message = '', onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  const typeConfig = {
    info: {
      bgIcon: 'bg-blue-100',
      iconColor: 'text-blue-600',
      bgToast: 'bg-white',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z" />
        </svg>
      ),
    },
    success: {
      bgIcon: 'bg-green-100',
      iconColor: 'text-green-600',
      bgToast: 'bg-white',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    warning: {
      bgIcon: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      bgToast: 'bg-yellow-50',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 5h.01" />
        </svg>
      ),
    },
    alert: {
      bgIcon: 'bg-red-100',
      iconColor: 'text-red-600',
      bgToast: 'bg-red-50',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
        </svg>
      ),
    },
  };

  const { bgIcon, iconColor, bgToast, icon } = typeConfig[type] || typeConfig.info;

  return (
    <div className="fixed top-4 right-4 z-[2000]">
      <div className={`flex items-center max-w-xs w-full p-4 ${bgToast} rounded-lg shadow text-gray-700`}>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${bgIcon} ${iconColor}`}>
          {icon}
        </div>
        <div className="ml-3 text-sm font-medium">{message}</div>
        <button
          onClick={() => {
            setVisible(false);
            if (onClose) onClose();
          }}
          className="ml-auto text-gray-400 hover:text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-gray-300 p-1.5"
        >
          <span className="sr-only">Cerrar</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 14 14">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1l6 6m0 0l6 6M7 7l6-6M7 7l-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
