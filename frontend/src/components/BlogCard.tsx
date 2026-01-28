import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";
import { PremiumTheme } from "utils/premiumTheme";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  category: string;
  author: string | null;
  published_at: string;
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[] | null;
  reading_time_minutes: number | null;
}

interface BlogCardProps {
  post: BlogPost;
}

const CATEGORY_COLORS: Record<string, string> = {
  news: "#8B1538",
  recipes: "#10B981",
  culture: "#F59E0B",
  community: "#3B82F6",
  events: "#A855F7",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BlogCard({ post }: BlogCardProps) {
  const categoryColor = CATEGORY_COLORS[post.category?.toLowerCase()] || PremiumTheme.colors.burgundy[500];

  return (
    <Link to={`/blog/${post.slug}`} className="block group">
      <motion.article
        className="rounded-xl overflow-hidden h-full flex flex-col"
        style={{
          backgroundColor: PremiumTheme.colors.background.card,
          border: `1px solid ${PremiumTheme.colors.border.light}`,
        }}
        whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          {post.image_url ? (
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${PremiumTheme.colors.background.secondary} 0%, ${PremiumTheme.colors.burgundy[900]} 100%)`,
              }}
            >
              <span
                className="text-5xl font-serif opacity-20"
                style={{ color: PremiumTheme.colors.burgundy[400] }}
              >
                CT
              </span>
            </div>
          )}
          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-white"
              style={{ backgroundColor: categoryColor }}
            >
              {post.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5">
          <h3
            className="text-lg font-serif font-semibold mb-2 line-clamp-2 group-hover:opacity-80 transition-opacity"
            style={{
              color: PremiumTheme.colors.text.primary,
              fontFamily: PremiumTheme.typography.fontFamily.serif,
            }}
          >
            {post.title}
          </h3>

          {post.excerpt && (
            <p
              className="text-sm leading-relaxed line-clamp-3 mb-4 flex-1"
              style={{ color: PremiumTheme.colors.text.muted }}
            >
              {post.excerpt}
            </p>
          )}

          {/* Footer */}
          <div
            className="flex items-center gap-4 text-xs pt-3 mt-auto"
            style={{
              borderTop: `1px solid ${PremiumTheme.colors.border.light}`,
              color: PremiumTheme.colors.text.muted,
            }}
          >
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.published_at)}
            </span>
            {post.reading_time_minutes && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {post.reading_time_minutes} min read
              </span>
            )}
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
