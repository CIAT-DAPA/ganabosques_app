// Pin the timezone so date assertions do not depend on the runner
process.env.TZ = "America/Bogota";

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // Only *.test.js(x) are suites, so shared helpers can live in __tests__
  testMatch: ["**/*.test.[jt]s?(x)"],

  // Order matters: CSS and asset patterns must come before the "@/" alias
  moduleNameMapper: {
    "\.(css|less|sass|scss)$": "<rootDir>/__mocks__/styleMock.js",
    "\.(gif|png|jpe?g|svg|webp|avif|woff2?|ttf|eot)$": "<rootDir>/__mocks__/fileMock.js",
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  transform: {
    "^.+\.[jt]sx?$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        ["@babel/preset-react", { runtime: "automatic" }],
      ],
    }],
  },

  // Page suites drive many interactions; the 5s default is too tight for them.
  testTimeout: 30000,

  transformIgnorePatterns: [
    "/node_modules/",
  ],

  testTimeout: 30000,

  // Coverage only runs with --coverage (npm run test:coverage).
  // CI runs plain `npm test`: no coverage, no thresholds.
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/**/__tests__/**",
    "!src/**/*.test.{js,jsx}",
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/src/components/maps/",
    "<rootDir>/src/app/layout.jsx",
  ],
  coverageThreshold: {
    global: { statements: 90, lines: 90, functions: 85, branches: 80 },
  },
};
