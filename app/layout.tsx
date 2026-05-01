import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ETOOS 247 이천기숙학원 수강신청',
  description: '재수정규 6평 완성반 수강신청 페이지',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css"
        />
      </head>
      <body className="bg-white text-brand-text font-sans antialiased">{children}</body>
    </html>
  );
}
