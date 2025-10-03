// Supabase client optimizations for better performance

import { supabase } from "@/integrations/supabase/client";

// Batch multiple queries together for better performance
export async function batchQuery<T>(
  queries: (() => Promise<T>)[]
): Promise<T[]> {
  return Promise.all(queries.map(query => query()));
}

// Optimized query with select only required fields
export function optimizedSelect(fields: string[]) {
  return fields.join(',');
}

// Connection pooling hints
export const queryConfig = {
  // Limit concurrent connections
  maxConnections: 10,
  // Query timeout
  timeout: 30000,
  // Use read replicas for read-heavy operations
  preferReplica: true
};

// Debounced realtime subscription
export function createDebouncedSubscription(
  table: string,
  callback: () => void,
  debounceMs: number = 2000
) {
  let timeout: NodeJS.Timeout;
  
  return supabase
    .channel(`${table}-optimized`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table
      },
      () => {
        clearTimeout(timeout);
        timeout = setTimeout(callback, debounceMs);
      }
    )
    .subscribe();
}
