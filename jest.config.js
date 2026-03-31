/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.[jt]sx?$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
      ],
    }],
  },
  transformIgnorePatterns: [
    "/node_modules/",
  ],
};
