import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'bumbum',
  description: '3D 미니룸을 체험해보세요',
  icons: {
    icon: [
      { url: '/favicon.svg', sizes: 'any' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' }
    ],
    apple: '/favicon.png'
  }
};

// iOS Safari에서 페이지 핀치줌이 캔버스 제스처를 가로채지 않도록 방지
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
