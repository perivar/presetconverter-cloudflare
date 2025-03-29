import { Config } from "@jest/types";

// By default, all files inside `node_modules` are not transformed. But some 3rd party
// modules are published as untranspiled, Jest will not understand the code in these modules.
// To overcome this, exclude these modules in the ignore pattern.
const untranspiledModulePatterns = [""];

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["app"],
  // had to add isolatedModules: true to make sure the jest tests did not take forever to start
  // https://github.com/jestjs/jest/issues/10833
  transform: {
    "\\.[jt]sx?$": [
      "ts-jest",
      { tsconfig: "tsconfig.json", isolatedModules: true },
    ],
  },
  testRegex: "/__tests__/.*.(spec|test).ts$",
  transformIgnorePatterns: [
    `node_modules/(?!${untranspiledModulePatterns.join("|")})`,
  ],
  verbose: true,
};

export default config;
