import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  Banknote,
  Clock,
  MessageSquare,
  AlertTriangle,
  Heart,
  Star,
  ChevronLeft,
  Plus,
  Loader2,
  FileText,
  Package,
  Edit2,
  Pin,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { colors } from "../utils/InternalDesignSystem";
import brain from "brain";
import { CRMOrderDetailModal } from "./CRMOrderDetailModal";
import { useCRMReorder } from "../hooks/useCRMReorder";

interface CustomerProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  phone_e164?: string;
  customer_reference_number?: string;
  identity_confidence?: string;
  total_orders?: number;
  total_spend?: number;
  last_order_at?: string;
  created_at?: string;
  tags?: string[];
  notes_summary?: string;
  default_address?: {
    address_line1?: string;
    city?: string;
    postal_code?: string;
  };
  // Profile image fields
  image_url?: string | null;
  google_profile_image?: string | null;
}

interface TimelineItem {
  id: string;
  touchpoint_type: string;
  summary?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

interface CustomerNote {
  id: string;
  note_type: string;
  content: string;
  is_pinned: boolean;
  created_by_name?: string;
  created_at: string;
}

interface CustomerOrder {
  id: string;
  order_number?: string;
  order_type: string;
  status: string;
  total_amount: number;
  created_at: string;
  visibility?: string;
}

interface CRMCustomerProfileProps {
  customerId: string;
  onBack: () => void;
  onCustomerNameChange?: (name: string) => void;
}

type TabType = "overview" | "timeline" | "orders" | "notes";

const NOTE_TYPES = [
  { value: "general", label: "General", color: colors.text.muted },
  { value: "preference", label: "Preference", color: colors.purple.primary },
  { value: "allergy", label: "Allergy", color: "#F59E0B" },
  { value: "warning", label: "Warning", color: "#EF4444" },
  { value: "complaint", label: "Complaint", color: "#EC4899" },
];

export function CRMCustomerProfile({
  customerId,
  onBack,
  onCustomerNameChange,
}: CRMCustomerProfileProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);

  // Note form state
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState("general");
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Order detail modal state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { handleReorder } = useCRMReorder();

  // Load customer data
  const loadCustomerData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load profile
      const profileRes = await brain.crm_get_customer_profile({ customer_id: customerId });
      const profileData = await profileRes.json();

      if (!profileData.success) {
        throw new Error(profileData.error || "Failed to load customer");
      }

      setProfile(profileData.customer);
      if (onCustomerNameChange && profileData.customer) {
        const name = `${profileData.customer.first_name || ""} ${profileData.customer.last_name || ""}`.trim();
        onCustomerNameChange(name || "Customer Profile");
      }

      // Load timeline
      const timelineRes = await brain.crm_get_customer_timeline({
        customer_id: customerId,
        limit: 50,
      });
      const timelineData = await timelineRes.json();
      setTimeline(timelineData.success ? timelineData.touchpoints || [] : []);

      // Load notes
      const notesRes = await brain.crm_get_customer_notes({ customer_id: customerId });
      const notesData = await notesRes.json();
      setNotes(notesData.success ? notesData.notes || [] : []);

      // Load orders
      const ordersRes = await brain.crm_get_customer_orders({
        customer_id: customerId,
        limit: 50,
      });
      const ordersData = await ordersRes.json();
      setOrders(ordersData.success ? ordersData.orders || [] : []);
    } catch (err) {
      console.error("Error loading customer data:", err);
      setError(err instanceof Error ? err.message : "Failed to load customer");
    } finally {
      setIsLoading(false);
    }
  }, [customerId, onCustomerNameChange]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  // Add note
  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    setIsSavingNote(true);
    try {
      const response = await brain.crm_add_customer_note({
        customer_id: customerId,
        note_type: newNoteType,
        content: newNoteContent.trim(),
      });
      const data = await response.json();

      if (data.success) {
        // Reload notes
        const notesRes = await brain.crm_get_customer_notes({ customer_id: customerId });
        const notesData = await notesRes.json();
        setNotes(notesData.success ? notesData.notes || [] : []);

        // Reset form
        setNewNoteContent("");
        setNewNoteType("general");
        setIsAddingNote(false);
      }
    } catch (err) {
      console.error("Error adding note:", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "£0.00";
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const formatDate = (dateStr?: string, includeTime = false) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (includeTime) {
      return date.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getCustomerName = () => {
    if (!profile) return "Unknown Customer";
    const firstName = profile.first_name || "";
    const lastName = profile.last_name || "";
    return `${firstName} ${lastName}`.trim() || "Unknown Customer";
  };

  const getInitials = () => {
    if (!profile) return "?";
    const firstName = profile.first_name || "";
    const lastName = profile.last_name || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
  };

  const getTouchpointIcon = (type: string) => {
    switch (type) {
      case "order":
        return ShoppingBag;
      case "note":
        return FileText;
      case "chat_session":
        return MessageSquare;
      default:
        return Clock;
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "delivered":
        return colors.status.success;
      case "pending":
      case "preparing":
        return "#F59E0B";
      case "cancelled":
        return colors.status.error;
      default:
        return colors.text.muted;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: colors.purple.primary }}
        />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <h3
          className="text-lg font-medium mb-2"
          style={{ color: colors.text.primary }}
        >
          Error Loading Customer
        </h3>
        <p className="text-sm mb-4" style={{ color: colors.text.muted }}>
          {error || "Customer not found"}
        </p>
        <Button onClick={onBack} variant="outline">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="flex-shrink-0 p-6 border-b"
        style={{ borderColor: colors.border.light }}
      >
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{
              background: profile.image_url || profile.google_profile_image
                ? 'transparent'
                : `linear-gradient(135deg, ${colors.purple.primary}22 0%, ${colors.purple.primary}44 100%)`,
            }}
          >
            {profile.image_url || profile.google_profile_image ? (
              <img
                src={profile.image_url || profile.google_profile_image || ''}
                alt={getCustomerName()}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials on image load error
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.style.background =
                      `linear-gradient(135deg, ${colors.purple.primary}22 0%, ${colors.purple.primary}44 100%)`;
                    // Create and append initials span
                    const span = document.createElement('span');
                    span.className = 'text-2xl font-bold';
                    span.style.color = colors.purple.primary;
                    span.textContent = getInitials();
                    target.parentElement.appendChild(span);
                  }
                }}
              />
            ) : (
              <span
                className="text-2xl font-bold"
                style={{ color: colors.purple.primary }}
              >
                {getInitials()}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h2
                className="text-2xl font-semibold"
                style={{ color: colors.text.primary }}
              >
                {getCustomerName()}
              </h2>
              {profile.customer_reference_number && (
                <span
                  className="text-sm px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: `${colors.purple.primary}20`,
                    color: colors.purple.primary,
                  }}
                >
                  {profile.customer_reference_number}
                </span>
              )}
              {profile.identity_confidence && (
                <span
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor:
                      profile.identity_confidence === "verified"
                        ? "rgba(16, 185, 129, 0.2)"
                        : colors.background.tertiary,
                    color:
                      profile.identity_confidence === "verified"
                        ? "#10B981"
                        : colors.text.muted,
                  }}
                >
                  {profile.identity_confidence}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              {profile.phone && (
                <span
                  className="flex items-center gap-1.5"
                  style={{ color: colors.text.secondary }}
                >
                  <Phone className="w-4 h-4" />
                  {profile.phone}
                </span>
              )}
              {profile.email && (
                <span
                  className="flex items-center gap-1.5"
                  style={{ color: colors.text.secondary }}
                >
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </span>
              )}
              {profile.default_address?.postal_code && (
                <span
                  className="flex items-center gap-1.5"
                  style={{ color: colors.text.secondary }}
                >
                  <MapPin className="w-4 h-4" />
                  {profile.default_address.postal_code}
                </span>
              )}
              <span
                className="flex items-center gap-1.5"
                style={{ color: colors.text.muted }}
              >
                <Calendar className="w-4 h-4" />
                Customer since {formatDate(profile.created_at)}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <p
                className="text-2xl font-bold"
                style={{ color: colors.text.primary }}
              >
                {profile.total_orders || 0}
              </p>
              <p className="text-xs" style={{ color: colors.text.muted }}>
                Orders
              </p>
            </div>
            <div className="text-center">
              <p
                className="text-2xl font-bold"
                style={{ color: colors.text.primary }}
              >
                {formatCurrency(profile.total_spend)}
              </p>
              <p className="text-xs" style={{ color: colors.text.muted }}>
                Total Spend
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex-shrink-0 flex border-b px-6"
        style={{ borderColor: colors.border.light }}
      >
        {(
          [
            { id: "overview", label: "Overview" },
            { id: "timeline", label: "Timeline" },
            { id: "orders", label: "Orders" },
            { id: "notes", label: "Notes" },
          ] as { id: TabType; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
            style={{
              borderColor:
                activeTab === tab.id ? colors.purple.primary : "transparent",
              color:
                activeTab === tab.id
                  ? colors.purple.primary
                  : colors.text.muted,
            }}
          >
            {tab.label}
            {tab.id === "notes" && notes.length > 0 && (
              <span
                className="ml-1.5 px-1.5 py-0.5 rounded text-xs"
                style={{
                  backgroundColor: `${colors.purple.primary}20`,
                  color: colors.purple.primary,
                }}
              >
                {notes.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Recent Activity */}
            <div className="col-span-2 space-y-6">
              {/* Recent Timeline */}
              <div
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                }}
              >
                <h3
                  className="font-medium mb-4"
                  style={{ color: colors.text.primary }}
                >
                  Recent Activity
                </h3>
                {timeline.slice(0, 5).map((item) => {
                  const Icon = getTouchpointIcon(item.touchpoint_type);
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 py-3 border-b last:border-0"
                      style={{ borderColor: colors.border.light }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: colors.background.tertiary }}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={{ color: colors.text.muted }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm"
                          style={{ color: colors.text.primary }}
                        >
                          {item.summary || item.touchpoint_type}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: colors.text.muted }}
                        >
                          {formatDate(item.created_at, true)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {timeline.length === 0 && (
                  <p className="text-sm" style={{ color: colors.text.muted }}>
                    No recent activity
                  </p>
                )}
              </div>

              {/* Recent Orders */}
              <div
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                }}
              >
                <h3
                  className="font-medium mb-4"
                  style={{ color: colors.text.primary }}
                >
                  Recent Orders
                </h3>
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="flex items-center gap-4 py-3 border-b last:border-0 cursor-pointer hover:bg-white/5 transition-colors rounded px-2 -mx-2"
                    style={{ borderColor: colors.border.light }}
                  >
                    <div className="flex-1">
                      <p
                        className="text-sm font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {order.order_number || order.id.slice(0, 8)}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: colors.text.muted }}
                      >
                        {order.order_type} • {formatDate(order.created_at)}
                      </p>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: `${getOrderStatusColor(order.status)}20`,
                        color: getOrderStatusColor(order.status),
                      }}
                    >
                      {order.status}
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      {formatCurrency(order.total_amount)}
                    </span>
                    <ExternalLink
                      className="w-3.5 h-3.5"
                      style={{ color: colors.text.muted }}
                    />
                  </div>
                ))}
                {orders.length === 0 && (
                  <p className="text-sm" style={{ color: colors.text.muted }}>
                    No orders yet
                  </p>
                )}
              </div>
            </div>

            {/* Right Column - Notes & Info */}
            <div className="space-y-6">
              {/* Pinned Notes */}
              <div
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="font-medium"
                    style={{ color: colors.text.primary }}
                  >
                    Notes
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setActiveTab("notes");
                      setIsAddingNote(true);
                    }}
                    className="gap-1"
                    style={{ color: colors.purple.primary }}
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
                {notes
                  .filter((n) => n.is_pinned)
                  .slice(0, 3)
                  .map((note) => {
                    const noteType = NOTE_TYPES.find(
                      (t) => t.value === note.note_type
                    );
                    return (
                      <div
                        key={note.id}
                        className="p-3 rounded-lg mb-2 last:mb-0"
                        style={{
                          backgroundColor: colors.background.tertiary,
                          borderLeft: `3px solid ${noteType?.color || colors.text.muted}`,
                        }}
                      >
                        <p
                          className="text-sm"
                          style={{ color: colors.text.primary }}
                        >
                          {note.content}
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: colors.text.muted }}
                        >
                          {note.created_by_name} • {formatDate(note.created_at)}
                        </p>
                      </div>
                    );
                  })}
                {notes.filter((n) => n.is_pinned).length === 0 && (
                  <p className="text-sm" style={{ color: colors.text.muted }}>
                    No pinned notes
                  </p>
                )}
              </div>

              {/* Tags */}
              {profile.tags && profile.tags.length > 0 && (
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.light,
                  }}
                >
                  <h3
                    className="font-medium mb-3"
                    style={{ color: colors.text.primary }}
                  >
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: colors.background.tertiary,
                          color: colors.text.secondary,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <div className="max-w-3xl">
            {timeline.map((item, index) => {
              const Icon = getTouchpointIcon(item.touchpoint_type);
              return (
                <div key={item.id} className="flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: colors.background.tertiary }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: colors.purple.primary }}
                      />
                    </div>
                    {index < timeline.length - 1 && (
                      <div
                        className="w-0.5 flex-1 mt-2"
                        style={{ backgroundColor: colors.border.light }}
                      />
                    )}
                  </div>
                  <div
                    className="flex-1 pb-6 border-b last:border-0"
                    style={{ borderColor: colors.border.light }}
                  >
                    <p
                      className="font-medium mb-1"
                      style={{ color: colors.text.primary }}
                    >
                      {item.summary || item.touchpoint_type}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: colors.text.muted }}
                    >
                      {formatDate(item.created_at, true)}
                    </p>
                  </div>
                </div>
              );
            })}
            {timeline.length === 0 && (
              <p className="text-center py-12" style={{ color: colors.text.muted }}>
                No timeline activity yet
              </p>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01]"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                }}
              >
                <Package
                  className="w-5 h-5"
                  style={{ color: colors.text.muted }}
                />
                <div className="flex-1">
                  <p
                    className="font-medium"
                    style={{ color: colors.text.primary }}
                  >
                    {order.order_number || order.id.slice(0, 8)}
                  </p>
                  <p className="text-sm" style={{ color: colors.text.muted }}>
                    {order.order_type} • {formatDate(order.created_at, true)}
                  </p>
                </div>
                <span
                  className="text-xs px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: `${getOrderStatusColor(order.status)}20`,
                    color: getOrderStatusColor(order.status),
                  }}
                >
                  {order.status}
                </span>
                {order.visibility && (
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: colors.background.tertiary,
                      color: colors.text.muted,
                    }}
                  >
                    {order.visibility === "customer_portal" ? "Online" : "POS"}
                  </span>
                )}
                <span
                  className="text-lg font-semibold"
                  style={{ color: colors.text.primary }}
                >
                  {formatCurrency(order.total_amount)}
                </span>
                <ExternalLink
                  className="w-4 h-4"
                  style={{ color: colors.text.muted }}
                />
              </div>
            ))}
            {orders.length === 0 && (
              <p
                className="text-center py-12"
                style={{ color: colors.text.muted }}
              >
                No orders found
              </p>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === "notes" && (
          <div className="space-y-4">
            {/* Add Note Form */}
            <AnimatePresence>
              {isAddingNote ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl p-4 border"
                  style={{
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.purple.primary,
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Select
                      value={newNoteType}
                      onValueChange={setNewNoteType}
                    >
                      <SelectTrigger
                        className="w-40"
                        style={{
                          backgroundColor: colors.background.tertiary,
                          borderColor: colors.border.medium,
                        }}
                      >
                        <SelectValue placeholder="Note type" />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Write a note about this customer..."
                    className="mb-3"
                    rows={3}
                    style={{
                      backgroundColor: colors.background.tertiary,
                      borderColor: colors.border.medium,
                      color: colors.text.primary,
                    }}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAddingNote(false);
                        setNewNoteContent("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddNote}
                      disabled={!newNoteContent.trim() || isSavingNote}
                      style={{
                        backgroundColor: colors.purple.primary,
                        color: "white",
                      }}
                    >
                      {isSavingNote ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Save Note"
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <Button
                  onClick={() => setIsAddingNote(true)}
                  variant="outline"
                  className="w-full gap-2"
                  style={{
                    borderColor: colors.border.medium,
                    color: colors.text.secondary,
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </Button>
              )}
            </AnimatePresence>

            {/* Notes List */}
            {notes.map((note) => {
              const noteType = NOTE_TYPES.find((t) => t.value === note.note_type);
              return (
                <div
                  key={note.id}
                  className="rounded-xl p-4 border"
                  style={{
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.light,
                    borderLeftWidth: "4px",
                    borderLeftColor: noteType?.color || colors.text.muted,
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${noteType?.color || colors.text.muted}20`,
                          color: noteType?.color || colors.text.muted,
                        }}
                      >
                        {noteType?.label || note.note_type}
                      </span>
                      {note.is_pinned && (
                        <Pin
                          className="w-3 h-3"
                          style={{ color: colors.purple.primary }}
                        />
                      )}
                    </div>
                    <span className="text-xs" style={{ color: colors.text.muted }}>
                      {formatDate(note.created_at, true)}
                    </span>
                  </div>
                  <p className="text-sm mb-2" style={{ color: colors.text.primary }}>
                    {note.content}
                  </p>
                  {note.created_by_name && (
                    <p className="text-xs" style={{ color: colors.text.muted }}>
                      — {note.created_by_name}
                    </p>
                  )}
                </div>
              );
            })}
            {notes.length === 0 && !isAddingNote && (
              <p
                className="text-center py-12"
                style={{ color: colors.text.muted }}
              >
                No notes yet. Add one to get started.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {profile && (
        <CRMOrderDetailModal
          isOpen={!!selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          orderId={selectedOrderId || ''}
          customer={{
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email,
            phone: profile.phone,
          }}
          onReorder={(order, customer) => {
            setSelectedOrderId(null);
            handleReorder(order, customer);
          }}
        />
      )}
    </div>
  );
}
