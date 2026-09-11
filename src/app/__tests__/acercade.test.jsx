import { render, screen } from "@testing-library/react";
import AcercaDe from "../acercade/page";

const PARTNERS = [
  { alt: "Ministerio de Agricultura y Desarrollo Rural", url: "https://www.minagricultura.gov.co/" },
  { alt: "Alliance Bioversity & CIAT", url: "https://alliancebioversityciat.org/" },
  { alt: "UK PACT", url: "https://www.ukpact.co.uk/" },
  { alt: "CGIAR", url: "https://www.cgiar.org/" },
];

const CONTRIBUTIONS = [
  "Política Nacional de Lucha contra la Deforestación (CONPES 4021)",
  "Monitoreo y verificación de compromisos de Cero Deforestación",
  "Priorización de acciones y alertas tempranas",
];

describe("AcercaDe", () => {
  beforeEach(() => {
    document.title = "";
  });

  it("sets the document title", () => {
    render(<AcercaDe />);
    expect(document.title).toBe("Ganabosques - Acerca de");
  });

  it("renders a main heading", () => {
    render(<AcercaDe />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  describe("contributions", () => {
    it("lists every contribution", () => {
      render(<AcercaDe />);

      for (const text of CONTRIBUTIONS) {
        expect(screen.getByText(text)).toBeInTheDocument();
      }
    });

    it("renders them as list items", () => {
      render(<AcercaDe />);
      expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(
        CONTRIBUTIONS.length
      );
    });
  });

  describe("strategic partners", () => {
    it("renders a logo per partner with alt text", () => {
      render(<AcercaDe />);

      for (const { alt } of PARTNERS) {
        expect(screen.getByAltText(alt)).toBeInTheDocument();
      }
    });

    it("links each logo to the partner site", () => {
      render(<AcercaDe />);

      for (const { alt, url } of PARTNERS) {
        expect(screen.getByAltText(alt).closest("a")).toHaveAttribute("href", url);
      }
    });

    it("opens the partner links in a new tab safely", () => {
      render(<AcercaDe />);

      for (const { alt } of PARTNERS) {
        const link = screen.getByAltText(alt).closest("a");
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
      }
    });
  });
});
