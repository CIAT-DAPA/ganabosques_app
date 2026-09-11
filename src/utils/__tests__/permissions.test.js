import { hasPermission } from "../permissions";

// Shape of userDb as returned by the backend after validating the token.
const userDb = (permissions, admin = false) => ({ admin, permissions });

describe("hasPermission", () => {
  describe("without a user", () => {
    it("denies when userDb is null", () => {
      expect(hasPermission(null, "read", "farm")).toBe(false);
    });

    it("denies when userDb is undefined", () => {
      expect(hasPermission(undefined, "read", "farm")).toBe(false);
    });

    it("denies with no arguments at all", () => {
      expect(hasPermission()).toBe(false);
    });
  });

  describe("for an admin user", () => {
    it("grants any action and option", () => {
      const admin = userDb([], true);
      expect(hasPermission(admin, "read", "farm")).toBe(true);
      expect(hasPermission(admin, "anything", "any-option")).toBe(true);
    });

    it("grants even without a permission list", () => {
      expect(hasPermission({ admin: true }, "read", "farm")).toBe(true);
    });
  });

  describe("with explicit permissions", () => {
    const user = userDb([
      { action: "read", options: ["farm", "enterprise"] },
      { action: "write", options: ["farm"] },
    ]);

    it("grants when action and option both match", () => {
      expect(hasPermission(user, "read", "farm")).toBe(true);
      expect(hasPermission(user, "read", "enterprise")).toBe(true);
      expect(hasPermission(user, "write", "farm")).toBe(true);
    });

    it("denies when the action matches but the option is not listed", () => {
      expect(hasPermission(user, "write", "enterprise")).toBe(false);
    });

    it("denies when the option matches but the action does not", () => {
      expect(hasPermission(user, "delete", "farm")).toBe(false);
    });

    it("denies when neither action nor option match", () => {
      expect(hasPermission(user, "delete", "adm3")).toBe(false);
    });

    it("is case sensitive", () => {
      expect(hasPermission(user, "READ", "farm")).toBe(false);
      expect(hasPermission(user, "read", "FARM")).toBe(false);
    });
  });

  describe("with a missing or empty permission list", () => {
    it("denies for an empty permissions array", () => {
      expect(hasPermission(userDb([]), "read", "farm")).toBe(false);
    });

    it("denies when permissions is undefined", () => {
      expect(hasPermission({ admin: false }, "read", "farm")).toBe(false);
    });

    it("denies when permissions is null", () => {
      expect(hasPermission(userDb(null), "read", "farm")).toBe(false);
    });
  });

  describe("when admin is falsy but not false", () => {
    it("falls through to the permission check when admin is undefined", () => {
      expect(
        hasPermission({ permissions: [{ action: "read", options: ["farm"] }] }, "read", "farm")
      ).toBe(true);
      expect(hasPermission({ permissions: [] }, "read", "farm")).toBe(false);
    });
  });
});
