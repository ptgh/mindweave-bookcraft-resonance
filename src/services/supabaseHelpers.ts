import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

// Generic error handler for Supabase operations
export const handleSupabaseError = (error: PostgrestError | null, context: string = '') => {
  if (!error) return null;
  
  console.error(`Supabase error ${context}:`, error);
  
  // Common error mappings
  const errorMessages: Record<string, string> = {
    '42P01': 'Table not found. Please contact support.',
    '23505': 'This item already exists.',
    '23503': 'Referenced item not found.',
    '42501': 'Permission denied. Please check your access rights.',
    'PGRST116': 'No data found.',
    'PGRST106': 'The result contains 0 rows.'
  };

  const friendlyMessage = errorMessages[error.code] || error.message || 'An unexpected error occurred.';
  
  return {
    code: error.code,
    message: error.message,
    friendlyMessage,
    details: error.details,
    hint: error.hint
  };
};

// Helper for paginated queries
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  ascending?: boolean;
}

export const buildPaginatedQuery = <T>(
  query: any,
  options: PaginationOptions = {}
) => {
  const { page = 1, pageSize = 20, orderBy, ascending = false } = options;
  
  let paginatedQuery = query;
  
  // Add ordering
  if (orderBy) {
    paginatedQuery = paginatedQuery.order(orderBy, { ascending });
  }
  
  // Add pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  return paginatedQuery.range(from, to);
};

// Helper for full-text search
export const buildSearchQuery = (
  query: any,
  searchTerm: string,
  columns: string[]
) => {
  if (!searchTerm.trim()) return query;
  
  // Build OR conditions for multiple columns
  const searchConditions = columns
    .map(column => `${column}.ilike.%${searchTerm}%`)
    .join(',');
  
  return query.or(searchConditions);
};

// Helper for filtering by date ranges
export interface DateRangeFilter {
  column: string;
  from?: string;
  to?: string;
}

export const buildDateRangeQuery = (
  query: any,
  dateFilter: DateRangeFilter
) => {
  const { column, from, to } = dateFilter;
  
  let filteredQuery = query;
  
  if (from) {
    filteredQuery = filteredQuery.gte(column, from);
  }
  
  if (to) {
    filteredQuery = filteredQuery.lte(column, to);
  }
  
  return filteredQuery;
};

// Helper for batch operations
export const batchOperation = async <T>(
  items: T[],
  operation: (batch: T[]) => Promise<any>,
  batchSize: number = 100
) => {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    try {
      const result = await operation(batch);
      results.push(result);
    } catch (error) {
      console.error(`Batch operation failed for items ${i}-${i + batch.length}:`, error);
      throw error;
    }
  }
  
  return results;
};

// Helper for retrying failed operations
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
};

// Helper for checking user permissions
export const checkUserPermission = async (
  requiredRole: 'admin' | 'moderator' | 'user' | 'premium'
) => {
  try {
    const { data: userRole } = await supabase
      .rpc('get_current_user_role');
      
    if (!userRole) return false;
    
    const roleHierarchy = { admin: 4, moderator: 3, premium: 2, user: 1 };
    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy];
    const requiredLevel = roleHierarchy[requiredRole];
    
    return userLevel >= requiredLevel;
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
};

// Helper for uploading files with progress
export const uploadFileWithProgress = async (
  bucket: string,
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });
    }
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(path);
        resolve(data.publicUrl);
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    };
    
    xhr.onerror = () => reject(new Error('Upload failed'));
    
    // Get upload URL from Supabase and upload
    supabase.storage
      .from(bucket)
      .upload(path, file)
      .then(({ error }) => {
        if (error) {
          reject(error);
        } else {
          const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);
          resolve(data.publicUrl);
        }
      })
      .catch(reject);
  });
};

// Helper for database health checks
export const checkDatabaseHealth = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    return { healthy: !error, error };
  } catch (error) {
    return { healthy: false, error };
  }
};

// Helper for cleaning up old data
export const cleanupOldData = async (
  table: 'profiles' | 'transmissions' | 'reading_sessions' | 'book_interactions' | 'performance_metrics',
  dateColumn: string,
  daysOld: number
) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const { data, error } = await supabase
    .from(table)
    .delete()
    .lt(dateColumn, cutoffDate.toISOString());
    
  return { data, error: handleSupabaseError(error, `cleanup ${table}`) };
};