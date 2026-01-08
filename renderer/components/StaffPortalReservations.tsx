
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Phone,
  Users
} from "lucide-react";
import { colors, cardStyle } from "../utils/designSystem";

interface Reservation {
  id: string;
  customer: string;
  guests: number;
  date: string;
  time: string;
  table: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  phone?: string;
  notes?: string;
}

interface StaffPortalReservationsProps {
  activeSubsection: string;
}

const StaffPortalReservations: React.FC<StaffPortalReservationsProps> = ({ activeSubsection }) => {
  // Sample reservations data - would normally come from an API
  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: "RES-10001",
      customer: "David Thompson",
      guests: 4,
      date: "2025-04-27",
      time: "7:00 PM",
      table: "Table 5",
      status: "confirmed",
      phone: "07700 900123",
      notes: "Anniversary celebration"
    },
    {
      id: "RES-10002",
      customer: "Jessica Lee",
      guests: 2,
      date: "2025-04-27",
      time: "8:30 PM",
      table: "Table 8",
      status: "pending",
      phone: "07700 900456"
    },
    {
      id: "RES-10003",
      customer: "Mohammed Khan",
      guests: 6,
      date: "2025-04-28",
      time: "6:45 PM",
      table: "Table 12",
      status: "confirmed",
      phone: "07700 900789",
      notes: "Birthday celebration, needs high chair"
    },
    {
      id: "RES-10004",
      customer: "Sarah Wilson",
      guests: 3,
      date: "2025-04-28",
      time: "7:15 PM",
      table: "Table 3",
      status: "cancelled",
      phone: "07700 900321",
      notes: "Cancelled due to illness"
    },
    {
      id: "RES-10005",
      customer: "Raj Patel",
      guests: 5,
      date: "2025-04-29",
      time: "6:30 PM",
      table: "Table 10",
      status: "confirmed",
      phone: "07700 900654"
    }
  ]);
  
  // Filter reservations based on active subsection
  const filteredReservations = activeSubsection === "upcoming" 
    ? reservations.filter(res => res.status === "confirmed" || res.status === "pending")
    : reservations;
  
  // Get status badge style
  const getStatusBadge = (status: Reservation["status"]) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500/20 text-green-300 hover:bg-green-500/30 hover:text-green-300">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 hover:text-amber-300">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-300">Cancelled</Badge>;
      case "completed":
        return <Badge className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-300">Completed</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <Card style={cardStyle}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" style={{color: colors.brand.purple}} />
            <span>{activeSubsection === "upcoming" ? "Upcoming Reservations" : "Manage Reservations"}</span>
          </CardTitle>
          <CardDescription style={{color: colors.text.secondary}}>
            {activeSubsection === "upcoming" ? "View and prepare for upcoming bookings" : "Manage and edit customer bookings"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell className="font-medium">{reservation.id}</TableCell>
                  <TableCell>
                    <div>
                      <div>{reservation.customer}</div>
                      {reservation.phone && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone className="h-3 w-3" />
                          <span>{reservation.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{reservation.date}</TableCell>
                  <TableCell>{reservation.time}</TableCell>
                  <TableCell>{reservation.table}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span>{reservation.guests}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
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

export default StaffPortalReservations;
