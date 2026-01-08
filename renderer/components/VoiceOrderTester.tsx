import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminSelect } from 'components/AdminSelect';
import { toast } from "sonner";
import { voiceOrderEvents } from "../utils/voiceOrderEvents";
import { Card } from "@/components/ui/card";
import { Wand2, Loader2 } from "lucide-react";

/**
 * Component for testing the voice order event system
 * Provides buttons to simulate various voice order events
 */
export function VoiceOrderTester() {
  const [scenario, setScenario] = useState("event_test_order");
  const [isSimulating, setIsSimulating] = useState(false);

  // Handle simulating a test order
  const handleSimulateOrder = async () => {
    try {
      setIsSimulating(true);
      toast.info("Simulating voice order event...");
      
      await voiceOrderEvents.simulateOrder(scenario);
      
      toast.success("Voice order simulation completed", {
        description: "Check the orders panel to see the simulated order"
      });
    } catch (error) {
      console.error("Error simulating order:", error);
      toast.error("Failed to simulate voice order");
    } finally {
      setIsSimulating(false);
    }
  };

  // Handle refreshing the voice orders
  const handleRefreshOrders = async () => {
    try {
      setIsSimulating(true);
      toast.info("Refreshing voice orders...");
      
      await voiceOrderEvents.refreshOrders();
      
      toast.success("Voice orders refreshed");
    } catch (error) {
      console.error("Error refreshing orders:", error);
      toast.error("Failed to refresh voice orders");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <Card className="p-4 bg-gray-900/30 border-gray-700 max-w-sm mx-auto">
      <h3 className="font-semibold text-lg mb-4 text-amber-200">Voice Order Event Tester</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Test Scenario</label>
          <AdminSelect
            value={scenario}
            onValueChange={setScenario}
            disabled={isSimulating}
            placeholder="Select scenario"
            options={[
              { value: "event_test_order", label: "Standard Test Order" },
              { value: "delivery_order", label: "Delivery Order" },
              { value: "call_no_order", label: "Call Without Order" },
              { value: "basic_call_ended", label: "Basic Call" }
            ]}
            variant="purple"
          />
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="secondary" 
            onClick={handleSimulateOrder} 
            disabled={isSimulating}
            className="flex-1 bg-amber-700 hover:bg-amber-600 text-white border-0"
          >
            {isSimulating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Simulate Order
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleRefreshOrders} 
            disabled={isSimulating}
            className="flex-1 border-amber-600 text-amber-300 hover:bg-amber-900/30"
          >
            {isSimulating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>Refresh Orders</>
            )}
          </Button>
        </div>
      </div>
      
      <p className="text-xs text-gray-400 mt-4">
        This tool allows you to test the event notification system by simulating voice orders.
      </p>
    </Card>
  );
}
