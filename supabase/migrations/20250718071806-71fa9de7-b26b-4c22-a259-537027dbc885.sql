-- Fix function search path security issues
-- Update all functions to have secure search_path settings

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix log_book_interaction function
CREATE OR REPLACE FUNCTION public.log_book_interaction(p_user_id text, p_book_title text, p_book_author text, p_book_isbn text DEFAULT NULL::text, p_interaction_type text DEFAULT 'view'::text, p_digital_source text DEFAULT NULL::text, p_source_context text DEFAULT NULL::text, p_device_type text DEFAULT NULL::text, p_browser_type text DEFAULT NULL::text, p_search_query text DEFAULT NULL::text, p_response_time_ms integer DEFAULT NULL::integer, p_success boolean DEFAULT true, p_error_details text DEFAULT NULL::text, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  interaction_id UUID;
BEGIN
  INSERT INTO public.book_interactions (
    user_id, book_title, book_author, book_isbn, interaction_type,
    digital_source, source_context, device_type, browser_type,
    search_query, response_time_ms, success, error_details, metadata
  ) VALUES (
    p_user_id, p_book_title, p_book_author, p_book_isbn, p_interaction_type,
    p_digital_source, p_source_context, p_device_type, p_browser_type,
    p_search_query, p_response_time_ms, p_success, p_error_details, p_metadata
  ) RETURNING id INTO interaction_id;
  
  RETURN interaction_id;
END;
$function$;

-- Fix log_performance_metric function
CREATE OR REPLACE FUNCTION public.log_performance_metric(p_metric_type text, p_metric_value numeric, p_context text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text, p_device_type text DEFAULT NULL::text, p_network_type text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  metric_id UUID;
BEGIN
  INSERT INTO public.performance_metrics (
    metric_type, metric_value, context, user_agent, device_type, network_type
  ) VALUES (
    p_metric_type, p_metric_value, p_context, p_user_agent, p_device_type, p_network_type
  ) RETURNING id INTO metric_id;
  
  RETURN metric_id;
END;
$function$;