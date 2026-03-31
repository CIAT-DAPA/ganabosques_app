import { validateToken } from "../tokenService";

beforeEach(() => { global.fetch = jest.fn(); });
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
  });

  it("returns { valid: false } when fetch throws", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await validateToken("any-token");
    expect(result).toEqual({ valid: false });
  });
});
