import Link from 'next/link';

export default function Page() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-semibold text-brand">ETOOS 247 수강신청</h1>
      <p className="text-brand-text-muted mt-2">아래 링크에서 시작하세요.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/login" className="text-brand underline">/login</Link>
      </div>
    </main>
  );
}
