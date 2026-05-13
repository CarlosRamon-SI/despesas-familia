import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {};

// Em dev, Turbopack é o padrão no Next.js 16 e não é compatível com o plugin
// webpack do serwist. Aplicamos o wrapper só em produção (next build --webpack).
export default process.env.NODE_ENV === "production"
  ? withSerwistInit({ swSrc: "app/sw.ts", swDest: "public/sw.js" })(nextConfig)
  : nextConfig;
