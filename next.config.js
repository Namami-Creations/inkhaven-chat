/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  outputFileTracingRoot: __dirname,

  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['app', 'components', 'lib', 'hooks'],
  },

  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    domains: ['localhost', 'www.inkhaven.in', 'emaznvqnynfgudlazzqz.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },

  experimental: {
    serverMinification: false,
  },

  serverExternalPackages: [
    'winston',
    'postgres',
    'pg',
    'nodemailer',
    '@google/generative-ai',
    '@huggingface/inference',
    'twilio',
    'web-push',
    'qrcode',
    'canvas',
  ],

  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        stream: false,
        os: false,
        process: false,
        buffer: false,
      }
    }
    return config
  },

  env: {
    NEXT_PUBLIC_DOMAIN: 'inkhaven.in',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  },
}

module.exports = nextConfig
