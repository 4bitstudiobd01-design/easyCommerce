import Link from 'next/link';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { ArrowRight, Clock, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog | BitCommerce',
  description:
    'Practical guides on running an online store in Bangladesh — payments, delivery, and growing your business.',
};

// Posts change rarely; regenerate hourly rather than on every visit.
export const revalidate = 3600;

interface PostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  authorName: string;
  category: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
  readingMinutes: number;
}

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/admin').replace(
  /\/(admin|stores|auth)$/,
  '',
);

async function fetchPosts(): Promise<PostSummary[]> {
  try {
    const res = await fetch(`${API_ROOT}/blog/posts`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const payload = (await res.json()) as { data?: PostSummary[] };
    return payload.data ?? [];
  } catch {
    return [];
  }
}

function formatDate(value: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function BlogIndexPage() {
  const posts = await fetchPosts();
  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans antialiased text-slate-900">
      <Navbar />

      <main className="flex-1">
        <section className="px-6 pt-14 pb-10 bg-gradient-to-b from-slate-50/70 to-white">
          <div className="max-w-5xl mx-auto text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              <BookOpen className="w-3.5 h-3.5" />
              <span>BitCommerce Blog</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 text-balance">
              Running an online business in Bangladesh
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              Practical notes on payments, delivery, and growth — written for merchants who are
              actually shipping orders.
            </p>
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="max-w-5xl mx-auto">
            {posts.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl">
                <p className="text-sm font-bold text-slate-700">No posts published yet</p>
                <p className="text-xs text-slate-500 mt-1">Check back soon.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Featured post */}
                <Link
                  href={`/blog/${featured.slug}`}
                  className="group block bg-white rounded-2xl border border-slate-200/80 p-7 sm:p-9 shadow-2xs hover:border-blue-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                      {featured.category}
                    </span>
                    <span>{formatDate(featured.publishedAt)}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {featured.readingMinutes} min read
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors text-balance">
                    {featured.title}
                  </h2>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-3xl">
                    {featured.excerpt}
                  </p>

                  <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600">
                    Read article
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>

                {/* Remaining posts */}
                {rest.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {rest.map((post) => (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="group flex flex-col bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-500">
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-full border border-slate-200">
                            {post.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readingMinutes} min
                          </span>
                        </div>

                        <h3 className="mt-3 text-base font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                          {post.title}
                        </h3>
                        <p className="mt-2 text-xs text-slate-600 leading-relaxed flex-1">
                          {post.excerpt}
                        </p>

                        <span className="mt-4 text-[11px] font-bold text-slate-400">
                          {formatDate(post.publishedAt)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
