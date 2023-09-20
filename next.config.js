/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "images.unsplash.com",
      "files.stripe.com",
      "vv8y7sfrh21nafsl.public.blob.vercel-storage.com",
    ],
  },
  reactStrictMode: false,
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
