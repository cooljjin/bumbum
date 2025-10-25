/** @type {import('next').NextConfig} */
const nextConfig = {
  // 워크스페이스 루트 경고 해결
  outputFileTracingRoot: require('path').join(__dirname),

  // 개발 환경에서는 static export 비활성화
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    distDir: 'out',
  }),

  // 이미지 최적화 설정
  images: {
    unoptimized: process.env.NODE_ENV === 'production',
  },

  // SSR 문제 해결을 위한 설정
  transpilePackages: [
    '@react-three/fiber',
    '@react-three/drei',
    'three',
    'framer-motion'
  ],

  // ✅ React 19 + R3F 안정화 설정 (Stable Dev Env Setup 가이드)
  reactStrictMode: false, // ⚠️ StrictMode가 useEffect 두 번 호출을 유발

  // 번들 최적화 (안정성 우선: Next 기본 최적화 사용)
  experimental: {
    optimizeCss: true,
    reactCompiler: false, // ✅ React 19 컴파일러 비활성화 (안정화용)
    turbo: false, // ✅ HMR 충돌 방지
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
  },

  // ✅ Webpack 설정 (캐시 및 HMR 안정화)
  webpack: (config, { isServer }) => {
    // Hot reload 시 context 잔존 방지
    if (process.env.NODE_ENV === 'development') {
      config.cache = false;
    }
    return config;
  },
}

module.exports = nextConfig
