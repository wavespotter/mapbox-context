import { glob } from "glob";
import { dirname } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { extname, relative, resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      exclude: ["**/*.stories.tsx", "**/storybook-helpers/*"],
    }),
  ],
  build: {
    copyPublicDir: false,
    lib: {
      entry: resolve(dirname(import.meta.url), "src/main.ts"),
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "react",
        "react/jsx-runtime",
        "@mapbox-controls/zoom",
        "@turf/turf",
        "fast-equals",
        "mapbox-gl",
        "use-deep-compare-effect",
      ],
      input: Object.fromEntries(
        // https://rollupjs.org/configuration-options/#input
        glob
          .sync("src/**/*.{ts,tsx}", {
            ignore: [
              "src/storybook-helpers/*",
              "src/**/*.d.ts",
              "src/**/*.spec.{ts,tsx}",
              "src/**/*.stories.{ts,tsx}",
            ],
          })
          .map((file) => [
            // 1. The name of the entry point
            // src/nested/foo.js becomes nested/foo
            relative("src", file.slice(0, file.length - extname(file).length)),
            // 2. The absolute path to the entry file
            // src/nested/foo.ts becomes /project/src/nested/foo.ts
            fileURLToPath(new URL(file, import.meta.url)),
          ])
      ),
      output: {
        assetFileNames: "assets/[name][extname]",
        entryFileNames: "[name].js",
      },
    },
  },
});
