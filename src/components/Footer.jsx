"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-600 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Secciones + Socios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
          {/* Secciones */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Secciones</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/aboutus" className="hover:underline hover:text-green-200">
                  Acerca de
                </Link>
              </li>
              <li>
                <Link href="/methodology" className="hover:underline hover:text-green-200">
                  Metodología
                </Link>
              </li>
            </ul>
          </div>

          {/* Socios */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Socios</h3>
            <div className="flex items-center space-x-2 overflow-x-auto">
              <Image
                src="/partner1.png"
                alt="Partner 1"
                width={100}
                height={50}
                className="object-contain max-h-12"
              />
              <Image
                src="/partner2.png"
                alt="Partner 2"
                width={100}
                height={50}
                className="object-contain max-h-12"
              />
              <Image
                src="/partner3.png"
                alt="Partner 3"
                width={100}
                height={50}
                className="object-contain max-h-12"
              />
              <Image
                src="/partner4.png"
                alt="Partner 4"
                width={100}
                height={50}
                className="object-contain max-h-12"
              />
            </div>
          </div>
        </div>

        {/* Línea inferior */}
        <div className="border-t border-gray-500 pt-4 text-center text-sm text-gray-200">
          &copy; Ganabosques {new Date().getFullYear()} Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
