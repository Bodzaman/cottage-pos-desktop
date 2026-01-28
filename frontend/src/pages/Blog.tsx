import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { UniversalHeader } from "components/UniversalHeader";
import { Footer } from "components/Footer";
import { SEO } from "components/SEO";
import { PAGE_SEO } from "utils/seoData";
import { PremiumTheme } from "utils/premiumTheme";
import { supabase } from "utils/supabaseClient";
import { BlogCard } from "components/BlogCard";
import type { BlogPost } from "components/BlogCard";

const CATEGORIES = ["All", "News", "Recipes", "Culture", "Community", "Events"];
const PAGE_SIZE = 12;

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Reset pagination when category changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory]);

  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["blog_posts", activeCategory],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });

      if (activeCategory !== "All") {
        query = query.eq("category", activeCategory.toLowerCase());
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as BlogPost[]) || [];
    },
  });

  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: PremiumTheme.colors.background.primary,
        color: PremiumTheme.colors.text.primary,
      }}
    >
      <SEO
        title={PAGE_SEO.blog.title}
        description={PAGE_SEO.blog.description}
        path="/blog"
      />

      {/* Header */}
      <UniversalHeader
        context="PUBLIC_NAV"
        transparent={false}
        showAuthButtons={true}
        showCart={true}
      />

      {/* Hero */}
      <section className="relative h-[40dvh] md:h-[60dvh] flex items-center">
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 z-10"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
          />
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[900]} 0%, ${PremiumTheme.colors.background.primary} 60%, ${PremiumTheme.colors.background.secondary} 100%)`,
            }}
          />
        </div>
        <div className="container mx-auto px-4 relative z-20">
          <motion.h1
            className="text-4xl md:text-6xl font-serif mb-6"
            style={{
              color: PremiumTheme.colors.text.primary,
              fontFamily: PremiumTheme.typography.fontFamily.serif,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Blog &amp; News
          </motion.h1>
          <motion.p
            className="text-xl max-w-xl"
            style={{ color: PremiumTheme.colors.text.secondary }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Stories, recipes, and updates from Cottage Tandoori — sharing our
            passion for authentic Indian cuisine since 1980.
          </motion.p>
        </div>
      </section>

      {/* Category Filters */}
      <section
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          backgroundColor: "rgba(15,15,15,0.85)",
          borderColor: PremiumTheme.colors.border.light,
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                  style={{
                    backgroundColor: isActive
                      ? PremiumTheme.colors.burgundy[500]
                      : "rgba(255,255,255,0.06)",
                    color: isActive
                      ? "#FFFFFF"
                      : PremiumTheme.colors.text.muted,
                    border: `1px solid ${
                      isActive
                        ? PremiumTheme.colors.burgundy[500]
                        : PremiumTheme.colors.border.light
                    }`,
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden animate-pulse"
                  style={{ backgroundColor: PremiumTheme.colors.background.secondary }}
                >
                  <div className="aspect-[16/10]" style={{ backgroundColor: PremiumTheme.colors.background.tertiary }} />
                  <div className="p-5 space-y-3">
                    <div className="h-5 rounded w-3/4" style={{ backgroundColor: PremiumTheme.colors.background.tertiary }} />
                    <div className="h-4 rounded w-full" style={{ backgroundColor: PremiumTheme.colors.background.tertiary }} />
                    <div className="h-4 rounded w-2/3" style={{ backgroundColor: PremiumTheme.colors.background.tertiary }} />
                  </div>
                </div>
              ))}
            </div>
          ) : visiblePosts.length === 0 ? (
            /* Empty State */
            <motion.div
              className="flex flex-col items-center justify-center py-24 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: "rgba(139,21,56,0.1)" }}
              >
                <FileText className="w-10 h-10" style={{ color: PremiumTheme.colors.burgundy[500] }} />
              </div>
              <h2
                className="text-2xl font-serif mb-2"
                style={{
                  color: PremiumTheme.colors.text.primary,
                  fontFamily: PremiumTheme.typography.fontFamily.serif,
                }}
              >
                No posts yet
              </h2>
              <p style={{ color: PremiumTheme.colors.text.muted }}>
                {activeCategory !== "All"
                  ? `No ${activeCategory.toLowerCase()} posts found. Check back soon!`
                  : "We're working on new content. Check back soon!"}
              </p>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visiblePosts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                  >
                    <BlogCard post={post} />
                  </motion.div>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200"
                    style={{
                      backgroundColor: "rgba(139,21,56,0.15)",
                      color: PremiumTheme.colors.burgundy[400],
                      border: `1px solid ${PremiumTheme.colors.burgundy[700]}`,
                    }}
                  >
                    Load more posts
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
