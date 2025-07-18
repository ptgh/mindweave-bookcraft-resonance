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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get pending enrichment jobs
    const { data: jobs, error: jobsError } = await supabaseClient
      .from('author_enrichment_queue')
      .select('id, author_id, enrichment_type, attempts')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('priority', { ascending: false })
      .limit(5)

    if (jobsError) throw jobsError

    const results = []

    for (const job of jobs || []) {
      try {
        // Mark job as processing
        await supabaseClient
          .from('author_enrichment_queue')
          .update({ status: 'processing' })
          .eq('id', job.id)

        // Get author details
        const { data: author, error: authorError } = await supabaseClient
          .from('scifi_authors')
          .select('id, name, bio, birth_year, death_year, notable_works')
          .eq('id', job.author_id)
          .single()

        if (authorError) throw authorError

        // Fetch from Wikipedia
        const wikipediaUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(author.name)}`
        
        let enrichedData: any = {}
        let confidence = 0

        try {
          const wikiResponse = await fetch(wikipediaUrl)
          if (wikiResponse.ok) {
            const wikiData = await wikiResponse.json()
            
            if (wikiData.extract && wikiData.extract.length > 50) {
              enrichedData.bio = wikiData.extract
              confidence += 30
            }

            // Try to extract birth/death years from extract
            if (wikiData.extract) {
              const yearRegex = /\b(18|19|20)\d{2}\b/g
              const years = wikiData.extract.match(yearRegex)?.map(y => parseInt(y))
              
              if (years && years.length >= 1) {
                if (!author.birth_year) {
                  enrichedData.birth_year = Math.min(...years)
                  confidence += 20
                }
                if (!author.death_year && years.length >= 2) {
                  enrichedData.death_year = Math.max(...years)
                  confidence += 20
                }
              }
            }

            // Store data source
            await supabaseClient
              .from('author_data_sources')
              .insert({
                author_id: author.id,
                source_type: 'wikipedia',
                source_url: wikipediaUrl,
                data_retrieved: wikiData,
                confidence_score: confidence
              })
          }
        } catch (wikiError) {
          console.error('Wikipedia fetch error:', wikiError)
        }

        // Update author if we have enriched data
        if (Object.keys(enrichedData).length > 0) {
          const updateData = {
            ...enrichedData,
            last_enriched: new Date().toISOString(),
            data_quality_score: Math.min(100, (author.bio ? 40 : 0) + (author.birth_year ? 20 : 0) + (author.death_year ? 20 : 0) + (author.notable_works?.length > 0 ? 20 : 0)),
            enrichment_attempts: job.attempts + 1,
            needs_enrichment: false
          }

          await supabaseClient
            .from('scifi_authors')
            .update(updateData)
            .eq('id', author.id)
        }

        // Mark job as completed
        await supabaseClient
          .from('author_enrichment_queue')
          .update({ 
            status: 'completed', 
            processed_at: new Date().toISOString(),
            attempts: job.attempts + 1
          })
          .eq('id', job.id)

        results.push({ 
          authorId: author.id, 
          authorName: author.name, 
          enriched: Object.keys(enrichedData).length > 0,
          confidence 
        })

      } catch (jobError) {
        console.error('Job processing error:', jobError)
        
        // Mark job as failed
        await supabaseClient
          .from('author_enrichment_queue')
          .update({ 
            status: 'failed', 
            error_message: jobError.message,
            attempts: job.attempts + 1
          })
          .eq('id', job.id)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in enrich-author-data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})