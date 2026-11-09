import type { NextConfig } from "next";
import path from "node:path";

const repositoryRoot = path.resolve(__dirname, "../..");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@aster/content"],
  turbopack: { root: repositoryRoot },
  outputFileTracingRoot: repositoryRoot,
};
export default nextConfig;
