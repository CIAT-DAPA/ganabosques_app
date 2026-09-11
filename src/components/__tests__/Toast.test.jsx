import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Toast from "../Toast";

describe("Toast", () => {
  describe("content", () => {
    it("renders the message", () => {
      render(<Toast message="Predio no encontrado" />);
      expect(screen.getByText("Predio no encontrado")).toBeInTheDocument();
    });

    it("renders with no props at all", () => {
      expect(() => render(<Toast />)).not.toThrow();
    });

    it("offers an accessible close button", () => {
      render(<Toast message="Aviso" />);
      expect(screen.getByRole("button", { name: "Cerrar" })).toBeInTheDocument();
    });
  });

  describe("type styling", () => {
    it("uses a white background for info", () => {
      const { container } = render(<Toast type="info" message="Aviso" />);
      expect(container.querySelector(".bg-white")).toBeInTheDocument();
      expect(container.querySelector(".bg-blue-100")).toBeInTheDocument();
    });

    it("uses green accents for success", () => {
      const { container } = render(<Toast type="success" message="Listo" />);
      expect(container.querySelector(".bg-green-100")).toBeInTheDocument();
    });

    it("uses yellow accents for warning", () => {
      const { container } = render(<Toast type="warning" message="Cuidado" />);
      expect(container.querySelector(".bg-yellow-50")).toBeInTheDocument();
      expect(container.querySelector(".bg-yellow-100")).toBeInTheDocument();
    });

    it("uses red accents for alert", () => {
      const { container } = render(<Toast type="alert" message="Error" />);
      expect(container.querySelector(".bg-red-50")).toBeInTheDocument();
      expect(container.querySelector(".bg-red-100")).toBeInTheDocument();
    });

    it("falls back to the info style for an unknown type", () => {
      const { container } = render(<Toast type="unknown" message="Aviso" />);
      expect(container.querySelector(".bg-blue-100")).toBeInTheDocument();
    });

    it("defaults to info when no type is given", () => {
      const { container } = render(<Toast message="Aviso" />);
      expect(container.querySelector(".bg-blue-100")).toBeInTheDocument();
    });
  });

  describe("auto dismiss", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("stays visible before the timeout", () => {
      render(<Toast message="Aviso" />);

      act(() => {
        jest.advanceTimersByTime(2999);
      });

      expect(screen.getByText("Aviso")).toBeInTheDocument();
    });

    it("disappears after three seconds", () => {
      render(<Toast message="Aviso" />);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(screen.queryByText("Aviso")).not.toBeInTheDocument();
    });

    it("notifies the parent when it auto dismisses", () => {
      const onClose = jest.fn();
      render(<Toast message="Aviso" onClose={onClose} />);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not fail without an onClose callback", () => {
      render(<Toast message="Aviso" />);

      expect(() =>
        act(() => {
          jest.advanceTimersByTime(3000);
        })
      ).not.toThrow();
    });

    it("clears the timer on unmount so it cannot fire afterwards", () => {
      const onClose = jest.fn();
      const { unmount } = render(<Toast message="Aviso" onClose={onClose} />);

      unmount();
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("manual dismiss", () => {
    it("hides the toast when the close button is clicked", async () => {
      const user = userEvent.setup();
      render(<Toast message="Aviso" />);

      await user.click(screen.getByRole("button", { name: "Cerrar" }));

      expect(screen.queryByText("Aviso")).not.toBeInTheDocument();
    });

    it("notifies the parent when closed by hand", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<Toast message="Aviso" onClose={onClose} />);

      await user.click(screen.getByRole("button", { name: "Cerrar" }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not fail closing by hand without onClose", async () => {
      const user = userEvent.setup();
      render(<Toast message="Aviso" />);

      await user.click(screen.getByRole("button", { name: "Cerrar" }));

      expect(screen.queryByText("Aviso")).not.toBeInTheDocument();
    });
  });
});
