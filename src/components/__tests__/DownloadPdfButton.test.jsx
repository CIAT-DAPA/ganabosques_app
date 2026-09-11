// jsPDF and html2canvas-pro are loaded lazily inside the handler, so both are
// replaced with doubles that record how the PDF gets assembled.
const mockPdfInstance = {
  internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
  addImage: jest.fn(),
  addPage: jest.fn(),
  save: jest.fn(),
};
const mockJsPDFCtor = jest.fn(() => mockPdfInstance);
jest.mock("jspdf", () => ({ __esModule: true, jsPDF: mockJsPDFCtor }));

const mockHtml2Canvas = jest.fn();
jest.mock("html2canvas-pro", () => ({ __esModule: true, default: mockHtml2Canvas }));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DownloadPdfButton from "../DownloadPdfButton";

// A canvas whose aspect ratio decides how many PDF pages are needed.
const canvasOf = (width, height) => ({
  width,
  height,
  toDataURL: jest.fn(() => "data:image/png;base64,AAAA"),
});

const mountTarget = (id = "report") => {
  const el = document.createElement("div");
  el.id = id;
  document.body.appendChild(el);
  return el;
};

describe("DownloadPdfButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
    mockHtml2Canvas.mockResolvedValue(canvasOf(1000, 1000));
  });

  describe("rendering", () => {
    it("shows the default label", () => {
      render(<DownloadPdfButton targetId="report" />);
      expect(screen.getByRole("button", { name: "Download PDF" })).toBeInTheDocument();
    });

    it("shows a custom label", () => {
      render(<DownloadPdfButton targetId="report" label="Descargar reporte" />);
      expect(screen.getByRole("button", { name: "Descargar reporte" })).toBeInTheDocument();
    });

    it("appends the extra className", () => {
      render(<DownloadPdfButton targetId="report" className="mt-4" />);
      expect(screen.getByRole("button")).toHaveClass("mt-4");
    });

    it("starts enabled and not busy", () => {
      render(<DownloadPdfButton targetId="report" />);

      expect(screen.getByRole("button")).toBeEnabled();
      expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "false");
    });
  });

  describe("guards", () => {
    it("does nothing without a targetId", async () => {
      const user = userEvent.setup();
      render(<DownloadPdfButton />);

      await user.click(screen.getByRole("button"));

      expect(mockHtml2Canvas).not.toHaveBeenCalled();
    });

    it("reports an error when the target element is missing", async () => {
      const user = userEvent.setup();
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      const onError = jest.fn();
      render(<DownloadPdfButton targetId="missing" onError={onError} />);

      await user.click(screen.getByRole("button"));

      expect(spy).toHaveBeenCalledWith('No element found with id="missing"');
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(mockHtml2Canvas).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it("does not fail when the target is missing and no onError is given", async () => {
      const user = userEvent.setup();
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      render(<DownloadPdfButton targetId="missing" />);

      await expect(user.click(screen.getByRole("button"))).resolves.toBeUndefined();
      spy.mockRestore();
    });
  });

  describe("generating the PDF", () => {
    it("captures the target element", async () => {
      const user = userEvent.setup();
      const el = mountTarget();
      render(<DownloadPdfButton targetId="report" />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => expect(mockHtml2Canvas).toHaveBeenCalled());
      expect(mockHtml2Canvas.mock.calls[0][0]).toBe(el);
    });

    it("passes the capture options through", async () => {
      const user = userEvent.setup();
      mountTarget();
      render(<DownloadPdfButton targetId="report" scale={3} backgroundColor="#eeeeee" />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => expect(mockHtml2Canvas).toHaveBeenCalled());
      expect(mockHtml2Canvas.mock.calls[0][1]).toEqual({
        scale: 3,
        useCORS: true,
        backgroundColor: "#eeeeee",
      });
    });

    it("uses the documented capture defaults", async () => {
      const user = userEvent.setup();
      mountTarget();
      render(<DownloadPdfButton targetId="report" />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => expect(mockHtml2Canvas).toHaveBeenCalled());
      expect(mockHtml2Canvas.mock.calls[0][1]).toEqual({
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
    });

    it("builds an A4 portrait document in millimetres", async () => {
      const user = userEvent.setup();
      mountTarget();
      render(<DownloadPdfButton targetId="report" />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => expect(mockJsPDFCtor).toHaveBeenCalledWith("p", "mm", "a4"));
    });

    it("saves with the default filename", async () => {
      const user = userEvent.setup();
      mountTarget();
      render(<DownloadPdfButton targetId="report" />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => expect(mockPdfInstance.save).toHaveBeenCalledWith("report.pdf"));
    });

    it("saves with a custom filename", async () => {
      const user = userEvent.setup();
      mountTarget();
      render(<DownloadPdfButton targetId="report" filename="predios.pdf" />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => expect(mockPdfInstance.save).toHaveBeenCalledWith("predios.pdf"));
    });

    it("fits a short capture on a single page", async () => {
      const user = userEvent.setup();
      mountTarget();
      // 1000x1000 scales to 210x210 mm, well under the 297 mm page height.
      render(<DownloadPdfButton targetId="report" />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => expect(mockPdfInstance.save).toHaveBeenCalled());
      expect(mockPdfInstance.addPage).not.toHaveBeenCalled();
      expect(mockPdfInstance.addImage).toHaveBeenCalledTimes(1);
    });

    it("splits a tall capture across extra pages", async () => {
      const user = userEvent.setup();
      mountTarget();
      // 1000x4000 scales to 210x840 mm: three pages of 297 mm, so the first
      // image plus two appended pages.
      mockHtml2Canvas.mockResolvedValue(canvasOf(1000, 4000));
      render(<DownloadPdfButton targetId="report" />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => expect(mockPdfInstance.save).toHaveBeenCalled());
      expect(mockPdfInstance.addPage).toHaveBeenCalledTimes(2);
      expect(mockPdfInstance.addImage).toHaveBeenCalledTimes(3);
    });

    it("embeds the captured image as PNG", async () => {
      const user = userEvent.setup();
      mountTarget();
      render(<DownloadPdfButton targetId="report" />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => expect(mockPdfInstance.addImage).toHaveBeenCalled());
      expect(mockPdfInstance.addImage.mock.calls[0][0]).toBe("data:image/png;base64,AAAA");
      expect(mockPdfInstance.addImage.mock.calls[0][1]).toBe("PNG");
    });
  });

  describe("busy state", () => {
    it("shows a progress label while generating", async () => {
      const user = userEvent.setup();
      mountTarget();
      let resolve;
      mockHtml2Canvas.mockReturnValue(new Promise((r) => { resolve = r; }));
      render(<DownloadPdfButton targetId="report" />);

      await user.click(screen.getByRole("button"));

      expect(screen.getByRole("button", { name: "Generando..." })).toBeDisabled();
      expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");

      resolve(canvasOf(1000, 1000));
      await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
    });

    it("returns to the idle label when it finishes", async () => {
      const user = userEvent.setup();
      mountTarget();
      render(<DownloadPdfButton targetId="report" />);

      await user.click(screen.getByRole("button"));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled()
      );
    });
  });

  describe("when generation fails", () => {
    it("logs the error and notifies the parent", async () => {
      const user = userEvent.setup();
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      const onError = jest.fn();
      mountTarget();
      mockHtml2Canvas.mockRejectedValue(new Error("capture failed"));
      render(<DownloadPdfButton targetId="report" onError={onError} />);

      await user.click(screen.getByRole("button"));

      await waitFor(() =>
        expect(spy).toHaveBeenCalledWith("Error generating PDF:", expect.any(Error))
      );
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      spy.mockRestore();
    });

    it("re-enables the button after a failure", async () => {
      const user = userEvent.setup();
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      mountTarget();
      mockHtml2Canvas.mockRejectedValue(new Error("capture failed"));
      render(<DownloadPdfButton targetId="report" />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
      expect(mockPdfInstance.save).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
