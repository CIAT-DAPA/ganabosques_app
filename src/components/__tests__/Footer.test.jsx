import { render, screen } from "@testing-library/react";
import Footer from "../Footer";

const PARTNERS = [
  "Ministerio de Agricultura y Desarrollo Rural",
  "Alliance Bioversity & CIAT",
  "UK PACT",
  "CGIAR",
];

describe("Footer", () => {
  it("renders the partners section", () => {
    render(<Footer />);
    expect(screen.getByRole("heading", { name: "Socios" })).toBeInTheDocument();
  });

  it("renders every partner logo with alt text", () => {
    render(<Footer />);

    for (const alt of PARTNERS) {
      expect(screen.getByAltText(alt)).toBeInTheDocument();
    }
  });

  it("links to the about page", () => {
    render(<Footer />);

    const link = screen.getByRole("link", { name: "Acerca de" });
    expect(link).toHaveAttribute("href", "/acercade");
  });

  // Only internal links are active right now, so no link opens a new tab.
  it("does not open the internal link in a new tab", () => {
    render(<Footer />);

    const link = screen.getByRole("link", { name: "Acerca de" });
    expect(link).not.toHaveAttribute("target");
  });

  it("shows the current year in the copyright", () => {
    render(<Footer />);

    const year = String(new Date().getFullYear());
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it("credits both institutions in the copyright", () => {
    render(<Footer />);
    expect(screen.getByText(/Todos los derechos reservados/)).toBeInTheDocument();
  });

  it("renders as a footer landmark", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
