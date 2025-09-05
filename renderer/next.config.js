/** @type {import('next').NextConfig} */
const {resolve} = require("path");

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  reactStrictMode: false,
  output: 'export',
  distDir: process.env.NODE_ENV === 'production' ? '../app' : '.next',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    return config;
  },
}
