/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Prevent server-side loading of PDF.js
    if (isServer) {
      config.resolve.alias['pdfjs-dist'] = false;
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      fs: false,
      path: false,
      url: false,
    };

    return config;
  },
};

export default nextConfig; 