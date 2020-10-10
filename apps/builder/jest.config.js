module.exports = {
  preset: "../../jest.preset.js",
  coverageDirectory: "../../coverage/apps/builder",
  globals: { "ts-jest": { tsConfig: "<rootDir>/tsconfig.spec.json" } },
  displayName: "builder",
};
