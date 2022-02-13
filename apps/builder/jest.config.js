module.exports = {
  preset: "../../jest.preset.js",
  coverageDirectory: "../../coverage/apps/builder",
  globals: { "ts-jest": { tsconfig: "<rootDir>/tsconfig.spec.json" } },
  displayName: "builder",
  testEnvironment: "node",
};
