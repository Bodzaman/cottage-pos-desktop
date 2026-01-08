import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Package,
  Calendar,
  ShoppingCart,
  Bell,
  LayoutDashboard,
  ArrowUpRight,
  Users,
  Clock,
  AlertCircle,
  Utensils,
  ClipboardList,
  Wallet,
  PieChart
} from "lucide-react";
import { colors, cardStyle } from "../utils/designSystem";
import { getDashboardStats } from "../utils/launch-page-modules";

interface StaffPortalDashboardProps {
  activeSubsection: string;
  onOpenSalesReport: () => void;
}

const StaffPortalDashboard: React.FC<StaffPortalDashboardProps> = ({ activeSubsection, onOpenSalesReport }) => {
  // Get quick stats
  const quickStats = getDashboardStats('staff');
  
  if (activeSubsection === "overview") {
    return (
      <div className="space-y-6">
        {/* Quick stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 overflow-hidden" style={cardStyle}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending Orders</p>
                <p className="text-2xl font-bold" style={{color: colors.text.primary}}>{quickStats.pendingOrders}</p>
                <Progress value={75} className="h-1 mt-2 bg-gray-700" />
              </div>
              <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Package className="h-6 w-6" style={{color: colors.status.info}} />
              </div>
            </CardContent>
            <div className="h-1 w-full bg-gradient-to-r" style={{ background: `linear-gradient(to right, ${colors.status.info}, ${colors.brand.purple})` }}></div>
          </Card>
          
          <Card className="border-0 overflow-hidden" style={cardStyle}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Today's Reservations</p>
                <p className="text-2xl font-bold" style={{color: colors.text.primary}}>{quickStats.todayReservations}</p>
                <Progress value={60} className="h-1 mt-2 bg-gray-700" />
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Calendar className="h-6 w-6" style={{color: colors.status.success}} />
              </div>
            </CardContent>
            <div className="h-1 w-full bg-gradient-to-r" style={{ background: `linear-gradient(to right, ${colors.status.success}, ${colors.brand.teal})` }}></div>
          </Card>
          
          <Card className="border-0 overflow-hidden" style={cardStyle}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Deliveries</p>
                <p className="text-2xl font-bold" style={{color: colors.text.primary}}>{quickStats.activeDeliveries}</p>
                <Progress value={40} className="h-1 mt-2 bg-gray-700" />
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6" style={{color: colors.status.warning}} />
              </div>
            </CardContent>
            <div className="h-1 w-full bg-gradient-to-r" style={{ background: `linear-gradient(to right, ${colors.status.warning}, ${colors.brand.purple})` }}></div>
          </Card>
          
          <Card className="border-0 overflow-hidden" style={cardStyle}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Notifications</p>
                <p className="text-2xl font-bold" style={{color: colors.text.primary}}>{quickStats.unreadNotifications}</p>
                <Progress value={30} className="h-1 mt-2 bg-gray-700" />
              </div>
              <div className="h-12 w-12 rounded-full bg-rose-500/20 flex items-center justify-center">
                <Bell className="h-6 w-6" style={{color: colors.brand.purple}} />
              </div>
            </CardContent>
            <div className="h-1 w-full bg-gradient-to-r" style={{ background: `linear-gradient(to right, ${colors.brand.purple}, ${colors.status.info})` }}></div>
          </Card>
        </div>
        
        {/* Order Summary */}
        <Card className="border-0" style={cardStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5" style={{color: colors.brand.purple}} />
              <span>Staff Dashboard</span>
            </CardTitle>
            <CardDescription style={{color: colors.text.secondary}}>
              Activity overview for Cottage Tandoori restaurant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-800 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Today's Orders</p>
                  <p className="text-2xl font-bold">{quickStats.pendingOrders + quickStats.activeDeliveries}</p>
                  <div className="flex items-center text-sm" style={{color: colors.status.info}}>
                    <ArrowUpRight className="h-3 w-3 mr-1" /> Active Orders
                  </div>
                </div>
                <div className="h-16 w-16 rounded-full" style={{backgroundColor: "rgba(66, 133, 244, 0.1)"}} className="flex items-center justify-center">
                  <Clock className="h-8 w-8" style={{color: colors.status.info}} />
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-800 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Staff on Duty</p>
                  <p className="text-2xl font-bold">6</p>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Users className="h-3 w-3 mr-1" /> Full staffed
                  </div>
                </div>
                <div className="h-16 w-16 rounded-full" style={{backgroundColor: "rgba(175, 139, 244, 0.1)"}} className="flex items-center justify-center">
                  <Users className="h-8 w-8" style={{color: colors.brand.purple}} />
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-800 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Popular Dish</p>
                  <p className="text-xl font-bold truncate max-w-[150px]">{quickStats.popularDish || 'Chicken Tikka'}</p>
                  <div className="flex items-center text-sm" style={{color: colors.status.warning}}>
                    <AlertCircle className="h-3 w-3 mr-1" /> High demand
                  </div>
                </div>
                <div className="h-16 w-16 rounded-full" style={{backgroundColor: "rgba(255, 171, 46, 0.1)"}} className="flex items-center justify-center">
                  <Utensils className="h-8 w-8" style={{color: colors.status.warning}} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Activity */}
        <Card className="border-0" style={cardStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" style={{color: colors.brand.purple}} />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 rounded-lg" style={{backgroundColor: "rgba(30, 35, 50, 0.5)"}}>
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{backgroundColor: "rgba(175, 139, 244, 0.2)"}}>
                  <Package className="h-5 w-5" style={{color: colors.brand.purple}} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">New delivery order received</p>
                  <p className="text-sm text-gray-400">Order #12345 - Delivery to SW19</p>
                </div>
                <div className="text-sm text-gray-400">5m ago</div>
              </div>
              
              <div className="flex items-center space-x-4 p-3 rounded-lg" style={{backgroundColor: "rgba(30, 35, 50, 0.5)"}}>
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{backgroundColor: "rgba(99, 226, 183, 0.2)"}}>
                  <Calendar className="h-5 w-5" style={{color: colors.brand.teal}} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Reservation confirmed</p>
                  <p className="text-sm text-gray-400">Table #8 - Party of 4 at 7:30 PM</p>
                </div>
                <div className="text-sm text-gray-400">20m ago</div>
              </div>
              
              <div className="flex items-center space-x-4 p-3 rounded-lg" style={{backgroundColor: "rgba(30, 35, 50, 0.5)"}}>
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{backgroundColor: "rgba(66, 133, 244, 0.2)"}}>
                  <Wallet className="h-5 w-5" style={{color: colors.status.info}} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Payment received</p>
                  <p className="text-sm text-gray-400">Order #12342 - £68.50 via Card</p>
                </div>
                <div className="text-sm text-gray-400">45m ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } else if (activeSubsection === "orders") {
    return (
      <div className="space-y-6">
        <Card className="border-0" style={cardStyle}>
          <CardHeader>
            <CardTitle>Orders Summary</CardTitle>
            <CardDescription style={{color: colors.text.secondary}}>Overview of all restaurant orders</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Orders statistics and charts will be displayed here</p>
          </CardContent>
        </Card>
      </div>
    );
  } else if (activeSubsection === "activity") {
    return (
      <div className="space-y-6">
        <Card className="border-0" style={cardStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" style={{color: colors.brand.purple}} />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription style={{color: colors.text.secondary}}>
              Latest restaurant activities and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 rounded-lg" style={{backgroundColor: "rgba(30, 35, 50, 0.5)"}}>
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{backgroundColor: "rgba(175, 139, 244, 0.2)"}}>
                  <Package className="h-5 w-5" style={{color: colors.brand.purple}} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">New delivery order received</p>
                  <p className="text-sm text-gray-400">Order #12345 - Delivery to SW19</p>
                </div>
                <div className="text-sm text-gray-400">5m ago</div>
              </div>
              
              <div className="flex items-center space-x-4 p-3 rounded-lg" style={{backgroundColor: "rgba(30, 35, 50, 0.5)"}}>
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{backgroundColor: "rgba(99, 226, 183, 0.2)"}}>
                  <Calendar className="h-5 w-5" style={{color: colors.brand.teal}} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Reservation confirmed</p>
                  <p className="text-sm text-gray-400">Table #8 - Party of 4 at 7:30 PM</p>
                </div>
                <div className="text-sm text-gray-400">20m ago</div>
              </div>
              
              <div className="flex items-center space-x-4 p-3 rounded-lg" style={{backgroundColor: "rgba(30, 35, 50, 0.5)"}}>
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{backgroundColor: "rgba(66, 133, 244, 0.2)"}}>
                  <Wallet className="h-5 w-5" style={{color: colors.status.info}} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Payment received</p>
                  <p className="text-sm text-gray-400">Order #12342 - £68.50 via Card</p>
                </div>
                <div className="text-sm text-gray-400">45m ago</div>
              </div>
              
              <div className="flex items-center space-x-4 p-3 rounded-lg" style={{backgroundColor: "rgba(30, 35, 50, 0.5)"}}>
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{backgroundColor: "rgba(255, 0, 0, 0.2)"}}>
                  <AlertCircle className="h-5 w-5" style={{color: colors.status.error}} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Inventory alert</p>
                  <p className="text-sm text-gray-400">Low stock: Chicken, Rice, Naan Bread</p>
                </div>
                <div className="text-sm text-gray-400">1h ago</div>
              </div>
              
              <div className="flex items-center space-x-4 p-3 rounded-lg" style={{backgroundColor: "rgba(30, 35, 50, 0.5)"}}>
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{backgroundColor: "rgba(255, 171, 46, 0.2)"}}>
                  <Users className="h-5 w-5" style={{color: colors.status.warning}} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Staff clock-in</p>
                  <p className="text-sm text-gray-400">Amit Singh started shift at 4:00 PM</p>
                </div>
                <div className="text-sm text-gray-400">2h ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0" style={cardStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" style={{color: colors.brand.purple}} />
              <span>Alerts & Notifications</span>
            </CardTitle>
            <CardDescription style={{color: colors.text.secondary}}>
              Important restaurant alerts requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-amber-800/30 bg-amber-900/10">
                <div className="flex items-center gap-2 mb-2 text-amber-300">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Inventory Warning</span>
                </div>
                <p className="text-sm text-gray-300">Several inventory items are running low and need to be restocked soon.</p>
                <Button variant="outline" size="sm" className="mt-3 border-amber-800/50 text-amber-300 hover:bg-amber-900/30">
                  View Inventory
                </Button>
              </div>
              
              <div className="p-4 rounded-lg border border-blue-800/30 bg-blue-900/10">
                <div className="flex items-center gap-2 mb-2 text-blue-300">
                  <Bell className="h-5 w-5" />
                  <span className="font-medium">Reservation Reminder</span>
                </div>
                <p className="text-sm text-gray-300">Large party of 10 arriving at 8:00 PM. Special arrangements needed.</p>
                <Button variant="outline" size="sm" className="mt-3 border-blue-800/50 text-blue-300 hover:bg-blue-900/30">
                  View Reservation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } else {
    return <div>Select a dashboard section</div>;
  }
};

export default StaffPortalDashboard;
