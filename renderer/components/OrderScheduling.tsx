


import React, { useState, useEffect } from 'react';
import { Clock, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { QSAITheme, styles } from '../utils/QSAIDesign';

export interface OrderSchedulingProps {
  orderType: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  onSchedulingChange: (data: SchedulingData) => void;
  className?: string;
}

export interface SchedulingData {
  // Collection orders
  pickup_time?: string;
  pickup_date?: string;
  
  // Delivery orders
  delivery_time?: string;
  delivery_date?: string;
}

// Generate time options in 15-minute intervals
const generateTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 11; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(timeString);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Get current time in HH:MM format
const getCurrentTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

// Get minimum date (today)
const getMinDate = () => getTodayDate();

// Check if selected date is future date
const isFutureDate = (dateString?: string) => {
  if (!dateString) return false;
  return dateString > getTodayDate();
};

export function OrderScheduling({ orderType, onSchedulingChange, className = "" }: OrderSchedulingProps) {
  const [schedulingData, setSchedulingData] = useState<SchedulingData>({
    // Set defaults
    pickup_date: getTodayDate(),
    pickup_time: getCurrentTime(),
    delivery_date: getTodayDate(),
    delivery_time: getCurrentTime()
  });
  
  // Update parent when data changes
  useEffect(() => {
    onSchedulingChange(schedulingData);
  }, [schedulingData, onSchedulingChange]);

  // Helper function to format date for display
  const formatDateForDisplay = (dateString: string | undefined) => {
    if (!dateString) return "Select date";
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch {
      return "Select date";
    }
  };

  // Helper function to convert date to string format
  const formatDateToString = (date: Date | undefined) => {
    if (!date) return undefined;
    return format(date, 'yyyy-MM-dd');
  };

  // Helper function to parse date string to Date object
  const parseDateString = (dateString: string | undefined) => {
    if (!dateString) return undefined;
    try {
      return new Date(dateString);
    } catch {
      return undefined;
    }
  };

  // Handle Collection time change
  const handlePickupTimeChange = (time: string) => {
    setSchedulingData({
      ...schedulingData,
      pickup_time: time
    });
  };

  // Handle Collection date change
  const handlePickupDateChange = (date: string) => {
    setSchedulingData({
      ...schedulingData,
      pickup_date: date
    });
  };

  // Handle Delivery time change
  const handleDeliveryTimeChange = (time: string) => {
    setSchedulingData({
      ...schedulingData,
      delivery_time: time
    });
  };

  // Handle Delivery date change
  const handleDeliveryDateChange = (date: string) => {
    setSchedulingData({
      ...schedulingData,
      delivery_date: date
    });
  };

  // Clear scheduling data
  const clearScheduling = () => {
    setSchedulingData({});
  };

  // Don't render for DINE-IN or WAITING orders
  if (orderType === "DINE-IN" || orderType === "WAITING") {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Collection Order Scheduling */}
      {orderType === "COLLECTION" && (
        <div className="space-y-3">
          {/* Date picker first */}
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-11 text-base font-medium justify-start text-left transition-all duration-200"
                  style={{ 
                    ...styles.input,
                    fontSize: '0.95rem',
                    fontWeight: 500
                  }}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateForDisplay(schedulingData.pickup_date)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={schedulingData.pickup_date ? new Date(schedulingData.pickup_date) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const dateString = date.toISOString().split('T')[0];
                      handlePickupDateChange(dateString);
                    }
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Time picker second */}
          <div className="space-y-2">
            <Select
              value={schedulingData.pickup_time || ""}
              onValueChange={(value) => handlePickupTimeChange(value)}
            >
              <SelectTrigger 
                className="h-11 text-base font-medium transition-all duration-200"
                style={{ 
                  ...styles.input,
                  fontSize: '0.95rem',
                  fontWeight: 500
                }}
              >
                <SelectValue placeholder="Collection Time" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {timeOptions.map(time => (
                  <SelectItem key={time} value={time} className="text-base py-2">
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      {/* Delivery Order Scheduling */}
      {orderType === "DELIVERY" && (
        <div className="space-y-3">
          {/* Date picker first */}
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-11 text-base font-medium justify-start text-left transition-all duration-200"
                  style={{ 
                    ...styles.input,
                    fontSize: '0.95rem',
                    fontWeight: 500
                  }}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateForDisplay(schedulingData.delivery_date)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={schedulingData.delivery_date ? new Date(schedulingData.delivery_date) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const dateString = date.toISOString().split('T')[0];
                      handleDeliveryDateChange(dateString);
                    }
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Time picker second */}
          <div className="space-y-2">
            <Select
              value={schedulingData.delivery_time || ""}
              onValueChange={(value) => handleDeliveryTimeChange(value)}
            >
              <SelectTrigger 
                className="h-11 text-base font-medium transition-all duration-200"
                style={{ 
                  ...styles.input,
                  fontSize: '0.95rem',
                  fontWeight: 500
                }}
              >
                <SelectValue placeholder="Delivery Time" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {timeOptions.map(time => (
                  <SelectItem key={time} value={time} className="text-base py-2">
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
