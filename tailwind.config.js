/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores personalizados del proyecto
        'custom': {
          DEFAULT: '#FCFFF5',     // Color de fondo principal
          'dark': '#082C14',      // Color para fondos oscuros
          'light': '#FCFFF5',     // Color de texto claro
        },
        // Reemplazar colores por defecto
        'background': '#FCFFF5',
        'foreground': '#082C14',
      },
      fontFamily: {
        // Tipografías personalizadas
        'heading': ['var(--font-raleway)', 'Raleway', 'Arial', 'sans-serif'],
        'body': ['var(--font-plus-jakarta-sans)', 'Plus Jakarta Sans', 'Arial', 'sans-serif'],
        // Reemplazar sans por defecto
        'sans': ['var(--font-plus-jakarta-sans)', 'Plus Jakarta Sans', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
