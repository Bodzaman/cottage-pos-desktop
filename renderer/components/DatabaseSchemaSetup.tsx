import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { colors as designColors } from '../utils/designSystem';
import { AlertTriangle, CheckCircle, Database, RefreshCw, ShieldCheck } from 'lucide-react';
import { apiClient } from 'app';

interface SchemaStatus {
  status: string;
  message: string;
  tables_exist: boolean;
  rls_enabled: boolean;
}

interface Props {
  className?: string;
  onComplete?: () => void;
}

export function DatabaseSchemaSetup({ className = '', onComplete }: Props) {
  const [diningTablesStatus, setDiningTablesStatus] = useState<SchemaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  
  useEffect(() => {
    checkSchemaStatus();
  }, []);
  
  const checkSchemaStatus = async () => {
    setIsLoading(true);
    try {
      // Check dining tables schema status
      const diningTablesResponse = await apiClient.check_dining_tables_schema();
      const diningTablesData = await diningTablesResponse.json();
      setDiningTablesStatus(diningTablesData);
      
      // If everything is set up correctly, call onComplete
      if (diningTablesData.tables_exist && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error checking schema status:', error);
      toast.error('Failed to check database schema status');
    } finally {
      setIsLoading(false);
    }
  };
  
  const setupDatabaseSchema = async () => {
    setIsSettingUp(true);
    try {
      // Set up dining tables schema
      const diningTablesResponse = await apiClient.setup_dining_tables_schema();
      const diningTablesData = await diningTablesResponse.json();
      
      if (diningTablesData.success) {
        toast.success('Dining tables schema set up successfully');
        setDiningTablesStatus(diningTablesData);
      } else {
        toast.error(`Failed to set up dining tables schema: ${diningTablesData.message}`);
      }
      
      // Re-check the statuses
      await checkSchemaStatus();
      
      // If onComplete is provided and everything is set up correctly, call it
      if (diningTablesStatus?.tables_exist && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error setting up database schema:', error);
      toast.error('Failed to set up database schema');
    } finally {
      setIsSettingUp(false);
    }
  };
  
  const getStatusColorClass = (status: string | undefined) => {
    if (!status) return 'text-gray-500';
    switch (status) {
      case 'success': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  return (
    <Card className={`w-full ${className}`} style={{
      backgroundColor: designColors.background.tertiary,
      border: `1px solid ${designColors.border.light}`,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: designColors.text.primary }}>
          <Database size={20} />
          Database Schema Setup
        </CardTitle>
        <CardDescription style={{ color: designColors.text.secondary }}>
          Checks and sets up required database tables and security policies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Dining Tables Schema Status */}
          <div className="p-4 rounded-md" style={{
            backgroundColor: designColors.background.highlight,
            border: `1px solid ${designColors.border.light}`
          }}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className={getStatusColorClass(diningTablesStatus?.status)}>
                  {diningTablesStatus?.tables_exist ? (
                    <CheckCircle size={18} />
                  ) : (
                    <AlertTriangle size={18} />
                  )}
                </div>
                <h3 className="font-medium" style={{ color: designColors.text.primary }}>Dining Tables</h3>
              </div>
              <div className="text-xs px-2 py-1 rounded-full" style={{
                backgroundColor: diningTablesStatus?.tables_exist ? 'rgba(11, 206, 165, 0.1)' : 'rgba(255, 171, 46, 0.1)',
                color: diningTablesStatus?.tables_exist ? designColors.status.success : designColors.status.warning,
                border: `1px solid ${diningTablesStatus?.tables_exist ? 'rgba(11, 206, 165, 0.3)' : 'rgba(255, 171, 46, 0.3)'}`
              }}>
                {diningTablesStatus?.tables_exist ? 'Tables Exist' : 'Tables Missing'}
              </div>
            </div>
            
            <p className="text-sm mb-2" style={{ color: designColors.text.secondary }}>
              {diningTablesStatus?.message || 'Checking dining tables schema status...'}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t" style={{ borderColor: designColors.border.light }}>
        <Button 
          variant="outline" 
          size="sm"
          onClick={checkSchemaStatus}
          disabled={isLoading}
          style={{
            backgroundColor: 'rgba(124, 93, 250, 0.1)',
            borderColor: designColors.border.medium,
            color: designColors.brand.purpleLight
          }}
        >
          <RefreshCw size={14} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
        <Button 
          size="sm"
          onClick={setupDatabaseSchema}
          disabled={isSettingUp || (diningTablesStatus?.tables_exist)}
          style={{
            backgroundColor: designColors.brand.purple,
            color: 'white'
          }}
        >
          {isSettingUp ? (
            <>
              <RefreshCw size={14} className="mr-2 animate-spin" />
              Setting Up...
            </>
          ) : (
            'Setup Database Tables'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
