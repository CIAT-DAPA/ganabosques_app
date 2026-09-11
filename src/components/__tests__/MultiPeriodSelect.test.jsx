import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MultiPeriodSelect from "../MultiPeriodSelect";

const OPTIONS = [
  { value: "1", label: "2021 - 2022" },
  { value: "2", label: "2022 - 2023" },
  { value: "3", label: "2023 - 2024" },
  { value: "4", label: "2024 - 2025" },
];

const open = async (user) => {
  await user.click(screen.getByRole("button", { name: /Períodos|2021|2022|2023|2024/ }));
};

describe("MultiPeriodSelect", () => {
  describe("button summary", () => {
    it("shows the default label when nothing is selected", () => {
      render(<MultiPeriodSelect options={OPTIONS} values={[]} onChange={jest.fn()} />);
      expect(screen.getByRole("button", { name: "Períodos" })).toBeInTheDocument();
    });

    it("shows a custom label when nothing is selected", () => {
      render(
        <MultiPeriodSelect
          options={OPTIONS}
          values={[]}
          onChange={jest.fn()}
          buttonLabel="Elegir años"
        />
      );
      expect(screen.getByRole("button", { name: "Elegir años" })).toBeInTheDocument();
    });

    it("lists a single selection", () => {
      render(<MultiPeriodSelect options={OPTIONS} values={["1"]} onChange={jest.fn()} />);
      expect(screen.getByRole("button", { name: "2021 - 2022" })).toBeInTheDocument();
    });

    it("lists two selections joined by a comma", () => {
      render(<MultiPeriodSelect options={OPTIONS} values={["1", "2"]} onChange={jest.fn()} />);
      expect(
        screen.getByRole("button", { name: "2021 - 2022, 2022 - 2023" })
      ).toBeInTheDocument();
    });

    // Beyond two the summary is abbreviated so the button keeps its width.
    it("abbreviates three or more selections with a counter", () => {
      render(
        <MultiPeriodSelect options={OPTIONS} values={["1", "2", "3"]} onChange={jest.fn()} />
      );
      expect(
        screen.getByRole("button", { name: "2021 - 2022, 2022 - 2023 +1" })
      ).toBeInTheDocument();
    });

    it("counts every extra selection", () => {
      render(
        <MultiPeriodSelect options={OPTIONS} values={["1", "2", "3", "4"]} onChange={jest.fn()} />
      );
      expect(
        screen.getByRole("button", { name: "2021 - 2022, 2022 - 2023 +2" })
      ).toBeInTheDocument();
    });

    it("ignores selected values that are not in the option list", () => {
      render(<MultiPeriodSelect options={OPTIONS} values={["zzz"]} onChange={jest.fn()} />);
      expect(screen.getByRole("button", { name: "Períodos" })).toBeInTheDocument();
    });

    it("treats a missing values prop as empty", () => {
      render(<MultiPeriodSelect options={OPTIONS} onChange={jest.fn()} />);
      expect(screen.getByRole("button", { name: "Períodos" })).toBeInTheDocument();
    });
  });

  describe("the panel", () => {
    it("stays closed until the button is clicked", () => {
      render(<MultiPeriodSelect options={OPTIONS} values={[]} onChange={jest.fn()} />);
      expect(screen.queryByText("Seleccionar períodos")).not.toBeInTheDocument();
    });

    it("opens with a checkbox per option", async () => {
      const user = userEvent.setup();
      render(<MultiPeriodSelect options={OPTIONS} values={[]} onChange={jest.fn()} />);

      await open(user);

      expect(screen.getByText("Seleccionar períodos")).toBeInTheDocument();
      expect(screen.getAllByRole("checkbox")).toHaveLength(4);
    });

    it("reflects the current selection in the checkboxes", async () => {
      const user = userEvent.setup();
      render(<MultiPeriodSelect options={OPTIONS} values={["2"]} onChange={jest.fn()} />);

      await open(user);

      const boxes = screen.getAllByRole("checkbox");
      expect(boxes[0]).not.toBeChecked();
      expect(boxes[1]).toBeChecked();
    });

    it("closes from the close button", async () => {
      const user = userEvent.setup();
      render(<MultiPeriodSelect options={OPTIONS} values={[]} onChange={jest.fn()} />);

      await open(user);
      await user.click(screen.getByRole("button", { name: "Cerrar" }));

      expect(screen.queryByText("Seleccionar períodos")).not.toBeInTheDocument();
    });

    it("closes when the pointer leaves the panel", async () => {
      const user = userEvent.setup();
      render(<MultiPeriodSelect options={OPTIONS} values={[]} onChange={jest.fn()} />);

      await open(user);
      // onMouseLeave sits on the panel wrapper, not on the heading inside it.
      const panel = screen.getByText("Seleccionar períodos").closest("div.absolute");
      fireEvent.mouseLeave(panel);

      expect(screen.queryByText("Seleccionar períodos")).not.toBeInTheDocument();
    });

    it("toggles closed from the main button", async () => {
      const user = userEvent.setup();
      render(<MultiPeriodSelect options={OPTIONS} values={[]} onChange={jest.fn()} />);

      await open(user);
      await user.click(screen.getByRole("button", { name: "Períodos" }));

      expect(screen.queryByText("Seleccionar períodos")).not.toBeInTheDocument();
    });
  });

  describe("changing the selection", () => {
    it("adds a value when an unchecked box is clicked", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<MultiPeriodSelect options={OPTIONS} values={["1"]} onChange={onChange} />);

      await open(user);
      await user.click(screen.getAllByRole("checkbox")[1]);

      expect(onChange).toHaveBeenCalledWith(["1", "2"]);
    });

    it("removes a value when a checked box is clicked", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<MultiPeriodSelect options={OPTIONS} values={["1", "2"]} onChange={onChange} />);

      await open(user);
      await user.click(screen.getAllByRole("checkbox")[0]);

      expect(onChange).toHaveBeenCalledWith(["2"]);
    });

    it("selects every option from 'Seleccionar todos'", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<MultiPeriodSelect options={OPTIONS} values={[]} onChange={onChange} />);

      await open(user);
      await user.click(screen.getByRole("button", { name: "Seleccionar todos" }));

      expect(onChange).toHaveBeenCalledWith(["1", "2", "3", "4"]);
    });

    it("offers 'Quitar todos' once everything is selected", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <MultiPeriodSelect options={OPTIONS} values={["1", "2", "3", "4"]} onChange={onChange} />
      );

      await open(user);
      await user.click(screen.getByRole("button", { name: "Quitar todos" }));

      expect(onChange).toHaveBeenCalledWith([]);
    });

    it("empties the selection from 'Limpiar'", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<MultiPeriodSelect options={OPTIONS} values={["1", "2"]} onChange={onChange} />);

      await open(user);
      await user.click(screen.getByRole("button", { name: "Limpiar" }));

      expect(onChange).toHaveBeenCalledWith([]);
    });
  });

  describe("with no options", () => {
    it("renders the default label", () => {
      render(<MultiPeriodSelect options={[]} values={[]} onChange={jest.fn()} />);
      expect(screen.getByRole("button", { name: "Períodos" })).toBeInTheDocument();
    });

    // An empty list satisfies values.length === options.length, so the toggle
    // reads as if everything were already selected.
    it("shows 'Quitar todos' because an empty list counts as fully selected", async () => {
      const user = userEvent.setup();
      render(<MultiPeriodSelect options={[]} values={[]} onChange={jest.fn()} />);

      await user.click(screen.getByRole("button", { name: "Períodos" }));

      expect(screen.getByRole("button", { name: "Quitar todos" })).toBeInTheDocument();
      expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    });
  });
});
