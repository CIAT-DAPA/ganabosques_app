'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6 text-center">
      <Image
        src="/triste.png"
        alt="No autorizado"
        width={200}
        height={200}
        className="mb-6"
        priority
      />
      <h1 className="text-2xl font-bold text-red-600 mb-2">
        No estás autorizado
      </h1>
      <p className="text-gray-700 mb-4">
        No tienes permisos para acceder a este recurso.
      </p>
      <Link href="/">
        <span className="text-blue-600 hover:underline">Volver al inicio</span>
      </Link>
    </div>
  );
}
