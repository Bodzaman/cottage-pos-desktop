import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  X,
  ShoppingCart,
  Clock,
  Settings,
  Bell,
  Volume2,
  Copy,
  Truck,
  Package,
  Loader2,
  Plus,
  Trash2,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Users,
  DollarSign,
  Timer,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { globalColors } from '../utils/QSAIDesign';
import {
  useRestaurantSettings,
  type OrderingHoursEntry,
  type OnlineOrdersSettings,
  type TimeSlot,
  type OrderAcceptanceSettings,
} from '../utils/useRestaurantSettings';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface OnlineOrderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DayName = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const DAYS: DayName[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<DayName, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const DEFAULT_ORDERING_HOURS: OrderingHoursEntry[] = DAYS.map((day) => ({
  day,
  enabled: true,
  slots: [{ label: 'Evening', openTime: '17:00', closeTime: '22:30' }],
}));

/** Migrate legacy single open/close format to slots array */
function migrateOrderingHours(entries: OrderingHoursEntry[]): OrderingHoursEntry[] {
  return entries.map((entry) => {
    if (entry.slots?.length) return entry;
    // Legacy format: openTime/closeTime at root level
    const openTime = (entry as any).openTime || '17:00';
    const closeTime = (entry as any).closeTime || '22:30';
    return {
      day: entry.day,
      enabled: entry.enabled,
      slots: [{ label: 'Evening', openTime, closeTime }],
    };
  });
}

const DEFAULT_ORDER_ACCEPTANCE: OrderAcceptanceSettings = {
  autoAcceptEnabled: true,
  rules: {
    COLLECTION: { autoAccept: true, manualThreshold: 75 },
    DELIVERY: { autoAccept: true, manualThreshold: 75 },
  },
  advanced: {
    manualForFirstTimeCustomers: false,
    manualDuringRushHours: false,
    rushHoursSchedule: {
      monday: { enabled: false, start: '18:00', end: '21:00' },
      tuesday: { enabled: false, start: '18:00', end: '21:00' },
      wednesday: { enabled: false, start: '18:00', end: '21:00' },
      thursday: { enabled: false, start: '18:00', end: '21:00' },
      friday: { enabled: true, start: '18:00', end: '22:00' },
      saturday: { enabled: true, start: '17:00', end: '23:00' },
      sunday: { enabled: false, start: '17:00', end: '21:00' },
    },
  },
  deadlines: {
    COLLECTION: 15,
    DELIVERY: 20,
  },
  notifications: {
    notifyCustomerOnAccept: true,
    notifyCustomerOnReject: true,
    warnStaffBeforeTimeout: 5,
  },
};

const DEFAULT_SETTINGS: OnlineOrdersSettings = {
  notifications: {
    playSound: true,
    soundVolume: 75,
    repeatUntilAcknowledged: false,
  },
  processing: {
    autoApproveOrders: true,
    autoPrintOnAccept: true,
  },
  prepTimeSchedule: [],
  availability: {
    acceptOnlineOrders: true,
    acceptDeliveryOrders: true,
    acceptCollectionOrders: true,
    orderCutoffMinutes: 30,
  },
  orderingHours: DEFAULT_ORDERING_HOURS,
  orderAcceptance: DEFAULT_ORDER_ACCEPTANCE,
};

// ============================================================================
// COMPONENT
// ============================================================================

export function OnlineOrderSettingsModal({ isOpen, onClose }: OnlineOrderSettingsModalProps) {
  const { settings, saveSettings, isLoading: isSettingsLoading } = useRestaurantSettings();

  const [localSettings, setLocalSettings] = useState<OnlineOrdersSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvancedRules, setShowAdvancedRules] = useState(false);

  // Load settings from database when modal opens
  useEffect(() => {
    if (isOpen && settings?.onlineOrders) {
      const rawHours = settings.onlineOrders.orderingHours?.length
        ? settings.onlineOrders.orderingHours
        : DEFAULT_ORDERING_HOURS;

      setLocalSettings({
        ...DEFAULT_SETTINGS,
        ...settings.onlineOrders,
        notifications: {
          ...DEFAULT_SETTINGS.notifications,
          ...settings.onlineOrders.notifications,
        },
        processing: {
          ...DEFAULT_SETTINGS.processing,
          ...settings.onlineOrders.processing,
        },
        availability: {
          ...DEFAULT_SETTINGS.availability,
          ...settings.onlineOrders.availability,
        },
        orderingHours: migrateOrderingHours(rawHours),
        orderAcceptance: {
          ...DEFAULT_ORDER_ACCEPTANCE,
          ...settings.onlineOrders.orderAcceptance,
          rules: {
            ...DEFAULT_ORDER_ACCEPTANCE.rules,
            ...settings.onlineOrders.orderAcceptance?.rules,
          },
          advanced: {
            ...DEFAULT_ORDER_ACCEPTANCE.advanced,
            ...settings.onlineOrders.orderAcceptance?.advanced,
            rushHoursSchedule: {
              ...DEFAULT_ORDER_ACCEPTANCE.advanced.rushHoursSchedule,
              ...settings.onlineOrders.orderAcceptance?.advanced?.rushHoursSchedule,
            },
          },
          deadlines: {
            ...DEFAULT_ORDER_ACCEPTANCE.deadlines,
            ...settings.onlineOrders.orderAcceptance?.deadlines,
          },
          notifications: {
            ...DEFAULT_ORDER_ACCEPTANCE.notifications,
            ...settings.onlineOrders.orderAcceptance?.notifications,
          },
        },
      });
      setHasChanges(false);
    }
  }, [isOpen, settings]);

  // Update helper
  const updateSection = <K extends keyof OnlineOrdersSettings>(
    section: K,
    updates: Partial<OnlineOrdersSettings[K]>
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        ...updates,
      },
    }));
    setHasChanges(true);
  };

  // Update order acceptance settings
  const updateAcceptance = (updates: Partial<OrderAcceptanceSettings>) => {
    setLocalSettings((prev) => ({
      ...prev,
      orderAcceptance: {
        ...(prev.orderAcceptance || DEFAULT_ORDER_ACCEPTANCE),
        ...updates,
      },
    }));
    setHasChanges(true);
  };

  const updateAcceptanceRules = (
    orderType: 'COLLECTION' | 'DELIVERY',
    updates: Partial<{ autoAccept: boolean; manualThreshold: number }>
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      orderAcceptance: {
        ...(prev.orderAcceptance || DEFAULT_ORDER_ACCEPTANCE),
        rules: {
          ...(prev.orderAcceptance?.rules || DEFAULT_ORDER_ACCEPTANCE.rules),
          [orderType]: {
            ...(prev.orderAcceptance?.rules?.[orderType] || DEFAULT_ORDER_ACCEPTANCE.rules[orderType]),
            ...updates,
          },
        },
      },
    }));
    setHasChanges(true);
  };

  const updateAcceptanceAdvanced = (updates: Partial<OrderAcceptanceSettings['advanced']>) => {
    setLocalSettings((prev) => ({
      ...prev,
      orderAcceptance: {
        ...(prev.orderAcceptance || DEFAULT_ORDER_ACCEPTANCE),
        advanced: {
          ...(prev.orderAcceptance?.advanced || DEFAULT_ORDER_ACCEPTANCE.advanced),
          ...updates,
        },
      },
    }));
    setHasChanges(true);
  };

  const updateAcceptanceDeadlines = (updates: Partial<{ COLLECTION: number; DELIVERY: number }>) => {
    setLocalSettings((prev) => ({
      ...prev,
      orderAcceptance: {
        ...(prev.orderAcceptance || DEFAULT_ORDER_ACCEPTANCE),
        deadlines: {
          ...(prev.orderAcceptance?.deadlines || DEFAULT_ORDER_ACCEPTANCE.deadlines),
          ...updates,
        },
      },
    }));
    setHasChanges(true);
  };

  // Update a single day's top-level props (enabled toggle)
  const updateDayHours = (day: DayName, updates: Partial<OrderingHoursEntry>) => {
    setLocalSettings((prev) => ({
      ...prev,
      orderingHours: (prev.orderingHours || DEFAULT_ORDERING_HOURS).map((h) =>
        h.day === day ? { ...h, ...updates } : h
      ),
    }));
    setHasChanges(true);
  };

  // Update a specific time slot within a day
  const updateSlot = (day: DayName, slotIndex: number, updates: Partial<TimeSlot>) => {
    setLocalSettings((prev) => ({
      ...prev,
      orderingHours: (prev.orderingHours || DEFAULT_ORDERING_HOURS).map((h) => {
        if (h.day !== day) return h;
        const newSlots = [...h.slots];
        newSlots[slotIndex] = { ...newSlots[slotIndex], ...updates };
        return { ...h, slots: newSlots };
      }),
    }));
    setHasChanges(true);
  };

  // Add a new time slot to a day
  const addSlot = (day: DayName) => {
    setLocalSettings((prev) => ({
      ...prev,
      orderingHours: (prev.orderingHours || DEFAULT_ORDERING_HOURS).map((h) => {
        if (h.day !== day || h.slots.length >= 4) return h;
        return { ...h, slots: [...h.slots, { label: 'Lunch', openTime: '12:00', closeTime: '14:30' }] };
      }),
    }));
    setHasChanges(true);
  };

  // Remove a time slot from a day (min 1)
  const removeSlot = (day: DayName, slotIndex: number) => {
    setLocalSettings((prev) => ({
      ...prev,
      orderingHours: (prev.orderingHours || DEFAULT_ORDERING_HOURS).map((h) => {
        if (h.day !== day || h.slots.length <= 1) return h;
        return { ...h, slots: h.slots.filter((_, i) => i !== slotIndex) };
      }),
    }));
    setHasChanges(true);
  };

  // Copy first day's hours to all days
  const copyToAll = () => {
    const hours = localSettings.orderingHours || DEFAULT_ORDERING_HOURS;
    const first = hours[0];
    if (!first) return;

    setLocalSettings((prev) => ({
      ...prev,
      orderingHours: (prev.orderingHours || DEFAULT_ORDERING_HOURS).map((h) => ({
        ...h,
        enabled: first.enabled,
        slots: first.slots.map((s) => ({ ...s })),
      })),
    }));
    setHasChanges(true);
    toast.success('Hours copied to all days');
  };

  // Save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedSettings = {
        ...settings,
        onlineOrders: localSettings,
        general: {
          ...settings?.general,
          autoApproveOrders: localSettings.processing.autoApproveOrders,
        },
      };

      await saveSettings(updatedSettings);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save online order settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Close handler
  const handleClose = useCallback(() => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Discard them?');
      if (!confirmed) return;
    }
    setHasChanges(false);
    onClose();
  }, [hasChanges, onClose]);

  // Test notification sound
  const testSound = () => {
    // Use relative path in Electron (file:// protocol), absolute in browser
    const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;
    const soundPath = isElectron
      ? './audio-sounds/online_order_notification_sound_pos.mp3'
      : '/audio-sounds/online_order_notification_sound_pos.mp3';
    const audio = new Audio(soundPath);
    audio.volume = localSettings.notifications.soundVolume / 100;
    audio.play().catch((err) => {
      console.warn('Failed to play test sound:', err);
      toast.error('Failed to play sound');
    });
  };

  const orderingHours = localSettings.orderingHours || DEFAULT_ORDERING_HOURS;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="p-0 border-0 !overflow-hidden"
        hideCloseButton
        style={{
          maxWidth: '95vw',
          width: '900px',
          height: 'min(90vh, 860px)',
          maxHeight: '90vh',
          backgroundColor: '#111111',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{
                  background: 'rgba(124, 93, 250, 0.1)',
                  border: '1px solid rgba(124, 93, 250, 0.2)',
                }}
              >
                <ShoppingCart className="h-5 w-5" style={{ color: '#7C5DFA' }} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: globalColors.text.primary }}>
                  Online Order Settings
                </h2>
                <p className="text-xs" style={{ color: globalColors.text.secondary }}>
                  Manage ordering hours, notifications, and processing
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  size="sm"
                  className="h-8"
                  style={{ backgroundColor: globalColors.purple.primary }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Saving
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-gray-400 hover:text-white h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6">
            {/* ── Section: Online Ordering Hours ── */}
            <section
              className="rounded-lg border p-4"
              style={{ borderColor: globalColors.border.light, backgroundColor: globalColors.background.tertiary }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" style={{ color: globalColors.purple.primary }} />
                  <h4 className="text-base font-semibold" style={{ color: globalColors.text.primary }}>
                    Online Ordering Hours
                  </h4>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToAll}
                  className="h-7 text-xs"
                  style={{ borderColor: globalColors.border.light }}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy first to all
                </Button>
              </div>

              <p className="text-xs mb-4" style={{ color: globalColors.text.secondary }}>
                Set when online ordering is available. Add multiple time slots per day (e.g., Lunch + Evening).
              </p>

              <div className="space-y-2">
                {orderingHours.map((entry) => (
                  <div
                    key={entry.day}
                    className="rounded-md border px-3 py-2"
                    style={{
                      borderColor: entry.enabled ? globalColors.border.light : 'rgba(255, 255, 255, 0.05)',
                      backgroundColor: entry.enabled ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                      opacity: entry.enabled ? 1 : 0.5,
                    }}
                  >
                    {/* Day header row */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={entry.enabled}
                          onCheckedChange={(checked) => updateDayHours(entry.day, { enabled: checked })}
                          className="scale-75"
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: globalColors.text.primary }}
                        >
                          {DAY_LABELS[entry.day]}
                        </span>
                      </div>
                      {entry.enabled && entry.slots.length < 4 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addSlot(entry.day)}
                          className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-white/10"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Slot
                        </Button>
                      )}
                    </div>

                    {/* Time slots */}
                    {entry.enabled && (
                      <div className="space-y-1.5 ml-9">
                        {entry.slots.map((slot, slotIdx) => (
                          <div key={slotIdx} className="flex items-center gap-2">
                            <Input
                              type="text"
                              value={slot.label}
                              onChange={(e) => updateSlot(entry.day, slotIdx, { label: e.target.value })}
                              className="h-7 text-xs w-20"
                              placeholder="Label"
                              style={{ colorScheme: 'dark' }}
                            />
                            <Input
                              type="time"
                              value={slot.openTime}
                              onChange={(e) => updateSlot(entry.day, slotIdx, { openTime: e.target.value })}
                              className="h-7 text-xs"
                              style={{ maxWidth: '120px', colorScheme: 'dark' }}
                            />
                            <span className="text-xs" style={{ color: globalColors.text.secondary }}>to</span>
                            <Input
                              type="time"
                              value={slot.closeTime}
                              onChange={(e) => updateSlot(entry.day, slotIdx, { closeTime: e.target.value })}
                              className="h-7 text-xs"
                              style={{ maxWidth: '120px', colorScheme: 'dark' }}
                            />
                            {entry.slots.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSlot(entry.day, slotIdx)}
                                className="h-6 w-6 p-0 text-gray-500 hover:text-red-400"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ── Section: Order Type Controls ── */}
            <section
              className="rounded-lg border p-4"
              style={{ borderColor: globalColors.border.light, backgroundColor: globalColors.background.tertiary }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Truck className="h-5 w-5" style={{ color: globalColors.purple.primary }} />
                <h4 className="text-base font-semibold" style={{ color: globalColors.text.primary }}>
                  Order Types
                </h4>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" style={{ color: localSettings.availability.acceptDeliveryOrders ? globalColors.purple.primary : globalColors.text.muted }} />
                    <div>
                      <label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                        Accept delivery orders
                      </label>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.availability.acceptDeliveryOrders}
                    onCheckedChange={(checked) => updateSection('availability', { acceptDeliveryOrders: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" style={{ color: localSettings.availability.acceptCollectionOrders ? globalColors.purple.primary : globalColors.text.muted }} />
                    <div>
                      <label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                        Accept collection orders
                      </label>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.availability.acceptCollectionOrders}
                    onCheckedChange={(checked) => updateSection('availability', { acceptCollectionOrders: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                      Order cutoff before closing
                    </label>
                    <p className="text-xs" style={{ color: globalColors.text.secondary }}>
                      Stop accepting orders this many minutes before close
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={120}
                      value={localSettings.availability.orderCutoffMinutes}
                      onChange={(e) => updateSection('availability', { orderCutoffMinutes: parseInt(e.target.value) || 0 })}
                      className="w-20 h-8 text-center"
                    />
                    <span className="text-sm" style={{ color: globalColors.text.secondary }}>mins</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Section: Order Acceptance ── */}
            <section
              className="rounded-lg border p-4"
              style={{ borderColor: globalColors.border.light, backgroundColor: globalColors.background.tertiary }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5" style={{ color: globalColors.purple.primary }} />
                <h4 className="text-base font-semibold" style={{ color: globalColors.text.primary }}>
                  Order Acceptance
                </h4>
              </div>

              <div className="space-y-4">
                {/* Master toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                      Auto-accept orders
                    </label>
                    <p className="text-xs" style={{ color: globalColors.text.secondary }}>
                      Automatically accept paid orders. When off, staff must manually accept.
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.orderAcceptance?.autoAcceptEnabled ?? true}
                    onCheckedChange={(checked) => {
                      updateAcceptance({ autoAcceptEnabled: checked });
                      // Keep legacy field in sync
                      updateSection('processing', { autoApproveOrders: checked });
                    }}
                  />
                </div>

                {/* Auto-print on accept */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                      Auto-print on accept
                    </label>
                    <p className="text-xs" style={{ color: globalColors.text.secondary }}>
                      Print kitchen ticket when order is accepted
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.processing.autoPrintOnAccept}
                    onCheckedChange={(checked) => updateSection('processing', { autoPrintOnAccept: checked })}
                  />
                </div>

                {/* Per order type settings */}
                <div className="pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <p className="text-xs font-medium mb-3" style={{ color: globalColors.text.secondary }}>
                    Per Order Type Settings
                  </p>

                  {/* Collection */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" style={{ color: globalColors.purple.primary }} />
                      <div>
                        <label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                          Collection: Auto-accept
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs" style={{ color: globalColors.text.secondary }}>
                          Manual if over £
                        </span>
                        <Input
                          type="number"
                          min={0}
                          max={500}
                          value={localSettings.orderAcceptance?.rules?.COLLECTION?.manualThreshold ?? 75}
                          onChange={(e) => updateAcceptanceRules('COLLECTION', { manualThreshold: parseInt(e.target.value) || 75 })}
                          className="w-16 h-7 text-center text-xs"
                          disabled={!localSettings.orderAcceptance?.rules?.COLLECTION?.autoAccept}
                        />
                      </div>
                      <Switch
                        checked={localSettings.orderAcceptance?.rules?.COLLECTION?.autoAccept ?? true}
                        onCheckedChange={(checked) => updateAcceptanceRules('COLLECTION', { autoAccept: checked })}
                      />
                    </div>
                  </div>

                  {/* Delivery */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" style={{ color: globalColors.purple.primary }} />
                      <div>
                        <label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                          Delivery: Auto-accept
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs" style={{ color: globalColors.text.secondary }}>
                          Manual if over £
                        </span>
                        <Input
                          type="number"
                          min={0}
                          max={500}
                          value={localSettings.orderAcceptance?.rules?.DELIVERY?.manualThreshold ?? 75}
                          onChange={(e) => updateAcceptanceRules('DELIVERY', { manualThreshold: parseInt(e.target.value) || 75 })}
                          className="w-16 h-7 text-center text-xs"
                          disabled={!localSettings.orderAcceptance?.rules?.DELIVERY?.autoAccept}
                        />
                      </div>
                      <Switch
                        checked={localSettings.orderAcceptance?.rules?.DELIVERY?.autoAccept ?? true}
                        onCheckedChange={(checked) => updateAcceptanceRules('DELIVERY', { autoAccept: checked })}
                      />
                    </div>
                  </div>
                </div>

                {/* Acceptance Deadlines */}
                <div className="pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <p className="text-xs font-medium mb-3" style={{ color: globalColors.text.secondary }}>
                    Acceptance Deadlines (for manual acceptance)
                  </p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" style={{ color: globalColors.text.muted }} />
                      <span className="text-xs" style={{ color: globalColors.text.secondary }}>Collection:</span>
                      <Input
                        type="number"
                        min={5}
                        max={60}
                        value={localSettings.orderAcceptance?.deadlines?.COLLECTION ?? 15}
                        onChange={(e) => updateAcceptanceDeadlines({ COLLECTION: parseInt(e.target.value) || 15 })}
                        className="w-16 h-7 text-center text-xs"
                      />
                      <span className="text-xs" style={{ color: globalColors.text.secondary }}>mins</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" style={{ color: globalColors.text.muted }} />
                      <span className="text-xs" style={{ color: globalColors.text.secondary }}>Delivery:</span>
                      <Input
                        type="number"
                        min={5}
                        max={60}
                        value={localSettings.orderAcceptance?.deadlines?.DELIVERY ?? 20}
                        onChange={(e) => updateAcceptanceDeadlines({ DELIVERY: parseInt(e.target.value) || 20 })}
                        className="w-16 h-7 text-center text-xs"
                      />
                      <span className="text-xs" style={{ color: globalColors.text.secondary }}>mins</span>
                    </div>
                  </div>
                </div>

                {/* Advanced Rules Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvancedRules(!showAdvancedRules)}
                  className="flex items-center gap-2 pt-2 text-sm font-medium hover:opacity-80 transition-opacity"
                  style={{ color: globalColors.purple.primary }}
                >
                  {showAdvancedRules ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Advanced Rules
                </button>

                {/* Advanced Rules Section */}
                {showAdvancedRules && (
                  <div className="space-y-4 pt-2 pl-4 border-l-2" style={{ borderColor: globalColors.purple.primary + '40' }}>
                    {/* First-time customers */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" style={{ color: globalColors.text.muted }} />
                        <div>
                          <label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                            Manual for first-time customers
                          </label>
                          <p className="text-xs" style={{ color: globalColors.text.secondary }}>
                            Require manual review for new customers
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={localSettings.orderAcceptance?.advanced?.manualForFirstTimeCustomers ?? false}
                        onCheckedChange={(checked) => updateAcceptanceAdvanced({ manualForFirstTimeCustomers: checked })}
                      />
                    </div>

                    {/* Rush hours */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4" style={{ color: globalColors.text.muted }} />
                        <div>
                          <label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                            Manual during rush hours
                          </label>
                          <p className="text-xs" style={{ color: globalColors.text.secondary }}>
                            Require manual review during busy periods
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={localSettings.orderAcceptance?.advanced?.manualDuringRushHours ?? false}
                        onCheckedChange={(checked) => updateAcceptanceAdvanced({ manualDuringRushHours: checked })}
                      />
                    </div>

                    {/* Rush hours schedule hint */}
                    {localSettings.orderAcceptance?.advanced?.manualDuringRushHours && (
                      <div
                        className="text-xs p-2 rounded"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: globalColors.text.secondary }}
                      >
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        Rush hours: Fri 18:00-22:00, Sat 17:00-23:00
                      </div>
                    )}

                    {/* Staff timeout warning */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                          Warn staff before timeout
                        </label>
                        <p className="text-xs" style={{ color: globalColors.text.secondary }}>
                          Alert staff this many minutes before auto-reject
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={15}
                          value={localSettings.orderAcceptance?.notifications?.warnStaffBeforeTimeout ?? 5}
                          onChange={(e) =>
                            setLocalSettings((prev) => ({
                              ...prev,
                              orderAcceptance: {
                                ...(prev.orderAcceptance || DEFAULT_ORDER_ACCEPTANCE),
                                notifications: {
                                  ...(prev.orderAcceptance?.notifications || DEFAULT_ORDER_ACCEPTANCE.notifications),
                                  warnStaffBeforeTimeout: parseInt(e.target.value) || 5,
                                },
                              },
                            }))
                          }
                          className="w-16 h-7 text-center text-xs"
                        />
                        <span className="text-xs" style={{ color: globalColors.text.secondary }}>mins</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ── Section: Notifications ── */}
            <section
              className="rounded-lg border p-4"
              style={{ borderColor: globalColors.border.light, backgroundColor: globalColors.background.tertiary }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5" style={{ color: globalColors.purple.primary }} />
                <h4 className="text-base font-semibold" style={{ color: globalColors.text.primary }}>
                  Notifications
                </h4>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                      Play sound for new orders
                    </label>
                    <p className="text-xs" style={{ color: globalColors.text.secondary }}>
                      Alert when a new online order arrives
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.notifications.playSound}
                    onCheckedChange={(checked) => updateSection('notifications', { playSound: checked })}
                  />
                </div>

                {localSettings.notifications.playSound && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                          Sound volume
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: globalColors.text.secondary }}>
                            {localSettings.notifications.soundVolume}%
                          </span>
                          <Button size="sm" variant="outline" onClick={testSound} className="h-7 text-xs">
                            <Volume2 className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                        </div>
                      </div>
                      <Slider
                        value={[localSettings.notifications.soundVolume]}
                        onValueChange={([value]) => updateSection('notifications', { soundVolume: value })}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                          Repeat until acknowledged
                        </label>
                        <p className="text-xs" style={{ color: globalColors.text.secondary }}>
                          Keep playing sound until order is viewed
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.notifications.repeatUntilAcknowledged}
                        onCheckedChange={(checked) => updateSection('notifications', { repeatUntilAcknowledged: checked })}
                      />
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>

          {/* Footer */}
          {hasChanges && (
            <div
              className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-3 border-t"
              style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (settings?.onlineOrders) {
                    const rawHours = settings.onlineOrders.orderingHours?.length
                      ? settings.onlineOrders.orderingHours
                      : DEFAULT_ORDERING_HOURS;
                    setLocalSettings({
                      ...DEFAULT_SETTINGS,
                      ...settings.onlineOrders,
                      orderingHours: migrateOrderingHours(rawHours),
                    });
                  } else {
                    setLocalSettings(DEFAULT_SETTINGS);
                  }
                  setHasChanges(false);
                }}
                disabled={isSaving}
              >
                Discard
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                style={{ backgroundColor: globalColors.purple.primary }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OnlineOrderSettingsModal;
