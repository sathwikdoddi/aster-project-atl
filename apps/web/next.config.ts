import type { NextConfig } from "next";
import path from "node:path";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

const repositoryRoot = path.resolve(__dirname, "../..");
const localEnv = path.join(repositoryRoot, ".env");
if (existsSync(localEnv)) loadEnvFile(localEnv);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@aster/content", "@aster/publishing"],
  turbopack: { root: repositoryRoot },
  outputFileTracingRoot: repositoryRoot,
};
export default nextConfig;
