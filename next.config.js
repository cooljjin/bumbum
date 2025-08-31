/** @type {import('next').NextConfig} */
const nextConfig = {
  // 워크스페이스 루트 경고 해결
  outputFileTracingRoot: require('path').join(__dirname),

  // Netlify static export 설정
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',

  // 이미지 최적화 비활성화 (static export에서는 필요 없음)
  images: {
    unoptimized: true,
  },

  // SSR 문제 해결을 위한 설정
  transpilePackages: [
    '@react-three/fiber',
    '@react-three/drei',
    'three',
    'framer-motion'
  ],


  
  // 번들 최적화
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@react-three/fiber', '@react-three/drei', 'three'],
  },
  
  // 웹팩 최적화
  webpack: (config, { dev, isServer }) => {
    // 프로덕션 빌드에서만 최적화 적용
    if (!dev && !isServer) {
      // Tree shaking 최적화
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // 번들 분할 최적화
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          three: {
            test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
            name: 'three',
            chunks: 'all',
            priority: 10,
          },
        },
      };
    }
    
    return config;
  },
  
  // 압축 설정
  compress: true
}

module.exports = nextConfig
