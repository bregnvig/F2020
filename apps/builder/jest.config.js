module.exports = {
  name: "builder",
  preset: "../../jest.config.js",
  coverageDirectory: "../../coverage/apps/builder",
  globals: { "ts-jest": { tsConfig: "<rootDir>/tsconfig.spec.json" } },
};
