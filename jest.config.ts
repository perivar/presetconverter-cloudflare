import { Config } from "@jest/types";

// By default, all files inside `node_modules` are not transformed. But some 3rd party
// modules are published as untranspiled, Jest will not understand the code in these modules.
// To overcome this, exclude these modules in the ignore pattern.
const untranspiledModulePatterns = [""];

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  roots: ["app"],
  transform: {
    "\\.[jt]sx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  testRegex: "/__tests__/.*.(spec|test).ts$",
  transformIgnorePatterns: [
    `node_modules/(?!${untranspiledModulePatterns.join("|")})`,
  ],
  verbose: true,
};

export default config;
