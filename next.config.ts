import type { NextConfig } from "next";
import "./src/lib/env/clientEnv";
import "./src/lib/env/serverEnv";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  reactCompiler: true,
  typedRoutes: true,
};

export default nextConfig;
