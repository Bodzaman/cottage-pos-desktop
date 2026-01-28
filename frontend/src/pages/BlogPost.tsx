import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Calendar, Clock, User, Tag } from "lucide-react";
import { UniversalHeader } from "components/UniversalHeader";
import { Footer } from "components/Footer";
import { SEO } from "components/SEO";
import { PremiumTheme } from "utils/premiumTheme";
import { supabase } from "utils/supabaseClient";
import { SocialShareButtons } from "components/SocialShareButtons";
import { BlogCard } from "components/BlogCard";
import type { BlogPost as BlogPostType } from "components/BlogCard";

const SITE_URL = "https://www.cottagetandoori.com";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  news: "#8B1538",
  recipes: "#10B981",
  culture: "#F59E0B",
  community: "#3B82F6",
  events: "#A855F7",
};

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Fetch current post
  const {
    data: post,
    isLoading,
    error,
  } = useQuery<BlogPostType | null>({
    queryKey: ["blog_post", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();
      if (error) throw error;
      return data as BlogPostType;
    },
    enabled: !!slug,
  });

  // Fetch related posts (same category, excluding current)
  const { data: relatedPosts = [] } = useQuery<BlogPostType[]>({
    queryKey: ["blog_related", post?.category, post?.id],
    queryFn: async () => {
      if (!post) return [];
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .eq("category", post.category)
        .neq("id", post.id)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return (data as BlogPostType[]) || [];
    },
    enabled: !!post,
  });

  const pageUrl = `${SITE_URL}/blog/${slug}`;

  // JSON-LD Article schema
  const articleJsonLd = post
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.meta_description || post.excerpt || "",
        image: post.image_url || `${SITE_URL}/og-default.jpg`,
        datePublished: post.published_at,
        author: {
          "@type": "Person",
          name: post.author || "Cottage Tandoori",
        },
        publisher: {
          "@type": "Organization",
          name: "Cottage Tandoori",
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/og-default.jpg`,
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": pageUrl,
        },
      }
    : undefined;

  // Loading state
  if (isLoading) {
    return (
      <div
        className="min-h-screen"
        style={{
          backgroundColor: PremiumTheme.colors.background.primary,
          color: PremiumTheme.colors.text.primary,
        }}
      >
        <UniversalHeader
          context="PUBLIC_NAV"
          transparent={false}
          showAuthButtons={true}
          showCart={true}
        />
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
            <div
              className="h-8 rounded w-1/4"
              style={{ backgroundColor: PremiumTheme.colors.background.tertiary }}
            />
            <div
              className="h-12 rounded w-3/4"
              style={{ backgroundColor: PremiumTheme.colors.background.tertiary }}
            />
            <div
              className="h-6 rounded w-1/2"
              style={{ backgroundColor: PremiumTheme.colors.background.tertiary }}
            />
            <div
              className="h-64 rounded"
              style={{ backgroundColor: PremiumTheme.colors.background.tertiary }}
            />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Not found state
  if (error || !post) {
    return (
      <div
        className="min-h-screen"
        style={{
          backgroundColor: PremiumTheme.colors.background.primary,
          color: PremiumTheme.colors.text.primary,
        }}
      >
        <SEO
          title="Post Not Found"
          description="The blog post you are looking for could not be found."
          path={`/blog/${slug}`}
          noindex
        />
        <UniversalHeader
          context="PUBLIC_NAV"
          transparent={false}
          showAuthButtons={true}
          showCart={true}
        />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1
            className="text-4xl font-serif mb-4"
            style={{ fontFamily: PremiumTheme.typography.fontFamily.serif }}
          >
            Post not found
          </h1>
          <p className="mb-8" style={{ color: PremiumTheme.colors.text.muted }}>
            The article you are looking for may have been removed or does not exist.
          </p>
          <button
            onClick={() => navigate("/blog")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-colors"
            style={{
              backgroundColor: PremiumTheme.colors.burgundy[500],
              color: "#FFFFFF",
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const categoryColor =
    CATEGORY_COLORS[post.category?.toLowerCase()] || PremiumTheme.colors.burgundy[500];

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: PremiumTheme.colors.background.primary,
        color: PremiumTheme.colors.text.primary,
      }}
    >
      <SEO
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt || ""}
        path={`/blog/${slug}`}
        ogImage={post.image_url || undefined}
        ogType="article"
        jsonLd={articleJsonLd}
      />

      <UniversalHeader
        context="PUBLIC_NAV"
        transparent={false}
        showAuthButtons={true}
        showCart={true}
      />

      {/* Hero / Header */}
      {post.image_url ? (
        <section className="relative h-[40dvh] md:h-[60dvh] flex items-end">
          <div className="absolute inset-0 z-0">
            <div
              className="absolute inset-0 z-10"
              style={{
                background:
                  "linear-gradient(to top, rgba(15,15,15,1) 0%, rgba(15,15,15,0.6) 40%, rgba(0,0,0,0.3) 100%)",
              }}
            />
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="container mx-auto px-4 relative z-20 pb-12">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm mb-6 opacity-80 hover:opacity-100 transition-opacity"
              style={{ color: PremiumTheme.colors.text.secondary }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
            <motion.h1
              className="text-3xl md:text-5xl font-serif mb-4 max-w-3xl"
              style={{
                color: PremiumTheme.colors.text.primary,
                fontFamily: PremiumTheme.typography.fontFamily.serif,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {post.title}
            </motion.h1>
          </div>
        </section>
      ) : (
        <section
          className="pt-12 pb-8"
          style={{ backgroundColor: PremiumTheme.colors.background.primary }}
        >
          <div className="container mx-auto px-4 max-w-3xl">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm mb-8 opacity-80 hover:opacity-100 transition-opacity"
              style={{ color: PremiumTheme.colors.text.secondary }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
            <motion.h1
              className="text-3xl md:text-5xl font-serif mb-4"
              style={{
                color: PremiumTheme.colors.text.primary,
                fontFamily: PremiumTheme.typography.fontFamily.serif,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {post.title}
            </motion.h1>
          </div>
        </section>
      )}

      {/* Metadata Bar */}
      <section
        className="border-b"
        style={{
          backgroundColor: PremiumTheme.colors.background.primary,
          borderColor: PremiumTheme.colors.border.light,
        }}
      >
        <div className="container mx-auto px-4 max-w-3xl py-4">
          <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: PremiumTheme.colors.text.muted }}>
            {post.author && (
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {post.author}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(post.published_at)}
            </span>
            {post.reading_time_minutes && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.reading_time_minutes} min read
              </span>
            )}
            <span
              className="px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider text-white"
              style={{ backgroundColor: categoryColor }}
            >
              {post.category}
            </span>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <article className="py-12 px-4">
        <motion.div
          className="container mx-auto max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="prose-custom">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1
                    className="text-3xl md:text-4xl font-bold mt-10 mb-4"
                    style={{
                      fontFamily: PremiumTheme.typography.fontFamily.serif,
                      color: PremiumTheme.colors.text.primary,
                    }}
                  >
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2
                    className="text-2xl md:text-3xl font-semibold mt-8 mb-3"
                    style={{
                      fontFamily: PremiumTheme.typography.fontFamily.serif,
                      color: PremiumTheme.colors.text.primary,
                    }}
                  >
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3
                    className="text-xl md:text-2xl font-semibold mt-6 mb-3"
                    style={{
                      fontFamily: PremiumTheme.typography.fontFamily.serif,
                      color: PremiumTheme.colors.text.primary,
                    }}
                  >
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p
                    className="text-base md:text-lg leading-relaxed mb-5"
                    style={{
                      fontFamily: PremiumTheme.typography.fontFamily.sans,
                      color: PremiumTheme.colors.text.secondary,
                    }}
                  >
                    {children}
                  </p>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="underline underline-offset-2 transition-colors hover:opacity-80"
                    style={{ color: PremiumTheme.colors.burgundy[400] }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                ul: ({ children }) => (
                  <ul
                    className="list-disc pl-6 mb-5 space-y-2"
                    style={{ color: PremiumTheme.colors.text.secondary }}
                  >
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol
                    className="list-decimal pl-6 mb-5 space-y-2"
                    style={{ color: PremiumTheme.colors.text.secondary }}
                  >
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-base md:text-lg leading-relaxed">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote
                    className="border-l-4 pl-5 my-6 italic"
                    style={{
                      borderColor: PremiumTheme.colors.burgundy[500],
                      color: PremiumTheme.colors.text.muted,
                    }}
                  >
                    {children}
                  </blockquote>
                ),
                img: ({ src, alt }) => (
                  <figure className="my-8">
                    <img
                      src={src}
                      alt={alt || ""}
                      className="w-full rounded-xl"
                    />
                    {alt && (
                      <figcaption
                        className="text-sm mt-2 text-center"
                        style={{ color: PremiumTheme.colors.text.muted }}
                      >
                        {alt}
                      </figcaption>
                    )}
                  </figure>
                ),
                hr: () => (
                  <hr
                    className="my-8 border-0 h-px"
                    style={{ backgroundColor: PremiumTheme.colors.border.light }}
                  />
                ),
                code: ({ children }) => (
                  <code
                    className="px-1.5 py-0.5 rounded text-sm"
                    style={{
                      backgroundColor: PremiumTheme.colors.background.tertiary,
                      color: PremiumTheme.colors.burgundy[400],
                    }}
                  >
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre
                    className="p-4 rounded-xl overflow-x-auto my-6 text-sm"
                    style={{
                      backgroundColor: PremiumTheme.colors.background.secondary,
                      border: `1px solid ${PremiumTheme.colors.border.light}`,
                    }}
                  >
                    {children}
                  </pre>
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div
              className="flex flex-wrap items-center gap-2 mt-10 pt-6 border-t"
              style={{ borderColor: PremiumTheme.colors.border.light }}
            >
              <Tag className="w-4 h-4" style={{ color: PremiumTheme.colors.text.muted }} />
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    color: PremiumTheme.colors.text.muted,
                    border: `1px solid ${PremiumTheme.colors.border.light}`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Social Share */}
          <div
            className="mt-10 pt-8 border-t"
            style={{ borderColor: PremiumTheme.colors.border.light }}
          >
            <SocialShareButtons url={pageUrl} title={post.title} />
          </div>
        </motion.div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section
          className="py-16 px-4 border-t"
          style={{
            backgroundColor: PremiumTheme.colors.background.secondary,
            borderColor: PremiumTheme.colors.border.light,
          }}
        >
          <div className="container mx-auto">
            <h2
              className="text-2xl md:text-3xl font-serif mb-8"
              style={{
                color: PremiumTheme.colors.text.primary,
                fontFamily: PremiumTheme.typography.fontFamily.serif,
              }}
            >
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((related, i) => (
                <motion.div
                  key={related.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <BlogCard post={related} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
