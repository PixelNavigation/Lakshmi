/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Temporarily ignore lint errors during build on Netlify
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
