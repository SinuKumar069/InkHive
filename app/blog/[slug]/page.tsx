import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { MarkdownRenderer } from "@/components/markdown-renderer";

export const revalidate = 60;

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

const getPublicPostBySlug = cache(async (slug: string) => {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return null;
  }

  const client = new ConvexHttpClient(convexUrl);
  return client.query(api.contentProjects.getPublicPostBySlug, { slug });
});

export async function generateMetadata(
  props: BlogPageProps,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPublicPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found | InkHive",
      description: "The requested post does not exist.",
    };
  }

  return {
    title: `${post.seoTitle} | InkHive`,
    description: post.seoDescription,
    keywords: post.seoKeywords,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      type: "article",
      title: post.seoTitle,
      description: post.seoDescription,
      url: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage(props: BlogPageProps) {
  const { slug } = await props.params;
  const post = await getPublicPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto w-full max-w-3xl px-6 py-14 sm:px-8">
        <header className="mb-10 border-b border-white/10 pb-8">
          <p className="mb-4 text-sm text-muted-foreground">
            {formattedDate} · {post.readingTime} min read
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        </header>

        <MarkdownRenderer content={post.content} />
      </article>
    </main>
  );
}
