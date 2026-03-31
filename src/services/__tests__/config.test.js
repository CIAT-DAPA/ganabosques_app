import { API_URL } from "../config";

describe("config", () => {
  it("exports API_URL as a non-empty string", () => {
    expect(typeof API_URL).toBe("string");
    expect(API_URL.length).toBeGreaterThan(0);
  });

  it("API_URL ends with a slash", () => {
    expect(API_URL.endsWith("/")).toBe(true);
  });

  it("API_URL starts with https", () => {
    expect(API_URL.startsWith("https://")).toBe(true);
  });
});
