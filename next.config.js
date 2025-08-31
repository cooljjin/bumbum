/** @type {import('next').NextConfig} */
const nextConfig = {
  // 워크스페이스 루트 경고 해결
  outputFileTracingRoot: require('path').join(__dirname),

  // 이미지 최적화 (개발 환경에서는 최적화 활성화)
  images: {
    unoptimized: process.env.NODE_ENV === 'production' ? false : true,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
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
