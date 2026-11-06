/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required by the Dockerfile, which runs the self-contained server.js.
  output: 'standalone',
  images: {
    domains: ['localhost', 'maoliworld.com'],
  },
}

module.exports = nextConfig
