import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterChips from "../FilterChips";

describe("FilterChips", () => {
  describe("with every mode off", () => {
    it("renders nothing", () => {
      render(<FilterChips />);
      expect(screen.queryAllByRole("button")).toHaveLength(0);
    });

    it("ignores data when the matching mode is off", () => {
      render(<FilterChips foundFarms={[{ id: "f1", code: "111" }]} setFoundFarms={jest.fn()} />);
      expect(screen.queryByText("111")).not.toBeInTheDocument();
    });
  });

  describe("farm mode", () => {
    it("renders a chip per farm code", () => {
      render(
        <FilterChips
          farmRisk
          foundFarms={[
            { id: "f1", code: "111" },
            { id: "f2", code: "222" },
          ]}
          setFoundFarms={jest.fn()}
        />
      );

      expect(screen.getByText("111")).toBeInTheDocument();
      expect(screen.getByText("222")).toBeInTheDocument();
    });

    it("labels each chip for screen readers", () => {
      render(
        <FilterChips farmRisk foundFarms={[{ id: "f1", code: "111" }]} setFoundFarms={jest.fn()} />
      );

      expect(screen.getByRole("button", { name: "Remover finca 111" })).toBeInTheDocument();
    });

    it("removes the clicked farm by its code", async () => {
      const user = userEvent.setup();
      const setFoundFarms = jest.fn();
      render(
        <FilterChips
          farmRisk
          foundFarms={[
            { id: "f1", code: "111" },
            { id: "f2", code: "222" },
          ]}
          setFoundFarms={setFoundFarms}
        />
      );

      await user.click(screen.getByRole("button", { name: "Remover finca 111" }));

      const updater = setFoundFarms.mock.calls[0][0];
      expect(updater([{ code: "111" }, { code: "222" }])).toEqual([{ code: "222" }]);
    });

    it("renders nothing when the farm list is empty", () => {
      render(<FilterChips farmRisk foundFarms={[]} setFoundFarms={jest.fn()} />);
      expect(screen.queryAllByRole("button")).toHaveLength(0);
    });

    it("falls back to the code as the key when the farm has no id", () => {
      render(<FilterChips farmRisk foundFarms={[{ code: "111" }]} setFoundFarms={jest.fn()} />);
      expect(screen.getByText("111")).toBeInTheDocument();
    });
  });

  describe("enterprise mode", () => {
    const enterprises = [
      { id: "e1", name: "Planta Norte" },
      { id: "e2", name: "Acopio Sur" },
    ];

    it("renders a chip per selected enterprise", () => {
      render(
        <FilterChips
          enterpriseRisk
          selectedEnterprise={enterprises}
          setSelectedEnterprise={jest.fn()}
        />
      );

      expect(screen.getByText("Planta Norte")).toBeInTheDocument();
      expect(screen.getByText("Acopio Sur")).toBeInTheDocument();
    });

    it("labels each chip for screen readers", () => {
      render(
        <FilterChips
          enterpriseRisk
          selectedEnterprise={enterprises}
          setSelectedEnterprise={jest.fn()}
        />
      );

      expect(
        screen.getByRole("button", { name: "Remover empresa Planta Norte" })
      ).toBeInTheDocument();
    });

    it("removes only the clicked enterprise", async () => {
      const user = userEvent.setup();
      const setSelectedEnterprise = jest.fn();
      render(
        <FilterChips
          enterpriseRisk
          selectedEnterprise={enterprises}
          setSelectedEnterprise={setSelectedEnterprise}
        />
      );

      await user.click(screen.getByRole("button", { name: "Remover empresa Planta Norte" }));

      const updater = setSelectedEnterprise.mock.calls[0][0];
      expect(updater(enterprises)).toEqual([{ id: "e2", name: "Acopio Sur" }]);
    });

    it("renders nothing for an empty selection", () => {
      render(
        <FilterChips enterpriseRisk selectedEnterprise={[]} setSelectedEnterprise={jest.fn()} />
      );
      expect(screen.queryAllByRole("button")).toHaveLength(0);
    });

    // The selection is an array, so a stale non-array value must not crash.
    it("renders nothing when the selection is not an array", () => {
      render(
        <FilterChips
          enterpriseRisk
          selectedEnterprise={{ id: "e1", name: "Planta" }}
          setSelectedEnterprise={jest.fn()}
        />
      );
      expect(screen.queryByText("Planta")).not.toBeInTheDocument();
    });

    it("renders nothing when the selection is null", () => {
      render(
        <FilterChips enterpriseRisk selectedEnterprise={null} setSelectedEnterprise={jest.fn()} />
      );
      expect(screen.queryAllByRole("button")).toHaveLength(0);
    });
  });

  describe("national mode", () => {
    const adms = [
      { id: "a1", adm3name: "El Retorno" },
      { id: "a2", adm3name: "Calamar" },
    ];

    it("renders a chip per selected region", () => {
      render(<FilterChips nationalRisk foundAdms={adms} setFoundAdms={jest.fn()} />);

      expect(screen.getByText("El Retorno")).toBeInTheDocument();
      expect(screen.getByText("Calamar")).toBeInTheDocument();
    });

    it("labels each chip for screen readers", () => {
      render(<FilterChips nationalRisk foundAdms={adms} setFoundAdms={jest.fn()} />);

      expect(
        screen.getByRole("button", { name: "Remover región El Retorno" })
      ).toBeInTheDocument();
    });

    it("removes the clicked region by its id", async () => {
      const user = userEvent.setup();
      const setFoundAdms = jest.fn();
      render(<FilterChips nationalRisk foundAdms={adms} setFoundAdms={setFoundAdms} />);

      await user.click(screen.getByRole("button", { name: "Remover región El Retorno" }));

      const updater = setFoundAdms.mock.calls[0][0];
      expect(updater(adms)).toEqual([{ id: "a2", adm3name: "Calamar" }]);
    });

    it("renders nothing when the region list is empty", () => {
      render(<FilterChips nationalRisk foundAdms={[]} setFoundAdms={jest.fn()} />);
      expect(screen.queryAllByRole("button")).toHaveLength(0);
    });
  });

  it("can render chips of several modes at once", () => {
    render(
      <FilterChips
        farmRisk
        nationalRisk
        foundFarms={[{ id: "f1", code: "111" }]}
        setFoundFarms={jest.fn()}
        foundAdms={[{ id: "a1", adm3name: "El Retorno" }]}
        setFoundAdms={jest.fn()}
      />
    );

    expect(screen.getByText("111")).toBeInTheDocument();
    expect(screen.getByText("El Retorno")).toBeInTheDocument();
  });
});
