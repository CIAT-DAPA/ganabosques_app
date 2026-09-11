import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import CustomSelect from "../CustomSelect";

const OPTIONS = [
  { value: "annual", label: "Alerta anual" },
  { value: "cumulative", label: "Alerta acumulada" },
  { value: "nad", label: "Núcleos activos" },
];

// Mirrors how FilterSelects wires the component: value flows back from state.
function Controlled({ options = OPTIONS, initial = "annual", onChangeSpy }) {
  const [value, setValue] = useState(initial);
  return (
    <CustomSelect
      value={value}
      options={options}
      onChange={(e) => {
        onChangeSpy?.(e.target.value);
        setValue(e.target.value);
      }}
    />
  );
}

describe("CustomSelect", () => {
  describe("closed state", () => {
    it("shows the label of the selected value", () => {
      render(<CustomSelect value="cumulative" options={OPTIONS} onChange={jest.fn()} />);
      expect(screen.getByText("Alerta acumulada")).toBeInTheDocument();
    });

    it("shows the first option when the value matches nothing", () => {
      render(<CustomSelect value="missing" options={OPTIONS} onChange={jest.fn()} />);
      expect(screen.getByText("Alerta anual")).toBeInTheDocument();
    });

    it("shows the placeholder when there are no options", () => {
      render(
        <CustomSelect value="" options={[]} onChange={jest.fn()} placeholder="Seleccionar período" />
      );
      expect(screen.getByText("Seleccionar período")).toBeInTheDocument();
    });

    it("does not render the option list until it is opened", () => {
      render(<CustomSelect value="annual" options={OPTIONS} onChange={jest.fn()} />);
      expect(screen.queryByText("Núcleos activos")).not.toBeInTheDocument();
    });

    it("applies the extra className to the wrapper", () => {
      const { container } = render(
        <CustomSelect value="annual" options={OPTIONS} onChange={jest.fn()} className="min-w-[140px]" />
      );
      expect(container.firstChild).toHaveClass("min-w-[140px]");
    });
  });

  describe("opening and selecting", () => {
    it("lists every option when opened", async () => {
      const user = userEvent.setup();
      render(<CustomSelect value="annual" options={OPTIONS} onChange={jest.fn()} />);

      await user.click(screen.getByText("Alerta anual"));

      expect(screen.getByText("Núcleos activos")).toBeInTheDocument();
      expect(screen.getByText("Alerta acumulada")).toBeInTheDocument();
    });

    it("reports the chosen value shaped like a DOM event", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<CustomSelect value="annual" options={OPTIONS} onChange={onChange} />);

      await user.click(screen.getByText("Alerta anual"));
      await user.click(screen.getByText("Núcleos activos"));

      expect(onChange).toHaveBeenCalledWith({ target: { value: "nad" } });
    });

    it("closes the list after choosing", async () => {
      const user = userEvent.setup();
      render(<Controlled />);

      await user.click(screen.getByText("Alerta anual"));
      await user.click(screen.getByText("Núcleos activos"));

      expect(screen.queryByText("Alerta acumulada")).not.toBeInTheDocument();
    });

    it("updates the visible label when used as a controlled input", async () => {
      const user = userEvent.setup();
      render(<Controlled />);

      await user.click(screen.getByText("Alerta anual"));
      await user.click(screen.getByText("Núcleos activos"));

      expect(screen.getByText("Núcleos activos")).toBeInTheDocument();
    });

    it("toggles closed when the trigger is clicked twice", async () => {
      const user = userEvent.setup();
      render(<CustomSelect value="annual" options={OPTIONS} onChange={jest.fn()} />);
      const trigger = screen.getByText("Alerta anual");

      await user.click(trigger);
      expect(screen.getByText("Núcleos activos")).toBeInTheDocument();

      await user.click(trigger);
      expect(screen.queryByText("Núcleos activos")).not.toBeInTheDocument();
    });

    it("closes when clicking outside the component", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <CustomSelect value="annual" options={OPTIONS} onChange={jest.fn()} />
          <button type="button">outside</button>
        </div>
      );

      await user.click(screen.getByText("Alerta anual"));
      expect(screen.getByText("Núcleos activos")).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByText("outside"));

      expect(screen.queryByText("Núcleos activos")).not.toBeInTheDocument();
    });
  });

  describe("disabled", () => {
    it("does not open when clicked", async () => {
      const user = userEvent.setup();
      render(<CustomSelect value="annual" options={OPTIONS} onChange={jest.fn()} disabled />);

      await user.click(screen.getByText("Alerta anual"));

      expect(screen.queryByText("Núcleos activos")).not.toBeInTheDocument();
    });

    it("marks the trigger as not interactive", () => {
      const { container } = render(
        <CustomSelect value="annual" options={OPTIONS} onChange={jest.fn()} disabled />
      );
      expect(container.querySelector(".cursor-not-allowed")).toBeInTheDocument();
    });
  });

  describe("syncing with the value and options props", () => {
    it("follows an externally changed value", () => {
      const { rerender } = render(
        <CustomSelect value="annual" options={OPTIONS} onChange={jest.fn()} />
      );
      expect(screen.getByText("Alerta anual")).toBeInTheDocument();

      rerender(<CustomSelect value="nad" options={OPTIONS} onChange={jest.fn()} />);

      expect(screen.getByText("Núcleos activos")).toBeInTheDocument();
    });

    it("notifies the parent once when the value is not in the option list", () => {
      const onChange = jest.fn();
      render(<CustomSelect value="missing" options={OPTIONS} onChange={onChange} />);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({ target: { value: "annual" } });
    });

    it("does not notify when the value is valid", () => {
      const onChange = jest.fn();
      render(<CustomSelect value="annual" options={OPTIONS} onChange={onChange} />);

      expect(onChange).not.toHaveBeenCalled();
    });

    it("picks up a label change for the same value", () => {
      const { rerender } = render(
        <CustomSelect value="annual" options={OPTIONS} onChange={jest.fn()} />
      );

      rerender(
        <CustomSelect
          value="annual"
          options={[{ value: "annual", label: "Anual (2024)" }]}
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText("Anual (2024)")).toBeInTheDocument();
    });

    it("falls back to the placeholder when the options disappear", () => {
      const { rerender } = render(
        <CustomSelect value="annual" options={OPTIONS} onChange={jest.fn()} placeholder="Vacío" />
      );

      rerender(<CustomSelect value="annual" options={[]} onChange={jest.fn()} placeholder="Vacío" />);

      expect(screen.getByText("Vacío")).toBeInTheDocument();
    });

    // Regression: onChange used to be an effect dependency and the state was
    // mirrored with a fresh object, so a parent passing a new array and a new
    // handler on every render drove an endless render -> effect -> setState loop.
    it("settles after one notification when the parent recreates props each render", () => {
      const onChangeSpy = jest.fn();

      function UnstableParent() {
        const [value, setValue] = useState("missing");
        return (
          <CustomSelect
            value={value}
            options={[
              { value: "annual", label: "Alerta anual" },
              { value: "nad", label: "Núcleos activos" },
            ]}
            onChange={(e) => {
              onChangeSpy(e.target.value);
              setValue(e.target.value);
            }}
          />
        );
      }

      render(<UnstableParent />);

      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenCalledWith("annual");
      expect(screen.getByText("Alerta anual")).toBeInTheDocument();
    });

    it("does not re-notify while the value stays valid across rerenders", () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <CustomSelect value="annual" options={[...OPTIONS]} onChange={onChange} />
      );

      rerender(<CustomSelect value="annual" options={[...OPTIONS]} onChange={onChange} />);
      rerender(<CustomSelect value="annual" options={[...OPTIONS]} onChange={onChange} />);

      expect(onChange).not.toHaveBeenCalled();
    });

    it("notifies again if the value becomes invalid a second time", () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <CustomSelect value="missing" options={OPTIONS} onChange={onChange} />
      );
      expect(onChange).toHaveBeenCalledTimes(1);

      rerender(<CustomSelect value="annual" options={OPTIONS} onChange={onChange} />);
      rerender(<CustomSelect value="gone" options={OPTIONS} onChange={onChange} />);

      expect(onChange).toHaveBeenCalledTimes(2);
    });

    // The hard case for the guard: the parent ignores onChange, so the value
    // stays invalid, and it also hands over a new options array every render.
    // Without the guard this notifies on every single render.
    it("notifies only once when the parent ignores onChange and keeps rerendering", () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <CustomSelect value="missing" options={[...OPTIONS]} onChange={onChange} />
      );
      expect(onChange).toHaveBeenCalledTimes(1);

      rerender(<CustomSelect value="missing" options={[...OPTIONS]} onChange={onChange} />);
      rerender(<CustomSelect value="missing" options={[...OPTIONS]} onChange={onChange} />);
      rerender(<CustomSelect value="missing" options={[...OPTIONS]} onChange={onChange} />);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Alerta anual")).toBeInTheDocument();
    });

    it("works without an onChange handler", () => {
      expect(() => render(<CustomSelect value="missing" options={OPTIONS} />)).not.toThrow();
    });
  });
});
