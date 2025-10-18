/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://campus-qiita-backend.onrender.com/:path*',
        //http://localhost:8000/:path*
      },
    ];
  },
};

export default nextConfig;
