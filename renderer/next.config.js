/** @type {import('next').NextConfig} */
/** @type {import('next').NextConfig} */
const WebpackObfuscator = require('webpack-obfuscator')
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
  webpack: (config, { isServer, dev }) => {
    // Obfuscate hanya bundle browser (renderer), production only
    if (!isServer && isProd && !dev) {
      config.plugins.push(
          new WebpackObfuscator(
              {
                  compact: true,
                  simplify: true,
                  stringArray: true,
                  stringArrayThreshold: 0.3,
                  stringArrayRotate: true,
                  numbersToExpressions: false,
                  controlFlowFlattening: false,
                  deadCodeInjection: false,
                  unicodeEscapeSequence: true,
              },
              // exclude file inti webpack/chunks biar nggak rusak
              [
                'static/chunks/webpack-*.js',
                'static/chunks/framework-*.js',
                'static/chunks/main-*.js',
                'static/runtime/*.js',
              ],
          )
      )
    }

    return config
  },
}
