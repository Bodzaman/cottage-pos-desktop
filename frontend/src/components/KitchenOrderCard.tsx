import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UnifiedKitchenOrder } from "utils/kitchenTypes";
import { OrderSourceBadge } from "components/OrderSourceBadge";
import { OrderTypeBadge } from "components/OrderTypeBadge";
import { OrderItemRow } from "components/OrderItemRow";
import { StatusButtons } from "components/StatusButtons";
import { QSAITheme, effects } from "utils/QSAIDesign";
import { motion } from "framer-motion";

interface Props {
  order: UnifiedKitchenOrder;
  onStatusUpdate: (orderId: string, status: UnifiedKitchenOrder["status"]) => void;
}

export function KitchenOrderCard({ order, onStatusUpdate }: Props) {
  const isPriority = order.isPriority;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="transition-all duration-300 overflow-hidden"
        style={{
          borderColor: String(order.statusColor),
          borderWidth: 3,
          background: QSAITheme.background.card,
          boxShadow: isPriority 
            ? `0 0 25px ${QSAITheme.purple.glow}, ${effects.outerGlow('strong')}` 
            : `0 4px 12px rgba(0,0,0,0.3)`,
          borderRadius: '0.75rem',
          position: 'relative'
        }}
      >
        {/* Priority Indicator */}
        {isPriority && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(90deg, ${QSAITheme.purple.primary}, ${QSAITheme.purple.light}, ${QSAITheme.purple.primary})`,
              boxShadow: `0 0 10px ${QSAITheme.purple.glow}`
            }}
          />
        )}

        <CardHeader style={{ paddingBottom: '0.75rem' }}>
          {/* Order Number & Source */}
          <div className="flex items-center justify-between mb-2">
            <h3 
              className="font-bold text-2xl tracking-tight"
              style={{ 
                color: isPriority ? QSAITheme.purple.light : QSAITheme.text.primary,
                textShadow: isPriority ? `0 0 10px ${QSAITheme.purple.glow}` : 'none'
              }}
            >
              {order.orderNumber}
            </h3>
            <OrderSourceBadge source={order.orderSource} />
          </div>

          {/* Order Type & Customer Info */}
          <div className="flex items-center gap-2 text-sm flex-wrap mb-2" style={{ color: QSAITheme.text.secondary }}>
            <OrderTypeBadge type={order.orderType} />
            {order.customerName && (
              <>
                <span>•</span>
                <span className="font-medium">{order.customerName}</span>
              </>
            )}
            {order.tableNumber && (
              <>
                <span>•</span>
                <Badge 
                  variant="outline"
                  style={{
                    background: `${QSAITheme.purple.primary}20`,
                    borderColor: QSAITheme.purple.primary,
                    color: QSAITheme.purple.light
                  }}
                >
                  Table {order.tableNumber}
                </Badge>
              </>
            )}
          </div>

          {/* Time Display */}
          <div 
            className="text-xl font-bold flex items-center gap-2"
            style={{ 
              color: isPriority ? QSAITheme.status.error : QSAITheme.text.primary,
              textShadow: effects.textShadow('medium')
            }}
          >
            <span>⏱</span>
            <span>{order.timeDisplay}</span>
            {isPriority && (
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ color: QSAITheme.status.error }}
              >
                🔥
              </motion.span>
            )}
          </div>
        </CardHeader>

        <CardContent style={{ paddingTop: '0.5rem', paddingBottom: '0.75rem' }}>
          {/* Order Items */}
          <div 
            className="space-y-2 p-3 rounded-lg"
            style={{
              background: QSAITheme.background.secondary,
              border: `1px solid ${QSAITheme.border.light}`
            }}
          >
            {order.items.map((it) => (
              <OrderItemRow key={it.id} item={it} />
            ))}
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 rounded-lg"
              style={{
                background: `${QSAITheme.status.warning}15`,
                border: `1px solid ${QSAITheme.status.warning}30`,
                color: QSAITheme.status.warning
              }}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">📝</span>
                <div className="flex-1">
                  <div className="text-xs font-semibold mb-1" style={{ color: QSAITheme.status.warning }}>Special Instructions</div>
                  <div className="text-sm">{order.specialInstructions}</div>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>

        <CardFooter style={{ paddingTop: '0.75rem' }}>
          <StatusButtons orderId={order.id} currentStatus={order.status} onStatusUpdate={onStatusUpdate} />
        </CardFooter>
      </Card>
    </motion.div>
  );
}
