import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Activa el MCP server en /_next/mcp (Next.js 16+)
  experimental: {
    mcpServer: true,
    serverActions: { bodySizeLimit: '6mb' },
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'shiatsu.ochoesferas.com', pathname: '/wp-content/uploads/**' }],
  },
}

export default nextConfig
