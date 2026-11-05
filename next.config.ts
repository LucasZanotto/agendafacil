import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // PGlite usa WebAssembly e arquivos próprios: fica fora do bundle do servidor
  serverExternalPackages: ['@electric-sql/pglite'],
}

export default nextConfig
