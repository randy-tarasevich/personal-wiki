import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  output: "server",
  integrations: [tailwind()],
  experimental: {
    // Add any current experimental features here when they become available
  },
});
