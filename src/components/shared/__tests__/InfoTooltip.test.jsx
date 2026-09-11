import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InfoTooltip, { COLUMN_INFO } from "../InfoTooltip";

describe("InfoTooltip", () => {
  it("hides the text until the user interacts", () => {
    render(<InfoTooltip text="Area deforestada" />);
    expect(screen.queryByText("Area deforestada")).not.toBeInTheDocument();
  });

  it("renders a button as the trigger", () => {
    render(<InfoTooltip text="Area deforestada" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows the text on hover", async () => {
    const user = userEvent.setup();
    render(<InfoTooltip text="Area deforestada" />);

    await user.hover(screen.getByRole("button"));

    expect(screen.getByText("Area deforestada")).toBeInTheDocument();
  });

  it("hides the text again when the pointer leaves", async () => {
    const user = userEvent.setup();
    render(<InfoTooltip text="Area deforestada" />);
    const trigger = screen.getByRole("button");

    await user.hover(trigger);
    await user.unhover(trigger);

    expect(screen.queryByText("Area deforestada")).not.toBeInTheDocument();
  });

  // A bare click (no pointer enter first) is what a touch device produces.
  it("shows the text on a click with no preceding hover", () => {
    render(<InfoTooltip text="Area deforestada" />);

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("Area deforestada")).toBeInTheDocument();
  });

  // A real mouse click fires pointer enter first, so hover has already opened
  // the tooltip and the click toggle closes it again.
  it("closes the text when a hover is followed by a click", async () => {
    const user = userEvent.setup();
    render(<InfoTooltip text="Area deforestada" />);

    await user.click(screen.getByRole("button"));

    expect(screen.queryByText("Area deforestada")).not.toBeInTheDocument();
  });

  it("reopens the text on a second bare click", () => {
    render(<InfoTooltip text="Area deforestada" />);
    const trigger = screen.getByRole("button");

    fireEvent.click(trigger);
    fireEvent.click(trigger);
    fireEvent.click(trigger);

    expect(screen.getByText("Area deforestada")).toBeInTheDocument();
  });

  it("renders even without text", () => {
    render(<InfoTooltip />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});

describe("COLUMN_INFO", () => {
  it("describes every metric column of the farm table", () => {
    for (const key of [
      "deforestation_ha",
      "deforestation_pct",
      "frontier_in_ha",
      "frontier_in_pct",
      "frontier_out_ha",
      "frontier_out_pct",
      "protected_ha",
      "protected_pct",
    ]) {
      expect(typeof COLUMN_INFO[key]).toBe("string");
      expect(COLUMN_INFO[key].length).toBeGreaterThan(0);
    }
  });
});
