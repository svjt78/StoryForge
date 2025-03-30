/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
      return [
        {
          source: '/',
          destination: '/new-story',
          permanent: true,
        },
      ]
    },
  }
  
  module.exports = nextConfig
  