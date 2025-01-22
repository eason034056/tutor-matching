/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com']
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.tutor-matching.tw',
          },
        ],
        destination: 'https://tutor-matching.tw/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'tutor-matching.vercel.app',
          },
        ],
        destination: 'https://tutor-matching.tw/:path*',
        permanent: true,
      }
    ]
  },
}

module.exports = nextConfig 