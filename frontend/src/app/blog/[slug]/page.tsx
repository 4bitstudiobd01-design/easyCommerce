import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { ArrowLeft, Clock, ArrowRight } from 'lucide-react';

export const revalidate = 3600;

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  authorName: string;
  category: string;
  publishedAt: string | null;
  readingMinutes: number;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  readingMinutes: number;
}

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/admin').replace(
  /\/(admin|stores|auth)$/,
  '',
);

async function fetchPost(slug: string): Promise<{ post: Post; related: RelatedPost[] } | null> {
  try {
    const res = await fetch(`${API_ROOT}/blog/posts/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as { data?: { post: Post; related: RelatedPost[] } };
    return payload.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await fetchPost(params.slug);
  if (!data) return { title: 'Post not found | BitCommerce' };

  return {
    title: `${data.post.title} | BitCommerce Blog`,
    description: data.post.excerpt,
    openGraph: {
      title: data.post.title,
      description: data.post.excerpt,
      type: 'article',
    },
  };
}

function formatDate(value: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const data = await fetchPost(params.slug);

  // A missing or unpublished post is a 404, not an empty page.
  if (!data) notFound();

  const { post, related } = data;
  const paragraphs = post.content.split(/\n\s*\n/).filter(Boolean);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans antialiased text-slate-900">
      <Navbar />

      <main className="flex-1 px-6 py-12">
        <article className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All articles</span>
          </Link>

          <header className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                {post.category}
              </span>
              <span>{formatDate(post.publishedAt)}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {post.readingMinutes} min read
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight text-balance">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-base text-slate-600 leading-relaxed">{post.excerpt}</p>
            )}

            <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center mt-4">
                {post.authorName.charAt(0)}
              </div>
              <span className="text-xs font-bold text-slate-700 mt-4">{post.authorName}</span>
            </div>
          </header>

          <div className="mt-8 space-y-5">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="text-sm sm:text-[15px] text-slate-700 leading-[1.75]">
                {paragraph}
              </p>
            ))}
          </div>

          {related.length > 0 && (
            <section className="mt-14 pt-8 border-t border-slate-200">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                Related reading
              </h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={`/blog/${item.slug}`}
                    className="group block bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-600 line-clamp-2">{item.excerpt}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600">
                      Read
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="mt-14 bg-blue-600 rounded-2xl p-7 text-center">
            <h2 className="text-lg font-extrabold text-white">Ready to start selling?</h2>
            <p className="mt-1.5 text-xs text-blue-100">
              Launch your store with payments and courier booking built in.
            </p>
            <Link
              href="/register"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-50 transition-colors"
            >
              <span>Start free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
