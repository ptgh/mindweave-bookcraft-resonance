
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WikipediaResponse {
  query?: {
    pages?: {
      [key: string]: {
        extract?: string;
        categories?: { title: string }[];
      }
    }
  }
}

serve(async (req) => {
  console.log('=== Enrich author data function called ===');
  console.log('Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check - URL exists:', !!supabaseUrl, 'Key exists:', !!serviceRoleKey);
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Missing Supabase environment variables');
    }

    console.log('Creating Supabase client...');
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);
    console.log('Supabase client created successfully');

    // Get pending enrichment jobs with better error handling
    console.log('=== Fetching pending enrichment jobs ===');
    const { data: jobs, error: jobsError } = await supabaseClient
      .from('author_enrichment_queue')
      .select('id, author_id, enrichment_type, attempts, created_at')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(10);

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      throw jobsError;
    }

    console.log(`Found ${jobs?.length || 0} pending jobs`);
    if (jobs && jobs.length > 0) {
      console.log('Job details:', jobs.map(j => ({ id: j.id, author_id: j.author_id, attempts: j.attempts })));
    }
    
    if (!jobs || jobs.length === 0) {
      console.log('=== No pending jobs found ===');
      
      // Check if there are any authors needing enrichment
      const { data: needsEnrichment, error: needsError } = await supabaseClient
        .from('scifi_authors')
        .select('id, name, needs_enrichment')
        .eq('needs_enrichment', true)
        .limit(5);
      
      console.log('Authors needing enrichment:', needsEnrichment?.length || 0);
      if (needsEnrichment && needsEnrichment.length > 0) {
        console.log('Creating enrichment jobs for authors:', needsEnrichment.map(a => a.name));
        
        // Create jobs for authors that need enrichment
        const newJobs = needsEnrichment.map(author => ({
          author_id: author.id,
          enrichment_type: 'full',
          priority: 5,
          status: 'pending'
        }));
        
        const { error: insertError } = await supabaseClient
          .from('author_enrichment_queue')
          .insert(newJobs);
        
        if (insertError) {
          console.error('Error creating new jobs:', insertError);
        } else {
          console.log(`Created ${newJobs.length} new enrichment jobs`);
          // Recursively call to process the new jobs
          const recursiveCall = await serve(req);
          return recursiveCall;
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending jobs found',
          processed: 0,
          results: [],
          authorsNeedingEnrichment: needsEnrichment?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const job of jobs) {
      console.log(`=== Processing job ${job.id} for author ${job.author_id} ===`);
      console.log(`Job attempts: ${job.attempts}, type: ${job.enrichment_type}`);
      
      try {
        // Mark job as processing
        console.log('Marking job as processing...');
        const { error: updateError } = await supabaseClient
          .from('author_enrichment_queue')
          .update({ 
            status: 'processing',
            attempts: job.attempts + 1
          })
          .eq('id', job.id);

        if (updateError) {
          console.error('Error updating job status:', updateError);
          continue;
        }
        console.log('Job marked as processing successfully');

        // Get author details
        console.log(`Fetching author details for ${job.author_id}`);
        const { data: author, error: authorError } = await supabaseClient
          .from('scifi_authors')
          .select('id, name, bio, birth_year, death_year, notable_works')
          .eq('id', job.author_id)
          .single();

        if (authorError) {
          console.error('Error fetching author:', authorError);
          throw authorError;
        }

        console.log(`Processing author: ${author.name}`);

        // Fetch from Wikipedia
        const wikipediaUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(author.name)}`;
        console.log(`Fetching from Wikipedia: ${wikipediaUrl}`);
        
        let enrichedData: any = {};
        let confidence = 0;

        try {
          const wikiResponse = await fetch(wikipediaUrl);
          console.log(`Wikipedia response status: ${wikiResponse.status}`);
          
          if (wikiResponse.ok) {
            const wikiData = await wikiResponse.json();
            console.log('Wikipedia data received:', Object.keys(wikiData));
            
            if (wikiData.extract && wikiData.extract.length > 50) {
              enrichedData.bio = wikiData.extract;
              confidence += 30;
              console.log('Added bio from Wikipedia');
            }

            // Try to extract birth/death years from extract
            if (wikiData.extract) {
              const yearRegex = /\b(18|19|20)\d{2}\b/g;
              const years = wikiData.extract.match(yearRegex)?.map(y => parseInt(y));
              
              if (years && years.length >= 1) {
                if (!author.birth_year) {
                  enrichedData.birth_year = Math.min(...years);
                  confidence += 20;
                  console.log('Added birth year:', enrichedData.birth_year);
                }
                if (!author.death_year && years.length >= 2) {
                  enrichedData.death_year = Math.max(...years);
                  confidence += 20;
                  console.log('Added death year:', enrichedData.death_year);
                }
              }
            }

            // Store data source
            console.log('Storing data source...');
            const { error: sourceError } = await supabaseClient
              .from('author_data_sources')
              .insert({
                author_id: author.id,
                source_type: 'wikipedia',
                source_url: wikipediaUrl,
                data_retrieved: wikiData,
                confidence_score: confidence
              });

            if (sourceError) {
              console.error('Error storing data source:', sourceError);
            }
          } else {
            console.log('Wikipedia request failed with status:', wikiResponse.status);
          }
        } catch (wikiError) {
          console.error('Wikipedia fetch error:', wikiError);
        }

        // Update author if we have enriched data
        if (Object.keys(enrichedData).length > 0) {
          console.log('Updating author with enriched data:', Object.keys(enrichedData));
          
          const newQualityScore = Math.min(100, 
            (enrichedData.bio || author.bio ? 40 : 0) + 
            (enrichedData.birth_year || author.birth_year ? 20 : 0) + 
            (enrichedData.death_year || author.death_year ? 20 : 0) + 
            (author.notable_works?.length > 0 ? 20 : 0)
          );

          const updateData = {
            ...enrichedData,
            last_enriched: new Date().toISOString(),
            data_quality_score: newQualityScore,
            enrichment_attempts: job.attempts + 1,
            needs_enrichment: newQualityScore < 80
          };

          const { error: authorUpdateError } = await supabaseClient
            .from('scifi_authors')
            .update(updateData)
            .eq('id', author.id);

          if (authorUpdateError) {
            console.error('Error updating author:', authorUpdateError);
            throw authorUpdateError;
          }
          
          console.log(`Successfully updated author ${author.name} with quality score ${newQualityScore}`);
        } else {
          console.log('No enriched data to update for author:', author.name);
        }

        // Mark job as completed
        const { error: completeError } = await supabaseClient
          .from('author_enrichment_queue')
          .update({ 
            status: 'completed', 
            processed_at: new Date().toISOString(),
            attempts: job.attempts + 1
          })
          .eq('id', job.id);

        if (completeError) {
          console.error('Error marking job as completed:', completeError);
        }

        results.push({ 
          authorId: author.id, 
          authorName: author.name, 
          enriched: Object.keys(enrichedData).length > 0,
          confidence,
          dataAdded: Object.keys(enrichedData)
        });

      } catch (jobError) {
        console.error(`Job processing error for job ${job.id}:`, jobError);
        
        // Mark job as failed
        const { error: failError } = await supabaseClient
          .from('author_enrichment_queue')
          .update({ 
            status: 'failed', 
            error_message: jobError.message,
            attempts: job.attempts + 1
          })
          .eq('id', job.id);

        if (failError) {
          console.error('Error marking job as failed:', failError);
        }
      }
    }

    console.log(`Processed ${results.length} jobs successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in enrich-author-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
