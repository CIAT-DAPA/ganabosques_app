import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "../SearchBar";

const baseProps = () => ({
  search: "",
  setSearch: jest.fn(),
  setToast: jest.fn(),
  setFoundFarms: jest.fn(),
  setFoundAdms: jest.fn(),
  setAdmSuggestions: jest.fn(),
  setFilteredEnterprises: jest.fn(),
  setSelectedEnterprise: jest.fn(),
  onAdmSearch: jest.fn(),
  onSearch: jest.fn(),
});

const input = () => screen.getByRole("textbox");
const submitButton = () => screen.getByRole("button", { name: "Buscar" });

describe("SearchBar", () => {
  describe("placeholder", () => {
    it("asks for a site by default", () => {
      render(<SearchBar {...baseProps()} />);
      expect(input()).toHaveAttribute("placeholder", "Buscar sitio");
    });

    it("asks for an enterprise in enterprise mode", () => {
      render(<SearchBar {...baseProps()} enterpriseRisk />);
      expect(input()).toHaveAttribute("placeholder", "Buscar empresa");
    });

    it("asks for a generic code in farm mode", () => {
      render(<SearchBar {...baseProps()} farmRisk />);
      expect(input()).toHaveAttribute("placeholder", "Buscar código");
    });

    it("names the configured source label in farm mode", () => {
      render(<SearchBar {...baseProps()} farmRisk sourceLabel="GEOFARMER_ID" />);
      expect(input()).toHaveAttribute("placeholder", "Buscar GEOFARMER_ID");
    });
  });

  describe("the text field", () => {
    it("shows the current search value", () => {
      render(<SearchBar {...baseProps()} search="Meta" />);
      expect(input()).toHaveValue("Meta");
    });

    it("reports every keystroke to the parent", async () => {
      const user = userEvent.setup();
      const props = baseProps();
      render(<SearchBar {...props} />);

      await user.type(input(), "M");

      expect(props.setSearch).toHaveBeenCalledWith("M");
    });

    it("disables the submit button while the field is empty", () => {
      render(<SearchBar {...baseProps()} search="" />);
      expect(submitButton()).toBeDisabled();
    });

    it("disables the submit button for whitespace only", () => {
      render(<SearchBar {...baseProps()} search="   " />);
      expect(submitButton()).toBeDisabled();
    });

    it("enables the submit button once there is text", () => {
      render(<SearchBar {...baseProps()} search="Meta" />);
      expect(submitButton()).toBeEnabled();
    });
  });

  describe("farm mode submit", () => {
    const farmProps = (overrides = {}) => ({
      ...baseProps(),
      farmRisk: true,
      search: "111",
      risk: "annual",
      year: "10",
      source: "smbyc",
      foundFarms: [],
      ...overrides,
    });

    it("adds the typed code as a pending farm", async () => {
      const user = userEvent.setup();
      const props = farmProps();
      render(<SearchBar {...props} />);

      await user.click(submitButton());

      const updater = props.setFoundFarms.mock.calls[0][0];
      expect(updater([])).toEqual([{ id: null, code: "111" }]);
    });

    it("clears the field after adding", async () => {
      const user = userEvent.setup();
      const props = farmProps();
      render(<SearchBar {...props} />);

      await user.click(submitButton());

      expect(props.setSearch).toHaveBeenCalledWith("");
    });

    it("trims the typed code", async () => {
      const user = userEvent.setup();
      const props = farmProps({ search: "  111  " });
      render(<SearchBar {...props} />);

      await user.click(submitButton());

      const updater = props.setFoundFarms.mock.calls[0][0];
      expect(updater([])).toEqual([{ id: null, code: "111" }]);
    });

    it("does not add a code that is already in the list", async () => {
      const user = userEvent.setup();
      const props = farmProps({ foundFarms: [{ id: null, code: "111" }] });
      render(<SearchBar {...props} />);

      await user.click(submitButton());

      expect(props.setFoundFarms).not.toHaveBeenCalled();
      expect(props.setSearch).toHaveBeenCalledWith("");
    });

    it("warns when the filters are incomplete", async () => {
      const user = userEvent.setup();
      const props = farmProps({ year: "" });
      render(<SearchBar {...props} />);

      await user.click(submitButton());

      expect(props.setToast).toHaveBeenCalledWith({
        type: "warning",
        message: "Debes seleccionar Riesgo, Año y Fuente antes de buscar",
      });
      expect(props.setFoundFarms).not.toHaveBeenCalled();
    });

    it("warns when the risk is missing", async () => {
      const user = userEvent.setup();
      const props = farmProps({ risk: "" });
      render(<SearchBar {...props} />);

      await user.click(submitButton());

      expect(props.setToast).toHaveBeenCalled();
    });

    it("warns when the source is missing", async () => {
      const user = userEvent.setup();
      const props = farmProps({ source: "" });
      render(<SearchBar {...props} />);

      await user.click(submitButton());

      expect(props.setToast).toHaveBeenCalled();
    });

    // Report mode drives its own period selection, so year/source are not required.
    it("skips the filter check in report mode", async () => {
      const user = userEvent.setup();
      const props = farmProps({ report: true, year: "", source: "", risk: "" });
      render(<SearchBar {...props} />);

      await user.click(submitButton());

      expect(props.setToast).not.toHaveBeenCalled();
      expect(props.setFoundFarms).toHaveBeenCalled();
    });

    it("refuses to add more than five farms", async () => {
      const user = userEvent.setup();
      const props = farmProps({
        foundFarms: [
          { code: "1" },
          { code: "2" },
          { code: "3" },
          { code: "4" },
          { code: "5" },
        ],
      });
      render(<SearchBar {...props} />);

      await user.click(submitButton());

      expect(props.setToast).toHaveBeenCalledWith({
        type: "warning",
        message: "Máximo 5 SIT CODE permitidos",
      });
      expect(props.setFoundFarms).not.toHaveBeenCalled();
    });
  });

  describe("national mode submit", () => {
    it("delegates the search to the parent handler", async () => {
      const user = userEvent.setup();
      const props = { ...baseProps(), nationalRisk: true, search: "Meta", admLevel: "adm1" };
      render(<SearchBar {...props} />);

      await user.click(submitButton());

      expect(props.onAdmSearch).toHaveBeenCalledWith("Meta", "adm1");
    });

    it("trims the query before searching", async () => {
      const user = userEvent.setup();
      const props = { ...baseProps(), nationalRisk: true, search: "  Meta ", admLevel: "adm3" };
      render(<SearchBar {...props} />);

      await user.click(submitButton());

      expect(props.onAdmSearch).toHaveBeenCalledWith("Meta", "adm3");
    });
  });

  describe("enterprise mode submit", () => {
    // Enterprises are only picked from the suggestion list, never by submitting.
    it("does nothing on submit", async () => {
      const user = userEvent.setup();
      const props = { ...baseProps(), enterpriseRisk: true, search: "Frigo" };
      render(<SearchBar {...props} />);

      await user.click(submitButton());

      expect(props.onSearch).not.toHaveBeenCalled();
      expect(props.setSelectedEnterprise).not.toHaveBeenCalled();
    });
  });

  describe("generic submit", () => {
    it("falls back to onSearch when no mode is active", async () => {
      const user = userEvent.setup();
      const props = { ...baseProps(), search: "algo" };
      render(<SearchBar {...props} />);

      await user.click(submitButton());

      expect(props.onSearch).toHaveBeenCalled();
    });

    it("does not fail when onSearch is absent", async () => {
      const user = userEvent.setup();
      const props = { ...baseProps(), search: "algo", onSearch: undefined };
      render(<SearchBar {...props} />);

      await expect(user.click(submitButton())).resolves.toBeUndefined();
    });

    it("ignores a submit with an empty query", () => {
      const props = { ...baseProps(), search: "   " };
      render(<SearchBar {...props} />);

      expect(submitButton()).toBeDisabled();
      expect(props.onSearch).not.toHaveBeenCalled();
    });
  });

  describe("enterprise suggestions", () => {
    const enterprises = [
      { id: "e1", name: "Planta Norte" },
      { id: "e2", name: "Acopio Sur" },
    ];

    it("lists the suggestions while there is text", () => {
      render(
        <SearchBar
          {...baseProps()}
          enterpriseRisk
          search="Pla"
          filteredEnterprises={enterprises}
        />
      );

      expect(screen.getAllByRole("option")).toHaveLength(2);
      expect(screen.getByText("Planta Norte")).toBeInTheDocument();
    });

    it("hides the list when the field is empty", () => {
      render(
        <SearchBar {...baseProps()} enterpriseRisk search="" filteredEnterprises={enterprises} />
      );

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("hides the list outside enterprise mode", () => {
      render(<SearchBar {...baseProps()} search="Pla" filteredEnterprises={enterprises} />);
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("adds the whole enterprise object on click", async () => {
      const user = userEvent.setup();
      const props = {
        ...baseProps(),
        enterpriseRisk: true,
        search: "Pla",
        filteredEnterprises: enterprises,
        selectedEnterprise: [],
      };
      render(<SearchBar {...props} />);

      await user.click(screen.getByText("Planta Norte"));

      const updater = props.setSelectedEnterprise.mock.calls[0][0];
      expect(updater([])).toEqual([enterprises[0]]);
    });

    it("clears the field and closes the list after picking", async () => {
      const user = userEvent.setup();
      const props = {
        ...baseProps(),
        enterpriseRisk: true,
        search: "Pla",
        filteredEnterprises: enterprises,
        selectedEnterprise: [],
      };
      render(<SearchBar {...props} />);

      await user.click(screen.getByText("Planta Norte"));

      expect(props.setSearch).toHaveBeenCalledWith("");
      expect(props.setFilteredEnterprises).toHaveBeenCalledWith([]);
    });

    it("does not add an enterprise that is already selected", async () => {
      const user = userEvent.setup();
      const props = {
        ...baseProps(),
        enterpriseRisk: true,
        search: "Pla",
        filteredEnterprises: enterprises,
        selectedEnterprise: [enterprises[0]],
      };
      render(<SearchBar {...props} />);

      await user.click(screen.getByText("Planta Norte"));

      expect(props.setSelectedEnterprise).not.toHaveBeenCalled();
      expect(props.setSearch).toHaveBeenCalledWith("");
    });

    it("appends to a null selection without failing", async () => {
      const user = userEvent.setup();
      const props = {
        ...baseProps(),
        enterpriseRisk: true,
        search: "Pla",
        filteredEnterprises: enterprises,
        selectedEnterprise: null,
      };
      render(<SearchBar {...props} />);

      await user.click(screen.getByText("Planta Norte"));

      const updater = props.setSelectedEnterprise.mock.calls[0][0];
      expect(updater(null)).toEqual([enterprises[0]]);
    });

    it("falls back to _id, then to the external code, for the identity", async () => {
      const user = userEvent.setup();
      const props = {
        ...baseProps(),
        enterpriseRisk: true,
        search: "Pla",
        filteredEnterprises: [{ _id: "alt", name: "Con _id" }],
        selectedEnterprise: [{ _id: "alt", name: "Con _id" }],
      };
      render(<SearchBar {...props} />);

      await user.click(screen.getByText("Con _id"));

      expect(props.setSelectedEnterprise).not.toHaveBeenCalled();
    });

    it("uses the label when the enterprise has no name", () => {
      render(
        <SearchBar
          {...baseProps()}
          enterpriseRisk
          search="x"
          filteredEnterprises={[{ id: "e9", label: "Etiqueta" }]}
        />
      );

      expect(screen.getByText("Etiqueta")).toBeInTheDocument();
    });
  });

  describe("adm suggestions", () => {
    const suggestions = [
      { id: "a1", name: "El Retorno", label: "El Retorno, Guaviare" },
      { id: "a2", name: "Calamar", label: "Calamar, Guaviare" },
    ];

    it("lists the suggestions in national mode", () => {
      render(<SearchBar {...baseProps()} nationalRisk admSuggestions={suggestions} />);

      expect(screen.getAllByRole("option")).toHaveLength(2);
      expect(screen.getByText("El Retorno, Guaviare")).toBeInTheDocument();
    });

    it("hides the list outside national mode", () => {
      render(<SearchBar {...baseProps()} admSuggestions={suggestions} />);
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("adds the region and triggers the map search", async () => {
      const user = userEvent.setup();
      const props = {
        ...baseProps(),
        nationalRisk: true,
        admSuggestions: suggestions,
        foundAdms: [],
        admLevel: "adm3",
      };
      render(<SearchBar {...props} />);

      await user.click(screen.getByText("El Retorno, Guaviare"));

      const updater = props.setFoundAdms.mock.calls[0][0];
      expect(updater([])).toEqual([{ id: "a1", adm3name: "El Retorno" }]);
      expect(props.onAdmSearch).toHaveBeenCalledWith("El Retorno", "adm3");
    });

    it("clears the field and the suggestion list after picking", async () => {
      const user = userEvent.setup();
      const props = {
        ...baseProps(),
        nationalRisk: true,
        admSuggestions: suggestions,
        foundAdms: [],
      };
      render(<SearchBar {...props} />);

      await user.click(screen.getByText("El Retorno, Guaviare"));

      expect(props.setSearch).toHaveBeenCalledWith("");
      expect(props.setAdmSuggestions).toHaveBeenCalledWith([]);
    });

    it("does not add a region that is already selected", async () => {
      const user = userEvent.setup();
      const props = {
        ...baseProps(),
        nationalRisk: true,
        admSuggestions: suggestions,
        foundAdms: [{ id: "a1", adm3name: "El Retorno" }],
      };
      render(<SearchBar {...props} />);

      await user.click(screen.getByText("El Retorno, Guaviare"));

      expect(props.setFoundAdms).not.toHaveBeenCalled();
      expect(props.onAdmSearch).toHaveBeenCalled();
    });

    it("refuses to add more than five regions", async () => {
      const user = userEvent.setup();
      const props = {
        ...baseProps(),
        nationalRisk: true,
        admSuggestions: suggestions,
        foundAdms: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
      };
      render(<SearchBar {...props} />);

      await user.click(screen.getByText("El Retorno, Guaviare"));

      expect(props.setToast).toHaveBeenCalledWith({
        type: "warning",
        message: "Máximo 5 elementos permitidos",
      });
      expect(props.setFoundAdms).not.toHaveBeenCalled();
      expect(props.onAdmSearch).not.toHaveBeenCalled();
    });
  });
});
