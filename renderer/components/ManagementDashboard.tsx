
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { colors } from "utils/designSystem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Users, Cog, Coffee, ActivitySquare, ClipboardList } from "lucide-react";

interface ManagementDashboardProps {
  onClose: () => void;
  onLogout?: () => void;
}

const ManagementDashboard: React.FC<ManagementDashboardProps> = ({ onClose, onLogout }) => {
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Management Dashboard</h1>
        <div className="flex gap-2">
          {onLogout && (
            <Button variant="outline" onClick={onLogout} className="bg-transparent text-amber-400 border-amber-500 hover:bg-amber-900/20">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Exit Management Mode
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="flex-1">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Coffee className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Cog className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card style={{ background: colors.background.tertiary, borderColor: colors.border.medium }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Today's Sales</CardTitle>
                <CardDescription>Total sales for today</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">£1,245.00</p>
                <p className="text-sm text-green-400">↑ 15% from yesterday</p>
              </CardContent>
            </Card>
            
            <Card style={{ background: colors.background.tertiary, borderColor: colors.border.medium }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Orders</CardTitle>
                <CardDescription>Total orders today</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">38</p>
                <p className="text-sm text-green-400">↑ 4 more than yesterday</p>
              </CardContent>
            </Card>
            
            <Card style={{ background: colors.background.tertiary, borderColor: colors.border.medium }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Avg. Order Value</CardTitle>
                <CardDescription>Average value per order</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">£32.76</p>
                <p className="text-sm text-amber-400">↓ £1.24 from yesterday</p>
              </CardContent>
            </Card>
          </div>
          
          <Card style={{ background: colors.background.tertiary, borderColor: colors.border.medium }}>
            <CardHeader>
              <CardTitle>Sales Activity (Placeholder)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border border-dashed rounded-md" style={{ borderColor: colors.border.medium }}>
                <ActivitySquare className="h-16 w-16 text-slate-600" />
                <p className="text-center text-slate-400 ml-4">Sales activity chart will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="staff" className="h-full">
          <Card className="h-full" style={{ background: colors.background.tertiary, borderColor: colors.border.medium }}>
            <CardHeader>
              <CardTitle>Staff Management</CardTitle>
              <CardDescription>This is a placeholder for the staff management section</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border border-dashed rounded-md" style={{ borderColor: colors.border.medium }}>
                <Users className="h-16 w-16 text-slate-600" />
                <p className="text-center text-slate-400 ml-4">Staff management tools will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inventory" className="h-full">
          <Card className="h-full" style={{ background: colors.background.tertiary, borderColor: colors.border.medium }}>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>This is a placeholder for the inventory management section</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border border-dashed rounded-md" style={{ borderColor: colors.border.medium }}>
                <Coffee className="h-16 w-16 text-slate-600" />
                <p className="text-center text-slate-400 ml-4">Inventory management tools will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="h-full">
          <Card className="h-full" style={{ background: colors.background.tertiary, borderColor: colors.border.medium }}>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>This is a placeholder for the reports section</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border border-dashed rounded-md" style={{ borderColor: colors.border.medium }}>
                <ClipboardList className="h-16 w-16 text-slate-600" />
                <p className="text-center text-slate-400 ml-4">Reports and analytics will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="h-full">
          <Card className="h-full" style={{ background: colors.background.tertiary, borderColor: colors.border.medium }}>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>This is a placeholder for the system settings section</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border border-dashed rounded-md" style={{ borderColor: colors.border.medium }}>
                <Cog className="h-16 w-16 text-slate-600" />
                <p className="text-center text-slate-400 ml-4">System settings will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.border.light }}>
        <p className="text-sm text-slate-400">
          Session will expire in 30 minutes of inactivity. This is a placeholder dashboard for demonstration purposes.
        </p>
      </div>
    </div>
  );
};

export default ManagementDashboard;
