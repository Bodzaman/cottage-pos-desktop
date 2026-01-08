import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Phone, MapPin, Heart, CheckCircle, Sparkles, ArrowRight, ArrowLeft, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useOnboardingStore } from 'utils/onboardingStore';
import { useSimpleAuth } from 'utils/simple-auth-context';
import { apiClient } from 'app';
import Confetti from 'react-confetti';
import { PremiumTheme } from 'utils/premiumTheme';
import GooglePlacesAutocompleteEnhanced, { type ExtractedAddress } from './GooglePlacesAutocompleteEnhanced';
import { createPortal } from 'react-dom';

// Add proper TypeScript interface
type CustomerSection = 'profile' | 'addresses' | 'orders' | 'favorites';

interface OnboardingWizardProps {
  onNavigateToSection?: (section: CustomerSection) => void; // Make optional
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onNavigateToSection }) => {
  const navigate = useNavigate();
  const { shouldShowWizard, status, markWizardComplete, dismissWizard } = useOnboardingStore();
  const { profile, updateProfile, addAddress } = useSimpleAuth();

  // Early return if wizard shouldn't show or status is not loaded
  const shouldShow = shouldShowWizard();
  if (!shouldShow || !status) return null;

  const [currentStep, setCurrentStep] = useState(0); // Start at Step 0 (Welcome)
  const [isCompleting, setIsCompleting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false); // Animation state for Step 0

  // Form state for Step 1: Phone Number
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Form state for Step 2: Address
  const [addressData, setAddressData] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    address_type: 'home',
    is_default: true,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    place_id: undefined as string | undefined
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  
  // Google Maps API key for autocomplete
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);

  // Saved data for Step 4 display
  const [savedPhone, setSavedPhone] = useState('');
  const [savedAddress, setSavedAddress] = useState('');

  const TOTAL_STEPS = 5; // Updated to 5 (0: Welcome, 1: Phone, 2: Address, 3: Favorites, 4: Completion)
  const isOpen = shouldShowWizard();

  // Welcome screen entrance animation: 2-second delay, then 500ms fade-in
  useEffect(() => {
    if (currentStep === 0 && isOpen) {
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, 2000); // 2-second delay
      return () => clearTimeout(timer);
    }
  }, [currentStep, isOpen]);

  // Load existing profile data
  useEffect(() => {
    if (profile) {
      if (profile.phone) {
        setPhoneNumber(profile.phone);
        setSavedPhone(profile.phone);
      }
    }
  }, [profile]);
  
  // Fetch Google Maps API key for autocomplete
  useEffect(() => {
    const fetchMapsConfig = async () => {
      try {
        const response = await apiClient.get_maps_config();
        const data = await response.json();
        if (data.apiKey) {
          setGoogleMapsApiKey(data.apiKey);
        }
      } catch (error) {
        console.error('Error fetching Google Maps API key:', error);
      }
    };
    
    if (isOpen) {
      fetchMapsConfig();
    }
  }, [isOpen]);

  // Trigger confetti when reaching step 4
  useEffect(() => {
    if (currentStep === 4 && !showConfetti) {
      setShowConfetti(true);
      // Auto-stop confetti after 5 seconds
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, showConfetti]);

  // Validate phone number
  const validatePhone = (phone: string): boolean => {
    if (!phone || phone.trim() === '') {
      setPhoneError('Phone number is required for ordering');
      return false;
    }
    // Basic UK phone validation
    const ukPhoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/;
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setPhoneError('Please enter a valid UK phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  // Validate address
  const validateAddress = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!addressData.address_line1.trim()) {
      errors.address_line1 = 'Street address is required';
    }
    if (!addressData.city.trim()) {
      errors.city = 'City is required';
    }
    if (!addressData.postal_code.trim()) {
      errors.postal_code = 'Postcode is required';
    }
    
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle address selection from Google Places autocomplete
  const handleAddressSelect = (selectedAddress: ExtractedAddress) => {
    console.log('🎯 [OnboardingWizard] Address selected:', selectedAddress);
    
    const streetAddress = `${selectedAddress.street_number || ''} ${selectedAddress.route || ''}`.trim();
    const city = selectedAddress.locality || '';
    const postcode = selectedAddress.postal_code || '';
    
    // Auto-fill the form fields
    setAddressData(prev => ({
      ...prev,
      address_line1: streetAddress,
      city: city,
      postal_code: postcode,
      latitude: selectedAddress.latitude,
      longitude: selectedAddress.longitude,
      place_id: selectedAddress.place_id
    }));
    
    // Clear any errors
    setAddressErrors({});
    
    toast.success('Address auto-filled! You can edit if needed.');
  };

  // Save phone number
  const savePhoneNumber = async (): Promise<boolean> => {
    if (!validatePhone(phoneNumber)) {
      return false;
    }

    setIsSaving(true);
    try {
      const result = await updateProfile({ phone: phoneNumber });
      if (result.error) {
        toast.error('Failed to save phone number');
        return false;
      }
      setSavedPhone(phoneNumber);
      toast.success('Phone number saved!');
      return true;
    } catch (error) {
      console.error('Error saving phone:', error);
      toast.error('Failed to save phone number');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Save address
  const saveAddress = async (): Promise<boolean> => {
    if (!validateAddress()) {
      return false;
    }

    console.log('🔍 [OnboardingWizard] Attempting to save address:', addressData);
    setIsSaving(true);
    try {
      // Step 1: Geocode the postcode to get coordinates
      console.log('🌍 [OnboardingWizard] Geocoding postcode:', addressData.postal_code);
      const geocodeResponse = await apiClient.geocode({ postcode: addressData.postal_code });
      const geocodeData = await geocodeResponse.json();
      
      console.log('🌍 [OnboardingWizard] Geocode result:', geocodeData);
      
      let finalAddressData = { ...addressData };
      
      if (geocodeData.success && geocodeData.coordinates) {
        // Add coordinates to address data
        finalAddressData = {
          ...addressData,
          latitude: geocodeData.coordinates.lat,
          longitude: geocodeData.coordinates.lng
        };
        console.log('✅ [OnboardingWizard] Geocoding successful, coordinates:', geocodeData.coordinates);
      } else {
        console.warn('⚠️ [OnboardingWizard] Geocoding failed or no coordinates:', geocodeData.message);
        // Continue without coordinates - address will save but map won't show
      }
      
      // Step 2: Save address with coordinates
      console.log('💾 [OnboardingWizard] Saving address with data:', finalAddressData);
      const result = await addAddress(finalAddressData);
      console.log('🔍 [OnboardingWizard] addAddress result:', result);
      if (result.error) {
        console.error('❌ [OnboardingWizard] Address save error:', result.error);
        toast.error('Failed to save address');
        return false;
      }
      setSavedAddress(`${addressData.address_line1}, ${addressData.city} ${addressData.postal_code}`);
      toast.success('Address saved!');
      return true;
    } catch (error) {
      console.error('❌ [OnboardingWizard] Error saving address (catch block):', error);
      toast.error('Failed to save address');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Check if address form has any data entered
  const hasAddressData = (): boolean => {
    return !!(
      addressData.address_line1.trim() ||
      addressData.address_line2.trim() ||
      addressData.city.trim() ||
      addressData.postal_code.trim()
    );
  };

  const handleNext = async () => {
    // Step 0: Welcome - just advance
    if (currentStep === 0) {
      setCurrentStep(1);
      return;
    }

    // Step 1: Save phone before advancing
    if (currentStep === 1) {
      const saved = await savePhoneNumber();
      if (!saved) return;
    }

    // Step 2: Save address before advancing (ONLY if user has entered data)
    if (currentStep === 2) {
      // If no address data entered, just skip to next step
      if (!hasAddressData()) {
        toast.info('Address skipped - you can add it later from your profile');
        setCurrentStep(currentStep + 1);
        return;
      }
      
      // If user has entered data, validate and save
      const saved = await saveAddress();
      if (!saved) return;
    }

    // Advance to next step
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) { // Allow going back to Step 0
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    dismissWizard();
    toast.info('You can always complete your profile later from the portal');
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      // Defensive check - ensure profile.id exists
      if (!profile?.id) {
        toast.error('Unable to complete setup', {
          description: 'Please try logging in again'
        });
        return;
      }

      // Pass profile.id to markWizardComplete
      await markWizardComplete(profile.id);
      toast.success('🎉 Welcome to Cottage Tandoori!', {
        description: 'Your profile is all set up. Ready to order?',
        duration: 4000,
      });
      dismissWizard();
    } catch (error) {
      console.error('Error completing wizard:', error);
      toast.error('Something went wrong', {
        description: 'Please try again',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  // Get customer's first name for personalization
  const firstName = profile?.first_name || 'Friend';

  return (
    <>
      {/* Confetti Portal */}
      {showConfetti && createPortal(
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 99999 }}>
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={300}
            colors={[PremiumTheme.colors.burgundy[500], PremiumTheme.colors.gold[500], PremiumTheme.colors.platinum[400]]}
            gravity={0.25}
          />
        </div>,
        document.body
      )}

      <Dialog open={isOpen} onOpenChange={dismissWizard}>
        <DialogContent 
          className="max-w-2xl max-h-[90vh] p-0 gap-0 border-0 flex flex-col"
          style={{ 
            backgroundColor: 'rgba(15, 15, 15, 0.85)',
            boxShadow: PremiumTheme.shadows.elevation.xl,
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Accessible title (visually hidden) */}
          <DialogTitle className="sr-only">
            {currentStep === 0 && "Welcome to Cottage Tandoori - Get Started"}
            {currentStep === 1 && "Add Your Phone Number - Step 1 of 4"}
            {currentStep === 2 && "Add Delivery Address - Step 2 of 4"}
            {currentStep === 3 && "Browse & Save Favorites - Step 3 of 4"}
            {currentStep === 4 && "Welcome to Cottage Tandoori - Setup Complete"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Complete your profile setup to start ordering from Cottage Tandoori
          </DialogDescription>

          {/* Header - Frosted burgundy gradient - STICKY */}
          <div 
            className="relative px-4 md:px-8 py-4 md:py-6 flex items-center justify-between flex-shrink-0"
            style={{ 
              background: `linear-gradient(135deg, rgba(139, 21, 56, 0.3) 0%, rgba(106, 17, 45, 0.25) 100%)`,
              backdropFilter: 'blur(10px)',
              borderBottom: `1px solid rgba(139, 21, 56, 0.2)`
            }}
          >
            {/* Step Icon */}
            <div className="flex items-center space-x-3 md:space-x-4">
              <div 
                className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                {currentStep === 0 && <PartyPopper className="w-5 h-5 md:w-6 md:h-6 text-white" />}
                {currentStep === 1 && <Phone className="w-5 h-5 md:w-6 md:h-6 text-white" />}
                {currentStep === 2 && <MapPin className="w-5 h-5 md:w-6 md:h-6 text-white" />}
                {currentStep === 3 && <Heart className="w-5 h-5 md:w-6 md:h-6 text-white" />}
                {currentStep === 4 && <PartyPopper className="w-5 h-5 md:w-6 md:h-6 text-white" />}
              </div>
              
              <div>
                {currentStep === 0 ? (
                  <h2 className="text-xl md:text-2xl font-bold text-white">
                    Welcome to Cottage Tandoori!
                  </h2>
                ) : (
                  <>
                    <p className="text-xs md:text-sm font-medium text-white opacity-90">
                      Step {currentStep} of {TOTAL_STEPS - 1}
                    </p>
                    <h2 className="text-lg md:text-2xl font-bold text-white">
                      {currentStep === 1 && "Add Your Phone Number"}
                      {currentStep === 2 && "Add Delivery Address"}
                      {currentStep === 3 && "Browse & Save Favorites"}
                      {currentStep === 4 && "Welcome to Cottage Tandoori!"}
                    </h2>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar - Gold gradient */}
          <div 
            className="h-2 flex-shrink-0"
            style={{ backgroundColor: 'rgba(26, 26, 26, 0.5)' }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${(currentStep / (TOTAL_STEPS - 1)) * 100}%`,
                background: `linear-gradient(90deg, ${PremiumTheme.colors.gold[400]} 0%, ${PremiumTheme.colors.gold[500]} 100%)`
              }}
            />
          </div>

          {/* Scrollable Content Area */}
          <div 
            className="flex-1 overflow-y-auto p-4 md:p-8"
            style={{ 
              backgroundColor: PremiumTheme.colors.background.primary
            }}
          >
            {/* Step 0: Welcome Screen */}
            {currentStep === 0 && (
              <div 
                className="text-center space-y-8 transition-all duration-500"
                style={{
                  opacity: showWelcome ? 1 : 0,
                  transform: showWelcome ? 'scale(1)' : 'scale(0.95)',
                }}
              >
                {/* Greeting */}
                <div className="space-y-4">
                  <h3 
                    className="text-3xl font-bold"
                    style={{ color: PremiumTheme.colors.text.primary }}
                  >
                    🏠 Welcome to Cottage Tandoori, {firstName}!
                  </h3>
                  
                  <p 
                    className="text-lg max-w-xl mx-auto"
                    style={{ color: PremiumTheme.colors.text.secondary }}
                  >
                    We're excited to have you here. Let's quickly set up your account so you can enjoy:
                  </p>
                </div>

                {/* Benefits List */}
                <div 
                  className="max-w-md mx-auto rounded-xl p-6 space-y-4"
                  style={{
                    backgroundColor: `${PremiumTheme.colors.burgundy[900]}40`,
                    border: `1px solid ${PremiumTheme.colors.burgundy[500]}30`
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">✓</div>
                    <div className="text-left">
                      <p 
                        className="font-semibold"
                        style={{ color: PremiumTheme.colors.text.primary }}
                      >
                        Lightning-fast checkout
                      </p>
                      <p 
                        className="text-sm"
                        style={{ color: PremiumTheme.colors.text.muted }}
                      >
                        Skip the forms, order in seconds
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">✓</div>
                    <div className="text-left">
                      <p 
                        className="font-semibold"
                        style={{ color: PremiumTheme.colors.text.primary }}
                      >
                        Saved favorites & reorder with one click
                      </p>
                      <p 
                        className="text-sm"
                        style={{ color: PremiumTheme.colors.text.muted }}
                      >
                        Your go-to dishes, always ready
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">✓</div>
                    <div className="text-left">
                      <p 
                        className="font-semibold"
                        style={{ color: PremiumTheme.colors.text.primary }}
                      >
                        Personalized menu recommendations
                      </p>
                      <p 
                        className="text-sm"
                        style={{ color: PremiumTheme.colors.text.muted }}
                      >
                        Discover dishes you'll love
                      </p>
                    </div>
                  </div>
                </div>

                {/* Primary CTA */}
                <Button
                  size="lg"
                  className="w-full max-w-md mx-auto text-lg py-6"
                  style={{
                    backgroundColor: PremiumTheme.colors.burgundy[500],
                    color: 'white'
                  }}
                  onClick={handleNext}
                >
                  Let's Get Started
                </Button>

                {/* Skip link */}
                <button
                  onClick={dismissWizard}
                  className="text-sm underline hover:no-underline transition-all"
                  style={{ color: PremiumTheme.colors.text.muted }}
                >
                  Skip for now
                </button>
              </div>
            )}

            {/* Existing Step 1-4 content */}
            {currentStep > 0 && (
              <>
                {/* Description */}
                <p 
                  className="text-center mb-8 text-lg"
                  style={{ color: PremiumTheme.colors.text.secondary }}
                >
                  {currentStep === 1 && "We'll use this to contact you about your orders"}
                  {currentStep === 2 && "Where should we deliver?"}
                  {currentStep === 3 && "Browse & save dishes you love for quick reordering"}
                  {currentStep === 4 && (
                    <>
                      Join hundreds of customers enjoying <br />
                      award-winning Indian cuisine since 1985
                    </>
                  )}
                </p>

                {/* Step Content Card */}
                <div 
                  className="rounded-xl p-8 mb-8"
                  style={{
                    backgroundColor: `${PremiumTheme.colors.burgundy[900]}40`,
                    border: `1px solid ${PremiumTheme.colors.burgundy[500]}30`
                  }}
                >
                  {/* Step 1: Phone Number */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div 
                        className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                        style={{ 
                          backgroundColor: `${PremiumTheme.colors.burgundy[500]}20`,
                          border: `2px solid ${PremiumTheme.colors.burgundy[500]}`
                        }}
                      >
                        <Phone className="w-10 h-10" style={{ color: PremiumTheme.colors.burgundy[400] }} />
                      </div>
                      
                      <div className="text-center">
                        <h3 
                          className="text-xl font-semibold mb-2"
                          style={{ color: PremiumTheme.colors.text.primary }}
                        >
                          Add phone number
                        </h3>
                        <p 
                          className="text-sm"
                          style={{ color: PremiumTheme.colors.text.muted }}
                        >
                          (Required for ordering)
                        </p>
                      </div>

                      {/* Inline Phone Input Form */}
                      <div className="max-w-md mx-auto space-y-4">
                        <div>
                          <Label 
                            htmlFor="phone" 
                            className="mb-2 block"
                            style={{ color: PremiumTheme.colors.text.secondary }}
                          >
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="07XXX XXXXXX or +44 7XXX XXXXXX"
                            value={phoneNumber}
                            onChange={(e) => {
                              setPhoneNumber(e.target.value);
                              setPhoneError('');
                            }}
                            className="text-base"
                            style={{
                              backgroundColor: PremiumTheme.colors.dark[800],
                              borderColor: phoneError ? '#EF4444' : PremiumTheme.colors.dark[600],
                              color: PremiumTheme.colors.text.primary
                            }}
                          />
                          {phoneError && (
                            <p className="text-sm mt-1" style={{ color: '#EF4444' }}>
                              {phoneError}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Delivery Address */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div 
                        className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                        style={{ 
                          backgroundColor: `${PremiumTheme.colors.burgundy[500]}20`,
                          border: `2px solid ${PremiumTheme.colors.burgundy[500]}`
                        }}
                      >
                        <MapPin className="w-10 h-10" style={{ color: PremiumTheme.colors.burgundy[400] }} />
                      </div>
                      
                      <div className="text-center">
                        <h3 
                          className="text-xl font-semibold mb-2"
                          style={{ color: PremiumTheme.colors.text.primary }}
                        >
                          Add delivery address
                        </h3>
                        <p 
                          className="text-sm"
                          style={{ color: PremiumTheme.colors.text.muted }}
                        >
                          (Optional - you can add this later)
                        </p>
                      </div>

                      {/* Inline Address Form */}
                      <div className="max-w-md mx-auto space-y-4">
                        {/* Google Maps Autocomplete */}
                        {googleMapsApiKey && (
                          <div>
                            <Label 
                              className="mb-2 block"
                              style={{ color: PremiumTheme.colors.text.secondary }}
                            >
                              Search for your address
                            </Label>
                            <GooglePlacesAutocompleteEnhanced
                              onAddressSelect={handleAddressSelect}
                              placeholder="Start typing your address..."
                              googleMapsApiKey={googleMapsApiKey}
                              className="w-full"
                            />
                            <p className="text-xs mt-2" style={{ color: PremiumTheme.colors.text.muted }}>
                              Or enter manually below
                            </p>
                          </div>
                        )}
                        
                        <div>
                          <Label 
                            htmlFor="address_line1" 
                            className="mb-2 block"
                            style={{ color: PremiumTheme.colors.text.secondary }}
                          >
                            Street Address
                          </Label>
                          <Input
                            id="address_line1"
                            type="text"
                            placeholder="123 High Street"
                            value={addressData.address_line1}
                            onChange={(e) => {
                              setAddressData({ ...addressData, address_line1: e.target.value });
                              setAddressErrors({ ...addressErrors, address_line1: '' });
                            }}
                            style={{
                              backgroundColor: PremiumTheme.colors.dark[800],
                              borderColor: addressErrors.address_line1 ? '#EF4444' : PremiumTheme.colors.dark[600],
                              color: PremiumTheme.colors.text.primary
                            }}
                          />
                          {addressErrors.address_line1 && (
                            <p className="text-sm mt-1" style={{ color: '#EF4444' }}>
                              {addressErrors.address_line1}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label 
                            htmlFor="address_line2" 
                            className="mb-2 block"
                            style={{ color: PremiumTheme.colors.text.secondary }}
                          >
                            Apartment, Suite, etc. (Optional)
                          </Label>
                          <Input
                            id="address_line2"
                            type="text"
                            placeholder="Apt 4B"
                            value={addressData.address_line2}
                            onChange={(e) => setAddressData({ ...addressData, address_line2: e.target.value })}
                            style={{
                              backgroundColor: PremiumTheme.colors.dark[800],
                              borderColor: PremiumTheme.colors.dark[600],
                              color: PremiumTheme.colors.text.primary
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label 
                              htmlFor="city" 
                              className="mb-2 block"
                              style={{ color: PremiumTheme.colors.text.secondary }}
                            >
                              City
                            </Label>
                            <Input
                              id="city"
                              type="text"
                              placeholder="London"
                              value={addressData.city}
                              onChange={(e) => {
                                setAddressData({ ...addressData, city: e.target.value });
                                setAddressErrors({ ...addressErrors, city: '' });
                              }}
                              style={{
                                backgroundColor: PremiumTheme.colors.dark[800],
                                borderColor: addressErrors.city ? '#EF4444' : PremiumTheme.colors.dark[600],
                                color: PremiumTheme.colors.text.primary
                              }}
                            />
                            {addressErrors.city && (
                              <p className="text-sm mt-1" style={{ color: '#EF4444' }}>
                                {addressErrors.city}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label 
                              htmlFor="postal_code" 
                              className="mb-2 block"
                              style={{ color: PremiumTheme.colors.text.secondary }}
                            >
                              Postcode
                            </Label>
                            <Input
                              id="postal_code"
                              type="text"
                              placeholder="SW1A 1AA"
                              value={addressData.postal_code}
                              onChange={(e) => {
                                setAddressData({ ...addressData, postal_code: e.target.value.toUpperCase() });
                                setAddressErrors({ ...addressErrors, postal_code: '' });
                              }}
                              style={{
                                backgroundColor: PremiumTheme.colors.dark[800],
                                borderColor: addressErrors.postal_code ? '#EF4444' : PremiumTheme.colors.dark[600],
                                color: PremiumTheme.colors.text.primary
                              }}
                            />
                            {addressErrors.postal_code && (
                              <p className="text-sm mt-1" style={{ color: '#EF4444' }}>
                                {addressErrors.postal_code}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Browse Favorites */}
                  {currentStep === 3 && (
                    <div className="text-center space-y-6">
                      <div 
                        className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                        style={{ 
                          backgroundColor: `${PremiumTheme.colors.burgundy[500]}20`,
                          border: `2px solid ${PremiumTheme.colors.burgundy[500]}`
                        }}
                      >
                        <Heart className="w-10 h-10" style={{ color: PremiumTheme.colors.burgundy[400] }} />
                      </div>
                      
                      <div>
                        <h3 
                          className="text-xl font-semibold mb-2"
                          style={{ color: PremiumTheme.colors.text.primary }}
                        >
                          Browse & save your favorites
                        </h3>
                      </div>

                      <Button
                        size="lg"
                        className="w-full max-w-md mx-auto"
                        style={{
                          backgroundColor: PremiumTheme.colors.burgundy[500],
                          color: 'white'
                        }}
                        onClick={() => {
                          // Navigate to online menu
                          dismissWizard();
                          onNavigateToSection && onNavigateToSection('favorites');
                        }}
                      >
                        Browse menu
                      </Button>
                    </div>
                  )}

                  {/* Step 4: Completion */}
                  {currentStep === 4 && (
                    <div className="text-center space-y-6">
                      <div 
                        className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                        style={{ 
                          backgroundColor: `${PremiumTheme.colors.burgundy[500]}20`,
                          border: `2px solid ${PremiumTheme.colors.burgundy[500]}`
                        }}
                      >
                        <PartyPopper className="w-10 h-10" style={{ color: PremiumTheme.colors.burgundy[400] }} />
                      </div>
                      
                      <div>
                        <h3 
                          className="text-2xl font-bold mb-4"
                          style={{ color: PremiumTheme.colors.text.primary }}
                        >
                          🎉 Welcome to Cottage Tandoori!
                        </h3>
                        
                        {/* Show saved data */}
                        {(savedPhone || savedAddress) && (
                          <div 
                            className="mb-6 p-4 rounded-lg text-left"
                            style={{ 
                              backgroundColor: `${PremiumTheme.colors.burgundy[900]}30`,
                              border: `1px solid ${PremiumTheme.colors.burgundy[500]}20`
                            }}
                          >
                            <p 
                              className="text-sm font-semibold mb-2"
                              style={{ color: PremiumTheme.colors.text.secondary }}
                            >
                              Your profile is complete:
                            </p>
                            {savedPhone && (
                              <p 
                                className="text-sm mb-1 flex items-center"
                                style={{ color: PremiumTheme.colors.text.secondary }}
                              >
                                <Phone className="w-4 h-4 mr-2" />
                                {savedPhone}
                              </p>
                            )}
                            {savedAddress && (
                              <p 
                                className="text-sm flex items-start"
                                style={{ color: PremiumTheme.colors.text.secondary }}
                              >
                                <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                                {savedAddress}
                              </p>
                            )}
                          </div>
                        )}
                        
                        <div className="space-y-4">
                          <p 
                            className="text-base"
                            style={{ color: PremiumTheme.colors.text.secondary }}
                          >
                            🌟 Try our signature dishes:
                          </p>
                          <ul 
                            className="space-y-2 text-left max-w-md mx-auto"
                            style={{ color: PremiumTheme.colors.text.secondary }}
                          >
                            <li className="flex items-center space-x-2">
                              <span>•</span>
                              <span>Chicken Tikka Masala</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <span>•</span>
                              <span>Lamb Rogan Josh</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <span>•</span>
                              <span>Paneer Butter Masala</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <Button
                        size="lg"
                        className="w-full max-w-md mx-auto"
                        style={{
                          backgroundColor: PremiumTheme.colors.burgundy[500],
                          color: 'white'
                        }}
                        onClick={handleComplete}
                        disabled={isCompleting}
                      >
                        {isCompleting ? 'Completing...' : 'Explore Menu'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Navigation Footer - STICKY */}
                <div 
                  className="flex-shrink-0 px-4 md:px-8 py-4 md:py-6 border-t"
                  style={{ 
                    backgroundColor: PremiumTheme.colors.background.primary,
                    borderColor: 'rgba(139, 21, 56, 0.2)'
                  }}
                >
                  {/* Progress Dots */}
                  <div className="flex justify-center space-x-2 mb-4 md:mb-6">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className="w-2 h-2 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: step === currentStep 
                            ? PremiumTheme.colors.gold[500]
                            : PremiumTheme.colors.dark[600]
                        }}
                      />
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      onClick={handlePrevious}
                      disabled={currentStep === 0}
                      className="text-sm md:text-base"
                      style={{ 
                        color: currentStep === 0 
                          ? PremiumTheme.colors.text.muted 
                          : PremiumTheme.colors.text.secondary
                      }}
                    >
                      Previous
                    </Button>

                    {/* Show "Skip for now" on Step 2 (address) only */}
                    {currentStep === 2 ? (
                      <div className="flex items-center space-x-2 md:space-x-3">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            toast.info('Address skipped - you can add it later from your profile');
                            setCurrentStep(currentStep + 1);
                          }}
                          className="text-sm md:text-base"
                          style={{ color: PremiumTheme.colors.text.muted }}
                        >
                          Skip for now
                        </Button>
                        
                        <Button
                          onClick={handleNext}
                          disabled={isSaving}
                          className="text-sm md:text-base"
                          style={{
                            backgroundColor: PremiumTheme.colors.burgundy[500],
                            color: 'white'
                          }}
                        >
                          {isSaving ? 'Saving...' : 'Next'}
                        </Button>
                      </div>
                    ) : currentStep === 4 ? (
                      // Step 4 (completion) - no middle button
                      <div />
                    ) : (
                      // Steps 0, 1, 3 - show global dismiss
                      <Button
                        variant="ghost"
                        onClick={dismissWizard}
                        className="text-sm md:text-base"
                        style={{ color: PremiumTheme.colors.text.muted }}
                      >
                        Skip wizard
                      </Button>
                    )}

                    {/* Next button (except on Step 2 where it's grouped with Skip) */}
                    {currentStep !== 2 && (
                      <Button
                        onClick={currentStep === 4 ? handleComplete : handleNext}
                        disabled={isSaving || (currentStep === 4 && isCompleting)}
                        className="text-sm md:text-base"
                        style={{
                          backgroundColor: PremiumTheme.colors.burgundy[500],
                          color: 'white'
                        }}
                      >
                        {currentStep === 4 
                          ? (isCompleting ? 'Completing...' : 'Get Started') 
                          : (isSaving ? 'Saving...' : 'Next')}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { OnboardingWizard };
