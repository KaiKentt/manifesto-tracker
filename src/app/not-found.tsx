import type { Metadata } from "next";
import Link from "@/components/NavigationLink";
import { getDictionary } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.notFound.title, robots: { index: false } };
}

export default async function NotFound() {
  const t = await getDictionary();
  return (
    <div className="card mx-auto my-8 max-w-md p-10 text-center">
      <p className="text-sm font-semibold text-brand-700">404</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{t.notFound.title}</h1>
      <p className="mt-2 text-sm text-muted">{t.notFound.text}</p>
      <Link href="/search" className="btn-primary mt-6">{t.notFound.button}</Link>
    </div>
  );
}
