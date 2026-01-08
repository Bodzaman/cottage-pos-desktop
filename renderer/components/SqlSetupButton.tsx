import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { apiClient } from 'app';

interface SqlSetupButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onSuccess?: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
  className?: string;
}

export const SqlSetupButton: React.FC<SqlSetupButtonProps> = ({
  onSuccess,
  variant = "default",
  size = "default",
  label = "Fix Database Functions",
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const setupSqlFunction = async () => {
    try {
      setIsLoading(true);
      toast.info("Setting up SQL execution function...");

      // Call the consolidated setup function
      const response = await apiClient.setup_execute_sql_function_consolidated();
      const data = await response.json();

      if (data.success) {
        toast.success("SQL function setup successful");
        
        // If the function was actually created, show more detailed success
        if (data.details?.method === "created_function") {
          toast.success("SQL function created successfully");
        } 
        // If using a fallback method, explain that
        else if (data.details?.method === "direct_api_fallback") {
          toast.info("Using alternative method for database operations");
        }
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        console.error("SQL function setup failed:", data.message);
        toast.error(`Failed to setup SQL function: ${data.message}`);
      }
    } catch (error) {
      console.error("Error setting up SQL function:", error);
      toast.error("Error setting up SQL function");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={setupSqlFunction}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {label}
    </Button>
  );
};
