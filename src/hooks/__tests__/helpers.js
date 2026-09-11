// Shared helpers for the hook test suites.
// Not a suite itself: jest.config.js limits testMatch to *.test.js(x).

import { useAuth } from "@/hooks/useAuth";

// Makes the useAuth mock return the given token. The suite must have called
// jest.mock("@/hooks/useAuth") beforehand.
export function mockToken(token = "test-token") {
  useAuth.mockReturnValue({ token });
  return token;
}

// A real pending-task counter shaped like a setState function.
//
// The fetch hooks call setPendingTasks(prev => prev + 1) when they start and
// (prev => Math.max(0, prev - 1)) when they finish. A mock that only records
// calls cannot detect an imbalance, so this helper keeps the value and exposes
// `value` to assert every hook leaves it back at zero.
export function makePendingTracker(initial = 0) {
  const state = { value: initial };
  const setPendingTasks = jest.fn((updater) => {
    state.value = typeof updater === "function" ? updater(state.value) : updater;
  });
  return { setPendingTasks, state };
}

// Silences console.error while a test exercises a failure branch.
export function silenceConsoleError() {
  return jest.spyOn(console, "error").mockImplementation(() => {});
}

// Silences console.warn while a test exercises a failure branch.
export function silenceConsoleWarn() {
  return jest.spyOn(console, "warn").mockImplementation(() => {});
}
