import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FloatingDownloadMenu from "../FloatingDownloadMenu";

const makeOptions = () => [
  { label: "Descargar CSV", icon: <span>csv</span>, action: jest.fn() },
  { label: "Descargar JSON", icon: <span>json</span>, action: jest.fn() },
];

const trigger = () => screen.getByTitle("Descargar");

describe("FloatingDownloadMenu", () => {
  describe("the main button", () => {
    it("renders with a download tooltip", () => {
      render(<FloatingDownloadMenu options={makeOptions()} />);
      expect(trigger()).toBeInTheDocument();
    });

    it("is disabled when there are no options", () => {
      render(<FloatingDownloadMenu options={[]} />);
      expect(trigger()).toBeDisabled();
    });

    it("is disabled with no props at all", () => {
      render(<FloatingDownloadMenu />);
      expect(trigger()).toBeDisabled();
    });

    it("is disabled when the disabled prop is set", () => {
      render(<FloatingDownloadMenu options={makeOptions()} disabled />);
      expect(trigger()).toBeDisabled();
    });

    it("is enabled when there are options", () => {
      render(<FloatingDownloadMenu options={makeOptions()} />);
      expect(trigger()).toBeEnabled();
    });
  });

  describe("positioning", () => {
    it("defaults to the bottom right corner", () => {
      const { container } = render(<FloatingDownloadMenu options={makeOptions()} />);
      expect(container.firstChild).toHaveClass("bottom-8", "right-8");
    });

    it.each([
      ["bottom-left", ["bottom-8", "left-8"]],
      ["top-right", ["top-8", "right-8"]],
      ["top-left", ["top-8", "left-8"]],
    ])("places itself for the %s position", (position, classes) => {
      const { container } = render(
        <FloatingDownloadMenu options={makeOptions()} position={position} />
      );
      expect(container.firstChild).toHaveClass(...classes);
    });
  });

  describe("the option menu", () => {
    // The panel is always mounted and toggled with opacity, so visibility is
    // asserted through the pointer-events class rather than presence.
    const panelOf = (container) => container.querySelector("div.absolute");

    it("starts collapsed and not interactive", () => {
      const { container } = render(<FloatingDownloadMenu options={makeOptions()} />);
      expect(panelOf(container)).toHaveClass("pointer-events-none");
    });

    it("becomes interactive once opened", async () => {
      const user = userEvent.setup();
      const { container } = render(<FloatingDownloadMenu options={makeOptions()} />);

      await user.click(trigger());

      expect(panelOf(container)).toHaveClass("pointer-events-auto");
    });

    it("renders a button per option", () => {
      render(<FloatingDownloadMenu options={makeOptions()} />);

      expect(screen.getByText("Descargar CSV")).toBeInTheDocument();
      expect(screen.getByText("Descargar JSON")).toBeInTheDocument();
    });

    it("renders the icon of each option", () => {
      render(<FloatingDownloadMenu options={makeOptions()} />);

      expect(screen.getByText("csv")).toBeInTheDocument();
      expect(screen.getByText("json")).toBeInTheDocument();
    });

    it("collapses again on a second click", async () => {
      const user = userEvent.setup();
      const { container } = render(<FloatingDownloadMenu options={makeOptions()} />);

      await user.click(trigger());
      await user.click(trigger());

      expect(panelOf(container)).toHaveClass("pointer-events-none");
    });

    it("collapses when clicking outside", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <div>
          <FloatingDownloadMenu options={makeOptions()} />
          <button type="button">outside</button>
        </div>
      );

      await user.click(trigger());
      expect(container.querySelector("div.absolute")).toHaveClass("pointer-events-auto");

      fireEvent.mouseDown(screen.getByText("outside"));

      expect(container.querySelector("div.absolute")).toHaveClass("pointer-events-none");
    });

    // The outside listener is only attached while the menu is open.
    it("ignores outside clicks while it is collapsed", () => {
      const { container } = render(
        <div>
          <FloatingDownloadMenu options={makeOptions()} />
          <button type="button">outside</button>
        </div>
      );

      fireEvent.mouseDown(screen.getByText("outside"));

      expect(container.querySelector("div.absolute")).toHaveClass("pointer-events-none");
    });
  });

  describe("running an option", () => {
    it("invokes the action of the clicked option", async () => {
      const user = userEvent.setup();
      const options = makeOptions();
      render(<FloatingDownloadMenu options={options} />);

      await user.click(trigger());
      await user.click(screen.getByText("Descargar CSV"));

      expect(options[0].action).toHaveBeenCalledTimes(1);
      expect(options[1].action).not.toHaveBeenCalled();
    });

    it("awaits an asynchronous action", async () => {
      const user = userEvent.setup();
      let resolve;
      const action = jest.fn(() => new Promise((r) => { resolve = r; }));
      render(<FloatingDownloadMenu options={[{ label: "Exportar", icon: null, action }]} />);

      await user.click(trigger());
      await user.click(screen.getByText("Exportar"));

      expect(action).toHaveBeenCalled();
      resolve();
      await waitFor(() => expect(trigger()).toBeEnabled());
    });

    it("collapses the menu after running an action", async () => {
      const user = userEvent.setup();
      const options = makeOptions();
      const { container } = render(<FloatingDownloadMenu options={options} />);

      await user.click(trigger());
      await user.click(screen.getByText("Descargar CSV"));

      await waitFor(() =>
        expect(container.querySelector("div.absolute")).toHaveClass("pointer-events-none")
      );
    });

    it("logs the error and recovers when the action rejects", async () => {
      const user = userEvent.setup();
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      const action = jest.fn().mockRejectedValue(new Error("export failed"));
      render(<FloatingDownloadMenu options={[{ label: "Exportar", icon: null, action }]} />);

      await user.click(trigger());
      await user.click(screen.getByText("Exportar"));

      await waitFor(() => expect(spy).toHaveBeenCalled());
      expect(trigger()).toBeEnabled();
      spy.mockRestore();
    });

    it("re-enables the button once the action settles", async () => {
      const user = userEvent.setup();
      const options = makeOptions();
      render(<FloatingDownloadMenu options={options} />);

      await user.click(trigger());
      await user.click(screen.getByText("Descargar JSON"));

      await waitFor(() => expect(trigger()).toBeEnabled());
      expect(options[1].action).toHaveBeenCalledTimes(1);
    });
  });
});
