import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PremiumTheme } from 'utils/premiumTheme';
import { apiClient } from 'app';
import { toast } from 'sonner';

interface TimeSlot {
  time: string;
  label: string;
  available: boolean;
  period: 'lunch' | 'dinner';
}

interface TimeSlotSelectorProps {
  orderType: 'DELIVERY' | 'COLLECTION';
  selectedTime?: string;
  selectedDate?: string;
  onTimeSelect: (time: string, date?: string) => void;
  className?: string;
}

export function TimeSlotSelector({
  orderType,
  selectedTime,
  selectedDate,
  onTimeSelect,
  className = ''
}: TimeSlotSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlotType, setSelectedSlotType] = useState<'ASAP' | 'FUTURE'>('ASAP');
  const [futureDate, setFutureDate] = useState<string>('');
  const [restaurantHours, setRestaurantHours] = useState<any>(null);

  // Generate time slots based on restaurant hours
  const generateTimeSlots = (openTime: string, closeTime: string, date: string): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const currentTime = new Date();
    const selectedDateTime = new Date(date);
    const isToday = selectedDateTime.toDateString() === currentTime.toDateString();
    
    // Parse opening hours
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
    
    // Generate 30-minute slots
    for (let hour = openHour; hour <= closeHour; hour++) {
      for (let min = 0; min < 60; min += 30) {
        if (hour === closeHour && min >= closeMin) break;
        
        const slotTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const slotDateTime = new Date(selectedDateTime);
        slotDateTime.setHours(hour, min, 0, 0);
        
        // Check if slot is in the future (minimum 1 hour from now)
        const isAvailable = !isToday || slotDateTime.getTime() > currentTime.getTime() + (60 * 60 * 1000);
        
        // Determine period
        const period = hour < 17 ? 'lunch' : 'dinner';
        
        slots.push({
          time: slotTime,
          label: slotTime,
          available: isAvailable,
          period
        });
      }
    }
    
    return slots;
  };

  // Load restaurant hours and validate opening status
  useEffect(() => {
    const loadRestaurantHours = async () => {
      try {
        setIsLoading(true);
        
        // Get restaurant settings
        const settingsResponse = await apiClient.get_restaurant_settings();
        if (settingsResponse.success && settingsResponse.settings) {
          setRestaurantHours(settingsResponse.settings);
          
          // Validate current opening hours
          const validationResponse = await apiClient.validate_opening_hours({
            delivery_date: futureDate || undefined,
            delivery_time: undefined
          });
          
          if (!validationResponse.valid && selectedSlotType === 'ASAP') {
            toast.error(validationResponse.message || 'Restaurant is currently closed');
          }
          
          // Generate slots for today or selected date
          const targetDate = futureDate || new Date().toISOString().split('T')[0];
          const dayName = new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long' });
          
          const dayHours = settingsResponse.settings.opening_hours?.find(
            (hours: any) => hours.day.toLowerCase() === dayName.toLowerCase()
          );
          
          if (dayHours && !dayHours.closed) {
            const slots = generateTimeSlots(dayHours.open, dayHours.close, targetDate);
            setAvailableSlots(slots);
          }
        }
      } catch (error) {
        console.error('Error loading restaurant hours:', error);
        toast.error('Unable to load available time slots');
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurantHours();
  }, [futureDate, selectedSlotType]);

  const handleASAPSelect = () => {
    setSelectedSlotType('ASAP');
    onTimeSelect('ASAP');
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    if (!slot.available) return;
    
    setSelectedSlotType('FUTURE');
    onTimeSelect(slot.time, futureDate || new Date().toISOString().split('T')[0]);
  };

  const handleDateChange = (date: string) => {
    setFutureDate(date);
    // Reset time selection when date changes
    if (selectedSlotType === 'FUTURE') {
      onTimeSelect('', date);
    }
  };

  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0];
  
  // Get maximum date (2 weeks from now)
  const maxDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  if (isLoading) {
    return (
      <Card className={`${className}`} style={{ backgroundColor: PremiumTheme.colors.dark[800] }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-[#8B1538] border-t-transparent rounded-full" />
            <span className="ml-3 text-sm" style={{ color: PremiumTheme.colors.text.muted }}>
              Loading available times...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`} style={{ backgroundColor: PremiumTheme.colors.dark[800] }}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5" style={{ color: PremiumTheme.colors.silver[500] }} />
            <h3 className="text-lg font-semibold" style={{ color: PremiumTheme.colors.text.primary }}>
              Select {orderType === 'DELIVERY' ? 'Delivery' : 'Collection'} Time
            </h3>
          </div>

          {/* ASAP Option */}
          <div>
            <Button
              variant={selectedSlotType === 'ASAP' && selectedTime === 'ASAP' ? 'default' : 'outline'}
              onClick={handleASAPSelect}
              className="w-full justify-start h-12"
              style={{
                backgroundColor: selectedSlotType === 'ASAP' && selectedTime === 'ASAP' 
                  ? PremiumTheme.colors.burgundy[500] 
                  : 'transparent',
                borderColor: PremiumTheme.colors.border.medium,
                color: selectedSlotType === 'ASAP' && selectedTime === 'ASAP'
                  ? 'white'
                  : PremiumTheme.colors.text.primary
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <div>
                  <div className="font-medium">ASAP</div>
                  <div className="text-xs opacity-70">
                    Ready in 25-35 minutes
                  </div>
                </div>
              </div>
            </Button>
          </div>

          {/* Future Order Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" style={{ color: PremiumTheme.colors.text.muted }} />
              <span className="text-sm font-medium" style={{ color: PremiumTheme.colors.text.primary }}>
                Schedule for Later
              </span>
            </div>

            {/* Date Selector */}
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={futureDate || minDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full p-3 rounded-lg border text-sm"
              style={{
                backgroundColor: PremiumTheme.colors.dark[700],
                borderColor: PremiumTheme.colors.border.medium,
                color: PremiumTheme.colors.text.primary
              }}
            />

            {/* Time Slots Grid */}
            {availableSlots.length > 0 && (
              <div className="space-y-3">
                {/* Lunch Slots */}
                {availableSlots.some(slot => slot.period === 'lunch') && (
                  <div>
                    <div className="text-xs font-medium mb-2" style={{ color: PremiumTheme.colors.text.muted }}>
                      LUNCH (12:30 - 14:00)
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots
                        .filter(slot => slot.period === 'lunch')
                        .map((slot) => (
                          <Button
                            key={slot.time}
                            variant="outline"
                            size="sm"
                            disabled={!slot.available}
                            onClick={() => handleSlotSelect(slot)}
                            className={`h-10 text-xs ${
                              selectedTime === slot.time && selectedSlotType === 'FUTURE'
                                ? ''
                                : ''
                            }`}
                            style={{
                              borderColor: selectedTime === slot.time && selectedSlotType === 'FUTURE'
                                ? PremiumTheme.colors.burgundy[400]
                                : PremiumTheme.colors.border.medium,
                              backgroundColor: selectedTime === slot.time && selectedSlotType === 'FUTURE'
                                ? PremiumTheme.colors.burgundy[900] + '20'
                                : 'transparent',
                              color: slot.available 
                                ? PremiumTheme.colors.text.primary 
                                : PremiumTheme.colors.text.muted,
                              opacity: slot.available ? 1 : 0.5
                            }}
                          >
                            {slot.label}
                          </Button>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* Dinner Slots */}
                {availableSlots.some(slot => slot.period === 'dinner') && (
                  <div>
                    <div className="text-xs font-medium mb-2" style={{ color: PremiumTheme.colors.text.muted }}>
                      DINNER (17:00 - 23:00)
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots
                        .filter(slot => slot.period === 'dinner')
                        .map((slot) => (
                          <Button
                            key={slot.time}
                            variant="outline"
                            size="sm"
                            disabled={!slot.available}
                            onClick={() => handleSlotSelect(slot)}
                            className={`h-10 text-xs ${
                              selectedTime === slot.time && selectedSlotType === 'FUTURE'
                                ? ''
                                : ''
                            }`}
                            style={{
                              borderColor: selectedTime === slot.time && selectedSlotType === 'FUTURE'
                                ? PremiumTheme.colors.burgundy[400]
                                : PremiumTheme.colors.border.medium,
                              backgroundColor: selectedTime === slot.time && selectedSlotType === 'FUTURE'
                                ? PremiumTheme.colors.burgundy[900] + '20'
                                : 'transparent',
                              color: slot.available 
                                ? PremiumTheme.colors.text.primary 
                                : PremiumTheme.colors.text.muted,
                              opacity: slot.available ? 1 : 0.5
                            }}
                          >
                            {slot.label}
                          </Button>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No slots available message */}
            {availableSlots.length === 0 && futureDate && (
              <div className="flex items-center space-x-2 p-3 rounded-lg" 
                   style={{ backgroundColor: PremiumTheme.colors.dark[700] }}>
                <AlertCircle className="w-4 h-4" style={{ color: PremiumTheme.colors.text.muted }} />
                <span className="text-sm" style={{ color: PremiumTheme.colors.text.muted }}>
                  No available time slots for this date
                </span>
              </div>
            )}
          </div>

          {/* Selected Time Display */}
          {selectedTime && (
            <div className="mt-4 p-3 rounded-lg border" 
                 style={{ 
                   backgroundColor: PremiumTheme.colors.burgundy[900] + '20',
                   borderColor: PremiumTheme.colors.burgundy[400]
                 }}>
              <div className="text-sm font-medium" style={{ color: PremiumTheme.colors.text.secondary }}>
                Selected Time:
              </div>
              <div className="text-sm" style={{ color: PremiumTheme.colors.text.primary }}>
                {selectedTime === 'ASAP' 
                  ? 'ASAP (25-35 minutes)'
                  : `${selectedTime} on ${new Date(futureDate || new Date()).toLocaleDateString('en-GB')}`
                }
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
