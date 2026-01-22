import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';

export interface RestaurantTable {
  id: string; // Will use table_number as string
  table_number: string;
  capacity: number;
  status: 'VACANT' | 'SEATED' | 'DINING' | 'REQUESTING_CHECK' | 'PAYING' | 'CLEANING';
  
  // Optional fields from pos_tables
  is_linked_table?: boolean;
  is_linked_primary?: boolean;
  linked_table_group_id?: string;
  linked_with_tables?: number[];
  
  // Fields for event-driven architecture (will default to null)
  section?: string | null;
  current_order_id?: string | null;
  seated_at?: string | null;
  created_at?: string;
  updated_at: string;
}

/**
 * Map pos_tables status to event-driven status
 */
const mapStatus = (posStatus: string): RestaurantTable['status'] => {
  const statusMap: Record<string, RestaurantTable['status']> = {
    'AVAILABLE': 'VACANT',
    'available': 'VACANT',
    'OCCUPIED': 'DINING',
    'occupied': 'DINING',
    'RESERVED': 'SEATED',
    'reserved': 'SEATED',
    'UNAVAILABLE': 'CLEANING',
    'unavailable': 'CLEANING'
  };
  
  return statusMap[posStatus] || 'VACANT';
};

export const useRestaurantTables = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('pos_tables')
          .select('*')
          .order('table_number');

        if (fetchError) throw fetchError;

        if (data) {
          // Transform pos_tables schema to RestaurantTable interface
          const transformedTables: RestaurantTable[] = data.map((table: any) => ({
            id: table.table_number.toString(),
            table_number: table.table_number.toString(),
            capacity: table.capacity || 4,
            status: mapStatus(table.status),
            
            // Optional pos_tables fields
            is_linked_table: table.is_linked_table || false,
            is_linked_primary: table.is_linked_primary || false,
            linked_table_group_id: table.linked_table_group_id || null,
            linked_with_tables: table.linked_with_tables || [],
            
            // Event-driven fields (defaults)
            section: null,
            current_order_id: null,
            seated_at: null,
            created_at: table.last_updated,
            updated_at: table.last_updated
          }));
          
          setTables(transformedTables);
          console.log(`[useRestaurantTables] Loaded ${transformedTables.length} tables from pos_tables`);
        }
      } catch (err: any) {
        console.error('[useRestaurantTables] Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();

    // Subscribe to pos_tables updates
    const subscription = supabase
      .channel('pos-tables-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pos_tables',
        },
        (payload) => {
          console.log('[useRestaurantTables] Real-time update:', payload);
          
          setTables((current) => {
            if (payload.eventType === 'INSERT') {
              const newTable = payload.new as any;
              const transformed: RestaurantTable = {
                id: newTable.table_number.toString(),
                table_number: newTable.table_number.toString(),
                capacity: newTable.capacity || 4,
                status: mapStatus(newTable.status),
                is_linked_table: newTable.is_linked_table || false,
                is_linked_primary: newTable.is_linked_primary || false,
                linked_table_group_id: newTable.linked_table_group_id || null,
                linked_with_tables: newTable.linked_with_tables || [],
                section: null,
                current_order_id: null,
                seated_at: null,
                created_at: newTable.last_updated,
                updated_at: newTable.last_updated
              };
              return [...current, transformed];
            }
            if (payload.eventType === 'UPDATE') {
              const updatedTable = payload.new as any;
              const transformed: RestaurantTable = {
                id: updatedTable.table_number.toString(),
                table_number: updatedTable.table_number.toString(),
                capacity: updatedTable.capacity || 4,
                status: mapStatus(updatedTable.status),
                is_linked_table: updatedTable.is_linked_table || false,
                is_linked_primary: updatedTable.is_linked_primary || false,
                linked_table_group_id: updatedTable.linked_table_group_id || null,
                linked_with_tables: updatedTable.linked_with_tables || [],
                section: null,
                current_order_id: null,
                seated_at: null,
                created_at: updatedTable.last_updated,
                updated_at: updatedTable.last_updated
              };
              return current.map((t) =>
                t.id === transformed.id ? transformed : t
              );
            }
            if (payload.eventType === 'DELETE') {
              return current.filter((t) => t.id !== payload.old.table_number.toString());
            }
            return current;
          });
        }
      )
      .subscribe();

    console.log('[useRestaurantTables] Subscribed to pos_tables real-time updates');

    return () => {
      console.log('[useRestaurantTables] Unsubscribing');
      subscription.unsubscribe();
    };
  }, []);

  // Manual refetch function
  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('pos_tables')
        .select('*')
        .order('table_number');

      if (fetchError) throw fetchError;

      if (data) {
        const transformedTables: RestaurantTable[] = data.map((table: any) => ({
          id: table.table_number.toString(),
          table_number: table.table_number.toString(),
          capacity: table.capacity || 4,
          status: mapStatus(table.status),
          is_linked_table: table.is_linked_table || false,
          is_linked_primary: table.is_linked_primary || false,
          linked_table_group_id: table.linked_table_group_id || null,
          linked_with_tables: table.linked_with_tables || [],
          section: null,
          current_order_id: null,
          seated_at: null,
          created_at: table.last_updated,
          updated_at: table.last_updated
        }));
        setTables(transformedTables);
      }
    } catch (err: any) {
      console.error('[useRestaurantTables] Refetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { tables, loading, error, refetch };
};
