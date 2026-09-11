import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VerificationChip from "../VerificationChip";
import { COLOR_RISK, COLOR_OK } from "@/utils";

describe("VerificationChip", () => {
  describe("label and colour", () => {
    it("reads 'Verificado' when status is exactly true", () => {
      render(<VerificationChip verification={{ status: true }} />);
      expect(screen.getByText("Verificado")).toBeInTheDocument();
      expect(screen.getByText("Verificado")).toHaveStyle({ backgroundColor: COLOR_OK });
    });

    it("reads 'No verificado' when status is false", () => {
      render(<VerificationChip verification={{ status: false }} />);
      expect(screen.getByText("No verificado")).toBeInTheDocument();
      expect(screen.getByText("No verificado")).toHaveStyle({ backgroundColor: COLOR_RISK });
    });

    it("reads 'No verificado' when there is no verification at all", () => {
      render(<VerificationChip verification={null} />);
      expect(screen.getByText("No verificado")).toBeInTheDocument();
    });

    it("reads 'No verificado' with no props", () => {
      render(<VerificationChip />);
      expect(screen.getByText("No verificado")).toBeInTheDocument();
    });

    // The check is strict, so a truthy non-boolean does not count as verified.
    it("does not treat a truthy non-boolean status as verified", () => {
      render(<VerificationChip verification={{ status: "yes" }} />);
      expect(screen.getByText("No verificado")).toBeInTheDocument();
    });
  });

  describe("tooltip", () => {
    it("is hidden until the user hovers", () => {
      render(
        <VerificationChip
          verification={{ status: true, verification_date: "2024-03-15T10:30:00Z" }}
        />
      );
      expect(screen.queryByText(/Fecha:/)).not.toBeInTheDocument();
    });

    it("shows the verification date on hover", async () => {
      const user = userEvent.setup();
      render(
        <VerificationChip
          verification={{ status: true, verification_date: "2024-03-15T10:30:00Z" }}
        />
      );

      await user.hover(screen.getByText("Verificado"));

      expect(screen.getByText(/Fecha:/)).toBeInTheDocument();
    });

    it("shows the observation when present", async () => {
      const user = userEvent.setup();
      render(
        <VerificationChip
          verification={{
            status: true,
            verification_date: "2024-03-15T10:30:00Z",
            observation: "Visita de campo",
          }}
        />
      );

      await user.hover(screen.getByText("Verificado"));

      expect(screen.getByText("Visita de campo")).toBeInTheDocument();
    });

    it("omits the observation block when absent", async () => {
      const user = userEvent.setup();
      render(
        <VerificationChip
          verification={{ status: true, verification_date: "2024-03-15T10:30:00Z" }}
        />
      );

      await user.hover(screen.getByText("Verificado"));

      expect(screen.getByText(/Fecha:/)).toBeInTheDocument();
      expect(screen.queryByText("Visita de campo")).not.toBeInTheDocument();
    });

    it("hides the tooltip again when the pointer leaves", async () => {
      const user = userEvent.setup();
      render(
        <VerificationChip
          verification={{ status: true, verification_date: "2024-03-15T10:30:00Z" }}
        />
      );
      const chip = screen.getByText("Verificado");

      await user.hover(chip);
      await user.unhover(chip);

      expect(screen.queryByText(/Fecha:/)).not.toBeInTheDocument();
    });

    // Hover only opens the tooltip for verified records, since there is no date
    // to show otherwise.
    it("never opens for an unverified record", async () => {
      const user = userEvent.setup();
      render(<VerificationChip verification={{ status: false }} />);

      await user.hover(screen.getByText("No verificado"));

      expect(screen.queryByText(/Fecha:/)).not.toBeInTheDocument();
    });
  });

  describe("date formatting", () => {
    it("renders an empty date when verification_date is missing", async () => {
      const user = userEvent.setup();
      render(<VerificationChip verification={{ status: true }} />);

      await user.hover(screen.getByText("Verificado"));

      expect(screen.getByText("Fecha:")).toBeInTheDocument();
    });

    it("falls back to the raw string when the date cannot be parsed", async () => {
      const user = userEvent.setup();
      render(<VerificationChip verification={{ status: true, verification_date: "not-a-date" }} />);

      await user.hover(screen.getByText("Verificado"));

      expect(screen.getByText(/not-a-date/)).toBeInTheDocument();
    });

    it("formats a valid date into a localized string", async () => {
      const user = userEvent.setup();
      render(
        <VerificationChip
          verification={{ status: true, verification_date: "2024-03-15T10:30:00Z" }}
        />
      );

      await user.hover(screen.getByText("Verificado"));

      // Locale output varies by ICU build, so only the year is asserted.
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });
  });
});
