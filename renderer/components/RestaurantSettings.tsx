


import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AdminInput } from "components/AdminInput";
import { useRestaurantSettings, OpeningHours, DeliverySettings, KitchenStatus } from "utils/useRestaurantSettings";
import { PriceNumberInput } from "components/PriceNumberInput";
import { NumberInput } from "components/NumberInput";

// Constants for delivery calculations
const DEFAULT_DELIVERY_RADIUS_MILES = 6.0;  // Default is 6 miles as per requirements
const DEFAULT_DELIVERY_RADIUS_KM = 9.65;     // 6 miles converted to km (6 * 1.60934)
const MIN_DELIVERY_RADIUS_MILES = 0.6;      // Minimum allowed radius in miles
const MAX_DELIVERY_RADIUS_MILES = 12.4;     // Maximum allowed radius in miles
const MIN_DELIVERY_RADIUS_KM = 1.0;         // Minimum allowed radius in km
const MAX_DELIVERY_RADIUS_KM = 20.0;        // Maximum allowed radius in km

// Function to convert km to miles
const kmToMiles = (km: number): number => {
  return km / 1.60934;
};

// Function to convert miles to km
const milesToKm = (miles: number): number => {
  return miles * 1.60934;
};

interface Props {}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const RestaurantSettings: React.FC<Props> = () => {
  // Use the centralized restaurant settings hook
  const { 
    settings, 
    isLoading, 
    saveSettings,
    getOpeningHours,
    getDeliverySettings,
    getKitchenStatus
  } = useRestaurantSettings();
  
  // Local state for editing
  const [isSaving, setIsSaving] = useState(false);
  const [editableSettings, setEditableSettings] = useState(settings || {});
  const [postcodesInput, setPostcodesInput] = useState(
    settings?.delivery?.postcodes?.join(", ") || ""
  );
  
  // Update local state when settings from the hook change
  React.useEffect(() => {
    if (settings) {
      setEditableSettings(settings);
      setPostcodesInput(settings.delivery?.postcodes?.join(", ") || "");
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      
      // Process postcodes from comma-separated string to array
      const processedSettings = {
        ...editableSettings,
        delivery: {
          ...editableSettings.delivery,
          postcodes: postcodesInput.split(",").map(code => code.trim()).filter(code => code !== ""),
        }
      };

      // Use centralized saveSettings function
      await saveSettings(processedSettings);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateOpeningHours = (index: number, field: keyof OpeningHours, value: any) => {
    const updatedHours = [...(editableSettings.opening_hours || getOpeningHours())];
    updatedHours[index] = {
      ...updatedHours[index],
      [field]: value
    };
    
    setEditableSettings({
      ...editableSettings,
      opening_hours: updatedHours
    });
  };

  const updateDeliverySettings = (field: keyof DeliverySettings, value: any) => {
    setEditableSettings({
      ...editableSettings,
      delivery: {
        ...(editableSettings.delivery || getDeliverySettings()),
        [field]: value
      }
    });
  };

  const updateKitchenStatus = (field: keyof KitchenStatus, value: any) => {
    setEditableSettings({
      ...editableSettings,
      kitchen_status: {
        ...(editableSettings.kitchen_status || getKitchenStatus()),
        [field]: value
      }
    });
  };



  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="hours" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hours">Opening Hours</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="kitchen">Kitchen Status</TabsTrigger>
        </TabsList>
        
        {/* Opening Hours Tab */}
        <TabsContent value="hours" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Hours</CardTitle>
              <CardDescription>
                Set your restaurant's opening and closing hours for each day of the week.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full" defaultValue={["monday"]}>
                {(editableSettings.opening_hours || getOpeningHours())?.map((dayHours, index) => (
                  <AccordionItem key={dayHours.day} value={dayHours.day.toLowerCase()}>
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <span className="mr-2">{dayHours.day}</span>
                        {dayHours.is_closed ? (
                          <span className="text-sm text-red-500 font-medium">Closed</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {dayHours.open} - {dayHours.close}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 py-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`closed-${dayHours.day}`} className="flex items-center gap-2">
                            Closed
                          </Label>
                          <Switch
                            id={`closed-${dayHours.day}`}
                            checked={dayHours.is_closed}
                            onCheckedChange={(checked) => updateOpeningHours(index, "is_closed", checked)}
                          />
                        </div>
                        
                        {!dayHours.is_closed && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`open-${dayHours.day}`}>Opening Time</Label>
                              <AdminInput
                                id={`open-${dayHours.day}`}
                                type="time"
                                value={dayHours.open}
                                onChange={(e) => updateOpeningHours(index, "open", e.target.value)}
                                variant="purple"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`close-${dayHours.day}`}>Closing Time</Label>
                              <AdminInput
                                id={`close-${dayHours.day}`}
                                type="time"
                                value={dayHours.close}
                                onChange={(e) => updateOpeningHours(index, "close", e.target.value)}
                                variant="purple"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Delivery Settings Tab */}
        <TabsContent value="delivery" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Settings</CardTitle>
              <CardDescription>
                Configure delivery radius, supported postcodes and minimum order amount.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="delivery-radius">Delivery Radius</Label>
                  <div className="flex items-center space-x-2">
                    <NumberInput
                      value={parseFloat(kmToMiles((editableSettings.delivery || getDeliverySettings()).radius_km).toFixed(1))}
                      onChange={(value) => {
                        // Validate range: 0.6-12.4 miles (1-20 km)
                        const validMiles = Math.max(MIN_DELIVERY_RADIUS_MILES, Math.min(MAX_DELIVERY_RADIUS_MILES, value));
                        
                        // Convert to km for storage (6 miles = 9.65 km)
                        const kmValue = milesToKm(validMiles);
                        updateDeliverySettings("radius_km", kmValue);
                      }}
                      min={MIN_DELIVERY_RADIUS_MILES}
                      max={MAX_DELIVERY_RADIUS_MILES}
                      step={0.1}
                      className="flex-1"
                      presets={[0.6, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0]}
                    />
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-muted-foreground">miles</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Delivery is ONLY available within a {kmToMiles((editableSettings.delivery || getDeliverySettings()).radius_km).toFixed(1)} mile radius from the restaurant.
                    <br />Orders outside this radius will be automatically blocked.
                    <br />Configuration range: {MIN_DELIVERY_RADIUS_MILES.toFixed(1)}-{MAX_DELIVERY_RADIUS_MILES.toFixed(1)} miles (default: {DEFAULT_DELIVERY_RADIUS_MILES.toFixed(1)} miles)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="delivery-postcodes">Delivery Postcodes</Label>
                  <Textarea
                    id="delivery-postcodes"
                    placeholder="E.g. B1 1AA, B2 2BB (comma separated)"
                    value={postcodesInput}
                    onChange={(e) => setPostcodesInput(e.target.value)}
                    className="min-h-24"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter postcodes separated by commas
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-order">Minimum Order Amount</Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">£</span>
                      <PriceNumberInput
                        value={(editableSettings.delivery || getDeliverySettings()).min_order}
                        onChange={(value) => updateDeliverySettings("min_order", value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="delivery-fee">Delivery Fee</Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">£</span>
                      <PriceNumberInput
                        value={(editableSettings.delivery || getDeliverySettings()).delivery_fee}
                        onChange={(value) => updateDeliverySettings("delivery_fee", value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Kitchen Status Tab */}
        <TabsContent value="kitchen" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Kitchen Status</CardTitle>
              <CardDescription>
                Toggle kitchen open/closed status and set custom message for customers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="kitchen-status">Kitchen Status</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Toggle kitchen open/closed status
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label
                      htmlFor="kitchen-status"
                      className={`text-sm font-medium ${(editableSettings.kitchen_status || getKitchenStatus()).is_open ? "text-green-500" : "text-red-500"}`}
                    >
                      {(editableSettings.kitchen_status || getKitchenStatus()).is_open ? "Open" : "Closed"}
                    </Label>
                    <Switch
                      id="kitchen-status"
                      checked={(editableSettings.kitchen_status || getKitchenStatus()).is_open}
                      onCheckedChange={(checked) => updateKitchenStatus("is_open", checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="kitchen-message">Status Message</Label>
                  <Textarea
                    id="kitchen-message"
                    placeholder="E.g. Kitchen is closed for maintenance"
                    value={(editableSettings.kitchen_status || getKitchenStatus()).message}
                    onChange={(e) => updateKitchenStatus("message", e.target.value)}
                    className="min-h-24"
                  />
                  <p className="text-sm text-muted-foreground">
                    This message will be displayed to customers when the kitchen is closed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        

      </Tabs>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="min-w-28"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
};
