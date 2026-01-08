import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Save, Database, Clock, CheckCircle, AlertTriangle, Calendar, Download, Upload, X, Info, Zap, BookOpen, FileJson, Info, Badge, ScrollArea, Tabs, TabsContent, TabsList, TabsTrigger, TabsValue } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { colors, cardStyle } from '../utils/designSystem';
import { SafeDate } from '../utils';

interface MenuKnowledgeBaseProps {
  className?: string;
}

interface MenuVersion {
  version: string;
  timestamp: string;
  entry_count: number;
  delta_changes?: {
    added: number;
    updated: number;
    removed: number;
    unchanged: number;
  }
}

interface MenuCorpusEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  price_dine_in?: number;
  spice_level?: number;
  dietary_info?: string[];
  keywords?: string[];
  version: string;
  natural_language_description?: string;
  popular_pairings?: string[];
  allergens?: string[];
  customizations?: any[];
}

interface SyncScheduleConfig {
  enabled: boolean;
  time: string;
  frequency: 'daily' | 'weekly';
  last_scheduled_run: string | null;
  next_scheduled_run: string | null;
}

export const MenuKnowledgeBase: React.FC<MenuKnowledgeBaseProps> = ({ className }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [entryCount, setEntryCount] = useState<number | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [versionHistory, setVersionHistory] = useState<MenuVersion[]>([]);
  const [sampleEntries, setSampleEntries] = useState<MenuCorpusEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<MenuCorpusEntry | null>(null);
  const [deltaChanges, setDeltaChanges] = useState<MenuVersion['delta_changes'] | null>(null);
  const [syncSchedule, setSyncSchedule] = useState<SyncScheduleConfig>({
    enabled: false,
    time: '02:00',
    frequency: 'daily',
    last_scheduled_run: null,
    next_scheduled_run: null
  });
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [isScheduleSaving, setIsScheduleSaving] = useState(false);

  // Fetch current corpus data on mount
  useEffect(() => {
    fetchMenuCorpus();
    fetchVersionHistory();
    fetchSyncSchedule();
  }, []);

  // Fetch the current menu corpus data
  const fetchMenuCorpus = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get_menu_corpus({
        headers: {
          Authorization: `Bearer qsai-voice-auth-2025`
        }
      });
      const data = await response.json();

      if (data.success) {
        // Update state with corpus data
        setEntryCount(data.entry_count);
        setCurrentVersion(data.version);
        setSampleEntries(data.corpus_data || []);
        setDeltaChanges(data.delta_changes || null);
        
        // Format timestamp if it exists in the response
        if (data.timestamp) {
          setLastSync(new Date(data.timestamp).toLocaleString());
        }
      } else if (data.message.includes("No menu corpus found")) {
        // No corpus exists yet
        setEntryCount(0);
        setCurrentVersion(null);
        setSampleEntries([]);
        setDeltaChanges(null);
      } else {
        // Error message
        toast.error(`Failed to load menu corpus: ${data.message}`);
      }
    } catch (error) {
      console.error('Error fetching menu corpus:', error);
      toast.error('Failed to load menu knowledge base');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch version history
  const fetchVersionHistory = async () => {
    try {
      const response = await apiClient.get_menu_versions({
        headers: {
          Authorization: `Bearer qsai-voice-auth-2025`
        }
      });
      const data = await response.json();

      if (data.success && data.versions) {
        setVersionHistory(data.versions);
      }
    } catch (error) {
      console.error('Error fetching version history:', error);
    }
  };

  // Fetch sync schedule configuration
  const fetchSyncSchedule = async () => {
    try {
      setIsScheduleLoading(true);
      const response = await apiClient.get_sync_schedule({
        headers: {
          Authorization: `Bearer qsai-voice-auth-2025`
        }
      });
      const data = await response.json();

      if (data.success && data.schedule) {
        setSyncSchedule(data.schedule);
      }
    } catch (error) {
      console.error('Error fetching sync schedule:', error);
    } finally {
      setIsScheduleLoading(false);
    }
  };

  // Save sync schedule configuration
  const saveSyncSchedule = async () => {
    try {
      setIsScheduleSaving(true);
      const response = await apiClient.update_sync_schedule(syncSchedule, {
        headers: {
          Authorization: `Bearer qsai-voice-auth-2025`
        }
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Sync schedule updated successfully');
        setSyncSchedule(data.schedule);
      } else {
        toast.error(`Failed to update sync schedule: ${data.message}`);
      }
    } catch (error) {
      console.error('Error updating sync schedule:', error);
      toast.error('Failed to update sync schedule');
    } finally {
      setIsScheduleSaving(false);
    }
  };

  // Sync menu data with Ultravox
  const handleSyncMenu = async () => {
    try {
      setIsSyncing(true);
      const response = await apiClient.sync_menu_data_wrapper({
        force: true
      }, {
        headers: {
          Authorization: `Bearer qsai-voice-auth-2025`
        }
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully synced menu data with ${data.entry_count} items`);
        
        // Show changes if available
        if (data.delta_changes) {
          const changes = data.delta_changes;
          let changeMessage = `Changes: `;
          if (changes.added > 0) changeMessage += `${changes.added} added, `;
          if (changes.updated > 0) changeMessage += `${changes.updated} updated, `;
          if (changes.removed > 0) changeMessage += `${changes.removed} removed, `;
          if (changes.unchanged > 0) changeMessage += `${changes.unchanged} unchanged`;
          toast.info(changeMessage);
        }
        
        // Refresh data
        fetchMenuCorpus();
        fetchVersionHistory();
        fetchSyncSchedule(); // Also refresh the schedule
      } else {
        toast.error(`Failed to sync menu data: ${data.message}`);
      }
    } catch (error) {
      console.error('Error syncing menu data:', error);
      toast.error('Failed to sync menu data');
    } finally {
      setIsSyncing(false);
    }
  };

  // Format a version string for display
  const formatVersion = (version: string) => {
    // If version is in format v_20250503_123456
    const match = version?.match(/v_(\d{8})_(\d{6})/);
    if (match) {
      const date = match[1];
      const time = match[2];
      // Format as YYYY-MM-DD HH:MM:SS
      return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)} ${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`;
    }
    return version;
  };

  // Handle entry selection for details view
  const handleEntrySelect = (entry: MenuCorpusEntry) => {
    setSelectedEntry(entry);
  };

  // Handle schedule toggle
  const handleScheduleToggle = (checked: boolean) => {
    setSyncSchedule(prev => ({
      ...prev,
      enabled: checked
    }));
  };

  // Handle schedule time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSyncSchedule(prev => ({
      ...prev,
      time: e.target.value
    }));
  };

  // Handle frequency change
  const handleFrequencyChange = (value: 'daily' | 'weekly') => {
    setSyncSchedule(prev => ({
      ...prev,
      frequency: value
    }));
  };
  
  const formatNextRun = useMemo(() => {
    if (!syncSchedule.enabled || !syncSchedule.next_scheduled_run) return 'Not scheduled';
    
    try {
      const nextRun = new Date(syncSchedule.next_scheduled_run);
      const now = new Date();
      
      // If next run is today
      if (nextRun.toDateString() === now.toDateString()) {
        return (
          <span>
            Today at <SafeDate date={nextRun} format="time" />
          </span>
        );
      }
      
      // If next run is tomorrow
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (nextRun.toDateString() === tomorrow.toDateString()) {
        return (
          <span>
            Tomorrow at <SafeDate date={nextRun} format="time" />
          </span>
        );
      }
      
      // Otherwise show full date
      return <SafeDate date={nextRun} format="datetime" />;
    } catch (e) {
      return 'Invalid date';
    }
  }, [syncSchedule.enabled, syncSchedule.next_scheduled_run]);

  return (
    <Card className={`bg-gray-900 border-gray-800 ${className}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Menu Knowledge Base</h2>
            <p className="text-gray-400 text-sm mt-1">
              Sync your restaurant menu with the AI Voice Agent
            </p>
          </div>
          <Button
            onClick={handleSyncMenu}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-gradient-to-r from-[#7C5DFA] to-[#9277FF] hover:from-[#6B4DEA] hover:to-[#7C5DFA]"
            size="sm"
          >
            {isSyncing ? (
              <>
                <span className="animate-spin mr-1">⌛</span>
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Sync Menu Data
              </>
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-400">
            <span className="animate-spin inline-block mr-2">⌛</span>
            Loading knowledge base data...
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4 bg-gray-800 border-gray-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
                Overview
              </TabsTrigger>
              <TabsTrigger value="sample" className="data-[state=active]:bg-gray-700">
                Sample Data
              </TabsTrigger>
              <TabsTrigger value="schedule" className="data-[state=active]:bg-gray-700">
                Sync Schedule
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-gray-700">
                Version History
              </TabsTrigger>
              <TabsTrigger value="formatted" className="data-[state=active]:bg-gray-700">
                Corpus Format
              </TabsTrigger>
              {selectedEntry && (
                <TabsTrigger value="details" className="data-[state=active]:bg-gray-700">
                  Item Details
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center text-white mb-2">
                    <Database className="h-5 w-5 mr-2 text-purple-400" />
                    <h3 className="font-medium">Knowledge Base Status</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Menu Items:</span>
                      <span className="text-white font-medium">{entryCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Version:</span>
                      <span className="text-white font-medium">
                        {currentVersion ? formatVersion(currentVersion) : 'Not synced'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      {entryCount && entryCount > 0 ? (
                        <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-800">
                          <X className="h-3 w-3 mr-1" />
                          Not Synced
                        </Badge>
                      )}
                    </div>
                    {deltaChanges && (
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <span className="text-gray-400 text-sm">Last Sync Changes:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {deltaChanges.added > 0 && (
                            <Badge className="bg-green-900/20 text-green-400 border-green-800">
                              +{deltaChanges.added} added
                            </Badge>
                          )}
                          {deltaChanges.updated > 0 && (
                            <Badge className="bg-blue-900/20 text-blue-400 border-blue-800">
                              {deltaChanges.updated} updated
                            </Badge>
                          )}
                          {deltaChanges.removed > 0 && (
                            <Badge className="bg-red-900/20 text-red-400 border-red-800">
                              -{deltaChanges.removed} removed
                            </Badge>
                          )}
                          {deltaChanges.unchanged > 0 && (
                            <Badge className="bg-gray-700/20 text-gray-400 border-gray-600">
                              {deltaChanges.unchanged} unchanged
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center text-white mb-2">
                    <Clock className="h-5 w-5 mr-2 text-purple-400" />
                    <h3 className="font-medium">Sync Status</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Synchronized:</span>
                      <span className="text-white font-medium">{lastSync || 'Never'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Sync Schedule:</span>
                      <span className="text-white font-medium">
                        {syncSchedule.enabled ? (
                          <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
                            <Calendar className="h-3 w-3 mr-1" />
                            {syncSchedule.frequency === 'daily' ? 'Daily' : 'Weekly'} at {syncSchedule.time}
                          </Badge>
                        ) : (
                          'Manual'
                        )}
                      </span>
                    </div>
                    {syncSchedule.next_scheduled_run && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Next Run:</span>
                        <span className="text-white font-medium">
                          {new Date(syncSchedule.next_scheduled_run).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="mt-2">
                      <p className="text-gray-400 text-sm">
                        {syncSchedule.enabled 
                          ? 'Automatic sync is enabled. You can still trigger manual sync at any time.'
                          : 'Sync your menu data manually after making changes to ensure the voice agent has the latest information.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center text-white mb-2">
                  <BookOpen className="h-5 w-5 mr-2 text-purple-400" />
                  <h3 className="font-medium">Knowledge Base Information</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  The menu knowledge base allows your AI Voice Agent to accurately answer
                  questions about your menu items, prices, and ingredients. It uses your
                  existing menu management system to ensure consistency across all channels.
                </p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-gray-700 p-3 rounded-md">
                    <h4 className="text-white text-sm font-medium mb-1">Pricing Information</h4>
                    <p className="text-gray-400 text-xs">Includes takeaway and dine-in prices</p>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-md">
                    <h4 className="text-white text-sm font-medium mb-1">Dietary Information</h4>
                    <p className="text-gray-400 text-xs">Includes dietary tags and spice levels</p>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-md">
                    <h4 className="text-white text-sm font-medium mb-1">Menu Categorization</h4>
                    <p className="text-gray-400 text-xs">Organized by menu categories</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sample" className="mt-0">
              {sampleEntries.length > 0 ? (
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 overflow-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left pb-2 pr-4">Name</th>
                        <th className="text-left pb-2 pr-4">Category</th>
                        <th className="text-right pb-2 pr-4">Price</th>
                        <th className="text-left pb-2">Keywords</th>
                        <th className="text-right pb-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleEntries.map((entry) => (
                        <tr key={entry.id} className="border-b border-gray-700 text-gray-300 hover:bg-gray-700/30 transition-colors">
                          <td className="py-2 pr-4">{entry.name}</td>
                          <td className="py-2 pr-4">{entry.category}</td>
                          <td className="py-2 pr-4 text-right">£{entry.price.toFixed(2)}</td>
                          <td className="py-2">
                            <div className="flex flex-wrap gap-1">
                              {entry.keywords?.slice(0, 3).map((keyword, idx) => (
                                <Badge key={idx} variant="outline" className="bg-gray-700 text-gray-300 border-gray-600">
                                  {keyword}
                                </Badge>
                              ))}
                              {entry.keywords && entry.keywords.length > 3 && (
                                <span className="text-gray-500 text-xs self-center">+{entry.keywords.length - 3} more</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 hover:text-indigo-300 hover:bg-indigo-900/20"
                              onClick={() => handleEntrySelect(entry)}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 text-center text-gray-400 text-sm">
                    <p>Showing {sampleEntries.length} sample entries out of {entryCount} total items</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
                  <p className="text-gray-400">No menu data has been synced yet.</p>
                  <Button
                    onClick={handleSyncMenu}
                    disabled={isSyncing}
                    className="mt-4 flex items-center gap-2 mx-auto bg-gradient-to-r from-[#7C5DFA] to-[#9277FF] hover:from-[#6B4DEA] hover:to-[#7C5DFA]"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Sync Now
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="schedule" className="mt-0">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between text-white mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-purple-400" />
                    <h3 className="font-medium">Automatic Sync Schedule</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">{syncSchedule.enabled ? 'Enabled' : 'Disabled'}</span>
                    <Switch
                      checked={syncSchedule.enabled}
                      onCheckedChange={handleScheduleToggle}
                      disabled={isScheduleLoading || isScheduleSaving}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sync-time" className="text-gray-300 mb-1 block">
                        Sync Time
                      </Label>
                      <Input
                        id="sync-time"
                        type="time"
                        value={syncSchedule.time}
                        onChange={handleTimeChange}
                        disabled={!syncSchedule.enabled || isScheduleLoading || isScheduleSaving}
                        className="bg-gray-700 border-gray-600 text-gray-200"
                      />
                      <p className="text-gray-500 text-xs mt-1">Time is in 24-hour format (local timezone)</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="sync-frequency" className="text-gray-300 mb-1 block">
                        Frequency
                      </Label>
                      <AdminSelect
                        value={syncSchedule.frequency}
                        onValueChange={(value: any) => handleFrequencyChange(value)}
                        disabled={!syncSchedule.enabled || isScheduleLoading || isScheduleSaving}
                        placeholder="Select frequency"
                        options={[
                          { value: "daily", label: "Daily" },
                          { value: "weekly", label: "Weekly (Sunday)" }
                        ]}
                        variant="purple"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {syncSchedule.last_scheduled_run && (
                      <div className="p-3 bg-gray-700/50 rounded-md">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Clock className="h-4 w-4 text-blue-400" />
                          <Label className="text-gray-300 text-sm">
                            Last Scheduled Run
                          </Label>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {new Date(syncSchedule.last_scheduled_run).toLocaleString()}
                        </p>
                      </div>
                    )}
                    
                    <div className="p-3 bg-gray-700/50 rounded-md">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Zap className="h-4 w-4 text-amber-400" />
                        <Label className="text-gray-300 text-sm">
                          Next Scheduled Run
                        </Label>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {syncSchedule.enabled ? getNextRunText() : 'Not scheduled'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-indigo-900/20 border border-indigo-800/50 p-3 rounded-md flex gap-2">
                    <Info className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-indigo-300 text-sm">
                        Automatic sync will run at the specified time to ensure your voice agent
                        always has the latest menu information.
                      </p>
                      <p className="text-indigo-400/80 text-xs mt-1">
                        Note: Manual sync is always available regardless of scheduled sync settings.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      onClick={saveSyncSchedule}
                      disabled={isScheduleSaving || isScheduleLoading}
                      className="bg-gradient-to-r from-[#7C5DFA] to-[#9277FF] hover:from-[#6B4DEA] hover:to-[#7C5DFA]"
                      size="sm"
                    >
                      {isScheduleSaving ? (
                        <>
                          <span className="animate-spin mr-1">⌛</span>
                          Saving...
                        </>
                      ) : (
                        'Save Schedule Settings'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="mt-0">
              {versionHistory.length > 0 ? (
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 overflow-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left pb-2 pr-4">Version</th>
                        <th className="text-left pb-2 pr-4">Timestamp</th>
                        <th className="text-right pb-2 pr-4">Items</th>
                        <th className="text-left pb-2">Changes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {versionHistory.map((version, index) => (
                        <tr key={index} className="border-b border-gray-700 text-gray-300">
                          <td className="py-2 pr-4">
                            {formatVersion(version.version)}
                            {currentVersion === version.version && (
                              <Badge variant="outline" className="ml-2 bg-blue-900/20 text-blue-400 border-blue-800">
                                Current
                              </Badge>
                            )}
                          </td>
                          <td className="py-2 pr-4">
                            {new Date(version.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2 pr-4 text-right">{version.entry_count}</td>
                          <td className="py-2">
                            {version.delta_changes ? (
                              <div className="flex flex-wrap gap-1">
                                {version.delta_changes.added > 0 && (
                                  <Badge className="bg-green-900/20 text-green-400 border-green-800">
                                    +{version.delta_changes.added}
                                  </Badge>
                                )}
                                {version.delta_changes.updated > 0 && (
                                  <Badge className="bg-blue-900/20 text-blue-400 border-blue-800">
                                    ~{version.delta_changes.updated}
                                  </Badge>
                                )}
                                {version.delta_changes.removed > 0 && (
                                  <Badge className="bg-red-900/20 text-red-400 border-red-800">
                                    -{version.delta_changes.removed}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-xs">No change data</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
                  <p className="text-gray-400">No version history available.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="formatted" className="mt-0">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center text-white mb-4">
                  <FileJson className="h-5 w-5 mr-2 text-purple-400" />
                  <h3 className="font-medium">AI Voice Corpus Format</h3>
                </div>
                
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Overview</h4>
                      <p className="text-gray-400 text-sm">
                        This knowledge base is formatted specifically for the Ultravox AI Voice Agent platform.
                        The structured format enables your voice agent to efficiently access and respond to
                        customer inquiries about menu items, pricing, and options.
                      </p>
                    </div>

                    <Separator className="my-4 bg-gray-700" />

                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Data Structure</h4>
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="menu-item" className="border-gray-700">
                          <AccordionTrigger className="text-gray-300 hover:text-white hover:no-underline py-2">
                            <div className="flex items-center">
                              <Badge className="mr-2 bg-indigo-900/20 text-indigo-400 border-indigo-800">Object</Badge>
                              Menu Item Structure
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-400 text-sm">
                            <div className="bg-gray-700/50 p-3 rounded-md font-mono text-xs overflow-x-auto">
                              <pre>{`{
  "id": "string",            // Unique identifier
  "name": "string",          // Item name as shown on menu
  "category": "string",      // Menu category (e.g., "Starters")
  "description": "string",   // Menu description 
  "price": number,           // Standard takeaway price
  "price_dine_in": number,   // Optional dine-in price
  "spice_level": number,     // Optional spice rating (0-3)
  "dietary_info": [          // Optional dietary information
    "string", ...            // e.g., "Vegetarian", "Vegan", "Gluten-Free"
  ],
  "keywords": [              // Search terms for voice recognition
    "string", ...            // Alternative names or common misspellings
  ],
  "natural_language_description": "string", // Voice-optimized description
  "popular_pairings": [      // Optional suggested combinations
    "string", ...            // Names of complementary items
  ],
  "allergens": [             // Optional allergen information
    "string", ...            // e.g., "Nuts", "Dairy", "Gluten"
  ],
  "customizations": [        // Optional customization groups
    {
      "group_name": "string",  // Name of customization group
      "required": boolean,     // Whether customer must choose
      "options": [             // Available options
        {
          "name": "string",     // Option name
          "price": number       // Additional cost (if any)
        },
        ...
      ]
    },
    ...
  ],
  "version": "string"        // Corpus version this item belongs to
}`}</pre>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="corpus-structure" className="border-gray-700">
                          <AccordionTrigger className="text-gray-300 hover:text-white hover:no-underline py-2">
                            <div className="flex items-center">
                              <Badge className="mr-2 bg-indigo-900/20 text-indigo-400 border-indigo-800">Object</Badge>
                              Complete Corpus Structure
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-400 text-sm">
                            <div className="bg-gray-700/50 p-3 rounded-md font-mono text-xs overflow-x-auto">
                              <pre>{`{
  "version": "string",       // Version identifier (e.g., "v_20250514_120000")
  "timestamp": "string",     // ISO timestamp of creation
  "entry_count": number,     // Total number of menu items
  "categories": [            // List of menu categories
    "string", ...            // e.g., "Starters", "Mains", "Desserts"
  ],
  "items": [                 // Array of menu items
    { ... },                  // Menu item objects as detailed above
    ...
  ],
  "restaurant_info": {       // Optional restaurant metadata
    "name": "string",         // Restaurant name
    "cuisine": "string",      // Primary cuisine type
    "specialties": [          // Optional signature dishes
      "string", ...           // Names of specialty items
    ],
    "dietary_options": [      // Optional dietary accommodations
      "string", ...           // e.g., "Vegan options", "Gluten-free"
    ]
  }
}`}</pre>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="voice-optimizations" className="border-gray-700">
                          <AccordionTrigger className="text-gray-300 hover:text-white hover:no-underline py-2">
                            <div className="flex items-center">
                              <Badge className="mr-2 bg-amber-900/20 text-amber-400 border-amber-800">Guide</Badge>
                              Voice Optimization Features
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-400 text-sm">
                            <div className="space-y-3">
                              <p>
                                The corpus includes several features specifically designed to enhance voice interactions:
                              </p>
                              <ul className="list-disc pl-5 space-y-2">
                                <li>
                                  <span className="text-gray-300">Natural Language Descriptions:</span> Optimized for text-to-speech, with proper pronunciation of Indian terms and dishes
                                </li>
                                <li>
                                  <span className="text-gray-300">Keywords:</span> Alternative terms, common misspellings, and phonetic variations to improve recognition
                                </li>
                                <li>
                                  <span className="text-gray-300">Structured Pricing:</span> Formatted for clear verbal communication with proper currency formatting
                                </li>
                                <li>
                                  <span className="text-gray-300">Customization Groups:</span> Organized to facilitate natural conversation flow when collecting order customizations
                                </li>
                              </ul>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>

                    <Separator className="my-4 bg-gray-700" />

                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Integration with Voice Agent</h4>
                      <p className="text-gray-400 text-sm">
                        This corpus is automatically integrated with your AI voice agent.
                        When the menu is synchronized, the agent gains immediate access to updated
                        information without requiring any additional configuration.
                      </p>
                      <div className="mt-3 bg-indigo-900/20 border border-indigo-800/30 p-3 rounded-md">
                        <div className="flex gap-2">
                          <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                          <p className="text-indigo-300 text-xs">
                            The AI voice system provides natural language understanding capabilities
                            that allow customers to ask questions in various ways. The agent can understand
                            queries about ingredients, prices, spice levels, and dietary information,
                            responding in a conversational manner using this corpus as its knowledge base.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            {selectedEntry && (
              <TabsContent value="details" className="mt-0">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 overflow-auto max-h-96">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-medium">{selectedEntry.name}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-200"
                      onClick={() => setSelectedEntry(null)}
                    >
                      Close
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-400">Basic Information</h4>
                        <div className="mt-1 p-3 bg-gray-700 rounded-md space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <span className="text-gray-400 text-xs">ID:</span>
                            <span className="text-gray-200 text-xs col-span-2">{selectedEntry.id}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <span className="text-gray-400 text-xs">Category:</span>
                            <span className="text-gray-200 text-xs col-span-2">{selectedEntry.category}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <span className="text-gray-400 text-xs">Price:</span>
                            <span className="text-gray-200 text-xs col-span-2">£{selectedEntry.price.toFixed(2)}</span>
                          </div>
                          {selectedEntry.price_dine_in !== undefined && (
                            <div className="grid grid-cols-3 gap-2">
                              <span className="text-gray-400 text-xs">Dine-in Price:</span>
                              <span className="text-gray-200 text-xs col-span-2">£{selectedEntry.price_dine_in.toFixed(2)}</span>
                            </div>
                          )}
                          {selectedEntry.spice_level !== undefined && (
                            <div className="grid grid-cols-3 gap-2">
                              <span className="text-gray-400 text-xs">Spice Level:</span>
                              <span className="text-gray-200 text-xs col-span-2">{selectedEntry.spice_level}/3</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-400">Description</h4>
                        <div className="mt-1 p-3 bg-gray-700 rounded-md">
                          <p className="text-gray-200 text-xs">{selectedEntry.description || 'No description available'}</p>
                        </div>
                      </div>

                      {selectedEntry.natural_language_description && (
                        <div>
                          <div className="flex items-center">
                            <h4 className="text-sm font-medium text-gray-400">Natural Language Description</h4>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-gray-500 ml-1" />
                              </TooltipTrigger>
                              <TooltipContent className="bg-gray-800 text-gray-200 border-gray-700">
                                <p className="text-xs max-w-[260px]">
                                  Enhanced description optimized for voice interactions
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="mt-1 p-3 bg-gray-700 rounded-md">
                            <p className="text-gray-200 text-xs">{selectedEntry.natural_language_description}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {selectedEntry.dietary_info && selectedEntry.dietary_info.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400">Dietary Information</h4>
                          <div className="mt-1 p-3 bg-gray-700 rounded-md">
                            <div className="flex flex-wrap gap-1">
                              {selectedEntry.dietary_info.map((tag, idx) => (
                                <Badge key={idx} className="bg-green-900/20 text-green-400 border-green-800">
                                  {tag}
                                </Badge>
                              ))}
                              {selectedEntry.dietary_info.length === 0 && (
                                <span className="text-gray-400 text-xs">No dietary information available</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedEntry.allergens && selectedEntry.allergens.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400">Allergens</h4>
                          <div className="mt-1 p-3 bg-gray-700 rounded-md">
                            <div className="flex flex-wrap gap-1">
                              {selectedEntry.allergens.map((allergen, idx) => (
                                <Badge key={idx} className="bg-amber-900/20 text-amber-400 border-amber-800">
                                  {allergen}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedEntry.keywords && selectedEntry.keywords.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400">Keywords</h4>
                          <div className="mt-1 p-3 bg-gray-700 rounded-md">
                            <div className="flex flex-wrap gap-1">
                              {selectedEntry.keywords.map((keyword, idx) => (
                                <Badge key={idx} variant="outline" className="bg-gray-800 text-gray-300 border-gray-600">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedEntry.popular_pairings && selectedEntry.popular_pairings.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400">Popular Pairings</h4>
                          <div className="mt-1 p-3 bg-gray-700 rounded-md">
                            <div className="flex flex-wrap gap-1">
                              {selectedEntry.popular_pairings.map((pairing, idx) => (
                                <Badge key={idx} className="bg-indigo-900/20 text-indigo-400 border-indigo-800">
                                  {pairing}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedEntry.customizations && selectedEntry.customizations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400">Available Customizations</h4>
                          <div className="mt-1 space-y-2">
                            {selectedEntry.customizations.map((customGroup: any, groupIdx) => (
                              <div key={groupIdx} className="p-2 bg-gray-700 rounded-md">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-200 text-xs font-medium">{customGroup.group_name}</span>
                                  <Badge variant="outline" className="bg-transparent text-gray-400 border-gray-600 text-[10px]">
                                    {customGroup.required ? 'Required' : 'Optional'}
                                  </Badge>
                                </div>
                                <div className="mt-1 pt-1 border-t border-gray-600">
                                  <div className="flex flex-wrap gap-1">
                                    {customGroup.options.map((option: any, optIdx: number) => (
                                      <Badge 
                                        key={optIdx} 
                                        variant="outline" 
                                        className="bg-gray-800/50 text-gray-300 border-gray-600 text-[10px]"
                                      >
                                        {option.name}
                                        {option.price > 0 && ` +£${option.price.toFixed(2)}`}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default MenuKnowledgeBase;
