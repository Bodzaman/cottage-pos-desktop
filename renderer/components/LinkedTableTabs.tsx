import { Button } from '@/components/ui/button';
import { QSAITheme } from 'utils/QSAIDesign';

interface LinkedTableTabsProps {
  tables: number[];
  selectedTable: number;
  tableOrders: Record<number, { order_items: any[] }>;
  onTableSwitch: (table: number) => void;
}

/**
 * Renders linked table tabs for large parties
 * Shows table number and item count for each linked table
 */
export function LinkedTableTabs({
  tables,
  selectedTable,
  tableOrders,
  onTableSwitch
}: LinkedTableTabsProps) {
  if (tables.length <= 1) return null;
  
  return (
    <div className="flex gap-2 mt-3">
      {tables.map(table => {
        const tableOrder = tableOrders[table];
        const itemCount = tableOrder?.order_items.length || 0;
        
        return (
          <Button
            key={table}
            variant={selectedTable === table ? "default" : "outline"}
            size="sm"
            onClick={() => onTableSwitch(table)}
            style={{
              backgroundColor: selectedTable === table ? QSAITheme.purple.primary : 'transparent',
              borderColor: selectedTable === table ? QSAITheme.purple.primary : QSAITheme.border.medium,
              color: selectedTable === table ? 'white' : QSAITheme.text.primary
            }}
            className="text-xs h-8"
          >
            Table {table}
            {itemCount > 0 && (
              <span className="ml-1 text-xs opacity-80">({itemCount})</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
