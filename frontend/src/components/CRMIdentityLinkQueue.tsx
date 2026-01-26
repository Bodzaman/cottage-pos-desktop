import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Check,
  X,
  AlertTriangle,
  User,
  Phone,
  Mail,
  ShoppingBag,
  Banknote,
  Loader2,
  RefreshCw,
  ChevronDown,
  Merge,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
}

interface IdentityLink {
  id: string;
  source_customer_id: string;
  target_customer_id: string;
  match_tier: "strong" | "medium" | "weak";
  match_reason: string;
  confidence_score: number;
  status: string;
  source_customer?: CustomerSummary;
  target_customer?: CustomerSummary;
  created_at?: string;
}

interface CRMIdentityLinkQueueProps {
  onViewCustomer: (customerId: string) => void;
}

const TIER_CONFIG = {
  strong: {
    label: "Strong",
    color: "#10B981",
    bgColor: "rgba(16, 185, 129, 0.15)",
    description: "High confidence match - likely same person",
  },
  medium: {
    label: "Medium",
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.15)",
    description: "Moderate confidence - review recommended",
  },
  weak: {
    label: "Weak",
    color: "#6B7280",
    bgColor: "rgba(107, 114, 128, 0.15)",
    description: "Low confidence - additional verification needed",
  },
};

const REASON_LABELS: Record<string, string> = {
  exact_email: "Exact email match",
  exact_phone: "Exact phone match",
  name_postcode: "Name + postcode match",
  name_phone_partial: "Name + partial phone match",
  name_only: "Name similarity",
};

export function CRMIdentityLinkQueue({
  onViewCustomer,
}: CRMIdentityLinkQueueProps) {
  const [links, setLinks] = useState<IdentityLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [pendingCount, setPendingCount] = useState(0);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const [stats, setStats] = useState<{
    pending: number;
    approved: number;
    rejected: number;
    auto_linked: number;
  } | null>(null);

  // Load links
  const loadLinks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await brain.identity_get_link_queue({
        status: statusFilter === "all" ? undefined : statusFilter,
        tier: tierFilter === "all" ? undefined : tierFilter,
        limit: 100,
      });
      const data = await response.json();

      if (data.success) {
        setLinks(data.links || []);
        setPendingCount(data.pending_count || 0);
      } else {
        setError(data.error || "Failed to load links");
      }
    } catch (err) {
      console.error("Error loading links:", err);
      setError("Failed to load identity links");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, tierFilter]);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const response = await brain.identity_get_stats();
      const data = await response.json();
      if (data.success) {
        setStats(data.by_status);
      }
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  }, []);

  useEffect(() => {
    loadLinks();
    loadStats();
  }, [loadLinks, loadStats]);

  // Approve link
  const handleApprove = async (linkId: string) => {
    setProcessingIds((prev) => new Set(prev).add(linkId));
    try {
      const response = await brain.identity_approve_link({ link_id: linkId });
      const data = await response.json();
      if (data.success) {
        await loadLinks();
        await loadStats();
      }
    } catch (err) {
      console.error("Error approving link:", err);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(linkId);
        return next;
      });
    }
  };

  // Reject link
  const handleReject = async (linkId: string) => {
    setProcessingIds((prev) => new Set(prev).add(linkId));
    try {
      const response = await brain.identity_reject_link({ link_id: linkId });
      const data = await response.json();
      if (data.success) {
        await loadLinks();
        await loadStats();
      }
    } catch (err) {
      console.error("Error rejecting link:", err);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(linkId);
        return next;
      });
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "£0.00";
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const getCustomerName = (customer?: CustomerSummary) => {
    if (!customer) return "Unknown";
    const firstName = customer.first_name || "";
    const lastName = customer.last_name || "";
    return `${firstName} ${lastName}`.trim() || "Unknown";
  };

  const getInitials = (customer?: CustomerSummary) => {
    if (!customer) return "?";
    const firstName = customer.first_name || "";
    const lastName = customer.last_name || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2
            className="text-2xl font-semibold"
            style={{ color: colors.text.primary }}
          >
            Identity Link Queue
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadLinks();
              loadStats();
            }}
            className="gap-2"
            style={{
              borderColor: colors.border.medium,
              color: colors.text.secondary,
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
        <p className="text-sm" style={{ color: colors.text.muted }}>
          Review potential duplicate customer records and decide whether to merge or keep separate
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Pending", value: stats.pending, color: "#F59E0B" },
            { label: "Approved", value: stats.approved, color: "#10B981" },
            { label: "Rejected", value: stats.rejected, color: "#EF4444" },
            { label: "Auto-linked", value: stats.auto_linked, color: colors.purple.primary },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl p-4 border"
              style={{
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.light,
              }}
            >
              <p className="text-xs mb-1" style={{ color: colors.text.muted }}>
                {label}
              </p>
              <p className="text-2xl font-bold" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: colors.text.muted }}>
            Status:
          </span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className="w-32"
              style={{
                backgroundColor: colors.background.tertiary,
                borderColor: colors.border.medium,
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: colors.text.muted }}>
            Confidence:
          </span>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger
              className="w-32"
              style={{
                backgroundColor: colors.background.tertiary,
                borderColor: colors.border.medium,
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="strong">Strong</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="weak">Weak</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {pendingCount > 0 && (
          <span
            className="text-sm px-3 py-1 rounded-full"
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.15)",
              color: "#F59E0B",
            }}
          >
            {pendingCount} pending review
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: colors.purple.primary }}
            />
            <span className="ml-3" style={{ color: colors.text.muted }}>
              Loading...
            </span>
          </div>
        )}

        {error && !isLoading && (
          <div
            className="flex items-center gap-3 p-4 rounded-lg"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {!isLoading && links.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${colors.purple.primary}15` }}
            >
              <Link2
                className="w-8 h-8"
                style={{ color: colors.purple.primary }}
              />
            </div>
            <h3
              className="text-lg font-medium mb-2"
              style={{ color: colors.text.primary }}
            >
              No identity links found
            </h3>
            <p
              className="text-sm max-w-md"
              style={{ color: colors.text.muted }}
            >
              {statusFilter === "pending"
                ? "No pending duplicate reviews. All clear!"
                : "No links match your current filters."}
            </p>
          </div>
        )}

        {/* Links List */}
        {!isLoading && links.length > 0 && (
          <div className="space-y-4">
            <AnimatePresence>
              {links.map((link, index) => {
                const tierConfig = TIER_CONFIG[link.match_tier];
                const isProcessing = processingIds.has(link.id);

                return (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.03 }}
                    className="rounded-xl border p-5"
                    style={{
                      backgroundColor: colors.background.secondary,
                      borderColor: colors.border.light,
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{
                            backgroundColor: tierConfig.bgColor,
                            color: tierConfig.color,
                          }}
                        >
                          {tierConfig.label} ({Math.round(link.confidence_score * 100)}%)
                        </span>
                        <span
                          className="text-sm"
                          style={{ color: colors.text.muted }}
                        >
                          {REASON_LABELS[link.match_reason] || link.match_reason}
                        </span>
                      </div>
                      <span
                        className="text-xs"
                        style={{ color: colors.text.muted }}
                      >
                        {link.status}
                      </span>
                    </div>

                    {/* Customer Comparison */}
                    <div className="grid grid-cols-2 gap-6 mb-4">
                      {[
                        { customer: link.source_customer, label: "Customer A" },
                        { customer: link.target_customer, label: "Customer B" },
                      ].map(({ customer, label }) => (
                        <div
                          key={label}
                          className="rounded-lg p-4 border"
                          style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.light,
                          }}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{
                                background: `linear-gradient(135deg, ${colors.purple.primary}22 0%, ${colors.purple.primary}44 100%)`,
                              }}
                            >
                              <span
                                className="text-sm font-medium"
                                style={{ color: colors.purple.primary }}
                              >
                                {getInitials(customer)}
                              </span>
                            </div>
                            <div>
                              <p
                                className="font-medium"
                                style={{ color: colors.text.primary }}
                              >
                                {getCustomerName(customer)}
                              </p>
                              {customer?.customer_reference_number && (
                                <p
                                  className="text-xs"
                                  style={{ color: colors.purple.primary }}
                                >
                                  {customer.customer_reference_number}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            {customer?.phone && (
                              <div
                                className="flex items-center gap-2"
                                style={{ color: colors.text.secondary }}
                              >
                                <Phone className="w-4 h-4" />
                                {customer.phone}
                              </div>
                            )}
                            {customer?.email && (
                              <div
                                className="flex items-center gap-2"
                                style={{ color: colors.text.secondary }}
                              >
                                <Mail className="w-4 h-4" />
                                {customer.email}
                              </div>
                            )}
                            <div className="flex items-center gap-4 pt-2">
                              <span
                                className="flex items-center gap-1"
                                style={{ color: colors.text.muted }}
                              >
                                <ShoppingBag className="w-4 h-4" />
                                {customer?.total_orders || 0} orders
                              </span>
                              <span
                                className="flex items-center gap-1"
                                style={{ color: colors.text.muted }}
                              >
                                <Banknote className="w-4 h-4" />
                                {formatCurrency(customer?.total_spend)}
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              customer && onViewCustomer(customer.id)
                            }
                            className="w-full mt-3 gap-1"
                            style={{ color: colors.purple.primary }}
                          >
                            <Eye className="w-4 h-4" />
                            View Profile
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    {link.status === "pending" && (
                      <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: colors.border.light }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(link.id)}
                          disabled={isProcessing}
                          className="gap-2"
                          style={{
                            borderColor: colors.status.error,
                            color: colors.status.error,
                          }}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          Different People
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(link.id)}
                          disabled={isProcessing}
                          className="gap-2"
                          style={{
                            backgroundColor: colors.status.success,
                            color: "white",
                          }}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Same Person
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
