/** @type {import('next').NextConfig} */
const {resolve} = require("path");

module.exports = {
  reactStrictMode: false,
  output: 'export',
  distDir: process.env.NODE_ENV === 'production' ? '../app' : '.next',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.alias["@"] = resolve(__dirname, "renderer");
    return config;
  },
}
