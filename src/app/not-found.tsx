import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-md p-10 text-center">
      <p className="text-sm font-semibold text-brand-700">404</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Profile not found</h1>
      <p className="mt-2 text-sm text-muted">It may have been renamed. Try searching for it instead.</p>
      <Link href="/search" className="btn-primary mt-6">Search profiles</Link>
    </div>
  );
}
