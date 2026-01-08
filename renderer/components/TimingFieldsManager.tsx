import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { colors } from '../utils/designSystem';

export interface Props {}

interface TimingField {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

interface SchemaResponse {
  success: boolean;
  timing_fields?: TimingField[];
  fields_exist?: boolean;
  error?: string;
  message?: string;
}

const TimingFieldsManager: React.FC<Props> = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [fieldsStatus, setFieldsStatus] = useState<SchemaResponse | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkTimingFields = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.check_order_timing_fields();
      const data: SchemaResponse = await response.json();
      setFieldsStatus(data);
      setLastCheck(new Date());
      
      if (data.success) {
        toast.success(`Found ${data.timing_fields?.length || 0} timing fields`);
      } else {
        toast.error(data.error || 'Failed to check timing fields');
      }
    } catch (error) {
      console.error('Error checking timing fields:', error);
      toast.error('Failed to check timing fields');
    } finally {
      setIsLoading(false);
    }
  };

  const addTimingFields = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.add_order_timing_fields();
      const data: SchemaResponse = await response.json();
      
      if (data.success) {
        toast.success(data.message || 'Timing fields added successfully');
        // Refresh the status
        await checkTimingFields();
      } else {
        toast.error(data.error || 'Failed to add timing fields');
      }
    } catch (error) {
      console.error('Error adding timing fields:', error);
      toast.error('Failed to add timing fields');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order Timing Fields Manager</CardTitle>
          <CardDescription>
            Test and manage the timing fields in the orders table for Collection and Delivery scheduling.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={checkTimingFields} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Checking...' : 'Check Fields Status'}
            </Button>
            
            <Button 
              onClick={addTimingFields} 
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Timing Fields'}
            </Button>
          </div>

          {lastCheck && (
            <p className="text-sm text-muted-foreground">
              Last checked: {lastCheck.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      {fieldsStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Fields Status</CardTitle>
            <CardDescription>
              Current status of timing fields in the orders table
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span>Status:</span>
                <Badge variant={fieldsStatus.success ? "default" : "destructive"}>
                  {fieldsStatus.success ? 'Success' : 'Error'}
                </Badge>
              </div>

              {fieldsStatus.fields_exist !== undefined && (
                <div className="flex items-center gap-2">
                  <span>Fields Exist:</span>
                  <Badge variant={fieldsStatus.fields_exist ? "default" : "secondary"}>
                    {fieldsStatus.fields_exist ? 'Yes' : 'No'}
                  </Badge>
                </div>
              )}

              {fieldsStatus.timing_fields && fieldsStatus.timing_fields.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Timing Fields Found:</h4>
                  <div className="space-y-2">
                    {fieldsStatus.timing_fields.map((field, index) => (
                      <div key={index} className="flex items-center gap-4 p-2 bg-muted rounded">
                        <span className="font-mono text-sm">{field.column_name}</span>
                        <Badge variant="outline">{field.data_type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {field.is_nullable === 'YES' ? 'Nullable' : 'Not Null'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {fieldsStatus.error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
                  <p className="text-sm text-destructive">{fieldsStatus.error}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TimingFieldsManager;
