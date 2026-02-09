import { Raleway, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/hooks/useAuth";
import { MapFiltersProvider } from "@/contexts/MapFiltersContext";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Ganabosques",
  description:
    "Visualiza el riesgo de deforestación y el movimiento de ganado en Colombia, fácil y en un solo lugar",
  icons: {
    icon: "/favicon.ico",         // <- vive en public/
    // opcionales:
    // shortcut: "/favicon.ico",
    // apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${raleway.variable} ${plusJakartaSans.variable} antialiased`}>
        <AuthProvider>
          <MapFiltersProvider>
            <Header />
            {children}
            <Footer />
          </MapFiltersProvider>
        </AuthProvider>
      </body>
    </html>
  );
}