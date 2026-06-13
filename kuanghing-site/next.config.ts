import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // This repo also contains the dashboard app (with its own lockfile) one
  // level up, so Next's automatic workspace-root inference can pick the wrong
  // root and place build output where Vercel doesn't expect it. Pin Turbopack's
  // root to THIS app's folder (the fix Next recommends in its warning).
  turbopack: {
    root: import.meta.dirname,
  },
}

export default nextConfig
