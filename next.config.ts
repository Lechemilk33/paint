import type { NextConfig } from 'next';

// A fully static site: every page prerenders at build time, so `next build`
// emits plain HTML/CSS/JS into out/ that any static host will serve - Netlify,
// Cloudflare Pages, GitHub Pages, S3. There is no server, no database and no
// environment variable anywhere in this app.
const nextConfig: NextConfig = {
  output: 'export',
  // next/image's optimizer is a server; a static export has none, so the
  // images are served exactly as they sit in public/.
  images: { unoptimized: true },
  // Emit /store/index.html rather than /store.html, so hosts resolve the
  // clean URLs without per-host redirect rules.
  trailingSlash: true,
};

export default nextConfig;
