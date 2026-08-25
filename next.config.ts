import type { NextConfig } from 'next';

// This site used to be a static export. It is not any more: the catalog lives
// in blob storage, the admin signs in, and photos are uploaded at runtime -
// none of which a folder of files can do. Netlify's Next runtime builds and
// serves it as a real application.
const nextConfig: NextConfig = {
  // Painting photos are served by an app route straight out of blob storage,
  // and they are already bounded and re-encoded to WebP on upload, so a second
  // optimisation pass at request time would only add latency.
  images: { unoptimized: true },
  // Uploads are photographs straight off a phone; the 1MB default body limit
  // for a server action is smaller than most of them.
  experimental: {
    serverActions: { bodySizeLimit: '25mb' },
  },
};

export default nextConfig;
