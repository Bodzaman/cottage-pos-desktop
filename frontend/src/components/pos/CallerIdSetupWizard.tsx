/**
 * Caller ID Setup Wizard
 * Step-by-step wizard for connecting Yealink phones to the POS system
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Plus,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Trash2,
  RefreshCw,
  Wifi,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  HelpCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { globalColors } from '../../utils/QSAIDesign';
import { toast } from 'sonner';
import {
  CallerIdDevice,
  CallerIdConfig,
  fetchDevices,
  addDevice,
  removeDevice,
  fetchConfig,
  simulateTestCall,
  formatMacAddress,
  formatMacAddressInput,
  isValidMacAddress,
  copyToClipboard,
  getDeviceStatusInfo
} from '../../utils/callerIdSetupHelpers';

// =============================================================================
// Types
// =============================================================================

interface CallerIdSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = 'welcome' | 'add-device' | 'configure' | 'test';

// =============================================================================
// Help Icon Component (Hover tooltip + Click for details)
// =============================================================================

const HelpIcon: React.FC<{
  tooltip: string;
  title?: string;
  fullHelp: React.ReactNode;
}> = ({ tooltip, title, fullHelp }) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toast(title || 'Help', {
              description: fullHelp,
              duration: 15000,
              className: 'max-w-md'
            });
          }}
          className="ml-1.5 text-gray-400 hover:text-purple-400 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-full"
          aria-label="Help"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-gray-800 border-gray-700 text-white">
        <p className="text-xs">{tooltip}</p>
        <p className="text-xs text-gray-400 mt-1">Click for more details</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// =============================================================================
// Help Content Components
// =============================================================================

const MacAddressHelpContent: React.FC = () => (
  <div className="text-sm space-y-3">
    <p className="font-medium">The MAC address is a unique ID for your phone system.</p>
    <p className="text-gray-400">It looks like: AA:BB:CC:DD:EE:FF (12 characters)</p>

    <div className="border-t border-gray-700 pt-3 mt-3">
      <p className="font-medium text-purple-400 mb-2">For Cordless Systems (W70B/W73/W76):</p>
      <p className="text-gray-400 mb-1">Use the BASE STATION's MAC, not the handset!</p>
      <ul className="text-gray-400 space-y-1 text-xs">
        <li>Check the label on bottom of your W70B base unit</li>
        <li>Or go to http://[base-ip] → Status → Device Info</li>
      </ul>
    </div>

    <div className="border-t border-gray-700 pt-3">
      <p className="font-medium text-purple-400 mb-2">For Desk Phones (T46U/T54W etc):</p>
      <ul className="text-gray-400 space-y-1 text-xs">
        <li>Check the label on bottom/back of phone</li>
        <li>Or press Menu → Status → Network</li>
        <li>Or go to http://[phone-ip] → Status</li>
      </ul>
    </div>

    <p className="text-xs text-gray-500 italic">Just type the letters and numbers - we'll format it for you!</p>
  </div>
);

const IpAddressHelpContent: React.FC = () => (
  <div className="text-sm space-y-3">
    <p className="font-medium">An IP address is like a "phone number" for network devices.</p>
    <p className="text-gray-400">It looks like: 192.168.1.100 (four numbers with dots)</p>

    <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 my-2">
      <p className="text-amber-400 text-xs">This field is OPTIONAL - leave blank if unsure!</p>
    </div>

    <div className="border-t border-gray-700 pt-3 mt-3">
      <p className="font-medium text-purple-400 mb-2">For Cordless Systems (W70B):</p>
      <ul className="text-gray-400 space-y-1 text-xs">
        <li>On handset: Press OK → Status → Base → IP Address</li>
        <li>Or check your router's connected devices list</li>
      </ul>
    </div>

    <div className="border-t border-gray-700 pt-3">
      <p className="font-medium text-purple-400 mb-2">For Desk Phones:</p>
      <ul className="text-gray-400 space-y-1 text-xs">
        <li>Press Menu → Status → Network → IP Address</li>
        <li>Some phones show IP on the main display</li>
      </ul>
    </div>
  </div>
);

const DeviceNameHelpContent: React.FC = () => (
  <div className="text-sm space-y-2">
    <p className="font-medium">Give this phone a friendly name to identify it later.</p>
    <p className="text-gray-400">Examples:</p>
    <ul className="text-gray-400 space-y-1 text-xs">
      <li>• "Front Desk" - Main reception phone</li>
      <li>• "Kitchen Phone" - Kitchen area</li>
      <li>• "Manager Office" - Back office</li>
    </ul>
  </div>
);

// =============================================================================
// Expandable Configuration Guide
// =============================================================================

const ConfigurationGuide: React.FC<{ phoneType: 'dect' | 'desk' }> = ({ phoneType }) => {
  const isDect = phoneType === 'dect';

  return (
    <div className="text-sm space-y-4 text-gray-300">
      {isDect && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-4">
          <p className="font-medium text-purple-400 mb-1">Important: DECT Cordless System</p>
          <p className="text-xs text-gray-400">
            Your system has TWO parts: Base Station (W70B) and Handset (W73H).
            <br />You configure the <strong className="text-white">BASE STATION</strong>, not the handset.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex gap-3">
          <span className="text-purple-400 font-bold shrink-0">1.</span>
          <div>
            <p className="font-medium text-white">Find the IP address</p>
            <p className="text-xs text-gray-400">
              {isDect
                ? 'On handset: Press OK → Status → Base → IP Address'
                : 'On phone: Press Menu → Status → Network'
              }
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <span className="text-purple-400 font-bold shrink-0">2.</span>
          <div>
            <p className="font-medium text-white">Open web browser</p>
            <p className="text-xs text-gray-400">
              Type the IP in your browser address bar (e.g., http://192.168.1.50)
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <span className="text-purple-400 font-bold shrink-0">3.</span>
          <div>
            <p className="font-medium text-white">Log in</p>
            <p className="text-xs text-gray-400">
              Default: Username <code className="bg-gray-800 px-1 rounded">admin</code>, Password <code className="bg-gray-800 px-1 rounded">admin</code>
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <span className="text-purple-400 font-bold shrink-0">4.</span>
          <div>
            <p className="font-medium text-white">Find Action URL settings</p>
            <p className="text-xs text-gray-400">
              Click <strong>Features</strong> in the menu, then <strong>Action URL</strong>
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <span className="text-purple-400 font-bold shrink-0">5.</span>
          <div>
            <p className="font-medium text-white">Paste the URLs</p>
            <p className="text-xs text-gray-400">
              Copy each URL above and paste into the matching field:
              <br />• "Incoming Call" → first URL
              <br />• "Call Established" → second URL
              <br />• "Call Terminated" → third URL
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <span className="text-purple-400 font-bold shrink-0">6.</span>
          <div>
            <p className="font-medium text-white">Save changes</p>
            <p className="text-xs text-gray-400">
              Click "Confirm" or "Submit" at the bottom of the page
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Step Progress Indicator
// =============================================================================

const StepIndicator: React.FC<{
  currentStep: WizardStep;
  steps: { id: WizardStep; label: string }[];
}> = ({ currentStep, steps }) => {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-purple-500 text-white ring-4 ring-purple-500/30'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              <span
                className={`text-xs mt-2 ${
                  isActive ? 'text-white font-medium' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mb-6 transition-colors duration-300 ${
                  index < currentIndex ? 'bg-green-500' : 'bg-gray-700'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// =============================================================================
// Device Card Component
// =============================================================================

const DeviceCard: React.FC<{
  device: CallerIdDevice;
  onRemove: (id: string) => void;
  onTest: (mac: string) => void;
  isTestingThis: boolean;
}> = ({ device, onRemove, onTest, isTestingThis }) => {
  const statusInfo = getDeviceStatusInfo(device);

  const statusColors = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };

  return (
    <div
      className="p-4 rounded-xl border transition-all duration-200 hover:border-purple-500/30"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(124, 93, 250, 0.15)' }}
          >
            <Phone className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h4 className="font-medium text-white">{device.device_name}</h4>
            <p className="text-sm text-gray-400 font-mono">
              {formatMacAddress(device.mac_address)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[statusInfo.color]}`}
          >
            {statusInfo.label}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTest(device.mac_address)}
            disabled={isTestingThis}
            className="text-gray-400 hover:text-white"
          >
            {isTestingThis ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(device.id)}
            className="text-gray-400 hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// URL Copy Field Component
// =============================================================================

const urlHelpContent: Record<string, { yealinkField: string; description: string }> = {
  'Incoming Call': {
    yealinkField: 'Incoming Call',
    description: 'Paste this in the "Incoming Call" field. This notifies the POS when someone calls.'
  },
  'Call Established': {
    yealinkField: 'Call Established (or Connected)',
    description: 'Paste this in the "Established" or "Connected" field. This updates when you answer.'
  },
  'Call Terminated': {
    yealinkField: 'Call Terminated (or Disconnected)',
    description: 'Paste this in the "Terminated" or "Disconnected" field. This clears the popup when the call ends.'
  }
};

const CopyableUrl: React.FC<{
  label: string;
  url: string;
}> = ({ label, url }) => {
  const [copied, setCopied] = useState(false);
  const helpInfo = urlHelpContent[label];

  const handleCopy = async () => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      toast.success(`${label} URL copied!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-gray-400 text-sm flex items-center">
        {label}
        {helpInfo && (
          <HelpIcon
            tooltip={`Paste in "${helpInfo.yealinkField}" field`}
            title={label}
            fullHelp={
              <div className="text-sm">
                <p>{helpInfo.description}</p>
                <p className="text-xs text-gray-400 mt-2">
                  In your phone's web interface: <strong>Features → Action URL</strong>
                </p>
              </div>
            }
          />
        )}
      </Label>
      <div className="flex gap-2">
        <Input
          value={url}
          readOnly
          className="font-mono text-xs bg-gray-800/50 border-gray-700 text-gray-300"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className={`shrink-0 transition-colors ${
            copied
              ? 'bg-green-500/20 border-green-500 text-green-400'
              : 'border-gray-600 text-gray-400 hover:text-white'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

// =============================================================================
// Main Wizard Component
// =============================================================================

export const CallerIdSetupWizard: React.FC<CallerIdSetupWizardProps> = ({
  isOpen,
  onClose
}) => {
  // State
  const [step, setStep] = useState<WizardStep>('welcome');
  const [devices, setDevices] = useState<CallerIdDevice[]>([]);
  const [config, setConfig] = useState<CallerIdConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [testingDevice, setTestingDevice] = useState<string | null>(null);

  // Form state for adding device
  const [deviceName, setDeviceName] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [ipAddress, setIpAddress] = useState('');

  // Help state
  const [showGuide, setShowGuide] = useState(false);
  const [phoneType, setPhoneType] = useState<'dect' | 'desk'>('dect');

  // Steps definition
  const steps: { id: WizardStep; label: string }[] = [
    { id: 'welcome', label: 'Welcome' },
    { id: 'add-device', label: 'Add Phone' },
    { id: 'configure', label: 'Configure' },
    { id: 'test', label: 'Test' }
  ];

  // Load data on open
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deviceList, configData] = await Promise.all([
        fetchDevices(),
        fetchConfig()
      ]);
      setDevices(deviceList);
      setConfig(configData);
    } catch (error) {
      console.error('[CallerID] Failed to load data:', error);
    }
    setLoading(false);
  };

  // Handle adding device
  const handleAddDevice = async () => {
    if (!deviceName.trim()) {
      toast.error('Please enter a device name');
      return;
    }

    if (!isValidMacAddress(macAddress)) {
      toast.error('Please enter a valid MAC address');
      return;
    }

    setLoading(true);
    const result = await addDevice(deviceName, macAddress, ipAddress || undefined);

    if (result.success) {
      toast.success(result.message);
      setDeviceName('');
      setMacAddress('');
      setIpAddress('');
      await loadData();
      setStep('configure');
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  // Handle removing device
  const handleRemoveDevice = async (deviceId: string) => {
    const result = await removeDevice(deviceId);
    if (result.success) {
      toast.success(result.message);
      await loadData();
    } else {
      toast.error(result.message);
    }
  };

  // Handle test call
  const handleTestCall = async (deviceMac?: string) => {
    setTestingDevice(deviceMac || 'all');

    const result = await simulateTestCall('07700900123', deviceMac);

    if (result.success) {
      toast.success('Test call sent! Check your POS screen.', {
        description: 'You should see a caller popup appear.',
        duration: 5000
      });
    } else {
      toast.error(result.message);
    }

    setTestingDevice(null);
  };

  // MAC address input handler with auto-formatting
  const handleMacChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatMacAddressInput(e.target.value);
    setMacAddress(formatted);
  };

  // Navigation
  const canGoNext = () => {
    switch (step) {
      case 'welcome':
        return true;
      case 'add-device':
        return devices.length > 0 || (deviceName && isValidMacAddress(macAddress));
      case 'configure':
        return devices.length > 0 && config?.secret_configured;
      case 'test':
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    const currentIndex = steps.findIndex(s => s.id === step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1].id);
    } else {
      onClose();
    }
  };

  const goBack = () => {
    const currentIndex = steps.findIndex(s => s.id === step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1].id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl mx-4 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${globalColors.background.primary} 0%, ${globalColors.background.secondary} 100%)`,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 border-b flex items-center justify-between"
          style={{ borderBottomColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${globalColors.purple.primary} 0%, ${globalColors.purple.dark} 100%)`
              }}
            >
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Caller ID Setup</h2>
              <p className="text-sm text-gray-400">Connect your Yealink phones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <span className="sr-only">Close</span>
            &times;
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-6">
          <StepIndicator currentStep={step} steps={steps} />
        </div>

        {/* Content */}
        <div className="px-6 py-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {/* Step 1: Welcome */}
            {step === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Connect Your Phone System
                  </h3>
                  <p className="text-gray-400">
                    When customers call, their details will appear on your POS screen automatically.
                  </p>
                </div>

                {/* How it works diagram */}
                <div
                  className="p-6 rounded-xl"
                  style={{ background: 'rgba(124, 93, 250, 0.1)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                        <Phone className="w-8 h-8 text-purple-400" />
                      </div>
                      <p className="text-sm text-gray-300">Yealink Phone</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-500" />
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                        <Wifi className="w-8 h-8 text-purple-400" />
                      </div>
                      <p className="text-sm text-gray-300">Your Server</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-500" />
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                      </div>
                      <p className="text-sm text-gray-300">POS Display</p>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-300">You'll need:</p>
                  <ul className="space-y-2">
                    {[
                      'Yealink phone (W70B/W73P cordless OR T4x/T5x desk)',
                      "Base station or phone's MAC address",
                      'Access to web interface (computer on same network)'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-400">
                        <Check className="w-4 h-4 text-green-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* DECT Note */}
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-purple-400 font-medium">Using cordless phones (W70B/W73P)?</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Configure the <strong className="text-white">base station</strong>, not the handset. The handset just connects wirelessly.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Add Device */}
            {step === 'add-device' && (
              <motion.div
                key="add-device"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Register Your Phone
                  </h3>
                  <p className="text-gray-400">
                    Add your Yealink phone to the system.
                  </p>
                </div>

                {/* Existing devices */}
                {devices.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-300">
                      Registered Phones ({devices.length})
                    </p>
                    {devices.map(device => (
                      <DeviceCard
                        key={device.id}
                        device={device}
                        onRemove={handleRemoveDevice}
                        onTest={handleTestCall}
                        isTestingThis={testingDevice === device.mac_address}
                      />
                    ))}
                  </div>
                )}

                {/* Add new device form */}
                <div
                  className="p-4 rounded-xl border space-y-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="flex items-center gap-2 text-gray-300">
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">Add New Phone</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-400 flex items-center">
                        Device Name *
                        <HelpIcon
                          tooltip="A friendly name for this phone"
                          title="Device Name"
                          fullHelp={<DeviceNameHelpContent />}
                        />
                      </Label>
                      <Input
                        value={deviceName}
                        onChange={e => setDeviceName(e.target.value)}
                        placeholder="e.g., Front Desk"
                        className="bg-gray-800/50 border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400 flex items-center">
                        MAC Address *
                        <HelpIcon
                          tooltip="Found on label under phone/base"
                          title="Finding Your MAC Address"
                          fullHelp={<MacAddressHelpContent />}
                        />
                      </Label>
                      <div className="relative">
                        <Input
                          value={macAddress}
                          onChange={handleMacChange}
                          placeholder="e.g., AA:BB:CC:DD:EE:FF"
                          maxLength={17}
                          className={`bg-gray-800/50 border-gray-700 font-mono pr-8 ${
                            macAddress && !isValidMacAddress(macAddress)
                              ? 'border-red-500'
                              : macAddress && isValidMacAddress(macAddress)
                              ? 'border-green-500'
                              : ''
                          }`}
                        />
                        {macAddress && isValidMacAddress(macAddress) && (
                          <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-400 flex items-center">
                      IP Address (optional)
                      <HelpIcon
                        tooltip="Extra security - leave blank if unsure"
                        title="IP Address (Optional)"
                        fullHelp={<IpAddressHelpContent />}
                      />
                    </Label>
                    <Input
                      value={ipAddress}
                      onChange={e => setIpAddress(e.target.value)}
                      placeholder="e.g., 192.168.1.100"
                      className="bg-gray-800/50 border-gray-700"
                    />
                    <p className="text-xs text-gray-500">
                      If provided, only this IP can send events. Leave blank if unsure.
                    </p>
                  </div>

                  <Button
                    onClick={handleAddDevice}
                    disabled={loading || !deviceName || !isValidMacAddress(macAddress)}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Add Phone
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Configure */}
            {step === 'configure' && (
              <motion.div
                key="configure"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Configure Your Phone
                  </h3>
                  <p className="text-gray-400">
                    Copy these URLs into your Yealink phone's Action URL settings.
                  </p>
                </div>

                {!config?.secret_configured && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-400 font-medium">Secret Token Not Configured</p>
                      <p className="text-sm text-amber-300/70">
                        Add CALLERID_BRIDGE_SECRET to your backend .env file for security.
                      </p>
                    </div>
                  </div>
                )}

                {config && (
                  <div className="space-y-4">
                    <CopyableUrl label="Incoming Call" url={config.incoming_url} />
                    <CopyableUrl label="Call Established" url={config.answered_url} />
                    <CopyableUrl label="Call Terminated" url={config.terminated_url} />
                  </div>
                )}

                {/* Phone type selector */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPhoneType('dect')}
                    className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
                      phoneType === 'dect'
                        ? 'bg-purple-500/20 border-purple-500 text-white'
                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <Phone className="w-4 h-4 mx-auto mb-1" />
                    <span className="block font-medium">Cordless (W70B/W73P)</span>
                    <span className="block text-xs text-gray-500">Configure base station</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneType('desk')}
                    className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
                      phoneType === 'desk'
                        ? 'bg-purple-500/20 border-purple-500 text-white'
                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <Phone className="w-4 h-4 mx-auto mb-1" />
                    <span className="block font-medium">Desk Phone (T4x/T5x)</span>
                    <span className="block text-xs text-gray-500">Configure phone directly</span>
                  </button>
                </div>

                {/* Expandable Instructions */}
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ background: 'rgba(124, 93, 250, 0.1)' }}
                >
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-purple-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-purple-400" />
                      <span className="text-white font-medium">
                        Need help? Step-by-step guide
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        showGuide ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {showGuide && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 border-t border-purple-500/20">
                          <ConfigurationGuide phoneType={phoneType} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Step 4: Test */}
            {step === 'test' && (
              <motion.div
                key="test"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Test Your Connection
                  </h3>
                  <p className="text-gray-400">
                    Make sure everything is working correctly.
                  </p>
                </div>

                {/* Test button */}
                <div
                  className="p-6 rounded-xl text-center"
                  style={{ background: 'rgba(124, 93, 250, 0.1)' }}
                >
                  <Phone className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-white mb-2">
                    Simulate Incoming Call
                  </h4>
                  <p className="text-sm text-gray-400 mb-4">
                    This will trigger a test popup on all POS terminals
                  </p>
                  <Button
                    onClick={() => handleTestCall()}
                    disabled={testingDevice !== null}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {testingDevice ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4 mr-2" />
                        Send Test Call
                      </>
                    )}
                  </Button>
                </div>

                {/* What happens help */}
                <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="flex items-start gap-3">
                    <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-white font-medium mb-1">What happens when you test?</p>
                      <ul className="text-gray-400 text-xs space-y-1">
                        <li>1. A fake incoming call appears on your POS screen</li>
                        <li>2. You should see a popup with caller information</li>
                        <li>3. This confirms your system is connected correctly</li>
                      </ul>
                      <p className="text-gray-500 text-xs mt-2">
                        If nothing appears: Check that POS is open and try refreshing the page.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Device status */}
                {devices.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-300">
                      Device Status
                    </p>
                    {devices.map(device => (
                      <DeviceCard
                        key={device.id}
                        device={device}
                        onRemove={handleRemoveDevice}
                        onTest={handleTestCall}
                        isTestingThis={testingDevice === device.mac_address}
                      />
                    ))}
                  </div>
                )}

                {/* Success message */}
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <p className="text-green-400">
                      Your Caller ID system is ready! Make a real call to test it.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between"
          style={{ borderTopColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <Button
            variant="ghost"
            onClick={step === 'welcome' ? onClose : goBack}
            className="text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {step === 'welcome' ? 'Cancel' : 'Back'}
          </Button>

          <Button
            onClick={goNext}
            disabled={!canGoNext()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {step === 'test' ? 'Finish' : 'Next'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CallerIdSetupWizard;
