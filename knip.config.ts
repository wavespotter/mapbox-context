/**
 * Our https://knip.dev/ config file.
 * Using a Typescript config file is nice because we get some typehinting
 * and can add contextual comments, which wouldn't be possible in JSON config files.
 *
 * NOTE: This file is intentionally in ./src so we don't have any .ts files at the root,
 * which seems to change the structure of the ./dist output, breaking TypeORM migrations :)
 */
import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    "src/index.ts",
  ],
  project: ["src/**/*.{js,ts,tsx}"],
  rules: {
    // This error is for enum values that aren't used anywhere. This feels noisy because often
    // it's nice to have an enum represent all possible real-world values of
    // something (ie. AIS status) even if the code doesn't explicitly reference each one.
    // enumMembers: "off",
    dependencies: "warn",
  },
};

export default config;
