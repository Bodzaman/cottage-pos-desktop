import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Save, 
  Building, 
  Phone, 
  Mail, 
  Globe, 
  Image, 
  UploadCloud, 
  ImagePlus, 
  Clock, 
  Truck, 
  Settings as SettingsIcon, 
  CreditCard, 
  ShieldCheck, 
  KeyRound, 
  Eye, 
  EyeOff,
  Plus,
  Trash2,
  Edit,
  Users,
  Check,
  X
} from "lucide-react";
import { useRestaurantSettings, BusinessProfile } from "../utils/useRestaurantSettings";
import MediaSelector from "./MediaSelector";
import DeliverySettings from "./DeliverySettings";
import { POSUrgencySettings } from "./POSUrgencySettings";
import { MediaItem, uploadMedia } from "../utils/mediaLibraryUtils";
import brain from "brain";
import type { POSSettings as BrainPOSSettings, PosTableResponse, CreateTableRequest, UpdateTableRequest } from "../brain/data-contracts";
import { colors, InternalTheme } from "../utils/InternalDesignSystem";
import { Separator } from "@/components/ui/separator";

// Interface for POS settings (local form state - maps to BrainPOSSettings)
interface LocalPOSSettings {
  delivery_charge: {
    enabled: boolean;
    amount: number;
    print_on_receipt: boolean;
  };
  service_charge: {
    enabled: boolean;
    percentage: number;
    print_on_receipt: boolean;
  };
  vat: {
    enabled: boolean;
    show_breakdown: boolean;
    percentage: number;
  };
}

// Interface for Table management (extends PosTableResponse for local state)
interface TableType extends Omit<PosTableResponse, 'status'> {
  status: 'available' | 'occupied' | 'reserved' | 'unavailable';
}

// Simplified opening hours type for this component
interface SimpleOpeningHours {
  day: string;
  lunch: {
    enabled: boolean;
    open: string;
    close: string;
  };
  dinner: {
    enabled: boolean;
    open: string;
    close: string;
  };
  is_closed: boolean;
}

// RestaurantSettingsManager Component
interface RestaurantSettingsManagerProps {
  // No props needed - internal navigation
}

const RestaurantSettingsManager: React.FC<RestaurantSettingsManagerProps> = () => {
  // Main navigation state
  const [activeSection, setActiveSection] = useState<"profile" | "admin" | "pos">("profile");
  
  // Restaurant settings hook
  const { 
    settings, 
    isLoading: isLoadingSettings, 
    saveSettings,
    updateProfile 
  } = useRestaurantSettings();
  
  // Restaurant profile state
  const [restaurantProfile, setRestaurantProfile] = useState<BusinessProfile>({
    name: '',
    address: '',
    postcode: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    tax_id: '',
    logo_url: ''
  });
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  
  // Admin password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // POS Settings state
  const [posSettings, setPosSettings] = useState<LocalPOSSettings>({
    delivery_charge: {
      enabled: false,
      amount: 0,
      print_on_receipt: true
    },
    service_charge: {
      enabled: false,
      percentage: 0,
      print_on_receipt: true
    },
    vat: {
      enabled: true,
      show_breakdown: true,
      percentage: 20
    }
  });
  
  const [isPOSSaving, setIsPOSSaving] = useState(false);
  const [posActiveTab, setPosActiveTab] = useState("delivery-management");
  
  // Table Management state
  const [tables, setTables] = useState<PosTableResponse[]>([]);
  const [isTablesLoading, setIsTablesLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTable, setEditingTable] = useState<PosTableResponse | null>(null);
  const [deleteTableNumber, setDeleteTableNumber] = useState<number | null>(null);
  const [tableFormData, setTableFormData] = useState<{ table_number?: number; capacity: number; status: 'available' | 'occupied' | 'reserved' | 'unavailable' }>({
    table_number: undefined,
    capacity: 4,
    status: 'available'
  });
  
  // Opening hours state (enhanced with lunch/dinner slots)
  const [openingHours, setOpeningHours] = useState<SimpleOpeningHours[]>([
    { 
      day: "Monday", 
      lunch: { enabled: true, open: "12:00", close: "14:00" },
      dinner: { enabled: true, open: "17:30", close: "22:00" },
      is_closed: false 
    },
    { 
      day: "Tuesday", 
      lunch: { enabled: true, open: "12:00", close: "14:00" },
      dinner: { enabled: true, open: "17:30", close: "22:00" },
      is_closed: false 
    },
    { 
      day: "Wednesday", 
      lunch: { enabled: true, open: "12:00", close: "14:00" },
      dinner: { enabled: true, open: "17:30", close: "22:00" },
      is_closed: false 
    },
    { 
      day: "Thursday", 
      lunch: { enabled: true, open: "12:00", close: "14:00" },
      dinner: { enabled: true, open: "17:30", close: "22:00" },
      is_closed: false 
    },
    { 
      day: "Friday", 
      lunch: { enabled: true, open: "12:00", close: "14:00" },
      dinner: { enabled: true, open: "17:30", close: "22:30" },
      is_closed: false 
    },
    { 
      day: "Saturday", 
      lunch: { enabled: true, open: "12:00", close: "14:00" },
      dinner: { enabled: true, open: "17:30", close: "22:30" },
      is_closed: false 
    },
    { 
      day: "Sunday", 
      lunch: { enabled: true, open: "12:00", close: "14:00" },
      dinner: { enabled: true, open: "17:30", close: "22:00" },
      is_closed: false 
    },
  ]);
  
  // Table management functions
  const loadTables = async () => {
    try {
      setIsTablesLoading(true);
      const response = await brain.get_tables();
      const data = await response.json();

      if (data.success && data.tables) {
        setTables(data.tables.sort((a: PosTableResponse, b: PosTableResponse) => a.table_number - b.table_number));
      } else {
        console.error('Failed to load tables:', data.message);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setIsTablesLoading(false);
    }
  };
  
  const handleTablesUpdate = () => {
    loadTables();
  };

  // Initialize restaurant profile when settings load
  useEffect(() => {
    if (settings?.business_profile) {
      setRestaurantProfile(settings.business_profile);
      if (settings.business_profile.logo_url) {
        setLogoPreview(settings.business_profile.logo_url);
      }
    }
    if (settings?.opening_hours) {
      // Convert old format to new enhanced format
      const convertedHours = settings.opening_hours.map((oldDay: any) => {
        // Check if it's already in new format
        if (oldDay.lunch && oldDay.dinner) {
          return oldDay;
        }
        
        // Convert from old format
        return {
          day: oldDay.day,
          lunch: {
            enabled: oldDay.lunch_enabled || false,
            open: oldDay.lunch_open || "12:00",
            close: oldDay.lunch_close || "14:00"
          },
          dinner: {
            enabled: oldDay.dinner_enabled !== false, // Default to true
            open: oldDay.dinner_open || oldDay.open || "17:30",
            close: oldDay.dinner_close || oldDay.close || "22:00"
          },
          is_closed: oldDay.is_closed || oldDay.closed || false
        };
      });
      setOpeningHours(convertedHours);
    }
  }, [settings]);
  
  // Load POS settings and tables on mount
  useEffect(() => {
    loadPOSSettings();
    loadTables();
  }, []);
  
  // Load tables when POS section is active
  useEffect(() => {
    if (activeSection === 'pos') {
      loadTables();
    }
  }, [activeSection]);
  
  // Fetch current password on mount
  useEffect(() => {
    const fetchCurrentPassword = async () => {
      try {
        const response = await brain.get_current_password();
        const data = await response.json();
        setCurrentPassword(data.password || "admin123");
      } catch (error) {
        console.error('Error fetching current password:', error);
        setCurrentPassword("admin123");
      }
    };
    
    fetchCurrentPassword();
  }, []);
  
  // Handler Functions
  
  // Load POS settings from API
  const loadPOSSettings = async () => {
    try {
      const response = await brain.get_pos_settings();
      const data = await response.json();

      if (data.settings) {
        // Map brain POSSettings to local form state
        const brainSettings = data.settings as BrainPOSSettings;
        setPosSettings({
          delivery_charge: {
            enabled: brainSettings.delivery_charge?.enabled ?? false,
            amount: brainSettings.delivery_charge?.amount ?? 0,
            print_on_receipt: brainSettings.delivery_charge?.print_on_receipt ?? true
          },
          service_charge: {
            enabled: brainSettings.service_charge?.enabled ?? false,
            percentage: brainSettings.service_charge?.percentage ?? 0,
            print_on_receipt: brainSettings.service_charge?.print_on_receipt ?? true
          },
          vat: {
            enabled: true,
            show_breakdown: true,
            percentage: 20
          }
        });
      }
    } catch (error) {
      console.error('Error loading POS settings:', error);
    }
  };
  
  // Save POS settings
  const savePOSSettings = async () => {
    try {
      setIsPOSSaving(true);
      // Map local form state to brain POSSettings format
      const brainSettings: BrainPOSSettings = {
        delivery_charge: {
          enabled: posSettings.delivery_charge.enabled,
          amount: posSettings.delivery_charge.amount,
          print_on_receipt: posSettings.delivery_charge.print_on_receipt
        },
        service_charge: {
          enabled: posSettings.service_charge.enabled,
          percentage: posSettings.service_charge.percentage,
          print_on_receipt: posSettings.service_charge.print_on_receipt
        }
      };
      const response = await brain.save_pos_settings({ settings: brainSettings });
      const data = await response.json();

      if (data.success) {
        toast.success('POS settings saved successfully');
      } else {
        throw new Error(data.message || 'Failed to save POS settings');
      }
    } catch (error) {
      console.error('Error saving POS settings:', error);
      toast.error('Failed to save POS settings');
    } finally {
      setIsPOSSaving(false);
    }
  };
  
  // Handle logo file selection
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setSelectedMedia(null);
      
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };
  
  // Handle media selection from library
  const handleMediaSelection = (media: MediaItem) => {
    setSelectedMedia(media);
    setLogoFile(null);
    setLogoPreview(media.url);
    
    setRestaurantProfile({
      ...restaurantProfile,
      logo_url: media.url
    });
  };
  
  // Upload logo
  const handleLogoUpload = async () => {
    if (!logoFile) return;
    try {
      setIsUploading(true);
      
      const uploadedMedia = await uploadMedia(logoFile, {
        friendlyName: `${restaurantProfile.name} Logo`,
        description: `Logo for ${restaurantProfile.name}`,
        tags: ["logo", "restaurant-profile"],
        usage: "restaurant-logo"
      });
      
      if (uploadedMedia && uploadedMedia.url) {
        const updatedProfile = {
          ...restaurantProfile,
          logo_url: uploadedMedia.url
        };
        
        setRestaurantProfile(updatedProfile);
        setSelectedMedia(uploadedMedia);
        toast.success("Logo uploaded successfully");
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setIsUploading(false);
    }
  };
  
  // Save unified restaurant profile (replaces separate save functions)
  const saveUnifiedRestaurantProfile = async () => {
    setLoading(true);
    try {
      // Save logo first if needed
      if (logoFile) {
        await handleLogoUpload();
      }
      
      // Save restaurant profile
      const profileSuccess = await updateProfile(restaurantProfile);
      
      // Save opening hours
      const backendFormat = openingHours.map(day => ({
        day: day.day,
        open: day.dinner.enabled ? day.dinner.open : (day.lunch.enabled ? day.lunch.open : "17:30"),
        close: day.dinner.enabled ? day.dinner.close : (day.lunch.enabled ? day.lunch.close : "22:00"),
        closed: day.is_closed,
        lunch_enabled: day.lunch.enabled,
        lunch_open: day.lunch.open,
        lunch_close: day.lunch.close,
        dinner_enabled: day.dinner.enabled,
        dinner_open: day.dinner.open,
        dinner_close: day.dinner.close
      }));
      
      // Call brain API directly to avoid nesting issues with saveSettings wrapper
      const hoursResponse = await brain.save_restaurant_settings({
        opening_hours: backendFormat
      });
      const hoursData = await hoursResponse.json();
      const hoursSuccess = hoursData.success;
      
      if (profileSuccess && hoursSuccess) {
        toast.success('Restaurant profile saved successfully');
      }
    } catch (error) {
      console.error('Error saving restaurant profile:', error);
      toast.error('Failed to save restaurant profile');
    } finally {
      setLoading(false);
    }
  };

  // Save opening hours
  const saveOpeningHours = async () => {
    try {
      // Convert enhanced format to backend format
      const backendFormat = openingHours.map(day => ({
        day: day.day,
        open: day.dinner.enabled ? day.dinner.open : (day.lunch.enabled ? day.lunch.open : "17:30"),
        close: day.dinner.enabled ? day.dinner.close : (day.lunch.enabled ? day.lunch.close : "22:00"),
        closed: day.is_closed,
        lunch_enabled: day.lunch.enabled,
        lunch_open: day.lunch.open,
        lunch_close: day.lunch.close,
        dinner_enabled: day.dinner.enabled,
        dinner_open: day.dinner.open,
        dinner_close: day.dinner.close
      }));
      
      // Call brain API directly to avoid nesting issues with saveSettings wrapper
      const hoursResponse = await brain.save_restaurant_settings({
        opening_hours: backendFormat
      });
      const hoursData = await hoursResponse.json();
      const hoursSuccess = hoursData.success;
      
      if (hoursSuccess) {
        toast.success('Opening hours saved successfully');
      }
    } catch (error) {
      console.error('Error saving opening hours:', error);
      toast.error('Failed to save opening hours');
    }
  };
  
  // Handle password change
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setIsChangingPassword(true);
      // TODO: Implement actual password change API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Admin password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Update opening hours day
  const updateOpeningHoursDay = (index: number, field: keyof SimpleOpeningHours, value: string | boolean) => {
    const updated = [...openingHours];
    updated[index] = { ...updated[index], [field]: value };
    setOpeningHours(updated);
  };

  // Update lunch slot for a day
  const updateLunchSlot = (index: number, field: 'enabled' | 'open' | 'close', value: string | boolean) => {
    const updated = [...openingHours];
    updated[index] = {
      ...updated[index],
      lunch: { ...updated[index].lunch, [field]: value }
    };
    setOpeningHours(updated);
  };

  // Update dinner slot for a day
  const updateDinnerSlot = (index: number, field: 'enabled' | 'open' | 'close', value: string | boolean) => {
    const updated = [...openingHours];
    updated[index] = {
      ...updated[index],
      dinner: { ...updated[index].dinner, [field]: value }
    };
    setOpeningHours(updated);
  };

  const startEditTable = (table: PosTableResponse) => {
    setEditingTable(table);
    setTableFormData({
      table_number: table.table_number,
      capacity: table.capacity,
      // Convert to lowercase - database stores UPPERCASE but form/API expects lowercase
      status: (table.status?.toLowerCase() || 'available') as 'available' | 'occupied' | 'reserved' | 'unavailable'
    });
    setShowAddForm(true);
  };

  const handleEditTable = async () => {
    if (!editingTable) return;
    try {
      const updateData: UpdateTableRequest = {
        capacity: tableFormData.capacity,
        status: tableFormData.status
      };
      const response = await brain.update_pos_table({ tableNumber: editingTable.table_number }, updateData);
      const data = await response.json();

      if (data.table_number) {
        toast.success(`Table ${editingTable.table_number} updated successfully`);
        setEditingTable(null);
        setShowAddForm(false);
        loadTables();
      } else {
        throw new Error('Failed to update table');
      }
    } catch (error) {
      console.error(`Error updating table ${editingTable.table_number}:`, error);
      toast.error(`Failed to update table ${editingTable.table_number}`);
    }
  };

  const handleAddTableForm = async () => {
    try {
      const createData: CreateTableRequest = {
        table_number: tableFormData.table_number || null,
        capacity: tableFormData.capacity,
        status: tableFormData.status
      };
      const response = await brain.create_pos_table(createData);
      const data = await response.json();

      if (data.success) {
        toast.success(`Table ${data.table?.table_number || tableFormData.table_number} added successfully`);
        setTableFormData({ table_number: undefined, capacity: 1, status: 'available' });
        setShowAddForm(false);
        loadTables();
      } else {
        throw new Error(data.message || 'Failed to add table');
      }
    } catch (error) {
      console.error(`Error adding table:`, error);
      toast.error(`Failed to add table`);
    }
  };

  const resetTableForm = () => {
    setTableFormData({ table_number: undefined, capacity: 1, status: 'available' });
    setEditingTable(null);
    setShowAddForm(false);
  };

  const openDeleteDialog = (tableNumber: number) => {
    setDeleteTableNumber(tableNumber);
  };

  const handleDeleteTable = async () => {
    if (!deleteTableNumber) return;

    try {
      const response = await brain.delete_pos_table({ tableNumber: deleteTableNumber });
      const data = await response.json();

      if (data.success) {
        toast.success(`Table ${deleteTableNumber} deleted successfully`);
        setDeleteTableNumber(null);
        loadTables();
      } else {
        throw new Error(data.message || 'Failed to delete table');
      }
    } catch (error) {
      console.error(`Error deleting table ${deleteTableNumber}:`, error);
      toast.error(`Failed to delete table ${deleteTableNumber}`);
    }
  };

  const getStatusColor = (status: string) => {
    // Normalize to lowercase - database may return UPPERCASE
    switch (status?.toLowerCase()) {
      case 'available':
        return { bg: 'bg-green-900', text: 'text-green-300' };
      case 'occupied':
        return { bg: 'bg-red-900', text: 'text-red-300' };
      case 'reserved':
        return { bg: 'bg-yellow-900', text: 'text-yellow-300' };
      case 'unavailable':
        return { bg: 'bg-gray-700', text: 'text-gray-300' };
      default:
        return { bg: 'bg-gray-700', text: 'text-gray-300' };
    }
  };

  const getStatusIcon = (status: string) => {
    // Normalize to lowercase - database may return UPPERCASE
    switch (status?.toLowerCase()) {
      case 'available':
        return <Check className="h-4 w-4 mr-2" />;
      case 'occupied':
        return <X className="h-4 w-4 mr-2" />;
      case 'reserved':
        return <Clock className="h-4 w-4 mr-2" />;
      case 'unavailable':
        return <X className="h-4 w-4 mr-2" />;
      default:
        return <X className="h-4 w-4 mr-2" />;
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleDayToggle = (day: string, checked: boolean) => {
    const updated = [...openingHours];
    updated[day] = { ...updated[day], is_closed: !checked };
    setOpeningHours(updated);
  };

  const handleTimeSlotToggle = (day: string, slot: 'lunch' | 'dinner', checked: boolean) => {
    const updated = [...openingHours];
    updated[day] = { ...updated[day], [slot]: { enabled: checked } };
    setOpeningHours(updated);
  };

  const handleTimeChange = (day: string, slot: 'lunch' | 'dinner', time: string) => {
    const updated = [...openingHours];
    updated[day] = { ...updated[day], [slot]: { [time]: time } };
    setOpeningHours(updated);
  };

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className={`p-6 ${InternalTheme.classes.surfacePanel}`}>
            <h1
              className="text-2xl font-bold mb-6"
              style={{ color: colors.text.primary }}
            >
              Restaurant Settings
            </h1>
            
            {/* Settings Navigation */}
            <div className={`flex space-x-1 mb-8 p-1 ${InternalTheme.classes.surfaceInset}`}>
              {[
                { id: "profile", label: "Restaurant Profile", icon: Building },
                { id: "pos", label: "POS Settings", icon: CreditCard },
                { id: "admin", label: "Admin Settings", icon: SettingsIcon },
              ].map((section) => {
                const IconComponent = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as any)}
                    className={`px-4 py-3 rounded-md flex items-center space-x-2 transition-all duration-200 flex-1 justify-center ${
                      activeSection === section.id
                        ? "shadow-[0_0_16px_rgba(124,58,237,0.4)]"
                        : "hover:bg-[rgba(124,58,237,0.1)]"
                    }`}
                    style={{
                      background: activeSection === section.id ? colors.purple.primary : 'transparent',
                      color: activeSection === section.id ? colors.text.primary : colors.text.muted,
                    }}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Restaurant Profile Section */}
            {activeSection === "profile" && (
              <div className="space-y-6">
                {/* Basic Restaurant Information */}
                <div
                  className={`p-6 ${InternalTheme.classes.surfaceCard}`}
                >
                  <div className="flex items-center mb-4">
                    <Building className="h-5 w-5 mr-2" style={{ color: colors.purple.primary }} />
                    <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
                      Restaurant Profile
                    </h2>
                  </div>
                  <p className="text-sm mb-6" style={{ color: colors.text.muted }}>
                    Manage your restaurant's basic information and contact details
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="restaurant-name" className="text-sm font-medium" style={{ color: colors.text.secondary }}>Restaurant Name</Label>
                        <Input
                          id="restaurant-name"
                          value={restaurantProfile.name}
                          onChange={(e) => setRestaurantProfile({...restaurantProfile, name: e.target.value})}
                          className="mt-1 transition-all duration-200 focus:border-[#7C3AED]"
                          style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.light,
                            color: colors.text.primary
                          }}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="restaurant-address" className="text-sm font-medium" style={{ color: colors.text.secondary }}>Address</Label>
                        <Textarea
                          id="restaurant-address"
                          value={restaurantProfile.address}
                          onChange={(e) => setRestaurantProfile({...restaurantProfile, address: e.target.value})}
                          className="mt-1"
                          rows={2}
                          style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.light,
                            color: colors.text.primary
                          }}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="restaurant-postcode" className="text-sm font-medium" style={{ color: colors.text.secondary }}>Postcode</Label>
                        <Input
                          id="restaurant-postcode"
                          value={restaurantProfile.postcode}
                          onChange={(e) => setRestaurantProfile({...restaurantProfile, postcode: e.target.value})}
                          className="mt-1 transition-all duration-200 focus:border-[#7C3AED]"
                          style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.light,
                            color: colors.text.primary
                          }}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="restaurant-tax-id" className="text-sm font-medium" style={{ color: colors.text.secondary }}>Tax ID / VAT Number</Label>
                        <Input
                          id="restaurant-tax-id"
                          value={restaurantProfile.tax_id}
                          onChange={(e) => setRestaurantProfile({...restaurantProfile, tax_id: e.target.value})}
                          className="mt-1 transition-all duration-200 focus:border-[#7C3AED]"
                          style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.light,
                            color: colors.text.primary
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="restaurant-phone" className="text-sm font-medium flex items-center" style={{ color: colors.text.secondary }}>
                          <Phone className="h-4 w-4 mr-2" />
                          Phone Number
                        </Label>
                        <Input
                          id="restaurant-phone"
                          value={restaurantProfile.phone}
                          onChange={(e) => setRestaurantProfile({...restaurantProfile, phone: e.target.value})}
                          className="mt-1 transition-all duration-200 focus:border-[#7C3AED]"
                          style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.light,
                            color: colors.text.primary
                          }}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="restaurant-email" className="text-sm font-medium flex items-center" style={{ color: colors.text.secondary }}>
                          <Mail className="h-4 w-4 mr-2" />
                          Email Address
                        </Label>
                        <Input
                          id="restaurant-email"
                          type="email"
                          value={restaurantProfile.email}
                          onChange={(e) => setRestaurantProfile({...restaurantProfile, email: e.target.value})}
                          className="mt-1 transition-all duration-200 focus:border-[#7C3AED]"
                          style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.light,
                            color: colors.text.primary
                          }}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="restaurant-website" className="text-sm font-medium flex items-center" style={{ color: colors.text.secondary }}>
                          <Globe className="h-4 w-4 mr-2" />
                          Website
                        </Label>
                        <Input
                          id="restaurant-website"
                          value={restaurantProfile.website}
                          onChange={(e) => setRestaurantProfile({...restaurantProfile, website: e.target.value})}
                          className="mt-1 transition-all duration-200 focus:border-[#7C3AED]"
                          style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.light,
                            color: colors.text.primary
                          }}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="restaurant-description" className="text-sm font-medium" style={{ color: colors.text.secondary }}>Description</Label>
                        <Textarea
                          id="restaurant-description"
                          value={restaurantProfile.description}
                          onChange={(e) => setRestaurantProfile({...restaurantProfile, description: e.target.value})}
                          className="mt-1"
                          rows={2}
                          style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.light,
                            color: colors.text.primary
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Logo Upload Section */}
                  <div className="mt-6 space-y-4">
                    <Label className="text-sm font-medium flex items-center" style={{ color: colors.text.secondary }}>
                      <Image className="h-4 w-4 mr-1" />
                      Restaurant Logo
                    </Label>
                    
                    {logoPreview && (
                      <div className="relative w-full max-w-[250px] h-auto border rounded-lg overflow-hidden mb-4" style={{ borderColor: colors.border.medium }}>
                        <img 
                          src={logoPreview} 
                          alt="Restaurant Logo Preview" 
                          className="w-full h-auto object-contain"
                        />
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-4">
                      <div 
                        className="flex items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors hover:border-opacity-50"
                        style={{
                          borderColor: colors.border.accent,
                          background: colors.background.secondary
                        }}
                      >
                        <div className="text-center">
                          <UploadCloud className="mx-auto h-12 w-12" style={{ color: colors.text.muted }} />
                          <div className="mt-4 flex text-sm leading-6" style={{ color: colors.text.muted }}>
                            <label
                              htmlFor="logo-upload"
                              className="relative cursor-pointer rounded-md font-semibold focus-within:outline-none focus-within:ring-2"
                              style={{ color: colors.purple.primary }}
                            >
                              <span>Upload a file</span>
                              <input 
                                id="logo-upload" 
                                name="logo-upload" 
                                type="file" 
                                accept="image/*"
                                className="sr-only" 
                                onChange={handleLogoFileChange}
                                disabled={isUploading}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs mt-1" style={{ color: colors.text.muted }}>PNG, JPG, GIF up to 2MB</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => setIsMediaSelectorOpen(true)}
                          disabled={isUploading}
                          style={{
                            borderColor: colors.border.accent,
                            color: colors.text.primary
                          }}
                        >
                          <ImagePlus className="h-4 w-4" />
                          Select from Media Library
                        </Button>
                      </div>
                      
                      <MediaSelector
                        isOpen={isMediaSelectorOpen}
                        onClose={() => setIsMediaSelectorOpen(false)}
                        onSelectMedia={handleMediaSelection}
                        mediaType="image"
                        aspectRatio="any"
                        title="Select Restaurant Logo"
                        showUploadTab={true}
                        uploadUsage="restaurant-logo"
                        tags={["logo", "restaurant-profile"]}
                      />
                    </div>
                  </div>
                  
                  {/* Opening Hours Section - Integrated Inside Restaurant Profile */}
                  <div className="mt-6 space-y-4">
                    <Label className="text-sm font-medium flex items-center" style={{ color: colors.text.secondary }}>
                      <Clock className="h-4 w-4 mr-2" />
                      Opening Hours
                    </Label>
                    
                    <div className="space-y-4">
                      {/* Individual Days - Monday through Sunday */}
                      {openingHours.map((day, index) => (
                        <div key={day.day} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium" style={{ color: colors.text.primary }}>
                              {day.day}
                            </h4>
                            <Switch
                              checked={!day.is_closed}
                              onCheckedChange={(checked) => {
                                const newHours = [...openingHours];
                                newHours[index].is_closed = !checked;
                                setOpeningHours(newHours);
                              }}
                            />
                          </div>
                          
                          {!day.is_closed && (
                            <div className="ml-4 space-y-2 text-sm">
                              {/* Lunch */}
                              <div className="flex items-center space-x-3">
                                <Switch
                                  checked={day.lunch.enabled}
                                  onCheckedChange={(checked) => {
                                    const newHours = [...openingHours];
                                    newHours[index].lunch.enabled = checked;
                                    setOpeningHours(newHours);
                                  }}
                                />
                                <span className="w-12 text-xs" style={{ color: colors.text.secondary }}>Lunch:</span>
                                {day.lunch.enabled ? (
                                  <>
                                    <Input
                                      type="time"
                                      value={day.lunch.open}
                                      onChange={(e) => {
                                        const newHours = [...openingHours];
                                        newHours[index].lunch.open = e.target.value;
                                        setOpeningHours(newHours);
                                      }}
                                      className="w-20 text-xs"
                                      style={{
                                        backgroundColor: colors.background.secondary,
                                        border: `1px solid ${colors.border.medium}`,
                                        color: colors.text.primary
                                      }}
                                    />
                                    <span style={{ color: colors.text.secondary }}>–</span>
                                    <Input
                                      type="time"
                                      value={day.lunch.close}
                                      onChange={(e) => {
                                        const newHours = [...openingHours];
                                        newHours[index].lunch.close = e.target.value;
                                        setOpeningHours(newHours);
                                      }}
                                      className="w-20 text-xs"
                                      style={{
                                        backgroundColor: colors.background.secondary,
                                        border: `1px solid ${colors.border.medium}`,
                                        color: colors.text.primary
                                      }}
                                    />
                                  </>
                                ) : (
                                  <span className="text-xs" style={{ color: colors.text.muted }}>Closed</span>
                                )}
                              </div>
                              
                              {/* Dinner */}
                              <div className="flex items-center space-x-3">
                                <Switch
                                  checked={day.dinner.enabled}
                                  onCheckedChange={(checked) => {
                                    const newHours = [...openingHours];
                                    newHours[index].dinner.enabled = checked;
                                    setOpeningHours(newHours);
                                  }}
                                />
                                <span className="w-12 text-xs" style={{ color: colors.text.secondary }}>Dinner:</span>
                                {day.dinner.enabled ? (
                                  <>
                                    <Input
                                      type="time"
                                      value={day.dinner.open}
                                      onChange={(e) => {
                                        const newHours = [...openingHours];
                                        newHours[index].dinner.open = e.target.value;
                                        setOpeningHours(newHours);
                                      }}
                                      className="w-20 text-xs"
                                      style={{
                                        backgroundColor: colors.background.secondary,
                                        border: `1px solid ${colors.border.medium}`,
                                        color: colors.text.primary
                                      }}
                                    />
                                    <span style={{ color: colors.text.secondary }}>–</span>
                                    <Input
                                      type="time"
                                      value={day.dinner.close}
                                      onChange={(e) => {
                                        const newHours = [...openingHours];
                                        newHours[index].dinner.close = e.target.value;
                                        setOpeningHours(newHours);
                                      }}
                                      className="w-20 text-xs"
                                      style={{
                                        backgroundColor: colors.background.secondary,
                                        border: `1px solid ${colors.border.medium}`,
                                        color: colors.text.primary
                                      }}
                                    />
                                  </>
                                ) : (
                                  <span className="text-xs" style={{ color: colors.text.muted }}>Closed</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={saveUnifiedRestaurantProfile}
                      disabled={loading || isUploading}
                      className="flex items-center gap-2"
                      style={{
                        backgroundColor: colors.purple.primary,
                        color: colors.text.primary
                      }}
                    >
                      <Save className="h-4 w-4" />
                      {isUploading ? "Uploading..." : "Save Restaurant Profile"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {activeSection === "pos" && (
              <div className="space-y-6">
                <div
                  className={`p-6 ${InternalTheme.classes.surfaceCard}`}
                >
                  <div className="flex items-center mb-4">
                    <CreditCard className="h-5 w-5 mr-2" style={{ color: colors.purple.primary }} />
                    <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
                      POS Settings
                    </h2>
                  </div>
                  <p className="text-sm mb-6" style={{ color: colors.text.muted }}>
                    Configure point of sale settings including charges and table management
                  </p>
                  
                  <Tabs value={posActiveTab} onValueChange={setPosActiveTab}>
                    <TabsList
                      className="grid w-full grid-cols-4"
                      style={{
                        backgroundColor: 'rgba(26, 26, 26, 0.6)',
                        backdropFilter: 'blur(12px)',
                        border: `1px solid ${colors.border.accent}`,
                      }}
                    >
                      <TabsTrigger
                        value="delivery-management"
                        className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-[0_0_16px_rgba(124,58,237,0.4)] transition-all duration-200 hover:bg-[rgba(124,58,237,0.15)]"
                        style={{ color: colors.text.secondary }}
                      >
                        Delivery
                      </TabsTrigger>
                      <TabsTrigger
                        value="service-charge"
                        className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-[0_0_16px_rgba(124,58,237,0.4)] transition-all duration-200 hover:bg-[rgba(124,58,237,0.15)]"
                        style={{ color: colors.text.secondary }}
                      >
                        Service Charge
                      </TabsTrigger>
                      <TabsTrigger
                        value="tables"
                        className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-[0_0_16px_rgba(124,58,237,0.4)] transition-all duration-200 hover:bg-[rgba(124,58,237,0.15)]"
                        style={{ color: colors.text.secondary }}
                      >
                        Tables
                      </TabsTrigger>
                      <TabsTrigger
                        value="urgency-alerts"
                        className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-[0_0_16px_rgba(124,58,237,0.4)] transition-all duration-200 hover:bg-[rgba(124,58,237,0.15)]"
                        style={{ color: colors.text.secondary }}
                      >
                        Urgency Alerts
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Delivery Management Tab - Comprehensive Settings */}
                    <TabsContent value="delivery-management" className="space-y-4 mt-6">
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>Delivery Management</h3>
                        <p className="text-sm" style={{ color: colors.text.secondary }}>Configure delivery zones, fees, and minimum order requirements for POS orders.</p>
                      </div>
                      {/* DeliverySettings now uses hook directly - no props needed */}
                      <DeliverySettings />
                    </TabsContent>
                    
                    {/* Service Charge Tab */}
                    <TabsContent value="service-charge" className="space-y-4 mt-6">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
                          <div>
                            <Label className="text-base font-medium" style={{ color: colors.text.primary }}>Enable Service Charge</Label>
                            <p className="text-sm" style={{ color: colors.text.muted }}>Add a service charge to orders</p>
                          </div>
                          <Switch
                            checked={posSettings.service_charge.enabled}
                            onCheckedChange={(enabled) => setPosSettings({
                              ...posSettings,
                              service_charge: { ...posSettings.service_charge, enabled }
                            })}
                          />
                        </div>
                        
                        {posSettings.service_charge.enabled && (
                          <>
                            <div>
                              <Label htmlFor="service-percentage" className="text-sm font-medium" style={{ color: colors.text.secondary }}>Service Charge Percentage (%)</Label>
                              <Input
                                id="service-percentage"
                                type="number"
                                step="1"
                                value={posSettings.service_charge.percentage}
                                onChange={(e) => setPosSettings({
                                  ...posSettings,
                                  service_charge: { ...posSettings.service_charge, percentage: parseFloat(e.target.value) || 0 }
                                })}
                                className="mt-1"
                                style={{
                                  backgroundColor: colors.background.secondary,
                                  border: `1px solid ${colors.border.medium}`,
                                  color: colors.text.primary
                                }}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
                              <div>
                                <Label className="text-base font-medium" style={{ color: colors.text.primary }}>Print on Receipt</Label>
                                <p className="text-sm" style={{ color: colors.text.muted }}>Show service charge on customer receipts</p>
                              </div>
                              <Switch
                                checked={posSettings.service_charge.print_on_receipt}
                                onCheckedChange={(print_on_receipt) => setPosSettings({
                                  ...posSettings,
                                  service_charge: { ...posSettings.service_charge, print_on_receipt }
                                })}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </TabsContent>
                    
                    {/* Table Management Tab */}
                    <TabsContent value="tables" className="space-y-4 mt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-medium" style={{ color: colors.text.primary }}>Tables</h3>
                          <p className="text-sm" style={{ color: colors.text.muted }}>Manage restaurant tables for dine-in orders</p>
                          <p className="text-sm" style={{ color: colors.text.muted }}>Total tables: {tables.length}</p>
                        </div>
                        <Button 
                          onClick={() => setShowAddForm(true)}
                          className="flex items-center gap-2"
                          style={{
                            backgroundColor: colors.purple.primary,
                            color: colors.text.primary
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          Add Table
                        </Button>
                      </div>
                      
                      {/* Add/Edit Form */}
                      {(showAddForm || editingTable) && (
                        <div
                          className="rounded-lg p-6 mb-6"
                          style={{
                            backgroundColor: colors.background.secondary,
                            border: `1px solid ${colors.border.medium}`
                          }}
                        >
                          <h3 className="text-lg font-medium mb-4" style={{ color: colors.text.primary }}>
                            {editingTable ? `Edit Table ${editingTable.table_number}` : 'Add New Table'}
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {showAddForm && (
                              <div>
                                <Label htmlFor="table-number" className="text-sm font-medium" style={{ color: colors.text.secondary }}>Table Number (Optional)</Label>
                                <Input
                                  id="table-number"
                                  type="number"
                                  value={tableFormData.table_number || ''}
                                  onChange={(e) => setTableFormData(prev => ({ ...prev, table_number: e.target.value ? parseInt(e.target.value) : undefined }))}
                                  placeholder="Auto-generated if empty"
                                  className="mt-1"
                                  style={{
                                    backgroundColor: colors.background.tertiary,
                                    border: `1px solid ${colors.border.medium}`,
                                    color: colors.text.primary
                                  }}
                                />
                              </div>
                            )}
                            
                            <div>
                              <Label htmlFor="capacity" className="text-sm font-medium" style={{ color: colors.text.secondary }}>Capacity</Label>
                              <Input
                                id="capacity"
                                type="number"
                                min="1"
                                max="20"
                                value={tableFormData.capacity}
                                onChange={(e) => setTableFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                                className="mt-1"
                                style={{
                                  backgroundColor: colors.background.tertiary,
                                  borderColor: colors.border.light,
                                  color: colors.text.primary
                                }}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="status" className="text-sm font-medium" style={{ color: colors.text.secondary }}>Status</Label>
                              <Select value={tableFormData.status} onValueChange={(value) => setTableFormData(prev => ({ ...prev, status: value as any }))}>
                                <SelectTrigger 
                                  className="mt-1"
                                  style={{
                                    backgroundColor: colors.background.tertiary,
                                    border: `1px solid ${colors.border.medium}`,
                                    color: colors.text.primary
                                  }}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="available">Available</SelectItem>
                                  <SelectItem value="occupied">Occupied</SelectItem>
                                  <SelectItem value="reserved">Reserved</SelectItem>
                                  <SelectItem value="unavailable">Unavailable</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={editingTable ? handleEditTable : handleAddTableForm}
                              className="flex items-center gap-2"
                              style={{
                                backgroundColor: colors.purple.primary,
                                color: colors.text.primary
                              }}
                            >
                              {editingTable ? 'Update Table' : 'Create Table'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={resetTableForm}
                              style={{
                                borderColor: colors.border.medium,
                                color: colors.text.muted
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
      
                      {isTablesLoading ? (
                        <div className="text-center py-8">
                          <p style={{ color: colors.text.muted }}>Loading tables...</p>
                        </div>
                      ) : tables.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {tables.map((table) => {
                            const statusColor = getStatusColor(table.status);
                            return (
                              <div
                                key={table.table_number}
                                className="p-4 rounded-lg border transition-all hover:border-[#7C3AED]"
                                style={{
                                  backgroundColor: colors.background.secondary,
                                  borderColor: colors.border.medium
                                }}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <h4 className="font-medium text-lg" style={{ color: colors.text.primary }}>
                                    Table {table.table_number}
                                  </h4>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusColor.bg} ${statusColor.text}`}>
                                    {getStatusIcon(table.status)}
                                    {table.status?.charAt(0).toUpperCase() + table.status?.slice(1).toLowerCase()}
                                  </span>
                                </div>
                                
                                <div className="flex items-center mb-4" style={{ color: colors.text.muted }}>
                                  <Users className="h-4 w-4 mr-2" />
                                  <span>Capacity: {table.capacity} people</span>
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => startEditTable(table)}
                                    className="flex items-center gap-1"
                                    style={{
                                      borderColor: colors.border.accent,
                                      color: colors.text.primary
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDeleteDialog(table.table_number)}
                                    className="flex items-center gap-1"
                                    style={{
                                      borderColor: colors.status.error,
                                      color: colors.status.error
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Users className="h-12 w-12 mx-auto mb-4" style={{ color: colors.text.muted }} />
                          <p className="text-lg" style={{ color: colors.text.primary }}>No tables found</p>
                          <p className="text-sm" style={{ color: colors.text.muted }}>Add your first table to get started</p>
                        </div>
                      )}
                    </TabsContent>

                    {/* Urgency Alerts Tab */}
                    <TabsContent value="urgency-alerts" className="space-y-4 mt-6">
                      <POSUrgencySettings />
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={savePOSSettings}
                      disabled={isPOSSaving}
                      className="flex items-center gap-2"
                      style={{
                        backgroundColor: colors.purple.primary,
                        color: colors.text.primary
                      }}
                    >
                      <Save className="h-4 w-4" />
                      {isPOSSaving ? "Saving..." : "Save POS Settings"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "admin" && (
              <div className="space-y-6">
                {/* Password Management */}
                <div
                  className={`p-6 ${InternalTheme.classes.surfaceCard}`}
                >
                  <div className="flex items-center mb-4">
                    <KeyRound className="h-5 w-5 mr-2" style={{ color: colors.purple.primary }} />
                    <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
                      Password Management
                    </h2>
                  </div>
                  <p className="text-sm mb-6" style={{ color: colors.text.muted }}>
                    Update your admin password for secure access
                  </p>
                  
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label htmlFor="current-password" className="text-sm font-medium" style={{ color: colors.text.secondary }}>Current Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="pr-10"
                          style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.light,
                            color: colors.text.primary
                          }}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" style={{ color: colors.text.muted }} />
                          ) : (
                            <Eye className="h-4 w-4" style={{ color: colors.text.muted }} />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="new-password" className="text-sm font-medium" style={{ color: colors.text.secondary }}>New Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="pr-10"
                          style={{
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.light,
                            color: colors.text.primary
                          }}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" style={{ color: colors.text.muted }} />
                          ) : (
                            <Eye className="h-4 w-4" style={{ color: colors.text.muted }} />
                          )}
                        </button>
                      </div>
                      <p className="text-sm mt-1" style={{ color: colors.text.muted }}>Password must be at least 6 characters long</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="confirm-password" className="text-sm font-medium" style={{ color: colors.text.secondary }}>Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="mt-1"
                        style={{
                          backgroundColor: colors.background.secondary,
                          border: `1px solid ${colors.border.medium}`,
                          color: colors.text.primary
                        }}
                      />
                    </div>
                    
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                      <div className="flex items-center" style={{ color: colors.status.error }}>
                        <KeyRound className="h-4 w-4 mr-2" />
                        <span className="text-sm">Passwords do not match</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={handlePasswordChange}
                      disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                      className="flex items-center gap-2"
                      style={{
                        backgroundColor: colors.purple.primary,
                        color: colors.text.primary
                      }}
                    >
                      <KeyRound className="h-4 w-4" />
                      {isChangingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </div>
                
                {/* Account Information */}
                <div
                  className={`p-6 ${InternalTheme.classes.surfaceCard}`}
                >
                  <div className="flex items-center mb-4">
                    <SettingsIcon className="h-5 w-5 mr-2" style={{ color: colors.purple.primary }} />
                    <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
                      Account Information
                    </h2>
                  </div>
                  <p className="text-sm mb-6" style={{ color: colors.text.muted }}>
                    View current admin account details
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium" style={{ color: colors.text.secondary }}>Admin Email</Label>
                      <p className="mt-1" style={{ color: colors.text.primary }}>bod@barkworthhathaway.com</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium" style={{ color: colors.text.secondary }}>Account Type</Label>
                      <p className="mt-1" style={{ color: colors.text.primary }}>Administrator</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium" style={{ color: colors.text.secondary }}>Last Login</Label>
                      <p className="mt-1" style={{ color: colors.text.primary }}>Today at 9:00 AM</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium" style={{ color: colors.text.secondary }}>Account Status</Label>
                      <p className="mt-1 flex items-center" style={{ color: colors.status.success }}>
                        <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: colors.purple.primary }}></span>
                        Active
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteTableNumber !== null} onOpenChange={(open) => !open && setDeleteTableNumber(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Table</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete Table {deleteTableNumber}? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteTableNumber(null)}
                    style={{
                      borderColor: colors.border.medium,
                      color: colors.text.muted
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteTable}
                    style={{
                      backgroundColor: colors.status.error,
                      color: colors.text.primary
                    }}
                  >
                    Delete Table
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantSettingsManager;
