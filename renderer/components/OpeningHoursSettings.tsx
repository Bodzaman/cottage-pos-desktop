
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { DayOfWeek, OpeningHours, DaySchedule } from "../utils/useRestaurantSettings";

interface OpeningHoursSettingsProps {
  openingHours?: OpeningHours;
  onSave: (openingHours: OpeningHours) => Promise<boolean> | boolean;
}

const DEFAULT_DAY_SCHEDULE: DaySchedule = {
  isOpen: true,
  shifts: [
    { open: "11:30", close: "14:30" },
    { open: "17:00", close: "22:30" }
  ]
};

const DEFAULT_OPENING_HOURS: OpeningHours = {
  monday: { ...DEFAULT_DAY_SCHEDULE },
  tuesday: { ...DEFAULT_DAY_SCHEDULE },
  wednesday: { ...DEFAULT_DAY_SCHEDULE },
  thursday: { ...DEFAULT_DAY_SCHEDULE },
  friday: { ...DEFAULT_DAY_SCHEDULE },
  saturday: { ...DEFAULT_DAY_SCHEDULE },
  sunday: { ...DEFAULT_DAY_SCHEDULE },
};

// Helper to get day label
const getDayLabel = (day: DayOfWeek): string => {
  const labels: Record<DayOfWeek, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday"
  };
  return labels[day];
};

const OpeningHoursSettings = ({ openingHours, onSave }: OpeningHoursSettingsProps) => {
  const [hours, setHours] = useState<OpeningHours>(openingHours || DEFAULT_OPENING_HOURS);
  const [isSaving, setIsSaving] = useState(false);

  // Update a specific day's schedule
  const updateDaySchedule = (day: DayOfWeek, schedule: DaySchedule) => {
    setHours(prev => ({
      ...prev,
      [day]: schedule
    }));
  };

  // Toggle if a day is open
  const toggleDayOpen = (day: DayOfWeek, isOpen: boolean) => {
    updateDaySchedule(day, {
      ...hours[day],
      isOpen
    });
  };

  // Add a new shift to a day
  const addShift = (day: DayOfWeek) => {
    const newShift = { open: "12:00", close: "15:00" };
    updateDaySchedule(day, {
      ...hours[day],
      shifts: [...hours[day].shifts, newShift]
    });
  };

  // Remove a shift from a day
  const removeShift = (day: DayOfWeek, index: number) => {
    updateDaySchedule(day, {
      ...hours[day],
      shifts: hours[day].shifts.filter((_, i) => i !== index)
    });
  };

  // Update a shift's time
  const updateShiftTime = (day: DayOfWeek, index: number, field: 'open' | 'close', time: string) => {
    const newShifts = [...hours[day].shifts];
    newShifts[index] = {
      ...newShifts[index],
      [field]: time
    };
    
    updateDaySchedule(day, {
      ...hours[day],
      shifts: newShifts
    });
  };

  // Save the opening hours
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await onSave(hours);
      if (result) {
        toast.success("Opening hours updated successfully");
      } else {
        toast.error("Failed to update opening hours");
      }
    } catch (error) {
      console.error("Error saving opening hours:", error);
      toast.error("An error occurred while saving opening hours");
    } finally {
      setIsSaving(false);
    }
  };

  // Copy hours from one day to another
  const copyHours = (fromDay: DayOfWeek, toDay: DayOfWeek) => {
    updateDaySchedule(toDay, JSON.parse(JSON.stringify(hours[fromDay])));
    toast.success(`Copied hours from ${getDayLabel(fromDay)} to ${getDayLabel(toDay)}`);
  };

  // Copy hours to all days
  const copyToAllDays = (fromDay: DayOfWeek) => {
    const daySchedule = hours[fromDay];
    const newHours = { ...hours };
    
    (Object.keys(newHours) as DayOfWeek[]).forEach(day => {
      if (day !== fromDay) {
        newHours[day] = JSON.parse(JSON.stringify(daySchedule));
      }
    });
    
    setHours(newHours);
    toast.success(`Applied ${getDayLabel(fromDay)}'s hours to all days`);
  };

  return (
    <div className="space-y-6">
      {(Object.keys(hours) as DayOfWeek[]).map((day) => (
        <div key={day} className="space-y-4 p-4 rounded-lg border border-gray-800/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold">{getDayLabel(day)}</h3>
              <div className="flex items-center space-x-2">
                <Switch 
                  id={`${day}-open`}
                  checked={hours[day].isOpen}
                  onCheckedChange={(checked) => toggleDayOpen(day, checked)}
                />
                <Label htmlFor={`${day}-open`}>
                  {hours[day].isOpen ? "Open" : "Closed"}
                </Label>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Select 
                onValueChange={(value) => copyHours(value as DayOfWeek, day)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Copy from..." />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(hours) as DayOfWeek[])
                    .filter(d => d !== day)
                    .map(d => (
                      <SelectItem key={d} value={d}>{getDayLabel(d)}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToAllDays(day)}
              >
                Apply to All
              </Button>
            </div>
          </div>
          
          {hours[day].isOpen && (
            <div className="space-y-3">
              {hours[day].shifts.map((shift, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Label>Open:</Label>
                    <Input
                      type="time"
                      value={shift.open}
                      onChange={(e) => updateShiftTime(day, index, 'open', e.target.value)}
                      className="w-32"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label>Close:</Label>
                    <Input
                      type="time"
                      value={shift.close}
                      onChange={(e) => updateShiftTime(day, index, 'close', e.target.value)}
                      className="w-32"
                    />
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeShift(day, index)}
                    disabled={hours[day].shifts.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => addShift(day)}
                className="mt-2"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Shift
              </Button>
            </div>
          )}
        </div>
      ))}
      
      <div className="flex justify-end pt-6">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isSaving ? "Saving..." : "Save Opening Hours"}
        </Button>
      </div>
    </div>
  );
};

export default OpeningHoursSettings;
