interface PageSkeletonProps {
  title: string;
}

export function PageSkeleton({ title }: PageSkeletonProps) {
  return (
    <main className="app" aria-busy="true">
      <header className="top">
        <div>
          <h1>{title}</h1>
          <p>جارٍ التحميل…</p>
        </div>
      </header>
      <section className="metrics">
        {["a", "b", "c", "d"].map((key) => <article key={key} className="metric skeleton" />)}
      </section>
    </main>
  );
}
