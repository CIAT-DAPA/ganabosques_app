import { render } from "@testing-library/react";
import SortIcon from "../SortIcon";

// lucide-react renders an <svg> whose classes carry the active colour, so the
// icon is identified by those classes rather than by accessible text.
const svgOf = (container) => container.querySelector("svg");

describe("SortIcon", () => {
  describe("when the column is not the sorted one", () => {
    it("renders the neutral grey icon", () => {
      const { container } = render(
        <SortIcon column="name" sortConfig={{ key: "other", direction: "asc" }} />
      );
      expect(svgOf(container)).toHaveClass("text-gray-300");
    });

    it("renders the neutral icon when nothing is sorted yet", () => {
      const { container } = render(
        <SortIcon column="name" sortConfig={{ key: null, direction: "asc" }} />
      );
      expect(svgOf(container)).toHaveClass("text-gray-300");
    });
  });

  describe("when the column is the sorted one", () => {
    it("highlights the icon in green for ascending order", () => {
      const { container } = render(
        <SortIcon column="name" sortConfig={{ key: "name", direction: "asc" }} />
      );
      expect(svgOf(container)).toHaveClass("text-green-600");
    });

    it("highlights the icon in green for descending order", () => {
      const { container } = render(
        <SortIcon column="name" sortConfig={{ key: "name", direction: "desc" }} />
      );
      expect(svgOf(container)).toHaveClass("text-green-600");
    });

    it("renders a different icon for each direction", () => {
      const asc = render(
        <SortIcon column="name" sortConfig={{ key: "name", direction: "asc" }} />
      );
      const ascMarkup = svgOf(asc.container).outerHTML;

      const desc = render(
        <SortIcon column="name" sortConfig={{ key: "name", direction: "desc" }} />
      );
      const descMarkup = svgOf(desc.container).outerHTML;

      expect(ascMarkup).not.toBe(descMarkup);
    });

    it("treats any direction other than asc as descending", () => {
      const { container } = render(
        <SortIcon column="name" sortConfig={{ key: "name", direction: "anything" }} />
      );
      expect(svgOf(container)).toHaveClass("text-green-600");
    });
  });

  it("always renders an icon", () => {
    const { container } = render(
      <SortIcon column="name" sortConfig={{ key: "name", direction: "asc" }} />
    );
    expect(svgOf(container)).toBeInTheDocument();
  });
});
