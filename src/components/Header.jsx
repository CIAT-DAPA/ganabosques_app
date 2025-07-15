"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
  <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between px-6 sm:px-8 md:px-12 lg:px-20 py-2">
    <Link href="/" className="text-xl font-semibold text-black">
      Ganabosques
    </Link>

    <button
      onClick={() => setIsOpen(!isOpen)}
      type="button"
      className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-600 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
      aria-controls="navbar-default"
      aria-expanded={isOpen}
    >
      <span className="sr-only">Open main menu</span>
      <svg
        className="w-5 h-5"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 17 14"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M1 1h15M1 7h15M1 13h15"
        />
      </svg>
    </button>

    <div
      className={`${isOpen ? 'block' : 'hidden'} w-full md:block md:w-auto`}
      id="navbar-default"
    >
      <ul className="font-medium flex flex-col md:flex-row md:space-x-8 mt-4 md:mt-0">
        {navItems.map(({ name, path }) => (
          <li key={path}>
            <Link
              href={path}
              className={`block py-2 px-3 rounded md:p-0 ${
                pathname === path
                  ? 'text-green-700 font-semibold'
                  : 'text-gray-900 hover:text-green-700'
              }`}
            >
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </div>
</nav>

  );
}
