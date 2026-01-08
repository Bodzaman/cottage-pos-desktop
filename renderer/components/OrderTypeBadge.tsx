import { Badge } from "@/components/ui/badge";

export function OrderTypeBadge({ type }: { type: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING" }) {
  const map: Record<string, string> = {
    "DINE-IN": "bg-purple-600/20 text-purple-400 border-purple-600/30",
    COLLECTION: "bg-amber-600/20 text-amber-400 border-amber-600/30",
    DELIVERY: "bg-indigo-600/20 text-indigo-400 border-indigo-600/30",
    WAITING: "bg-orange-600/20 text-orange-400 border-orange-600/30",
  };
  return <Badge className={map[type] || "bg-gray-600/20 text-gray-300"}>{type}</Badge>;
}
