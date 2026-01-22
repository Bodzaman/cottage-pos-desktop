import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  totalOrders: number;
  audioEnabled: boolean;
  onToggleAudio: () => void;
}

export function KitchenHeader({ totalOrders, audioEnabled, onToggleAudio }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kitchen Display</h1>
        <div className="mt-1 text-sm text-muted-foreground">Unified feed of POS + Online orders</div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{totalOrders} active</Badge>
        <Button variant={audioEnabled ? "default" : "secondary"} onClick={onToggleAudio}>
          {audioEnabled ? "Disable Sound" : "Enable Sound"}
        </Button>
      </div>
    </div>
  );
}
