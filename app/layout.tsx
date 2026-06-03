import './globals.css';
import type { Metadata } from 'next';
import { ToastProvider } from '@/components/ui/Toast';
import { PrototypeStateProvider } from '@/components/prototype/PrototypeApp';

export const metadata: Metadata = {
  title: 'ETOOS 247 이천기숙학원 수강신청',
  description: '학생과 관리자가 함께 검토하는 수강신청 프로토타입',
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
      <body className="bg-white font-sans text-brand-text antialiased">
        <PrototypeStateProvider>
          <ToastProvider>{children}</ToastProvider>
        </PrototypeStateProvider>
      </body>
    </html>
  );
}
