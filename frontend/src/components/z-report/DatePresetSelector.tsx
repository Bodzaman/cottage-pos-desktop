import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePreset, DATE_PRESET_LABELS } from '../../types/zReport';
import { useZReportStore } from '../../utils/zReportStore';
import { format } from 'date-fns';

export function DatePresetSelector() {
  const { dateRange, setDatePreset, setCustomDateRange } = useZReportStore();
  const [showCustomPicker, setShowCustomPicker] = React.useState(false);

  const handlePresetChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
      setDatePreset(value as DatePreset);
    }
  };

  const handleCustomDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      setCustomDateRange(range.from, range.to);
    } else if (range?.from) {
      setCustomDateRange(range.from, range.from);
    }
  };

  const getDisplayValue = () => {
    if (dateRange.preset === 'custom' && dateRange.from) {
      if (dateRange.to && dateRange.from.getTime() !== dateRange.to.getTime()) {
        return `${format(dateRange.from, 'dd MMM')} - ${format(dateRange.to, 'dd MMM yyyy')}`;
      }
      return format(dateRange.from, 'dd MMM yyyy');
    }
    return DATE_PRESET_LABELS[dateRange.preset as DatePreset] || 'Today';
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={dateRange.preset}
        onValueChange={handlePresetChange}
      >
        <SelectTrigger className="w-[180px] bg-[#1A1A1A] border-white/10 text-white">
          <SelectValue placeholder="Select period">
            {getDisplayValue()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-[#1A1A1A] border-white/10">
          {Object.entries(DATE_PRESET_LABELS).map(([key, label]) => (
            <SelectItem
              key={key}
              value={key}
              className="text-white hover:bg-white/10 focus:bg-white/10"
            >
              {label}
            </SelectItem>
          ))}
          <SelectItem
            value="custom"
            className="text-white hover:bg-white/10 focus:bg-white/10"
          >
            Custom Range...
          </SelectItem>
        </SelectContent>
      </Select>

      {(showCustomPicker || dateRange.preset === 'custom') && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="bg-[#1A1A1A] border-white/10 text-white hover:bg-white/10"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {dateRange.from ? format(dateRange.from, 'dd/MM/yy') : 'Pick date'}
              {dateRange.to && dateRange.from?.getTime() !== dateRange.to?.getTime() && (
                <> - {format(dateRange.to, 'dd/MM/yy')}</>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-[#1A1A1A] border-white/10" align="start">
            <CalendarComponent
              mode="range"
              selected={{
                from: dateRange.from || undefined,
                to: dateRange.to || undefined,
              }}
              onSelect={handleCustomDateSelect}
              numberOfMonths={2}
              className="bg-[#1A1A1A] text-white"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
