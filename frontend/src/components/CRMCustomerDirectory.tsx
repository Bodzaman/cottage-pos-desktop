import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Phone,
  Mail,
  Hash,
  User,
  Calendar,
  ShoppingBag,
  Banknote,
  ChevronRight,
  Loader2,
  UserPlus,
  X,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { colors } from "../utils/InternalDesignSystem";
import brain from "brain";

interface CustomerSummary {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  customer_reference_number?: string;
  total_orders?: number;
  total_spend?: number;
  last_order_at?: string;
  created_at?: string;
}

interface CRMCustomerDirectoryProps {
  initialQuery?: string;
  onSelectCustomer: (customerId: string) => void;
  onUpdateQuery: (query: string) => void;
}

type SearchType = "auto" | "phone" | "email" | "reference" | "name";

export function CRMCustomerDirectory({
  initialQuery,
  onSelectCustomer,
  onUpdateQuery,
}: CRMCustomerDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery || "");
  const [searchType, setSearchType] = useState<SearchType>("auto");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<CustomerSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Focus search on "/" key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounced search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await brain.crm_search_customers({
        query: query.trim(),
        limit: 50,
      });
      const data = await response.json();

      if (data.success) {
        setResults(data.customers || []);
      } else {
        setError(data.error || "Search failed");
        setResults([]);
      }
    } catch (err) {
      console.error("CRM search error:", err);
      setError("Search failed. Please try again.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input change with debounce
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      onUpdateQuery(value);

      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce search
      debounceRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    },
    [performSearch, onUpdateQuery]
  );

  // Initial search if query provided
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, []);

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "£0.00";
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getCustomerName = (customer: CustomerSummary) => {
    const firstName = customer.first_name || "";
    const lastName = customer.last_name || "";
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return "Unknown Customer";
  };

  const getInitials = (customer: CustomerSummary) => {
    const firstName = customer.first_name || "";
    const lastName = customer.last_name || "";
    if (firstName || lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return "?";
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Search Header */}
      <div className="mb-6">
        <h2
          className="text-2xl font-semibold mb-2"
          style={{ color: colors.text.primary }}
        >
          Customer Directory
        </h2>
        <p className="text-sm" style={{ color: colors.text.muted }}>
          Search by phone, email, name, or customer reference
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: colors.text.muted }}
          />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-12 pr-12 h-12 text-base"
            style={{
              backgroundColor: colors.background.tertiary,
              borderColor: colors.border.medium,
              color: colors.text.primary,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" style={{ color: colors.text.muted }} />
            </button>
          )}
        </div>

        {/* Search type indicators */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs" style={{ color: colors.text.muted }}>
            Search by:
          </span>
          {[
            { type: "phone" as SearchType, icon: Phone, label: "Phone" },
            { type: "email" as SearchType, icon: Mail, label: "Email" },
            { type: "reference" as SearchType, icon: Hash, label: "Ref#" },
            { type: "name" as SearchType, icon: User, label: "Name" },
          ].map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setSearchType(type)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
              style={{
                backgroundColor:
                  searchType === type
                    ? `${colors.purple.primary}20`
                    : "transparent",
                color:
                  searchType === type
                    ? colors.purple.primary
                    : colors.text.muted,
                border: `1px solid ${
                  searchType === type
                    ? colors.purple.primary
                    : colors.border.light
                }`,
              }}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-auto">
        {/* Loading State */}
        {isSearching && (
          <div className="flex items-center justify-center py-12">
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: colors.purple.primary }}
            />
            <span className="ml-3" style={{ color: colors.text.muted }}>
              Searching...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && !isSearching && (
          <div
            className="flex items-center gap-3 p-4 rounded-lg"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Empty State - No Search */}
        {!hasSearched && !isSearching && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${colors.purple.primary}15` }}
            >
              <Search
                className="w-8 h-8"
                style={{ color: colors.purple.primary }}
              />
            </div>
            <h3
              className="text-lg font-medium mb-2"
              style={{ color: colors.text.primary }}
            >
              Search for customers
            </h3>
            <p
              className="text-sm max-w-md"
              style={{ color: colors.text.muted }}
            >
              Enter a phone number, email address, customer reference, or name
              to find customer records
            </p>
          </div>
        )}

        {/* Empty State - No Results */}
        {hasSearched && !isSearching && results.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: colors.background.tertiary }}
            >
              <User className="w-8 h-8" style={{ color: colors.text.muted }} />
            </div>
            <h3
              className="text-lg font-medium mb-2"
              style={{ color: colors.text.primary }}
            >
              No customers found
            </h3>
            <p
              className="text-sm max-w-md mb-4"
              style={{ color: colors.text.muted }}
            >
              No customers match "{searchQuery}". Try a different search term.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              style={{
                borderColor: colors.border.medium,
                color: colors.text.secondary,
              }}
            >
              <UserPlus className="w-4 h-4" />
              Create New Customer
            </Button>
          </div>
        )}

        {/* Results List */}
        {!isSearching && results.length > 0 && (
          <div className="space-y-2">
            <p
              className="text-sm mb-3"
              style={{ color: colors.text.muted }}
            >
              {results.length} customer{results.length !== 1 ? "s" : ""} found
            </p>

            <AnimatePresence>
              {results.map((customer, index) => (
                <motion.button
                  key={customer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => onSelectCustomer(customer.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:border-purple-500/30 group"
                  style={{
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.light,
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${colors.purple.primary}22 0%, ${colors.purple.primary}44 100%)`,
                    }}
                  >
                    <span
                      className="text-sm font-semibold"
                      style={{ color: colors.purple.primary }}
                    >
                      {getInitials(customer)}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="font-medium truncate"
                        style={{ color: colors.text.primary }}
                      >
                        {getCustomerName(customer)}
                      </span>
                      {customer.customer_reference_number && (
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: `${colors.purple.primary}20`,
                            color: colors.purple.primary,
                          }}
                        >
                          {customer.customer_reference_number}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      {customer.phone && (
                        <span
                          className="flex items-center gap-1"
                          style={{ color: colors.text.muted }}
                        >
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </span>
                      )}
                      {customer.email && (
                        <span
                          className="flex items-center gap-1 truncate"
                          style={{ color: colors.text.muted }}
                        >
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      <p
                        className="text-xs"
                        style={{ color: colors.text.muted }}
                      >
                        Orders
                      </p>
                      <p
                        className="font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {customer.total_orders || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-xs"
                        style={{ color: colors.text.muted }}
                      >
                        Total Spend
                      </p>
                      <p
                        className="font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {formatCurrency(customer.total_spend)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-xs"
                        style={{ color: colors.text.muted }}
                      >
                        Last Order
                      </p>
                      <p
                        className="font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {formatDate(customer.last_order_at)}
                      </p>
                    </div>

                    <ChevronRight
                      className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: colors.purple.primary }}
                    />
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
