import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // src/ contiene código Node (Drizzle, Puppeteer) que no pasa por Next.js bundler
  // serverExternalPackages evita que Next.js intente bundlear pg y puppeteer
  serverExternalPackages: ["pg", "puppeteer", "puppeteer-core"],
};

export default nextConfig;
