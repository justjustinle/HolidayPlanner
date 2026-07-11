/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow Supabase Storage public image URLs to be rendered via next/image
  // if the host chooses to use it. We use plain <img> for user-uploaded
  // memories, but keep remote patterns permissive for the storage bucket.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
};

export default nextConfig;
