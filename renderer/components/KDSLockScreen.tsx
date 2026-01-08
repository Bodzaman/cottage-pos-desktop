import React, { useState, useEffect } from 'react';
import { Lock, Unlock, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from 'app';
import { toast } from 'sonner';

interface KDSLockScreenProps {
  onUnlock: () => void;
  restaurantName?: string;
}

/**
 * KDS PIN Lock Screen
 * Professional 4-digit PIN entry for kitchen display access control
 * Handles both first-time setup and verification
 */
export function KDSLockScreen({ onUnlock, restaurantName = 'Cottage Tandoori' }: KDSLockScreenProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'checking' | 'setup' | 'verify'>('checking');
  const [isSettingPin, setIsSettingPin] = useState(false); // Track if entering first or second PIN

  // Check if PIN is already set on mount
  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await apiClient.check_kds_schema();
      const result = await response.json();
      
      if (!result.schema_ready) {
        // Initialize schema first
        await apiClient.setup_kds_schema();
      }
      
      if (result.has_pin_set) {
        setMode('verify');
      } else {
        setMode('setup');
      }
    } catch (error) {
      console.error('Failed to check KDS setup:', error);
      setMode('setup'); // Default to setup mode if check fails
    }
  };

  // Auto-clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleNumberClick = (num: string) => {
    if (mode === 'setup' && !isSettingPin && pin.length < 4) {
      setPin(pin + num);
      setError(null);
    } else if (mode === 'setup' && isSettingPin && confirmPin.length < 4) {
      setConfirmPin(confirmPin + num);
      setError(null);
    } else if (mode === 'verify' && pin.length < 4) {
      setPin(pin + num);
      setError(null);
    }
  };

  const handleClear = () => {
    if (isSettingPin) {
      setConfirmPin('');
    } else {
      setPin('');
    }
    setError(null);
  };

  const handleSetupSubmit = async () => {
    if (!isSettingPin) {
      // First PIN entry - move to confirmation
      if (pin.length !== 4) {
        setError('Please enter 4 digits');
        return;
      }
      setIsSettingPin(true);
      setError(null);
    } else {
      // Confirmation entry - check if they match
      if (confirmPin.length !== 4) {
        setError('Please enter 4 digits');
        return;
      }
      
      if (pin !== confirmPin) {
        setError('PINs do not match. Try again.');
        setPin('');
        setConfirmPin('');
        setIsSettingPin(false);
        return;
      }
      
      // Set the PIN
      setIsVerifying(true);
      try {
        const response = await apiClient.set_kds_pin({ pin });
        const result = await response.json();
        
        if (result.success) {
          toast.success('PIN set successfully!');
          onUnlock();
        } else {
          setError(result.message || 'Failed to set PIN');
          setPin('');
          setConfirmPin('');
          setIsSettingPin(false);
        }
      } catch (error) {
        console.error('Failed to set PIN:', error);
        setError('Failed to set PIN');
        setPin('');
        setConfirmPin('');
        setIsSettingPin(false);
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleVerifySubmit = async () => {
    if (pin.length !== 4) {
      setError('Please enter 4 digits');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await apiClient.verify_kds_pin({ pin });
      const result = await response.json();

      if (result.success) {
        toast.success('Access granted');
        onUnlock();
      } else {
        setError(result.message || 'Incorrect PIN');
        setPin('');
      }
    } catch (err) {
      console.error('PIN verification error:', err);
      setError('Verification failed');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async () => {
    if (mode === 'setup') {
      await handleSetupSubmit();
    } else {
      await handleVerifySubmit();
    }
  };

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (mode === 'verify' && pin.length === 4) {
      handleVerifySubmit();
    } else if (mode === 'setup' && !isSettingPin && pin.length === 4) {
      handleSetupSubmit();
    } else if (mode === 'setup' && isSettingPin && confirmPin.length === 4) {
      handleSetupSubmit();
    }
  }, [pin, confirmPin]);

  // Keyboard support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleNumberClick(e.key);
      } else if (e.key === 'Backspace') {
        if (isSettingPin) {
          setConfirmPin(confirmPin.slice(0, -1));
        } else {
          setPin(pin.slice(0, -1));
        }
      } else if (e.key === 'Enter') {
        if (mode === 'verify' && pin.length === 4) {
          handleVerifySubmit();
        } else if (mode === 'setup') {
          handleSetupSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pin, confirmPin, mode, isSettingPin]);

  // Show loading state while checking
  if (mode === 'checking') {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
          zIndex: 9999
        }}
      >
        <div className="text-center">
          <div className="animate-pulse text-gray-400">Initializing...</div>
        </div>
      </div>
    );
  }

  const currentPin = isSettingPin ? confirmPin : pin;
  const promptText = mode === 'setup' 
    ? (isSettingPin ? 'Confirm your 4-digit PIN' : 'Create a 4-digit PIN')
    : 'Enter 4-digit PIN to access';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
        zIndex: 9999
      }}
    >
      <div className="text-center space-y-8 max-w-md w-full px-6">
        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="p-6 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)'
            }}
          >
            {mode === 'setup' ? (
              <KeyRound className="w-16 h-16 text-red-500" />
            ) : (
              <Lock className="w-16 h-16 text-red-500" />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1
            className="text-4xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #B91C1C 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {restaurantName}
          </h1>
          <p className="text-xl text-gray-400 font-medium">Kitchen Display System</p>
          <p className="text-sm text-gray-500">{promptText}</p>
          {mode === 'setup' && !isSettingPin && (
            <p className="text-xs text-amber-500 mt-2">First time setup - you'll need to confirm it</p>
          )}
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold transition-all duration-200"
              style={{
                background: currentPin.length > i
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.1) 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: currentPin.length > i
                  ? '2px solid rgba(239, 68, 68, 0.5)'
                  : '2px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                boxShadow: currentPin.length > i ? '0 0 20px rgba(239, 68, 68, 0.3)' : 'none'
              }}
            >
              {currentPin.length > i ? '●' : ''}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="px-4 py-3 rounded-lg text-sm font-medium"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444'
            }}
          >
            {error}
          </div>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <Button
              key={num}
              onClick={() => handleNumberClick(num)}
              disabled={isVerifying}
              className="h-16 text-2xl font-bold transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                border: '2px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                borderRadius: '0.75rem'
              }}
            >
              {num}
            </Button>
          ))}

          <Button
            onClick={handleClear}
            disabled={isVerifying || currentPin.length === 0}
            className="h-16 text-sm font-medium transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              borderRadius: '0.75rem'
            }}
          >
            Clear
          </Button>

          <Button
            onClick={() => handleNumberClick('0')}
            disabled={isVerifying}
            className="h-16 text-2xl font-bold transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
              border: '2px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              borderRadius: '0.75rem'
            }}
          >
            0
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isVerifying || currentPin.length !== 4}
            className="h-16 text-sm font-medium transition-all duration-200"
            style={{
              background:
                currentPin.length === 4
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(34, 197, 94, 0.1) 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
              border:
                currentPin.length === 4
                  ? '2px solid rgba(34, 197, 94, 0.5)'
                  : '2px solid rgba(255, 255, 255, 0.1)',
              color: currentPin.length === 4 ? '#22C55E' : '#666',
              borderRadius: '0.75rem'
            }}
          >
            {isVerifying ? (
              <span className="animate-pulse">Verifying...</span>
            ) : mode === 'setup' && !isSettingPin ? (
              'Next'
            ) : (
              <Unlock className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Footer Hint */}
        <p className="text-xs text-gray-600 mt-8">
          {mode === 'setup' ? 'This PIN will be used for all kitchen staff' : 'Contact manager to reset PIN'}
        </p>
      </div>
    </div>
  );
}
