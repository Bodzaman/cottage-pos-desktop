
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InfoIcon, PhoneCall, Headphones, Cog, Calendar } from 'lucide-react';

export function VoiceOrderTestPanel() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-1 flex items-center">
              <PhoneCall className="mr-2 h-5 w-5 text-indigo-400" />
              Voice Order Test Panel
            </h3>
            <p className="text-muted-foreground">
              Test and debug the Ultravox AI voice agent with real customer scenarios
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            ULTRAVOX AI
          </Badge>
        </div>
        
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Menu Corpus Connection</AlertTitle>
          <AlertDescription>
            The AI voice agent uses your menu corpus data to answer customer questions and take orders.
            Make sure your menu corpus is properly configured before testing voice orders.
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="scenarios">
          <TabsList>
            <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
            <TabsTrigger value="orders">Voice Orders</TabsTrigger>
            <TabsTrigger value="bookings">Table Bookings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="scenarios" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    <Headphones className="h-5 w-5 mr-2 text-indigo-400" />
                    <h4 className="font-medium">Menu Item Query</h4>
                  </div>
                  <p className="text-sm text-gray-300 mb-4">
                    "Do you have any vegetarian curries?"
                  </p>
                  <Button className="w-full bg-indigo-700 hover:bg-indigo-600">
                    Test Scenario
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    <Headphones className="h-5 w-5 mr-2 text-indigo-400" />
                    <h4 className="font-medium">Takeaway Order</h4>
                  </div>
                  <p className="text-sm text-gray-300 mb-4">
                    "I'd like to order a Chicken Tikka Masala and a Garlic Naan for takeaway."
                  </p>
                  <Button className="w-full bg-indigo-700 hover:bg-indigo-600">
                    Test Scenario
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    <Calendar className="h-5 w-5 mr-2 text-indigo-400" />
                    <h4 className="font-medium">Table Reservation</h4>
                  </div>
                  <p className="text-sm text-gray-300 mb-4">
                    "I'd like to book a table for 4 people this Saturday at 7pm."
                  </p>
                  <Button className="w-full bg-indigo-700 hover:bg-indigo-600">
                    Test Scenario
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    <Cog className="h-5 w-5 mr-2 text-indigo-400" />
                    <h4 className="font-medium">Special Requirements</h4>
                  </div>
                  <p className="text-sm text-gray-300 mb-4">
                    "Do you have any dishes without nuts? I have a nut allergy."
                  </p>
                  <Button className="w-full bg-indigo-700 hover:bg-indigo-600">
                    Test Scenario
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <Separator />
            
            <div className="bg-gray-800 rounded-md p-4">
              <h4 className="font-medium mb-3">About Voice Test Scenarios</h4>
              <p className="text-sm text-gray-300">
                These test scenarios simulate common customer interactions with your AI voice agent. 
                Each scenario uses your actual menu corpus data to generate responses.
                <br /><br />
                Note: Full voice test capability is currently under development. Check back soon for complete testing functionality.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="orders" className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">VO-2023-001</TableCell>
                  <TableCell>2023-05-24 18:32</TableCell>
                  <TableCell>Chicken Tikka Masala, Garlic Naan</TableCell>
                  <TableCell>
                    <Badge variant="outline">Takeaway</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-900/30 text-green-400 border-green-800">Completed</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">View</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div className="flex justify-center mt-4">
              <Badge variant="outline" className="text-muted-foreground">
                Voice Order History Coming Soon
              </Badge>
            </div>
          </TabsContent>
          
          <TabsContent value="bookings" className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Party Size</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">VB-2023-001</TableCell>
                  <TableCell>2023-05-28 19:00</TableCell>
                  <TableCell>4 people</TableCell>
                  <TableCell>John Smith</TableCell>
                  <TableCell>
                    <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-800">Pending</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">View</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div className="flex justify-center mt-4">
              <Badge variant="outline" className="text-muted-foreground">
                Voice Booking History Coming Soon
              </Badge>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
