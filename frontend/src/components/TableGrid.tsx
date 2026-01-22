import { cn } from '@/lib/utils';
import type { RestaurantTable } from 'utils/useRestaurantTables';

interface TableGridProps {
  tables: RestaurantTable[];
  selectedTableId: string | null;
  onTableSelect: (tableId: string) => void;
}

export const TableGrid = ({ tables, selectedTableId, onTableSelect }: TableGridProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VACANT':
        return 'bg-green-500';
      case 'SEATED':
        return 'bg-yellow-500';
      case 'DINING':
        return 'bg-orange-500';
      case 'REQUESTING_CHECK':
        return 'bg-blue-500';
      case 'PAYING':
        return 'bg-purple-500';
      case 'CLEANING':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  return (
    <div className="p-6 grid grid-cols-4 gap-4 h-full overflow-auto">
      {tables.map((table) => (
        <button
          key={table.id}
          onClick={() => onTableSelect(table.id)}
          className={cn(
            'relative p-6 rounded-lg border-2 transition-all h-32 flex flex-col justify-center',
            selectedTableId === table.id
              ? 'border-primary bg-primary/10 ring-2 ring-primary'
              : 'border-border hover:border-primary/50 hover:bg-accent/50'
          )}
        >
          {/* Status Indicator */}
          <div
            className={cn(
              'absolute top-2 right-2 w-3 h-3 rounded-full',
              getStatusColor(table.status)
            )}
          />

          {/* Table Number */}
          <div className="text-2xl font-bold">
            Table {table.table_number}
          </div>

          {/* Table Info */}
          <div className="text-sm text-muted-foreground mt-1">
            {table.section} • {table.capacity} seats
          </div>

          {/* Status */}
          <div className="text-xs text-muted-foreground capitalize mt-2">
            {getStatusLabel(table.status)}
          </div>
        </button>
      ))}
    </div>
  );
};
