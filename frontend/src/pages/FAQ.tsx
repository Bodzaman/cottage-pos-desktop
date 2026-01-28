import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaArrowRight } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { UniversalHeader } from "components/UniversalHeader";
import { Footer } from "components/Footer";
import { PremiumTheme } from "utils/premiumTheme";
import { SEO } from "components/SEO";
import { PAGE_SEO } from "utils/seoData";
import { supabase } from "utils/supabaseClient";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
}

// ---------------------------------------------------------------------------
// Category configuration
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "ordering", label: "Ordering" },
  { key: "delivery", label: "Delivery" },
  { key: "dining", label: "Dining In" },
  { key: "allergens", label: "Allergens" },
  { key: "payments", label: "Payments" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

// ---------------------------------------------------------------------------
// Hardcoded fallback data
// ---------------------------------------------------------------------------

const FALLBACK_FAQS: FAQItem[] = [
  {
    id: "f1",
    question: "How do I place an order online?",
    answer:
      "Visit our Online Menu page, browse the categories, add items to your cart, and proceed to checkout. You can pay online with card or choose to pay on collection.",
    category: "ordering",
    sort_order: 1,
  },
  {
    id: "f2",
    question: "Can I customise my order?",
    answer:
      "Yes! When adding items to your cart you can select spice level, add extras, or leave special instructions for the kitchen.",
    category: "ordering",
    sort_order: 2,
  },
  {
    id: "f3",
    question: "What areas do you deliver to?",
    answer:
      "We deliver within a 4-mile radius of Storrington, covering areas such as Pulborough, West Chiltington, Thakeham, and Washington. Delivery is free on orders over £25.",
    category: "delivery",
    sort_order: 3,
  },
  {
    id: "f4",
    question: "How long does delivery take?",
    answer:
      "Delivery typically takes 30-45 minutes depending on distance and how busy the kitchen is. You will receive a time estimate when you place your order.",
    category: "delivery",
    sort_order: 4,
  },
  {
    id: "f5",
    question: "Do I need to book a table?",
    answer:
      "We recommend booking, especially on Friday and Saturday evenings. You can call us on 01903 743605 or use the reservations link on our website.",
    category: "dining",
    sort_order: 5,
  },
  {
    id: "f6",
    question: "Is there wheelchair access?",
    answer:
      "Yes, our restaurant has step-free access at the entrance and accessible facilities inside.",
    category: "dining",
    sort_order: 6,
  },
  {
    id: "f7",
    question: "Do you cater for food allergies?",
    answer:
      "Absolutely. All menu items list the 14 major UK allergens. Please inform your server or add a note to your online order so the kitchen can take extra care.",
    category: "allergens",
    sort_order: 7,
  },
  {
    id: "f8",
    question: "Are there vegan and gluten-free options?",
    answer:
      "Yes, we offer a variety of vegan, vegetarian, and gluten-free dishes. Look for the dietary icons on our online menu or ask a member of staff.",
    category: "allergens",
    sort_order: 8,
  },
  {
    id: "f9",
    question: "What payment methods do you accept?",
    answer:
      "We accept Visa, Mastercard, American Express, Apple Pay, Google Pay, and cash. Online orders can be paid by card at checkout.",
    category: "payments",
    sort_order: 9,
  },
  {
    id: "f10",
    question: "Can I get a receipt for my order?",
    answer:
      "Yes. Online orders receive an email receipt automatically. For dine-in or collection, just ask a member of staff and we will provide a printed receipt.",
    category: "payments",
    sort_order: 10,
  },
];

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

const fetchFAQs = async (): Promise<FAQItem[]> => {
  const { data, error } = await supabase
    .from("faq_items")
    .select("id, question, answer, category, sort_order")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data as FAQItem[];
};

// ---------------------------------------------------------------------------
// FAQ JSON-LD Schema
// ---------------------------------------------------------------------------

const buildFaqJsonLd = (items: FAQItem[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FAQ() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: faqs } = useQuery<FAQItem[]>({
    queryKey: ["faq_items"],
    queryFn: fetchFAQs,
    staleTime: 1000 * 60 * 10,
    placeholderData: FALLBACK_FAQS,
  });

  const items = faqs ?? FALLBACK_FAQS;

  // Filter by search + category
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter((faq) => {
      const matchesCategory =
        activeCategory === "all" || faq.category === activeCategory;
      const matchesSearch =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [items, searchQuery, activeCategory]);

  const faqJsonLd = useMemo(() => buildFaqJsonLd(items), [items]);

  return (
    <div
      className="min-h-screen"
      style={{
        background: PremiumTheme.colors.background.primary,
        color: PremiumTheme.colors.text.primary,
      }}
    >
      <SEO
        title={PAGE_SEO.faq.title}
        description={PAGE_SEO.faq.description}
        path="/faq"
        jsonLd={faqJsonLd}
      />

      {/* Header */}
      <UniversalHeader
        context="PUBLIC_NAV"
        transparent={false}
        showAuthButtons={true}
        showCart={true}
      />

      {/* Hero Section */}
      <section className="relative h-[40dvh] md:h-[60dvh] flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black opacity-60 z-10" />
          <img
            src="https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/MAIN RESTAURANT EXTERIOR .jpg"
            alt="Cottage Tandoori Restaurant"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1
              className="text-4xl md:text-6xl mb-6"
              style={{
                fontFamily: PremiumTheme.typography.fontFamily.serif,
                color: PremiumTheme.colors.text.primary,
              }}
            >
              Frequently Asked Questions
            </h1>
            <p
              className="text-xl max-w-xl"
              style={{ color: PremiumTheme.colors.text.secondary }}
            >
              Everything you need to know about ordering, delivery, dining in,
              and more.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10"
        >
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${PremiumTheme.colors.border.light}`,
            }}
          >
            <FaSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-lg"
              style={{ color: PremiumTheme.colors.text.muted }}
            />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent py-4 pl-12 pr-4 text-base outline-none placeholder:text-[#B0B0B0]"
              style={{ color: PremiumTheme.colors.text.primary }}
            />
          </div>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap gap-2 mb-10"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                style={{
                  background: isActive
                    ? PremiumTheme.colors.burgundy[500]
                    : "rgba(255, 255, 255, 0.06)",
                  color: isActive
                    ? "#FFFFFF"
                    : PremiumTheme.colors.text.secondary,
                  border: `1px solid ${
                    isActive
                      ? PremiumTheme.colors.burgundy[500]
                      : PremiumTheme.colors.border.light
                  }`,
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </motion.div>

        {/* Accordion FAQ List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {filteredFaqs.length === 0 ? (
            <p
              className="text-center py-12 text-lg"
              style={{ color: PremiumTheme.colors.text.muted }}
            >
              No questions match your search. Try a different term or category.
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-3">
              {filteredFaqs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 * index }}
                >
                  <AccordionItem
                    value={faq.id}
                    className="rounded-xl border-0 overflow-hidden"
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: `1px solid ${PremiumTheme.colors.border.light}`,
                    }}
                  >
                    <AccordionTrigger
                      className="px-6 py-5 text-left text-base font-medium hover:no-underline"
                      style={{ color: PremiumTheme.colors.text.primary }}
                    >
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent
                      className="px-6 pb-5 text-base leading-relaxed"
                      style={{ color: PremiumTheme.colors.text.secondary }}
                    >
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          )}
        </motion.div>

        {/* Still Have Questions CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20 rounded-2xl p-8 md:p-12 text-center"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: `1px solid ${PremiumTheme.colors.border.light}`,
            backdropFilter: "blur(12px)",
          }}
        >
          <h2
            className="text-2xl md:text-3xl mb-4"
            style={{
              fontFamily: PremiumTheme.typography.fontFamily.serif,
              color: PremiumTheme.colors.text.primary,
            }}
          >
            Still have questions?
          </h2>
          <p
            className="mb-8 max-w-md mx-auto"
            style={{ color: PremiumTheme.colors.text.secondary }}
          >
            We're happy to help. Get in touch and our team will get back to you
            as soon as possible.
          </p>
          <button
            onClick={() => navigate("/contact")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium transition-all duration-200 hover:opacity-90"
            style={{
              background: PremiumTheme.colors.burgundy[500],
              boxShadow: PremiumTheme.shadows.glow.burgundy,
            }}
          >
            Contact Us
            <FaArrowRight className="text-sm" />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
