import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Phone,
  ArrowRight,
  Info,
  Filter,
  X,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import { UniversalHeader } from "components/UniversalHeader";
import { Footer } from "components/Footer";
import { PremiumTheme } from "utils/premiumTheme";
import { SEO } from "components/SEO";
import { PAGE_SEO } from "utils/seoData";
import { supabase } from "utils/supabaseClient";
import { AllergenBadge } from "components/AllergenBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AllergenDefinition {
  id: string;
  name: string;
  icon_name: string | null;
  sort_order: number;
}

interface MenuItem {
  id: string;
  name: string;
  category_id: string;
  allergens: Record<string, "contains" | "may_contain"> | null;
}

interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
}

interface GroupedCategory {
  category: MenuCategory;
  items: MenuItem[];
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchAllergenDefinitions(): Promise<AllergenDefinition[]> {
  const { data, error } = await supabase
    .from("allergen_definitions")
    .select("id, name, icon_name, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function fetchMenuItemsWithAllergens(): Promise<{
  items: MenuItem[];
  categories: MenuCategory[];
}> {
  const [itemsRes, catsRes] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id, name, category_id, allergens")
      .eq("is_published", true),
    supabase
      .from("menu_categories")
      .select("id, name, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);
  if (itemsRes.error) throw itemsRes.error;
  if (catsRes.error) throw catsRes.error;
  return {
    items: (itemsRes.data ?? []) as MenuItem[],
    categories: (catsRes.data ?? []) as MenuCategory[],
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check whether an item contains or may-contain any of the selected allergens. */
function itemHasSelectedAllergens(
  item: MenuItem,
  selectedIds: string[]
): boolean {
  if (!item.allergens || selectedIds.length === 0) return false;
  return selectedIds.some(
    (id) =>
      item.allergens?.[id] === "contains" ||
      item.allergens?.[id] === "may_contain"
  );
}

/** Count how many items actually have allergen data. */
function countItemsWithAllergenData(items: MenuItem[]): number {
  return items.filter(
    (i) => i.allergens && Object.keys(i.allergens).length > 0
  ).length;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Allergens() {
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Queries
  const {
    data: allergenDefs = [],
    isLoading: loadingDefs,
  } = useQuery({
    queryKey: ["allergen_definitions"],
    queryFn: fetchAllergenDefinitions,
    staleTime: 10 * 60 * 1000,
  });

  const {
    data: menuData,
    isLoading: loadingMenu,
  } = useQuery({
    queryKey: ["allergen_menu_items"],
    queryFn: fetchMenuItemsWithAllergens,
    staleTime: 10 * 60 * 1000,
  });

  const items = menuData?.items ?? [];
  const categories = menuData?.categories ?? [];
  const isLoading = loadingDefs || loadingMenu;

  // Build grouped + filtered data
  const grouped: GroupedCategory[] = useMemo(() => {
    const catMap = new Map<string, MenuCategory>();
    categories.forEach((c) => catMap.set(c.id, c));

    const buckets = new Map<string, MenuItem[]>();
    items.forEach((item) => {
      // When filters active, exclude items that contain the selected allergens
      if (
        excludedAllergens.length > 0 &&
        itemHasSelectedAllergens(item, excludedAllergens)
      ) {
        return;
      }
      const existing = buckets.get(item.category_id) ?? [];
      existing.push(item);
      buckets.set(item.category_id, existing);
    });

    return categories
      .filter((c) => buckets.has(c.id))
      .map((c) => ({ category: c, items: buckets.get(c.id)! }));
  }, [items, categories, excludedAllergens]);

  const hasAllergenData = countItemsWithAllergenData(items) > 5;

  // Toggle an allergen in the exclusion filter
  const toggleAllergen = (id: string) => {
    setExcludedAllergens((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const clearFilters = () => setExcludedAllergens([]);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: PremiumTheme.colors.background.primary,
        color: PremiumTheme.colors.text.primary,
      }}
    >
      <SEO
        title={PAGE_SEO.allergens.title}
        description={PAGE_SEO.allergens.description}
        path="/allergens"
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
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert
                className="w-8 h-8"
                style={{ color: PremiumTheme.colors.burgundy[500] }}
              />
              <span
                className="uppercase tracking-widest text-sm font-medium"
                style={{ color: PremiumTheme.colors.burgundy[400] }}
              >
                Food Safety
              </span>
            </div>
            <h1
              className="text-4xl md:text-6xl font-serif mb-4"
              style={{ color: PremiumTheme.colors.text.primary }}
            >
              Allergen Information
            </h1>
            <p
              className="text-lg md:text-xl max-w-2xl"
              style={{ color: PremiumTheme.colors.text.secondary }}
            >
              Comprehensive allergen details for every dish on our menu, in
              accordance with UK food allergen regulations.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border p-6 md:p-8"
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.08)",
              borderColor: "rgba(245, 158, 11, 0.3)",
            }}
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-amber-400 mb-2">
                  Important Allergen Notice
                </h2>
                <p
                  className="text-sm leading-relaxed mb-3"
                  style={{ color: PremiumTheme.colors.text.secondary }}
                >
                  Under UK Food Information Regulations 2014, food businesses must
                  provide allergen information for the 14 major allergens. We take
                  every care to identify allergens in our dishes; however, our
                  kitchen handles all 14 allergens and cross-contamination may
                  occur.
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: PremiumTheme.colors.text.secondary }}
                >
                  <strong className="text-amber-400">
                    Please inform a member of staff about any allergies or
                    dietary requirements before ordering.
                  </strong>{" "}
                  If you have a severe allergy, we recommend speaking to our
                  manager directly. Our team will do their best to accommodate
                  your needs.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Legend */}
      <section className="px-4 pb-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap items-center gap-6 rounded-xl border p-4"
            style={{
              backgroundColor: PremiumTheme.colors.background.secondary,
              borderColor: PremiumTheme.colors.border.light,
            }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: PremiumTheme.colors.text.muted }}
            >
              Key:
            </span>
            <span className="inline-flex items-center gap-2">
              <AllergenBadge status="contains" />
              <span className="text-sm" style={{ color: PremiumTheme.colors.text.secondary }}>
                Contains
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <AllergenBadge status="may_contain" />
              <span className="text-sm" style={{ color: PremiumTheme.colors.text.secondary }}>
                May contain
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <AllergenBadge status={null} />
              <span className="text-sm" style={{ color: PremiumTheme.colors.text.secondary }}>
                Free from
              </span>
            </span>
          </motion.div>
        </div>
      </section>

      {/* Filter Bar */}
      {allergenDefs.length > 0 && (
        <section className="px-4 pb-8">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="rounded-xl border p-5"
              style={{
                backgroundColor: PremiumTheme.colors.background.secondary,
                borderColor: PremiumTheme.colors.border.light,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Filter
                    className="w-4 h-4"
                    style={{ color: PremiumTheme.colors.burgundy[500] }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: PremiumTheme.colors.text.primary }}
                  >
                    Filter: show items free from
                  </span>
                </div>
                {excludedAllergens.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs flex items-center gap-1 hover:opacity-80 transition-opacity"
                    style={{ color: PremiumTheme.colors.burgundy[400] }}
                  >
                    <X className="w-3 h-3" />
                    Clear all
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {allergenDefs.map((def) => {
                  const active = excludedAllergens.includes(def.id);
                  return (
                    <button
                      key={def.id}
                      onClick={() => toggleAllergen(def.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                        active
                          ? "text-white"
                          : "hover:border-white/30"
                      }`}
                      style={{
                        backgroundColor: active
                          ? PremiumTheme.colors.burgundy[500]
                          : "transparent",
                        borderColor: active
                          ? PremiumTheme.colors.burgundy[500]
                          : PremiumTheme.colors.border.light,
                        color: active
                          ? "#fff"
                          : PremiumTheme.colors.text.secondary,
                      }}
                    >
                      {def.name}
                    </button>
                  );
                })}
              </div>

              {excludedAllergens.length > 0 && (
                <p
                  className="mt-3 text-xs"
                  style={{ color: PremiumTheme.colors.text.muted }}
                >
                  Showing items free from:{" "}
                  <span style={{ color: PremiumTheme.colors.burgundy[400] }}>
                    {excludedAllergens
                      .map(
                        (id) =>
                          allergenDefs.find((d) => d.id === id)?.name ?? id
                      )
                      .join(", ")}
                  </span>
                </p>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* Main Content: Allergen Matrix */}
      <section className="px-4 pb-16">
        <div className="container mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div
                  className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                  style={{ borderColor: PremiumTheme.colors.burgundy[500], borderTopColor: "transparent" }}
                />
                <p style={{ color: PremiumTheme.colors.text.muted }}>
                  Loading allergen information...
                </p>
              </div>
            </div>
          ) : !hasAllergenData ? (
            /* Fallback: insufficient allergen data */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border p-8 md:p-12 text-center"
              style={{
                backgroundColor: PremiumTheme.colors.background.secondary,
                borderColor: PremiumTheme.colors.border.light,
              }}
            >
              <Info
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: PremiumTheme.colors.burgundy[500] }}
              />
              <h3
                className="text-xl font-serif mb-3"
                style={{ color: PremiumTheme.colors.text.primary }}
              >
                Allergen Information Coming Soon
              </h3>
              <p
                className="max-w-md mx-auto mb-6 text-sm leading-relaxed"
                style={{ color: PremiumTheme.colors.text.secondary }}
              >
                We are currently updating our allergen information for every
                dish. In the meantime, please contact us directly for allergen
                queries.
              </p>
              <a
                href="tel:01903743605"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}
              >
                <Phone className="w-4 h-4" />
                Call 01903 743605
              </a>
            </motion.div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="rounded-xl border overflow-hidden"
                  style={{
                    backgroundColor: PremiumTheme.colors.background.secondary,
                    borderColor: PremiumTheme.colors.border.light,
                  }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr
                          className="sticky top-0 z-10"
                          style={{ backgroundColor: PremiumTheme.colors.background.primary }}
                        >
                          <th
                            className="text-left py-3 px-4 font-medium sticky left-0 z-20 min-w-[200px]"
                            style={{
                              color: PremiumTheme.colors.text.muted,
                              backgroundColor: PremiumTheme.colors.background.primary,
                              borderBottom: `1px solid ${PremiumTheme.colors.border.light}`,
                            }}
                          >
                            Dish
                          </th>
                          {allergenDefs.map((def) => (
                            <th
                              key={def.id}
                              className="text-center py-3 px-1 font-medium"
                              style={{
                                color: PremiumTheme.colors.text.muted,
                                borderBottom: `1px solid ${PremiumTheme.colors.border.light}`,
                                minWidth: "56px",
                              }}
                            >
                              <span className="block text-[10px] leading-tight">
                                {def.name}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {grouped.map(({ category, items: catItems }) => (
                          <>
                            {/* Category header row */}
                            <tr key={`cat-${category.id}`}>
                              <td
                                colSpan={allergenDefs.length + 1}
                                className="py-3 px-4 font-semibold text-xs uppercase tracking-wider"
                                style={{
                                  backgroundColor: "rgba(139, 21, 56, 0.1)",
                                  color: PremiumTheme.colors.burgundy[400],
                                  borderBottom: `1px solid ${PremiumTheme.colors.border.light}`,
                                }}
                              >
                                {category.name}
                              </td>
                            </tr>
                            {/* Item rows */}
                            {catItems.map((item, idx) => (
                              <tr
                                key={item.id}
                                className="transition-colors hover:bg-white/[0.03]"
                                style={{
                                  borderBottom:
                                    idx < catItems.length - 1
                                      ? `1px solid ${PremiumTheme.colors.border.light}`
                                      : undefined,
                                }}
                              >
                                <td
                                  className="py-2.5 px-4 sticky left-0"
                                  style={{
                                    color: PremiumTheme.colors.text.primary,
                                    backgroundColor:
                                      PremiumTheme.colors.background.secondary,
                                  }}
                                >
                                  {item.name}
                                </td>
                                {allergenDefs.map((def) => (
                                  <td key={def.id} className="text-center py-2.5">
                                    <span className="inline-flex justify-center">
                                      <AllergenBadge
                                        status={
                                          item.allergens?.[def.id] ?? null
                                        }
                                      />
                                    </span>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {grouped.map(({ category, items: catItems }) => (
                  <div key={category.id}>
                    <h3
                      className="text-xs uppercase tracking-wider font-semibold px-1 mb-2 mt-6 first:mt-0"
                      style={{ color: PremiumTheme.colors.burgundy[400] }}
                    >
                      {category.name}
                    </h3>
                    <div className="space-y-2">
                      {catItems.map((item) => {
                        const activeAllergens = allergenDefs.filter(
                          (d) =>
                            item.allergens?.[d.id] === "contains" ||
                            item.allergens?.[d.id] === "may_contain"
                        );

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="rounded-lg border p-4"
                            style={{
                              backgroundColor:
                                PremiumTheme.colors.background.secondary,
                              borderColor: PremiumTheme.colors.border.light,
                            }}
                          >
                            <h4
                              className="font-medium text-sm mb-2"
                              style={{
                                color: PremiumTheme.colors.text.primary,
                              }}
                            >
                              {item.name}
                            </h4>
                            {activeAllergens.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {activeAllergens.map((def) => {
                                  const status = item.allergens?.[def.id] as
                                    | "contains"
                                    | "may_contain";
                                  return (
                                    <Badge
                                      key={def.id}
                                      variant="outline"
                                      className={`text-xs ${
                                        status === "contains"
                                          ? "border-red-500/50 text-red-400 bg-red-500/10"
                                          : "border-amber-500/50 text-amber-400 bg-amber-500/10"
                                      }`}
                                    >
                                      {status === "contains" ? "\u2715" : "!"}{" "}
                                      {def.name}
                                    </Badge>
                                  );
                                })}
                              </div>
                            ) : (
                              <p
                                className="text-xs"
                                style={{
                                  color: PremiumTheme.colors.text.muted,
                                }}
                              >
                                No major allergens recorded
                              </p>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* No results after filtering */}
              {grouped.length === 0 && excludedAllergens.length > 0 && (
                <div
                  className="rounded-xl border p-8 text-center"
                  style={{
                    backgroundColor: PremiumTheme.colors.background.secondary,
                    borderColor: PremiumTheme.colors.border.light,
                  }}
                >
                  <HelpCircle
                    className="w-10 h-10 mx-auto mb-3"
                    style={{ color: PremiumTheme.colors.text.muted }}
                  />
                  <p
                    className="text-sm mb-3"
                    style={{ color: PremiumTheme.colors.text.secondary }}
                  >
                    No items found free from all selected allergens.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="text-sm font-medium hover:opacity-80 transition-opacity"
                    style={{ color: PremiumTheme.colors.burgundy[400] }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 pb-20">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border p-8 md:p-10 text-center"
            style={{
              backgroundColor: PremiumTheme.colors.background.secondary,
              borderColor: PremiumTheme.colors.border.light,
            }}
          >
            <HelpCircle
              className="w-10 h-10 mx-auto mb-4"
              style={{ color: PremiumTheme.colors.burgundy[500] }}
            />
            <h3
              className="text-2xl font-serif mb-3"
              style={{ color: PremiumTheme.colors.text.primary }}
            >
              Questions about allergens?
            </h3>
            <p
              className="max-w-md mx-auto mb-6 text-sm leading-relaxed"
              style={{ color: PremiumTheme.colors.text.secondary }}
            >
              Our team is happy to discuss ingredients, allergens, and dietary
              requirements. Do not hesitate to get in touch before your visit.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}
              >
                Contact Us
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="tel:01903743605"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-white/5"
                style={{
                  borderColor: PremiumTheme.colors.border.medium,
                  color: PremiumTheme.colors.text.secondary,
                }}
              >
                <Phone className="w-4 h-4" />
                01903 743605
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
