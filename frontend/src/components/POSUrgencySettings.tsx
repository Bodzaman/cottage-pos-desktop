/**
 * POSUrgencySettings - Configuration UI for table urgency indicators
 *
 * Allows staff to configure when pulsing urgency indicators appear on table cards:
 * - Stale order threshold (critical red pulse)
 * - In kitchen threshold (high orange pulse)
 * - Seated waiting threshold (medium yellow pulse)
 * - Ordering unsent threshold (medium yellow pulse)
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AlertTriangle, Clock, Users, ChefHat, Save } from 'lucide-react';
import { usePOSSettingsWithAutoFetch, DEFAULT_URGENCY_SETTINGS, UrgencySettings, POSSettings } from '@/utils/posSettingsStore';
import { QSAITheme } from '@/utils/QSAIDesign';

export function POSUrgencySettings() {
  const { settings, updateSettings, isLoading } = usePOSSettingsWithAutoFetch();
  const [urgency, setUrgency] = useState<UrgencySettings>(DEFAULT_URGENCY_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize from settings when loaded
  useEffect(() => {
    if (settings?.urgency_settings) {
      setUrgency(settings.urgency_settings);
    }
  }, [settings]);

  const handleChange = (field: keyof UrgencySettings, value: number | boolean) => {
    setUrgency(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;

    const updatedSettings: POSSettings = {
      ...settings,
      urgency_settings: urgency
    };

    const success = await updateSettings(updatedSettings);
    if (success) {
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    setUrgency(DEFAULT_URGENCY_SETTINGS);
    setHasChanges(true);
  };

  return (
    <Card
      className="border"
      style={{
        background: QSAITheme.background.card,
        borderColor: QSAITheme.border.light,
      }}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" style={{ color: QSAITheme.status.warning }} />
            <CardTitle style={{ color: QSAITheme.text.primary }}>
              Urgency Alert Thresholds
            </CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <Label
              htmlFor="urgency-enabled"
              className="text-sm"
              style={{ color: QSAITheme.text.secondary }}
            >
              Enable Indicators
            </Label>
            <Switch
              id="urgency-enabled"
              checked={urgency.enabled}
              onCheckedChange={(checked) => handleChange('enabled', checked)}
            />
          </div>
        </div>
        <CardDescription style={{ color: QSAITheme.text.muted }}>
          Configure when pulsing urgency indicators appear on table cards in the dashboard
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Critical Urgency - Stale Orders */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="animate-pulse-fast"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderColor: 'rgba(239, 68, 68, 0.5)',
                color: '#EF4444'
              }}
            >
              CRITICAL
            </Badge>
            <span className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
              Stale Order Detection
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label
                htmlFor="stale-hours"
                className="text-sm"
                style={{ color: QSAITheme.text.secondary }}
              >
                Hours before order is marked stale (zombie)
              </Label>
              <Input
                id="stale-hours"
                type="number"
                min={1}
                max={48}
                value={urgency.stale_order_hours}
                onChange={(e) => handleChange('stale_order_hours', parseInt(e.target.value) || 8)}
                disabled={!urgency.enabled}
                className="w-24"
                style={{
                  background: QSAITheme.background.secondary,
                  borderColor: QSAITheme.border.medium,
                  color: QSAITheme.text.primary
                }}
              />
            </div>
            <p className="text-xs flex-shrink-0" style={{ color: QSAITheme.text.muted }}>
              Fast red pulse
            </p>
          </div>
        </div>

        {/* High Urgency - In Kitchen */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="animate-pulse"
              style={{
                backgroundColor: 'rgba(249, 115, 22, 0.2)',
                borderColor: 'rgba(249, 115, 22, 0.5)',
                color: '#F97316'
              }}
            >
              HIGH
            </Badge>
            <ChefHat className="h-4 w-4" style={{ color: QSAITheme.text.muted }} />
            <span className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
              Long Kitchen Wait
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label
                htmlFor="kitchen-minutes"
                className="text-sm"
                style={{ color: QSAITheme.text.secondary }}
              >
                Minutes in kitchen before high urgency
              </Label>
              <Input
                id="kitchen-minutes"
                type="number"
                min={5}
                max={120}
                value={urgency.in_kitchen_high_minutes}
                onChange={(e) => handleChange('in_kitchen_high_minutes', parseInt(e.target.value) || 45)}
                disabled={!urgency.enabled}
                className="w-24"
                style={{
                  background: QSAITheme.background.secondary,
                  borderColor: QSAITheme.border.medium,
                  color: QSAITheme.text.primary
                }}
              />
            </div>
            <p className="text-xs flex-shrink-0" style={{ color: QSAITheme.text.muted }}>
              Orange pulse
            </p>
          </div>
        </div>

        {/* Medium Urgency - Seated Waiting */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="animate-pulse-slow"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                borderColor: 'rgba(245, 158, 11, 0.5)',
                color: '#F59E0B'
              }}
            >
              MEDIUM
            </Badge>
            <Users className="h-4 w-4" style={{ color: QSAITheme.text.muted }} />
            <span className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
              Waiting to Order
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label
                htmlFor="seated-minutes"
                className="text-sm"
                style={{ color: QSAITheme.text.secondary }}
              >
                Minutes seated without adding items
              </Label>
              <Input
                id="seated-minutes"
                type="number"
                min={1}
                max={60}
                value={urgency.seated_medium_minutes}
                onChange={(e) => handleChange('seated_medium_minutes', parseInt(e.target.value) || 10)}
                disabled={!urgency.enabled}
                className="w-24"
                style={{
                  background: QSAITheme.background.secondary,
                  borderColor: QSAITheme.border.medium,
                  color: QSAITheme.text.primary
                }}
              />
            </div>
            <p className="text-xs flex-shrink-0" style={{ color: QSAITheme.text.muted }}>
              Yellow slow pulse
            </p>
          </div>
        </div>

        {/* Medium Urgency - Unsent Items */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="animate-pulse-slow"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                borderColor: 'rgba(245, 158, 11, 0.5)',
                color: '#F59E0B'
              }}
            >
              MEDIUM
            </Badge>
            <Clock className="h-4 w-4" style={{ color: QSAITheme.text.muted }} />
            <span className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
              Items Waiting to Send
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label
                htmlFor="ordering-minutes"
                className="text-sm"
                style={{ color: QSAITheme.text.secondary }}
              >
                Minutes with unsent items before reminder
              </Label>
              <Input
                id="ordering-minutes"
                type="number"
                min={1}
                max={60}
                value={urgency.ordering_medium_minutes}
                onChange={(e) => handleChange('ordering_medium_minutes', parseInt(e.target.value) || 15)}
                disabled={!urgency.enabled}
                className="w-24"
                style={{
                  background: QSAITheme.background.secondary,
                  borderColor: QSAITheme.border.medium,
                  color: QSAITheme.text.primary
                }}
              />
            </div>
            <p className="text-xs flex-shrink-0" style={{ color: QSAITheme.text.muted }}>
              Yellow slow pulse
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: QSAITheme.border.light }}>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
            style={{
              borderColor: QSAITheme.border.medium,
              color: QSAITheme.text.secondary
            }}
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
            className="flex items-center gap-2"
            style={{
              background: hasChanges ? QSAITheme.purple.primary : QSAITheme.background.secondary,
              color: hasChanges ? 'white' : QSAITheme.text.muted,
            }}
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default POSUrgencySettings;
