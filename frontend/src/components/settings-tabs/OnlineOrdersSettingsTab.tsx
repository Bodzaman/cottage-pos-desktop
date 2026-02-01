import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Settings, Clock, Calendar, Volume2, Pencil, Check, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { globalColors } from '../../utils/QSAIDesign';
import { useRestaurantSettings } from '../../utils/useRestaurantSettings';
import { toast } from 'sonner';

// Types for Online Orders Settings
interface PrepTimeSchedule {
  id: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  orderType: 'COLLECTION' | 'DELIVERY';
  minMinutes: number;
  maxMinutes: number;
  isActive: boolean;
}

interface OnlineOrdersSettings {
  notifications: {
    playSound: boolean;
    soundVolume: number;
    repeatUntilAcknowledged: boolean;
  };
  processing: {
    autoApproveOrders: boolean;
    autoPrintOnAccept: boolean;
  };
  prepTimeSchedule: PrepTimeSchedule[];
  availability: {
    acceptOnlineOrders: boolean;
    acceptDeliveryOrders: boolean;
    acceptCollectionOrders: boolean;
    orderCutoffMinutes: number;
  };
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<typeof DAYS[number], string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

// Generate default prep time schedule (14 entries: 7 days × 2 order types)
const generateDefaultPrepTimeSchedule = (): PrepTimeSchedule[] => {
  const schedule: PrepTimeSchedule[] = [];
  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday'] as const;
  const friday = 'friday' as const;
  const weekend = ['saturday', 'sunday'] as const;

  // Weekdays (Mon-Thu)
  weekdays.forEach(day => {
    schedule.push({
      id: `${day}_collection`,
      day,
      orderType: 'COLLECTION',
      minMinutes: 20,
      maxMinutes: 30,
      isActive: true,
    });
    schedule.push({
      id: `${day}_delivery`,
      day,
      orderType: 'DELIVERY',
      minMinutes: 45,
      maxMinutes: 60,
      isActive: true,
    });
  });

  // Friday (busier)
  schedule.push({
    id: 'friday_collection',
    day: friday,
    orderType: 'COLLECTION',
    minMinutes: 25,
    maxMinutes: 40,
    isActive: true,
  });
  schedule.push({
    id: 'friday_delivery',
    day: friday,
    orderType: 'DELIVERY',
    minMinutes: 50,
    maxMinutes: 70,
    isActive: true,
  });

  // Weekend (busiest)
  weekend.forEach(day => {
    schedule.push({
      id: `${day}_collection`,
      day,
      orderType: 'COLLECTION',
      minMinutes: 30,
      maxMinutes: 45,
      isActive: true,
    });
    schedule.push({
      id: `${day}_delivery`,
      day,
      orderType: 'DELIVERY',
      minMinutes: 60,
      maxMinutes: 75,
      isActive: true,
    });
  });

  return schedule;
};

const DEFAULT_ONLINE_ORDERS_SETTINGS: OnlineOrdersSettings = {
  notifications: {
    playSound: true,
    soundVolume: 75,
    repeatUntilAcknowledged: false,
  },
  processing: {
    autoApproveOrders: true,
    autoPrintOnAccept: true,
  },
  prepTimeSchedule: generateDefaultPrepTimeSchedule(),
  availability: {
    acceptOnlineOrders: true,
    acceptDeliveryOrders: true,
    acceptCollectionOrders: true,
    orderCutoffMinutes: 30,
  },
};

export function OnlineOrdersSettingsTab() {
  const { settings, saveSettings, isLoading } = useRestaurantSettings();
  const [localSettings, setLocalSettings] = useState<OnlineOrdersSettings>(DEFAULT_ONLINE_ORDERS_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PrepTimeSchedule | null>(null);
  const [editMinMinutes, setEditMinMinutes] = useState(20);
  const [editMaxMinutes, setEditMaxMinutes] = useState(30);
  const [editIsActive, setEditIsActive] = useState(true);

  // Load settings from database
  useEffect(() => {
    if (settings?.onlineOrders) {
      setLocalSettings({
        ...DEFAULT_ONLINE_ORDERS_SETTINGS,
        ...settings.onlineOrders,
        notifications: {
          ...DEFAULT_ONLINE_ORDERS_SETTINGS.notifications,
          ...settings.onlineOrders.notifications,
        },
        processing: {
          ...DEFAULT_ONLINE_ORDERS_SETTINGS.processing,
          ...settings.onlineOrders.processing,
        },
        availability: {
          ...DEFAULT_ONLINE_ORDERS_SETTINGS.availability,
          ...settings.onlineOrders.availability,
        },
        prepTimeSchedule: settings.onlineOrders.prepTimeSchedule?.length
          ? settings.onlineOrders.prepTimeSchedule
          : DEFAULT_ONLINE_ORDERS_SETTINGS.prepTimeSchedule,
      });
    } else if (settings?.general) {
      // Migrate auto-approve from general settings if it exists there
      setLocalSettings(prev => ({
        ...prev,
        processing: {
          ...prev.processing,
          autoApproveOrders: settings.general?.autoApproveOrders ?? true,
        },
      }));
    }
  }, [settings]);

  // Update handler
  const updateLocalSettings = <K extends keyof OnlineOrdersSettings>(
    section: K,
    updates: Partial<OnlineOrdersSettings[K]>
  ) => {
    setLocalSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates,
      },
    }));
    setHasChanges(true);
  };

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedSettings = {
        ...settings,
        onlineOrders: localSettings,
        // Also update general.autoApproveOrders for backward compatibility
        general: {
          ...settings?.general,
          autoApproveOrders: localSettings.processing.autoApproveOrders,
        },
      };

      await saveSettings(updatedSettings);
      setHasChanges(false);
      toast.success('Online orders settings saved');
    } catch (error) {
      console.error('Failed to save online orders settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Edit prep time entry
  const openEditModal = (entry: PrepTimeSchedule) => {
    setEditingEntry(entry);
    setEditMinMinutes(entry.minMinutes);
    setEditMaxMinutes(entry.maxMinutes);
    setEditIsActive(entry.isActive);
    setEditModalOpen(true);
  };

  const saveEditedEntry = () => {
    if (!editingEntry) return;

    const updatedSchedule = localSettings.prepTimeSchedule.map(entry =>
      entry.id === editingEntry.id
        ? {
            ...entry,
            minMinutes: editMinMinutes,
            maxMinutes: editMaxMinutes,
            isActive: editIsActive,
          }
        : entry
    );

    setLocalSettings(prev => ({
      ...prev,
      prepTimeSchedule: updatedSchedule,
    }));
    setHasChanges(true);
    setEditModalOpen(false);
    setEditingEntry(null);
  };

  // Group schedule by day for display
  const scheduleByDay = useMemo(() => {
    const grouped: Record<string, { collection?: PrepTimeSchedule; delivery?: PrepTimeSchedule }> = {};

    DAYS.forEach(day => {
      grouped[day] = {
        collection: localSettings.prepTimeSchedule.find(
          e => e.day === day && e.orderType === 'COLLECTION'
        ),
        delivery: localSettings.prepTimeSchedule.find(
          e => e.day === day && e.orderType === 'DELIVERY'
        ),
      };
    });

    return grouped;
  }, [localSettings.prepTimeSchedule]);

  // Test sound
  const testSound = () => {
    // Use relative path in Electron (file:// protocol), absolute in browser
    const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;
    const soundPath = isElectron
      ? './audio-sounds/online_order_notification_sound_pos.mp3'
      : '/audio-sounds/online_order_notification_sound_pos.mp3';
    const audio = new Audio(soundPath);
    audio.volume = localSettings.notifications.soundVolume / 100;
    audio.play().catch(err => {
      console.warn('Failed to play test sound:', err);
      toast.error('Failed to play sound - check browser permissions');
    });
  };

  return (
    <div className="space-y-6">
      {/* Notifications Section */}
      <section className="rounded-lg border p-4" style={{ borderColor: globalColors.border.light, backgroundColor: globalColors.background.tertiary }}>
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
              onCheckedChange={(checked) => updateLocalSettings('notifications', { playSound: checked })}
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={testSound}
                      className="h-7 text-xs"
                    >
                      <Volume2 className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                  </div>
                </div>
                <Slider
                  value={[localSettings.notifications.soundVolume]}
                  onValueChange={([value]) => updateLocalSettings('notifications', { soundVolume: value })}
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
                  onCheckedChange={(checked) => updateLocalSettings('notifications', { repeatUntilAcknowledged: checked })}
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* Order Processing Section */}
      <section className="rounded-lg border p-4" style={{ borderColor: globalColors.border.light, backgroundColor: globalColors.background.tertiary }}>
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5" style={{ color: globalColors.purple.primary }} />
          <h4 className="text-base font-semibold" style={{ color: globalColors.text.primary }}>
            Order Processing
          </h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                Auto-approve orders
              </label>
              <p className="text-xs" style={{ color: globalColors.text.secondary }}>
                Automatically accept incoming orders
              </p>
            </div>
            <Switch
              checked={localSettings.processing.autoApproveOrders}
              onCheckedChange={(checked) => updateLocalSettings('processing', { autoApproveOrders: checked })}
            />
          </div>

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
              onCheckedChange={(checked) => updateLocalSettings('processing', { autoPrintOnAccept: checked })}
            />
          </div>
        </div>
      </section>

      {/* Prep Time Schedule Section */}
      <section className="rounded-lg border p-4" style={{ borderColor: globalColors.border.light, backgroundColor: globalColors.background.tertiary }}>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5" style={{ color: globalColors.purple.primary }} />
          <h4 className="text-base font-semibold" style={{ color: globalColors.text.primary }}>
            Prep Time Schedule
          </h4>
        </div>

        <p className="text-xs mb-4" style={{ color: globalColors.text.secondary }}>
          Set estimated preparation times shown to customers at checkout and used by AI assistant
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: globalColors.border.light }}>
                <th className="text-left py-2 px-2 font-medium" style={{ color: globalColors.text.secondary }}>Day</th>
                <th className="text-left py-2 px-2 font-medium" style={{ color: globalColors.text.secondary }}>Collection</th>
                <th className="text-left py-2 px-2 font-medium" style={{ color: globalColors.text.secondary }}>Delivery</th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day => {
                const dayData = scheduleByDay[day];
                return (
                  <tr key={day} className="border-b" style={{ borderColor: globalColors.border.light }}>
                    <td className="py-2 px-2 font-medium" style={{ color: globalColors.text.primary }}>
                      {DAY_LABELS[day]}
                    </td>
                    <td className="py-2 px-2">
                      {dayData?.collection ? (
                        <button
                          onClick={() => openEditModal(dayData.collection!)}
                          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 transition-colors"
                          style={{
                            color: dayData.collection.isActive ? globalColors.text.primary : globalColors.text.muted,
                            textDecoration: dayData.collection.isActive ? 'none' : 'line-through',
                          }}
                        >
                          {dayData.collection.minMinutes}-{dayData.collection.maxMinutes} mins
                          <Pencil className="h-3 w-3 opacity-50" />
                        </button>
                      ) : (
                        <span style={{ color: globalColors.text.muted }}>-</span>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      {dayData?.delivery ? (
                        <button
                          onClick={() => openEditModal(dayData.delivery!)}
                          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 transition-colors"
                          style={{
                            color: dayData.delivery.isActive ? globalColors.text.primary : globalColors.text.muted,
                            textDecoration: dayData.delivery.isActive ? 'none' : 'line-through',
                          }}
                        >
                          {dayData.delivery.minMinutes}-{dayData.delivery.maxMinutes} mins
                          <Pencil className="h-3 w-3 opacity-50" />
                        </button>
                      ) : (
                        <span style={{ color: globalColors.text.muted }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Availability Section */}
      <section className="rounded-lg border p-4" style={{ borderColor: globalColors.border.light, backgroundColor: globalColors.background.tertiary }}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5" style={{ color: globalColors.purple.primary }} />
          <h4 className="text-base font-semibold" style={{ color: globalColors.text.primary }}>
            Availability
          </h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                Accept online orders
              </label>
              <p className="text-xs" style={{ color: globalColors.text.secondary }}>
                Master switch for all online ordering
              </p>
            </div>
            <Switch
              checked={localSettings.availability.acceptOnlineOrders}
              onCheckedChange={(checked) => updateLocalSettings('availability', { acceptOnlineOrders: checked })}
            />
          </div>

          {localSettings.availability.acceptOnlineOrders && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                    Accept delivery orders
                  </label>
                </div>
                <Switch
                  checked={localSettings.availability.acceptDeliveryOrders}
                  onCheckedChange={(checked) => updateLocalSettings('availability', { acceptDeliveryOrders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                    Accept collection orders
                  </label>
                </div>
                <Switch
                  checked={localSettings.availability.acceptCollectionOrders}
                  onCheckedChange={(checked) => updateLocalSettings('availability', { acceptCollectionOrders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                    Order cutoff before closing
                  </label>
                  <p className="text-xs" style={{ color: globalColors.text.secondary }}>
                    Stop accepting orders this many minutes before closing
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={120}
                    value={localSettings.availability.orderCutoffMinutes}
                    onChange={(e) => updateLocalSettings('availability', { orderCutoffMinutes: parseInt(e.target.value) || 0 })}
                    className="w-20 h-8 text-center"
                  />
                  <span className="text-sm" style={{ color: globalColors.text.secondary }}>mins</span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: globalColors.border.light }}>
          <Button
            variant="outline"
            onClick={() => {
              if (settings?.onlineOrders) {
                setLocalSettings({
                  ...DEFAULT_ONLINE_ORDERS_SETTINGS,
                  ...settings.onlineOrders,
                });
              } else {
                setLocalSettings(DEFAULT_ONLINE_ORDERS_SETTINGS);
              }
              setHasChanges(false);
            }}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            style={{ backgroundColor: globalColors.purple.primary }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}

      {/* Edit Prep Time Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: globalColors.text.primary }}>
              Edit Prep Time - {editingEntry && `${DAY_LABELS[editingEntry.day]} ${editingEntry.orderType === 'COLLECTION' ? 'Collection' : 'Delivery'}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: globalColors.text.primary }}>
                Estimated Time Range
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: globalColors.text.secondary }}>From</span>
                  <Input
                    type="number"
                    min={5}
                    max={120}
                    value={editMinMinutes}
                    onChange={(e) => setEditMinMinutes(parseInt(e.target.value) || 5)}
                    className="w-20 h-8 text-center"
                  />
                  <span className="text-sm" style={{ color: globalColors.text.secondary }}>mins</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: globalColors.text.secondary }}>To</span>
                  <Input
                    type="number"
                    min={5}
                    max={180}
                    value={editMaxMinutes}
                    onChange={(e) => setEditMaxMinutes(parseInt(e.target.value) || 10)}
                    className="w-20 h-8 text-center"
                  />
                  <span className="text-sm" style={{ color: globalColors.text.secondary }}>mins</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg" style={{ backgroundColor: globalColors.background.secondary }}>
              <p className="text-sm" style={{ color: globalColors.text.secondary }}>
                Preview: <span style={{ color: globalColors.text.primary, fontWeight: 500 }}>
                  "Ready in {editMinMinutes}-{editMaxMinutes} minutes"
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="disableDay"
                checked={!editIsActive}
                onChange={(e) => setEditIsActive(!e.target.checked)}
                className="rounded"
              />
              <label htmlFor="disableDay" className="text-sm" style={{ color: globalColors.text.primary }}>
                Disable for this day
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditedEntry} style={{ backgroundColor: globalColors.purple.primary }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
