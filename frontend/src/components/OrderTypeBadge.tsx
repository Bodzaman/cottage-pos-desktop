import { Badge } from "@/components/ui/badge";

interface OrderTypeBadgeProps {
  type: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  prominent?: boolean;
}

export function OrderTypeBadge({ type, prominent = false }: OrderTypeBadgeProps) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    "DINE-IN": { bg: "bg-purple-600/20", text: "text-purple-400", border: "border-purple-600/30" },
    COLLECTION: { bg: "bg-amber-600/20", text: "text-amber-400", border: "border-amber-600/30" },
    DELIVERY: { bg: "bg-indigo-600/20", text: "text-indigo-400", border: "border-indigo-600/30" },
    WAITING: { bg: "bg-orange-600/20", text: "text-orange-400", border: "border-orange-600/30" },
  };

  const colors = colorMap[type] || { bg: "bg-gray-600/20", text: "text-gray-300", border: "" };

  if (prominent) {
    return (
      <div className={`w-full text-center py-2 rounded-lg ${colors.bg} ${colors.border} border`}>
        <span className={`text-xl font-black tracking-wider ${colors.text}`}>
          {type}
        </span>
      </div>
    );
  }

  return <Badge className={`${colors.bg} ${colors.text} ${colors.border}`}>{type}</Badge>;
}
