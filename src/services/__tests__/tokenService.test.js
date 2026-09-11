import { validateToken } from "../tokenService";

let errorSpy;

beforeEach(() => {
  global.fetch = jest.fn();
  // The catch branch logs before returning, so the log is silenced and asserted
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { jest.restoreAllMocks(); });

describe("validateToken", () => {
  it("returns data when token is valid", async () => {
    const mockData = { valid: true, user: "test@example.com" };
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });

    const result = await validateToken("valid-token");
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("auth/token/validate"),
      expect.objectContaining({
        method: "GET",
        headers: { Authorization: "Bearer valid-token" },
      })
    );
  });

  it("returns { valid: false } when response is not ok", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 401 });
    const result = await validateToken("invalid-token");
    expect(result).toEqual({ valid: false });
    expect(errorSpy).toHaveBeenCalledWith("Error validating token:", expect.any(Error));
  });

  it("returns { valid: false } when fetch throws", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await validateToken("any-token");
    expect(result).toEqual({ valid: false });
    expect(errorSpy).toHaveBeenCalledWith("Error validating token:", expect.any(Error));
  });

  it("does not log when the token is valid", async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ valid: true }) });
    await validateToken("valid-token");
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
