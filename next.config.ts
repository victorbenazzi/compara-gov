import type { NextConfig } from "next";

// Para publicar em um subcaminho (ex.: GitHub Pages em /compara-gov), defina NEXT_PUBLIC_BASE_PATH.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  // Site 100% estático: os dados são calculados antes do build e versionados no repositório.
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
