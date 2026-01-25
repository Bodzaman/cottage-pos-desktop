import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { colors } from '../../utils/InternalDesignSystem';
import type { CMSPage } from '../../utils/websiteCmsTypes';

const PAGE_OPTIONS: { value: CMSPage; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'about', label: 'About' },
  { value: 'contact', label: 'Contact' },
  { value: 'gallery', label: 'Gallery' },
];

interface CMSPageSelectorProps {
  value: CMSPage;
  onChange: (page: CMSPage) => void;
  label?: string;
}

export function CMSPageSelector({ value, onChange, label = 'Select Page:' }: CMSPageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/50 whitespace-nowrap">{label}</span>
      <Select value={value} onValueChange={(v) => onChange(v as CMSPage)}>
        <SelectTrigger className="w-[140px] h-8 text-white text-sm"
          style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.medium }}>
          {PAGE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-white/80 hover:text-white">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
