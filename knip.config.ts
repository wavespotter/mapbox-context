/**
 * https://knip.dev/overview/configuration
 */
import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/index.ts"],
  project: ["src/**/*.{js,ts,tsx}"],
};

export default config;
