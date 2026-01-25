import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { colors } from '../../../utils/InternalDesignSystem';
import type { ContactContent, OpeningHoursEntry } from '../../../utils/websiteCmsTypes';

interface ContactEditorProps {
  content: ContactContent | null;
  onUpdate: (content: ContactContent) => void;
}

export function ContactEditor({ content, onUpdate }: ContactEditorProps) {
  const address = content?.address || '';
  const phones = content?.phones || [];
  const emails = content?.emails || [];
  const opening_hours = content?.opening_hours || [];

  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...phones];
    newPhones[index] = value;
    onUpdate({ ...content!, phones: newPhones });
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    onUpdate({ ...content!, emails: newEmails });
  };

  const handleHoursChange = (index: number, field: keyof OpeningHoursEntry, value: string) => {
    const newHours = [...opening_hours];
    newHours[index] = { ...newHours[index], [field]: value };
    onUpdate({ ...content!, opening_hours: newHours });
  };

  const addHoursEntry = () => {
    onUpdate({
      ...content!,
      opening_hours: [...opening_hours, { day: '', hours: '', lunch: '', dinner: '' }],
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-white/60">Address</Label>
        <Input
          value={address}
          onChange={(e) => onUpdate({ ...content!, address: e.target.value })}
          className="text-white text-sm" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-white/60">Phone Numbers</Label>
        {phones.map((phone, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={phone}
              onChange={(e) => handlePhoneChange(i, e.target.value)}
              className="text-white text-sm flex-1" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
            />
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 text-white/30 hover:text-red-400"
              onClick={() => {
                const n = [...phones];
                n.splice(i, 1);
                onUpdate({ ...content!, phones: n });
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="ghost" size="sm" className="h-6 text-xs" style={{ color: colors.purple.light }}
          onClick={() => onUpdate({ ...content!, phones: [...phones, ''] })}>
          <Plus className="h-3 w-3 mr-1" /> Add Phone
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-white/60">Email Addresses</Label>
        {emails.map((email, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={email}
              onChange={(e) => handleEmailChange(i, e.target.value)}
              className="text-white text-sm flex-1" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
            />
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 text-white/30 hover:text-red-400"
              onClick={() => {
                const n = [...emails];
                n.splice(i, 1);
                onUpdate({ ...content!, emails: n });
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="ghost" size="sm" className="h-6 text-xs" style={{ color: colors.purple.light }}
          onClick={() => onUpdate({ ...content!, emails: [...emails, ''] })}>
          <Plus className="h-3 w-3 mr-1" /> Add Email
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-white/60">Opening Hours</Label>
          <Button variant="ghost" size="sm" className="h-6 text-xs" style={{ color: colors.purple.light }} onClick={addHoursEntry}>
            <Plus className="h-3 w-3 mr-1" /> Add Entry
          </Button>
        </div>
        {opening_hours.map((entry, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 p-2 rounded" style={{ backgroundColor: colors.background.tertiary, border: `1px solid ${colors.border.medium}` }}>
            <Input
              value={entry.day}
              onChange={(e) => handleHoursChange(i, 'day', e.target.value)}
              placeholder="Day(s)"
              className="text-white text-xs" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
            />
            <Input
              value={entry.lunch}
              onChange={(e) => handleHoursChange(i, 'lunch', e.target.value)}
              placeholder="Lunch hours"
              className="text-white text-xs" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
            />
            <Input
              value={entry.dinner}
              onChange={(e) => handleHoursChange(i, 'dinner', e.target.value)}
              placeholder="Dinner hours"
              className="text-white text-xs" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
