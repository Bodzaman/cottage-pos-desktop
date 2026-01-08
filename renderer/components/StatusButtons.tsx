import { Button } from "@/components/ui/button";
import { KitchenOrderStatus } from "utils/kitchenTypes";
import { QSAITheme, effects } from "utils/QSAIDesign";
import { motion } from "framer-motion";

interface Props {
  orderId: string;
  currentStatus: KitchenOrderStatus;
  onStatusUpdate: (orderId: string, status: KitchenOrderStatus) => void;
}

export function StatusButtons({ orderId, currentStatus, onStatusUpdate }: Props) {
  const canMarkReady = currentStatus === "PENDING" || currentStatus === "PREPARING";
  const canComplete = currentStatus === "READY";

  return (
    <div className="flex gap-2 w-full">
      {canMarkReady && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
          <Button 
            className="w-full font-semibold transition-all duration-200"
            onClick={() => onStatusUpdate(orderId, "READY")}
            style={{
              background: QSAITheme.purple.primary,
              color: QSAITheme.text.primary,
              border: `1px solid ${QSAITheme.purple.light}`,
              boxShadow: `0 0 15px ${QSAITheme.purple.glow}`
            }}
          >
            ✅ Mark Ready
          </Button>
        </motion.div>
      )}
      {canComplete && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
          <Button 
            className="w-full font-semibold transition-all duration-200"
            onClick={() => onStatusUpdate(orderId, "COMPLETED")}
            style={{
              background: QSAITheme.status.success,
              color: QSAITheme.background.primary,
              border: `1px solid ${QSAITheme.text.secondary}`,
              boxShadow: effects.outerGlow('medium')
            }}
          >
            🎉 Complete
          </Button>
        </motion.div>
      )}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button 
          variant="ghost" 
          onClick={() => onStatusUpdate(orderId, "DELAYED")}
          className="transition-all duration-200"
          style={{
            background: QSAITheme.background.secondary,
            color: QSAITheme.status.error,
            border: `1px solid ${QSAITheme.border.medium}`
          }}
        >
          ⚠️ Delayed
        </Button>
      </motion.div>
    </div>
  );
}
