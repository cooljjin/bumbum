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


  
  // 번들 최적화 (안정성 우선: Next 기본 최적화 사용)
  experimental: {
    optimizeCss: true,
  },
  
  // 압축 설정
  compress: true,
  
  // 타입 체크 비활성화 (빌드 시)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ESLint 비활성화 (빌드 시)
  eslint: {
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig
