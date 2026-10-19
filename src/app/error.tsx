"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="app">
      <div className="empty empty--shown">
        <h3>حصل خطأ أثناء تحميل الصفحة</h3>
        <p>تأكد من اتصالك بالإنترنت ثم حاول مرة أخرى.</p>
        <button className="btn btn-primary" type="button" onClick={reset}>
          إعادة المحاولة
        </button>
      </div>
    </main>
  );
}
