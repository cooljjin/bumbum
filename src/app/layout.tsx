import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bondidi - 아름다운 미니룸',
  description: '3D 미니룸을 체험해보세요'
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
