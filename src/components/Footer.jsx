'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-600 text-white py-8">
      <div className="max-w-6xl mx-auto px-6 text-center space-y-4">
        {/* Navegación */}
        <nav className="flex flex-wrap justify-center gap-6 text-sm font-medium">
          <Link href="/riesgos" className="hover:underline">
            Riesgos Nacionales
          </Link>
          <Link href="/metodologia" className="hover:underline">
            Metodología
          </Link>
          <Link href="/reportes" className="hover:underline">
            Reportes
          </Link>
          <Link href="/about" className="hover:underline">
            Acerca de
          </Link>
        </nav>

        {/* Créditos */}
        <p className="text-xs text-gray-200">
          GanaBosques © 2025. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
