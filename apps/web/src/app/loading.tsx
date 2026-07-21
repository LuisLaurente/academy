export default function Loading() {
  return (
    <main aria-busy="true" aria-live="polite" className="mx-auto max-w-3xl px-6 py-16">
      <div className="bg-muted h-8 w-48 animate-pulse rounded-md" />
      <span className="sr-only">Cargando</span>
    </main>
  );
}
