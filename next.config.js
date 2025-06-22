import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    domains: ["images.unsplash.com"],
  },
  typescript: {
    // ⚠️ Dangerously allow production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
};

export default config;
