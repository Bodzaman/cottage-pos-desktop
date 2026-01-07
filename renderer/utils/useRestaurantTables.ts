import { useEffect, useState } from 'react';
import { supabase, getSupabase } from './supabaseClient';

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
  const [supabaseReady, setSupabaseReady] = useState(false);

  // First effect: Wait for Supabase to be properly configured
  useEffect(() => {
    let mounted = true;
    
    const initSupabase = async () => {
      try {
        console.log('[useRestaurantTables] ⏳ Waiting for Supabase config...');
        await getSupabase(); // Wait for correct config
        if (mounted) {
          console.log('[useRestaurantTables] ✅ Supabase configured, ready to subscribe');
          setSupabaseReady(true);
        }
      } catch (err) {
        console.error('[useRestaurantTables] ❌ Failed to initialize Supabase:', err);
        if (mounted) {
          setError('Failed to initialize database connection');
          setLoading(false);
        }
      }
    };
    
    initSupabase();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Second effect: Only run when Supabase is ready
  useEffect(() => {
    if (!supabaseReady) {
      console.log('[useRestaurantTables] ⏸️ Waiting for Supabase to be ready...');
      return;
    }

    const fetchTables = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('pos_tables')
          .select('*')
          .order('table_number');

        if (fetchError) throw fetchError;

        if (data) {
          // 🐛 DEBUG: Log raw Supabase data for Tables 7 & 8
          console.log('[useRestaurantTables] 📊 Total tables from Supabase:', data.length);
          const table7Raw = data.find((t: any) => t.table_number === 7 || t.table_number === '7');
          const table8Raw = data.find((t: any) => t.table_number === 8 || t.table_number === '8');
          
          if (table7Raw) {
            console.log('[useRestaurantTables] 🔍 RAW Table 7 from Supabase:', table7Raw);
          }
          if (table8Raw) {
            console.log('[useRestaurantTables] 🔍 RAW Table 8 from Supabase:', table8Raw);
          }
          
          // Transform pos_tables schema to RestaurantTable interface
          const transformedTables: RestaurantTable[] = data.map((table: any) => ({
            id: table.id,
            table_number: table.table_number.toString(),
            capacity: table.capacity || 4,
            status: mapStatus(table.status),
            
            // Optional pos_tables fields
            is_linked_table: table.is_linked_table || false,
            is_linked_primary: table.is_linked_primary || false,
            linked_table_group_id: table.linked_table_group_id || null,
            linked_with_tables: table.linked_with_tables || [],
            
            // Event-driven fields from pos_tables
            section: table.section || null,
            current_order_id: table.current_order_id || null,
            seated_at: table.seated_at || null,
            created_at: table.last_updated,
            updated_at: table.last_updated
          }));
          
          // 🐛 DEBUG: Log transformed data for Tables 7 & 8
          const table7Trans = transformedTables.find(t => t.table_number === '7');
          const table8Trans = transformedTables.find(t => t.table_number === '8');
          
          if (table7Trans) {
            console.log('[useRestaurantTables] ✅ TRANSFORMED Table 7:', table7Trans);
          }
          if (table8Trans) {
            console.log('[useRestaurantTables] ✅ TRANSFORMED Table 8:', table8Trans);
          }
          
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
    console.log('[useRestaurantTables] 🔌 Creating subscription for pos_tables');
    
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
          console.log('[useRestaurantTables] 🔔 Real-time callback triggered!', payload);
          
          setTables((current) => {
            if (payload.eventType === 'INSERT') {
              console.log('[useRestaurantTables] ➡️ INSERT event - adding new table');
              const newTable = payload.new as any;
              const transformed: RestaurantTable = {
                id: newTable.id,  // ✅ FIXED: Use actual UUID from pos_tables.id
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
              console.log('[useRestaurantTables] ➡️ UPDATE event - updating table:', payload.new);
              const updatedTable = payload.new as any;
              return current.map((t) =>
                t.id === updatedTable.id
                  ? {
                      ...t,
                      table_number: updatedTable.table_number.toString(),
                      capacity: updatedTable.capacity || 4,
                      status: mapStatus(updatedTable.status),
                      is_linked_table: updatedTable.is_linked_table || false,
                      is_linked_primary: updatedTable.is_linked_primary || false,
                      linked_table_group_id: updatedTable.linked_table_group_id || null,
                      linked_with_tables: updatedTable.linked_with_tables || [],
                      section: updatedTable.section || null,
                      current_order_id: updatedTable.current_order_id || null,
                      seated_at: updatedTable.seated_at || null,
                      updated_at: updatedTable.last_updated
                    }
                  : t
              );
            }
            if (payload.eventType === 'DELETE') {
              console.log('[useRestaurantTables] ➡️ DELETE event - removing table');
              return current.filter(
                (table) => table.table_number !== (payload.old as any).table_number.toString()
              );
            }
            
            console.log('[useRestaurantTables] ⚠️ Unknown event type:', payload.eventType);
            return current;
          });
        }
      )
      .subscribe((status) => {
        console.log(`[useRestaurantTables] 📡 Subscription status changed: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log('[useRestaurantTables] ✅ Successfully subscribed to pos_tables');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useRestaurantTables] ❌ Channel error');
          setError('Real-time subscription failed');
        } else if (status === 'TIMED_OUT') {
          console.error('[useRestaurantTables] ⏱️ Subscription timed out');
          setError('Real-time subscription timed out');
        }
      });

    console.log('[useRestaurantTables] 🎯 Subscription object created:', subscription);

    return () => {
      console.log('[useRestaurantTables] 🔌 Unsubscribing from pos_tables');
      subscription.unsubscribe();
    };
  }, [supabaseReady]);

  // ✅ NEW: Refetch function for explicit data refresh
  const refetch = async () => {
    if (!supabaseReady) {
      console.warn('[useRestaurantTables] ⚠️ Cannot refetch - Supabase not ready');
      return;
    }

    try {
      console.log('[useRestaurantTables] 🔄 Manual refetch triggered');
      const { data, error: fetchError } = await supabase
        .from('pos_tables')
        .select('*')
        .order('table_number');

      if (fetchError) throw fetchError;

      if (data) {
        const transformedTables: RestaurantTable[] = data.map((table: any) => ({
          id: table.id,
          table_number: table.table_number.toString(),
          capacity: table.capacity || 4,
          status: mapStatus(table.status),
          is_linked_table: table.is_linked_table || false,
          is_linked_primary: table.is_linked_primary || false,
          linked_table_group_id: table.linked_table_group_id || null,
          linked_with_tables: table.linked_with_tables || [],
          section: table.section || null,
          current_order_id: table.current_order_id || null,
          seated_at: table.seated_at || null,
          created_at: table.last_updated,
          updated_at: table.last_updated
        }));
        
        setTables(transformedTables);
        console.log(`[useRestaurantTables] ✅ Refetch complete: ${transformedTables.length} tables`);
      }
    } catch (err: any) {
      console.error('[useRestaurantTables] ❌ Refetch error:', err);
      setError(err.message);
    }
  };

  return { tables, loading, error, refetch };
};
