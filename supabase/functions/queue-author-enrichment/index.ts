import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueueRequest {
  authorId?: string;
  authorName?: string;
  priority?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body: QueueRequest = await req.json();
    const { authorId, authorName, priority = 9 } = body || {};

    if (!authorId && !authorName) {
      return new Response(
        JSON.stringify({ success: false, message: 'authorId or authorName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Queue request received:', { authorId, authorName, priority });

    // Resolve authorId from name if needed
    let resolvedAuthorId = authorId as string | undefined;
    if (!resolvedAuthorId && authorName) {
      const { data: author, error: findError } = await supabase
        .from('scifi_authors')
        .select('id, name')
        .ilike('name', `%${authorName}%`)
        .limit(1)
        .single();

      if (findError || !author) {
        return new Response(
          JSON.stringify({ success: false, message: `Author not found for name: ${authorName}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      resolvedAuthorId = author.id;
    }

    if (!resolvedAuthorId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unable to resolve authorId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already queued (pending or processing)
    const { data: existing } = await supabase
      .from('author_enrichment_queue')
      .select('id, status')
      .eq('author_id', resolvedAuthorId)
      .in('status', ['pending', 'processing'])
      .limit(1)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, message: 'Already queued', jobId: existing.id, authorId: resolvedAuthorId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure author is marked as needing enrichment
    await supabase
      .from('scifi_authors')
      .update({ needs_enrichment: true })
      .eq('id', resolvedAuthorId);

    // Insert queue job
    const { data: job, error: insertError } = await supabase
      .from('author_enrichment_queue')
      .insert({
        author_id: resolvedAuthorId,
        enrichment_type: 'full',
        priority,
        status: 'pending'
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to insert job' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Queued', jobId: job.id, authorId: resolvedAuthorId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('queue-author-enrichment error:', error);
    return new Response(
      JSON.stringify({ success: false, message: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});