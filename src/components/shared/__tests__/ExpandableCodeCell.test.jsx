import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExpandableCodeCell from "../ExpandableCodeCell";

// Codes arrive keyed by farm id, each holding a list of source/code pairs.
const codesFor = (count) =>
  Object.fromEntries(
    Array.from({ length: count }, (_, i) => [
      `farm${i + 1}`,
      [{ source: "SIT", ext_code: `code-${i + 1}` }],
    ])
  );

describe("ExpandableCodeCell", () => {
  describe("without codes", () => {
    it("shows a placeholder for an empty object", () => {
      render(<ExpandableCodeCell codes={{}} rowKey="r1" />);
      expect(screen.getByText("Sin códigos")).toBeInTheDocument();
    });

    it("shows a placeholder for null", () => {
      render(<ExpandableCodeCell codes={null} rowKey="r1" />);
      expect(screen.getByText("Sin códigos")).toBeInTheDocument();
    });

    it("shows a placeholder with no props", () => {
      render(<ExpandableCodeCell />);
      expect(screen.getByText("Sin códigos")).toBeInTheDocument();
    });
  });

  describe("with two farms or fewer", () => {
    it("renders every code without a toggle", () => {
      render(<ExpandableCodeCell codes={codesFor(2)} rowKey="r1" />);

      expect(screen.getByText("code-1")).toBeInTheDocument();
      expect(screen.getByText("code-2")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("renders the source label next to each code", () => {
      render(<ExpandableCodeCell codes={codesFor(1)} rowKey="r1" />);
      expect(screen.getByText("SIT:")).toBeInTheDocument();
    });

    it("renders several codes belonging to the same farm", () => {
      render(
        <ExpandableCodeCell
          codes={{
            farm1: [
              { source: "SIT", ext_code: "111" },
              { source: "ICA", ext_code: "222" },
            ],
          }}
          rowKey="r1"
        />
      );

      expect(screen.getByText("111")).toBeInTheDocument();
      expect(screen.getByText("222")).toBeInTheDocument();
    });
  });

  describe("with more than two farms", () => {
    it("shows only the first two and a counter button", () => {
      render(<ExpandableCodeCell codes={codesFor(5)} rowKey="r1" />);

      expect(screen.getByText("code-1")).toBeInTheDocument();
      expect(screen.getByText("code-2")).toBeInTheDocument();
      expect(screen.queryByText("code-3")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "+3 más ▼" })).toBeInTheDocument();
    });

    it("reveals the rest when the button is clicked", async () => {
      const user = userEvent.setup();
      render(<ExpandableCodeCell codes={codesFor(5)} rowKey="r1" />);

      await user.click(screen.getByRole("button"));

      expect(screen.getByText("code-3")).toBeInTheDocument();
      expect(screen.getByText("code-5")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Ver menos ▲" })).toBeInTheDocument();
    });

    it("collapses again on a second click", async () => {
      const user = userEvent.setup();
      render(<ExpandableCodeCell codes={codesFor(5)} rowKey="r1" />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByRole("button"));

      expect(screen.queryByText("code-3")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "+3 más ▼" })).toBeInTheDocument();
    });

    it("counts exactly the hidden farms", () => {
      render(<ExpandableCodeCell codes={codesFor(3)} rowKey="r1" />);
      expect(screen.getByRole("button", { name: "+1 más ▼" })).toBeInTheDocument();
    });
  });

  describe("printing mode", () => {
    it("expands every code without asking", () => {
      render(<ExpandableCodeCell codes={codesFor(5)} rowKey="r1" isPrinting />);

      expect(screen.getByText("code-3")).toBeInTheDocument();
      expect(screen.getByText("code-5")).toBeInTheDocument();
    });

    it("hides the toggle so it does not reach the PDF", () => {
      render(<ExpandableCodeCell codes={codesFor(5)} rowKey="r1" isPrinting />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("still renders normally when there are few codes", () => {
      render(<ExpandableCodeCell codes={codesFor(1)} rowKey="r1" isPrinting />);
      expect(screen.getByText("code-1")).toBeInTheDocument();
    });
  });
});
