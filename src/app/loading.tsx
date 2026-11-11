export default function Loading() {
  return (
    <div role="status" aria-label="Loading page" className="mx-auto w-full max-w-6xl space-y-6">
      <span className="sr-only">Loading page…</span>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="h-8 w-56 rounded-lg bg-slate-200" />
        <div className="h-4 w-3/4 max-w-lg rounded bg-slate-100" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="card space-y-4 p-6">
              <div className="h-5 w-2/3 rounded bg-slate-200" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-1/2 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
