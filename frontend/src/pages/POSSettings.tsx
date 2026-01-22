
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cog, ArrowRight } from "lucide-react";

const POSSettings = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      navigate('/admin-settings?tab=pos-settings');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="max-w-2xl mx-auto pt-20">
        <Card className="border-purple-800/20 shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center text-2xl font-bold">
              <Cog className="mr-3 h-6 w-6" />
              POS Settings Moved
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-gray-400">
              POS settings have been consolidated into the Admin Settings page for better organization.
            </p>
            <p className="text-gray-300">
              You will be automatically redirected to the new location in a moment...
            </p>
            <div className="flex justify-center">
              <Button 
                onClick={() => navigate('/admin-settings?tab=pos-settings')}
                className="bg-purple-600 hover:bg-purple-700 flex items-center"
              >
                Go to Admin Settings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default POSSettings;
