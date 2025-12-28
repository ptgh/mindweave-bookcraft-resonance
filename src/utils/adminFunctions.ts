import { supabase } from "@/integrations/supabase/client";

/**
 * Helper to invoke admin-protected edge functions with proper authorization.
 * Automatically includes the user's auth token in the request.
 */
export async function invokeAdminFunction<T = unknown>(
  functionName: string,
  body?: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      return { 
        data: null, 
        error: new Error('Not authenticated. Please log in as an admin.') 
      };
    }

    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      // Handle specific HTTP errors
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        return { data: null, error: new Error('Authentication required. Please log in again.') };
      }
      if (error.message?.includes('403') || error.message?.includes('Admin access required')) {
        return { data: null, error: new Error('Admin access required. You do not have permission.') };
      }
      return { data: null, error };
    }

    return { data: data as T, error: null };
  } catch (err) {
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error('Unknown error occurred') 
    };
  }
}
