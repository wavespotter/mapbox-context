/**
 * Our https://knip.dev/ config file.
 * Using a Typescript config file is nice because we get some typehinting
 * and can add contextual comments, which wouldn't be possible in JSON config files.
 */
import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/index.ts"],
  project: ["src/**/*.{js,ts,tsx}"],
};

export default config;
