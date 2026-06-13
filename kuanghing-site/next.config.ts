import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Two Next apps live in this repo; pin the tracing root to this folder so
  // file tracing / workspace-root inference doesn't walk up to the parent.
  outputFileTracingRoot: import.meta.dirname,
}

export default nextConfig
