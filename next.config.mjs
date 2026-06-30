/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Standalone output for optimized Docker deployment
  output: 'standalone',

  // Tell Next.js NOT to bundle these server-only packages with webpack
  // They will be required at runtime on the server, where Node.js APIs are available
  experimental: {
    serverComponentsExternalPackages: [
      'firebase-admin',
      '@google-cloud/firestore',
      '@google-cloud/vertexai',
      'google-auth-library',
      'google-gax',
    ],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Image optimization domains
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },

  // Environment variables exposed to the client and server
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    // Google Cloud — used by Vertex AI and Cloud Run
    GOOGLE_CLOUD_PROJECT:  process.env.GOOGLE_CLOUD_PROJECT  ?? '',
    GOOGLE_CLOUD_LOCATION: process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1',
  },

  // Security and PWA headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },

  // Webpack: exclude server-only packages from client bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Polyfill / stub Node.js built-ins on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        http2: false,
        child_process: false,
        dns: false,
        'firebase-admin': false,
        '@google-cloud/firestore': false,
        '@google-cloud/vertexai': false,
        'google-auth-library': false,
        'google-gax': false,
      };
    }
    return config;
  },
};

export default nextConfig;
