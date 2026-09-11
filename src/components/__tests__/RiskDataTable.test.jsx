import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import RiskDataTable from "../RiskDataTable";

const COLUMNS = [
  { key: "name", label: "Nombre" },
  { key: "amount", label: "Cantidad" },
];

const ROWS = [
  { id: "a", name: "Beta", amount: 20 },
  { id: "b", name: "Alfa", amount: 30 },
  { id: "c", name: "Zeta", amount: 10 },
];

const makeRows = (count) =>
  Array.from({ length: count }, (_, i) => ({ id: `r${i}`, name: `Row ${i}`, amount: i }));

const bodyNames = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => row.querySelectorAll("td")[0].textContent);

// The "Mostrando N a M registros" line splits its numbers across spans, so it
// is read as one blob of text rather than queried by string.
const paginationInfo = (container) =>
  container.querySelector(".text-sm.text-gray-600")?.textContent ?? "";

describe("RiskDataTable", () => {
  describe("empty state", () => {
    it("shows the default message with no data", () => {
      render(<RiskDataTable data={[]} columns={COLUMNS} />);
      expect(screen.getByText("No hay datos para mostrar.")).toBeInTheDocument();
    });

    it("shows a custom message", () => {
      render(
        <RiskDataTable data={[]} columns={COLUMNS} emptyMessage="No hay predios para mostrar." />
      );
      expect(screen.getByText("No hay predios para mostrar.")).toBeInTheDocument();
    });

    it("shows the message when data is undefined", () => {
      render(<RiskDataTable data={undefined} columns={COLUMNS} />);
      expect(screen.getByText("No hay datos para mostrar.")).toBeInTheDocument();
    });

    it("renders no table at all", () => {
      render(<RiskDataTable data={[]} columns={COLUMNS} />);
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("renders the message with no props", () => {
      render(<RiskDataTable />);
      expect(screen.getByText("No hay datos para mostrar.")).toBeInTheDocument();
    });
  });

  describe("rendering", () => {
    it("renders a header per column", () => {
      render(<RiskDataTable data={ROWS} columns={COLUMNS} />);

      expect(screen.getByText("Nombre")).toBeInTheDocument();
      expect(screen.getByText("Cantidad")).toBeInTheDocument();
    });

    it("renders a row per record", () => {
      render(<RiskDataTable data={ROWS} columns={COLUMNS} />);
      expect(screen.getAllByRole("row")).toHaveLength(ROWS.length + 1);
    });

    it("renders the raw value when the column has no renderer", () => {
      render(<RiskDataTable data={ROWS} columns={COLUMNS} />);
      expect(screen.getByText("Beta")).toBeInTheDocument();
      expect(screen.getByText("20")).toBeInTheDocument();
    });

    it("uses the column renderer when present", () => {
      const columns = [
        { key: "name", label: "Nombre", render: (value) => <b>{value.toUpperCase()}</b> },
      ];
      render(<RiskDataTable data={ROWS} columns={columns} />);

      expect(screen.getByText("BETA")).toBeInTheDocument();
    });

    it("passes value, row and index to the renderer", () => {
      const render_ = jest.fn((value) => value);
      render(
        <RiskDataTable data={[ROWS[0]]} columns={[{ key: "name", label: "N", render: render_ }]} />
      );

      expect(render_).toHaveBeenCalledWith("Beta", ROWS[0], 0);
    });

    it("reads the value through getValue when provided", () => {
      const columns = [{ key: "custom", label: "Custom", getValue: (row) => `${row.name}!` }];
      render(<RiskDataTable data={[ROWS[0]]} columns={columns} />);

      expect(screen.getByText("Beta!")).toBeInTheDocument();
    });

    it("applies the highlight style to flagged columns", () => {
      const columns = [{ key: "name", label: "Nombre", highlight: true }];
      render(<RiskDataTable data={[ROWS[0]]} columns={columns} />);

      expect(screen.getByText("Beta")).toHaveClass("font-medium");
    });

    it("applies a column minWidth to its header", () => {
      const columns = [{ key: "name", label: "Nombre", minWidth: "180px" }];
      render(<RiskDataTable data={[ROWS[0]]} columns={columns} />);

      expect(screen.getByText("Nombre").closest("th")).toHaveStyle({ minWidth: "180px" });
    });

    it("renders an info tooltip when the column documents itself", () => {
      const columns = [{ key: "name", label: "Nombre", info: "Explicación" }];
      render(<RiskDataTable data={[ROWS[0]]} columns={columns} />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("uses getRowKey to key the rows", () => {
      const getRowKey = jest.fn((row) => row.id);
      render(<RiskDataTable data={ROWS} columns={COLUMNS} getRowKey={getRowKey} />);

      expect(getRowKey).toHaveBeenCalledTimes(ROWS.length);
    });

    it("forwards tableId to the table element", () => {
      render(<RiskDataTable data={ROWS} columns={COLUMNS} tableId="tabla-predios" />);
      expect(screen.getByRole("table")).toHaveAttribute("id", "tabla-predios");
    });

    it("alternates the row styling", () => {
      render(<RiskDataTable data={ROWS} columns={COLUMNS} />);

      const rows = screen.getAllByRole("row").slice(1);
      expect(rows[0].className).not.toBe(rows[1].className);
    });
  });

  describe("sorting", () => {
    it("does not sort when sortable is off", async () => {
      const user = userEvent.setup();
      render(<RiskDataTable data={ROWS} columns={COLUMNS} />);

      await user.click(screen.getByText("Nombre"));

      expect(bodyNames()).toEqual(["Beta", "Alfa", "Zeta"]);
    });

    it("sorts strings ascending on the first click", async () => {
      const user = userEvent.setup();
      render(<RiskDataTable data={ROWS} columns={COLUMNS} sortable />);

      await user.click(screen.getByText("Nombre"));

      expect(bodyNames()).toEqual(["Alfa", "Beta", "Zeta"]);
    });

    it("sorts descending on the second click", async () => {
      const user = userEvent.setup();
      render(<RiskDataTable data={ROWS} columns={COLUMNS} sortable />);

      await user.click(screen.getByText("Nombre"));
      await user.click(screen.getByText("Nombre"));

      expect(bodyNames()).toEqual(["Zeta", "Beta", "Alfa"]);
    });

    it("restarts ascending when switching column", async () => {
      const user = userEvent.setup();
      render(<RiskDataTable data={ROWS} columns={COLUMNS} sortable />);

      await user.click(screen.getByText("Nombre"));
      await user.click(screen.getByText("Nombre"));
      await user.click(screen.getByText("Cantidad"));

      expect(bodyNames()).toEqual(["Zeta", "Beta", "Alfa"]);
    });

    it("sorts numbers numerically, not as text", async () => {
      const user = userEvent.setup();
      const data = [
        { id: "a", name: "A", amount: 100 },
        { id: "b", name: "B", amount: 9 },
        { id: "c", name: "C", amount: 50 },
      ];
      render(<RiskDataTable data={data} columns={COLUMNS} sortable />);

      await user.click(screen.getByText("Cantidad"));

      expect(bodyNames()).toEqual(["B", "C", "A"]);
    });

    it("sorts numbers descending", async () => {
      const user = userEvent.setup();
      render(<RiskDataTable data={ROWS} columns={COLUMNS} sortable />);

      await user.click(screen.getByText("Cantidad"));
      await user.click(screen.getByText("Cantidad"));

      expect(bodyNames()).toEqual(["Alfa", "Beta", "Zeta"]);
    });

    it("pushes null values last when ascending", async () => {
      const user = userEvent.setup();
      const data = [
        { id: "a", name: "A", amount: 5 },
        { id: "b", name: "B", amount: null },
        { id: "c", name: "C", amount: 1 },
      ];
      render(<RiskDataTable data={data} columns={COLUMNS} sortable />);

      await user.click(screen.getByText("Cantidad"));

      expect(bodyNames()).toEqual(["C", "A", "B"]);
    });

    it("pushes null values first when descending", async () => {
      const user = userEvent.setup();
      const data = [
        { id: "a", name: "A", amount: 5 },
        { id: "b", name: "B", amount: null },
        { id: "c", name: "C", amount: 1 },
      ];
      render(<RiskDataTable data={data} columns={COLUMNS} sortable />);

      await user.click(screen.getByText("Cantidad"));
      await user.click(screen.getByText("Cantidad"));

      expect(bodyNames()).toEqual(["B", "A", "C"]);
    });

    it("sorts through getValue when the column defines it", async () => {
      const user = userEvent.setup();
      const columns = [
        { key: "name", label: "Nombre" },
        { key: "inverse", label: "Inverso", getValue: (row) => -row.amount },
      ];
      render(<RiskDataTable data={ROWS} columns={columns} sortable />);

      await user.click(screen.getByText("Inverso"));

      expect(bodyNames()).toEqual(["Alfa", "Beta", "Zeta"]);
    });

    it("leaves a column out of sorting when it opts out", async () => {
      const user = userEvent.setup();
      const columns = [
        { key: "name", label: "Nombre", sortable: false },
        { key: "amount", label: "Cantidad" },
      ];
      render(<RiskDataTable data={ROWS} columns={columns} sortable />);

      await user.click(screen.getByText("Nombre"));

      expect(bodyNames()).toEqual(["Beta", "Alfa", "Zeta"]);
    });

    it("highlights the active header", async () => {
      const user = userEvent.setup();
      render(<RiskDataTable data={ROWS} columns={COLUMNS} sortable />);

      await user.click(screen.getByText("Nombre"));

      expect(screen.getByText("Nombre").closest("th")).toHaveClass("bg-green-50");
    });
  });

  describe("internal pagination", () => {
    it("shows only the first page", () => {
      render(<RiskDataTable data={makeRows(25)} columns={COLUMNS} paginated />);
      expect(screen.getAllByRole("row")).toHaveLength(21);
    });

    it("honours a custom page size", () => {
      render(
        <RiskDataTable data={makeRows(25)} columns={COLUMNS} paginated defaultPageSize={10} />
      );
      expect(screen.getAllByRole("row")).toHaveLength(11);
    });

    it("reports the visible record range", () => {
      const { container } = render(
        <RiskDataTable data={makeRows(25)} columns={COLUMNS} paginated defaultPageSize={10} />
      );

      expect(paginationInfo(container)).toMatch(/Mostrando\s*1\s*a\s*10\s*registros/);
    });

    it("moves to the next page", async () => {
      const user = userEvent.setup();
      render(
        <RiskDataTable data={makeRows(25)} columns={COLUMNS} paginated defaultPageSize={10} />
      );

      await user.click(screen.getByRole("button", { name: "2" }));

      expect(bodyNames()[0]).toBe("Row 10");
    });

    it("disables the previous button on the first page", () => {
      const { container } = render(
        <RiskDataTable data={makeRows(25)} columns={COLUMNS} paginated defaultPageSize={10} />
      );

      const buttons = container.querySelectorAll("button");
      expect(buttons[0]).toBeDisabled();
    });

    it("disables the next button on the last page", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <RiskDataTable data={makeRows(15)} columns={COLUMNS} paginated defaultPageSize={10} />
      );

      await user.click(screen.getByRole("button", { name: "2" }));

      const buttons = container.querySelectorAll("button");
      expect(buttons[buttons.length - 1]).toBeDisabled();
    });

    it("walks forward and back with the arrow buttons", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <RiskDataTable data={makeRows(25)} columns={COLUMNS} paginated defaultPageSize={10} />
      );
      const next = () => container.querySelectorAll("button")[
        container.querySelectorAll("button").length - 1
      ];
      const prev = () => container.querySelectorAll("button")[0];

      await user.click(next());
      expect(bodyNames()[0]).toBe("Row 10");

      await user.click(prev());
      expect(bodyNames()[0]).toBe("Row 0");
    });

    it("caps the page buttons to five", () => {
      render(
        <RiskDataTable data={makeRows(200)} columns={COLUMNS} paginated defaultPageSize={10} />
      );

      const numbered = screen
        .getAllByRole("button")
        .filter((b) => /^\d+$/.test(b.textContent));
      expect(numbered).toHaveLength(5);
    });

    it("keeps five page buttons when sitting on the last page", async () => {
      const user = userEvent.setup();
      render(
        <RiskDataTable data={makeRows(100)} columns={COLUMNS} paginated defaultPageSize={10} />
      );

      await user.click(screen.getByRole("button", { name: "5" }));

      const numbered = screen
        .getAllByRole("button")
        .filter((b) => /^\d+$/.test(b.textContent));
      expect(numbered).toHaveLength(5);
    });

    it("renders no pagination controls when paginated is off", () => {
      render(<RiskDataTable data={makeRows(25)} columns={COLUMNS} />);
      expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument();
    });

    // Regression: this reset used to run inside useMemo, updating state during
    // render. Changing the data must land the user back on page one.
    it("returns to the first page when the data changes", async () => {
      const user = userEvent.setup();

      function Host() {
        const [rows, setRows] = useState(makeRows(25));
        return (
          <div>
            <button type="button" onClick={() => setRows(makeRows(30))}>
              reload
            </button>
            <RiskDataTable data={rows} columns={COLUMNS} paginated defaultPageSize={10} />
          </div>
        );
      }

      render(<Host />);

      await user.click(screen.getByRole("button", { name: "2" }));
      expect(bodyNames()[0]).toBe("Row 10");

      await user.click(screen.getByRole("button", { name: "reload" }));

      expect(bodyNames()[0]).toBe("Row 0");
    });
  });

  describe("external pagination", () => {
    const externalProps = {
      data: makeRows(10),
      columns: COLUMNS,
      paginated: true,
      defaultPageSize: 10,
      externalPage: 2,
      setExternalPage: jest.fn(),
    };

    it("renders the given data without slicing it", () => {
      render(<RiskDataTable {...externalProps} />);
      expect(screen.getAllByRole("row")).toHaveLength(11);
    });

    it("reports the range offset by the current page", () => {
      const { container } = render(<RiskDataTable {...externalProps} />);

      expect(paginationInfo(container)).toMatch(/Mostrando\s*11\s*a\s*20\s*registros/);
    });

    it("delegates page changes to the parent", async () => {
      const user = userEvent.setup();
      const setExternalPage = jest.fn();
      render(<RiskDataTable {...externalProps} setExternalPage={setExternalPage} hasMore />);

      await user.click(screen.getByRole("button", { name: "3" }));

      expect(setExternalPage).toHaveBeenCalledWith(3);
    });

    it("offers a next page while hasMore is set", () => {
      const { container } = render(<RiskDataTable {...externalProps} hasMore />);

      const buttons = container.querySelectorAll("button");
      expect(buttons[buttons.length - 1]).toBeEnabled();
    });

    it("blocks the next page once hasMore is false", () => {
      const { container } = render(<RiskDataTable {...externalProps} hasMore={false} />);

      const buttons = container.querySelectorAll("button");
      expect(buttons[buttons.length - 1]).toBeDisabled();
    });

    it("passes an updater to the parent for the arrow buttons", async () => {
      const user = userEvent.setup();
      const setExternalPage = jest.fn();
      const { container } = render(
        <RiskDataTable {...externalProps} setExternalPage={setExternalPage} hasMore />
      );

      const buttons = container.querySelectorAll("button");
      await user.click(buttons[buttons.length - 1]);

      const updater = setExternalPage.mock.calls[0][0];
      expect(typeof updater).toBe("function");
      expect(updater(2)).toBe(3);
    });

    it("clamps the previous-page updater at one", async () => {
      const user = userEvent.setup();
      const setExternalPage = jest.fn();
      const { container } = render(
        <RiskDataTable {...externalProps} setExternalPage={setExternalPage} hasMore />
      );

      await user.click(container.querySelectorAll("button")[0]);

      const updater = setExternalPage.mock.calls[0][0];
      expect(updater(1)).toBe(1);
    });
  });
});
