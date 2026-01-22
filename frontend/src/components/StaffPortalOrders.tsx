
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  MapPin, 
  ShoppingCart, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye
} from "lucide-react";
import { colors, cardStyle } from "../utils/designSystem";

interface Order {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
  type: "delivery" | "collection" | "dine-in";
  time: string;
  address?: string;
}

interface StaffPortalOrdersProps {
  activeSubsection: string;
}

const StaffPortalOrders: React.FC<StaffPortalOrdersProps> = ({ activeSubsection }) => {
  // Sample orders data - would normally come from an API
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "ORD-12345",
      customer: "John Smith",
      items: 4,
      total: 48.5,
      status: "pending",
      type: "delivery",
      time: "5:30 PM",
      address: "15 Park Lane, SW19 5NE"
    },
    {
      id: "ORD-12346",
      customer: "Sarah Johnson",
      items: 2,
      total: 26.75,
      status: "preparing",
      type: "collection",
      time: "6:00 PM"
    },
    {
      id: "ORD-12347",
      customer: "Michael Williams",
      items: 6,
      total: 72.30,
      status: "ready",
      type: "dine-in",
      time: "7:15 PM"
    },
    {
      id: "ORD-12348",
      customer: "Emma Davis",
      items: 3,
      total: 34.50,
      status: "delivered",
      type: "delivery",
      time: "4:45 PM",
      address: "22 Queen Street, SW1 8YZ"
    },
    {
      id: "ORD-12349",
      customer: "Robert Wilson",
      items: 5,
      total: 55.25,
      status: "cancelled",
      type: "dine-in",
      time: "6:30 PM"
    }
  ]);
  
  // Filter orders based on active subsection
  const filteredOrders = activeSubsection === "active" 
    ? orders.filter(order => ["pending", "preparing", "ready"].includes(order.status))
    : orders;
  
  // Get status badge style
  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 hover:text-amber-300">Pending</Badge>;
      case "preparing":
        return <Badge className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-300">Preparing</Badge>;
      case "ready":
        return <Badge className="bg-green-500/20 text-green-300 hover:bg-green-500/30 hover:text-green-300">Ready</Badge>;
      case "delivered":
        return <Badge className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 hover:text-purple-300">Delivered</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-300">Cancelled</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  // Get order type icon
  const getOrderTypeIcon = (type: Order["type"]) => {
    switch (type) {
      case "delivery":
        return <MapPin className="h-4 w-4 text-rose-500" />;
      case "collection":
        return <ShoppingCart className="h-4 w-4 text-amber-500" />;
      case "dine-in":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <Card style={cardStyle}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" style={{color: colors.brand.purple}} />
            <span>{activeSubsection === "active" ? "Active Orders" : "Order History"}</span>
          </CardTitle>
          <CardDescription style={{color: colors.text.secondary}}>
            {activeSubsection === "active" ? "Currently processing orders" : "Past order records"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span>{order.time}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getOrderTypeIcon(order.type)}
                      <span className="capitalize">{order.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell>£{order.total.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffPortalOrders;
