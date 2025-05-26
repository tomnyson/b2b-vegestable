const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Resolve issues with certain modules in Node.js environment
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        bufferutil: false,
        'utf-8-validate': false,
      };
    }
    return config;
  },
  // Avoid routing issues
  experimental: {
    appDir: true,
  },
  // Configure allowed image domains
  images: {
    domains: [
      'tmpzhmfjotnpueletuoi.supabase.co', // Supabase storage domain
    ],
  },
};

module.exports = withNextIntl(nextConfig); 