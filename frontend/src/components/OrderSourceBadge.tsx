import { Badge } from "@/components/ui/badge";

export function OrderSourceBadge({ source }: { source: "POS" | "ONLINE" }) {
  const isPOS = source === "POS";
  return (
    <Badge className={isPOS ? "bg-slate-700 text-slate-200" : "bg-blue-600 text-white"}>
      {isPOS ? "🏪 POS" : "🌐 ONLINE"}
    </Badge>
  );
}
