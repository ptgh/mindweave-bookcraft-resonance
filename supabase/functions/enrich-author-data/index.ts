
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

    // Create Supabase client with service role for full access
    console.log('Creating Supabase client with service role...');
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

        let enrichedData: any = {};
        let confidence = 0;

        // First, get books by this author for context
        console.log(`Fetching books by ${author.name} for context`);
        const { data: authorBooks } = await supabaseClient
          .from('transmissions')
          .select('title, notes')
          .ilike('author', `%${author.name}%`)
          .limit(5);

        const bookContext = authorBooks && authorBooks.length > 0
          ? `Known books by this author: ${authorBooks.map(b => `"${b.title}"${b.notes ? ` (${b.notes})` : ''}`).join(', ')}`
          : '';

        console.log('Book context:', bookContext || 'No books found');

        // Try both Wikipedia and Gemini AI in parallel for maximum data
        const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
        
        // Try Wikipedia first - but be flexible with name matching
        let wikiSuccess = false;
        try {
          // Try exact name first
          let wikipediaUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(author.name)}`;
          console.log(`Fetching from Wikipedia (exact): ${wikipediaUrl}`);
          
          let wikiResponse = await fetch(wikipediaUrl, {
            headers: {
              'User-Agent': 'LeafNode-SciFi-DB/1.0 (Author enrichment service)'
            }
          });
          
          console.log(`Wikipedia response status: ${wikiResponse.status}`);
          
          // If exact match fails, try without middle initial
          if (!wikiResponse.ok && author.name.includes('.')) {
            const nameWithoutInitial = author.name.replace(/\s+[A-Z]\.\s+/, ' ').trim();
            console.log(`Trying without middle initial: ${nameWithoutInitial}`);
            wikipediaUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nameWithoutInitial)}`;
            wikiResponse = await fetch(wikipediaUrl, {
              headers: {
                'User-Agent': 'LeafNode-SciFi-DB/1.0 (Author enrichment service)'
              }
            });
            console.log(`Wikipedia (no initial) response status: ${wikiResponse.status}`);
          }
          
          if (wikiResponse.ok) {
            const wikiData = await wikiResponse.json();
            console.log('Wikipedia data received:', wikiData.title || 'No title');
            
            if (wikiData.extract && wikiData.extract.length > 50) {
              enrichedData.bio = wikiData.extract;
              enrichedData.wikipedia_url = wikipediaUrl.replace('/api/rest_v1/page/summary/', '/wiki/');
              confidence += 40;
              wikiSuccess = true;
              console.log('Added bio and Wikipedia URL');
            }

            // Don't extract years from Wikipedia text - too error-prone
            // Let Gemini AI handle birth/death years from multiple sources

            // Store Wikipedia data source
            await supabaseClient
              .from('author_data_sources')
              .insert({
                author_id: author.id,
                source_type: 'wikipedia',
                source_url: wikipediaUrl,
                data_retrieved: wikiData,
                confidence_score: confidence
              });
          }
        } catch (wikiError) {
          console.error('Wikipedia fetch error:', wikiError);
        }
        
        // Use Gemini AI to comprehensively search multiple sources
        if (lovableApiKey) {
          try {
            console.log(`Using Gemini AI to search multiple sources for: ${author.name}`);
            const geminiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${lovableApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  {
                    role: 'system',
                    content: 'You are a literary research expert with access to comprehensive databases of science fiction authors. Research and compile biographical information from ALL available sources including: literary databases, publisher websites, author official sites, book databases, interviews, and academic sources. Provide the MOST COMPLETE information possible. Return data in this exact format: Bio: [comprehensive 2-4 sentence biography] | Birth: [year or "Unknown"] | Death: [year or "Living" or "Unknown"] | Nationality: [country] | Notable Works: [comma-separated list of 3-5 major works]'
                  },
                  {
                    role: 'user',
                    content: `Research and provide complete biographical information about science fiction author "${author.name}". ${bookContext || 'Search all available literary sources, publisher information, and databases.'} Provide comprehensive details even if Wikipedia is unavailable. Search multiple sources to compile the most accurate and complete profile.`
                  }
                ]
              }),
            });

            if (geminiResponse.ok) {
              const geminiData = await geminiResponse.json();
              const content = geminiData.choices?.[0]?.message?.content;
              
              if (content) {
                console.log('Gemini response received:', content);
                
                // Parse and fill/override with Gemini data (more comprehensive)
                const bioMatch = content.match(/Bio:\s*([^|]+)/i);
                if (bioMatch && bioMatch[1].trim()) {
                  enrichedData.bio = bioMatch[1].trim();
                  confidence += 35;
                  console.log('Added bio from Gemini');
                }
                
                // Birth year - Gemini overrides Wikipedia if present
                const birthMatch = content.match(/Birth:\s*(\d{4})/i);
                if (birthMatch) {
                  enrichedData.birth_year = parseInt(birthMatch[1]);
                  confidence += 15;
                  console.log('Added birth year from Gemini:', enrichedData.birth_year);
                }
                
                // Death year - only if year found (not "Living" or "Unknown")
                const deathMatch = content.match(/Death:\s*(\d{4})/i);
                if (deathMatch) {
                  enrichedData.death_year = parseInt(deathMatch[1]);
                  confidence += 15;
                  console.log('Added death year from Gemini:', enrichedData.death_year);
                }
                
                const nationalityMatch = content.match(/Nationality:\s*([^|]+)/i);
                if (nationalityMatch && nationalityMatch[1].trim()) {
                  enrichedData.nationality = nationalityMatch[1].trim();
                  confidence += 10;
                  console.log('Added nationality from Gemini');
                }
                
                const worksMatch = content.match(/Notable Works:\s*([^|]+)/i);
                if (worksMatch && worksMatch[1].trim()) {
                  enrichedData.notable_works = worksMatch[1].trim()
                    .split(',')
                    .map(w => w.trim())
                    .filter(w => w.length > 0);
                  confidence += 10;
                  console.log('Added notable works from Gemini');
                }

                // Store Gemini data source
                await supabaseClient
                  .from('author_data_sources')
                  .insert({
                    author_id: author.id,
                    source_type: 'ai_gemini_comprehensive',
                    source_url: 'https://ai.gateway.lovable.dev',
                    data_retrieved: { content, parsed: enrichedData },
                    confidence_score: confidence
                  });
              }
            }
          } catch (geminiError) {
            console.error('Gemini enrichment error:', geminiError);
          }
        }

        // Absolute final fallback: Create bio from book descriptions if still no data
        if (!enrichedData.bio && authorBooks && authorBooks.length > 0) {
          console.log('Creating bio from book descriptions as fallback');
          const bookTitles = authorBooks.map(b => `"${b.title}"`).join(', ');
          const hasNotes = authorBooks.some(b => b.notes);
          
          enrichedData.bio = `${author.name} is a contemporary author known for works in science fiction and speculative fiction, including ${bookTitles}.`;
          
          if (hasNotes) {
            const notesDesc = authorBooks.find(b => b.notes)?.notes;
            if (notesDesc && notesDesc.length > 20) {
              enrichedData.bio += ` ${notesDesc.substring(0, 150)}${notesDesc.length > 150 ? '...' : ''}`;
            }
          }
          
          confidence += 20;
          console.log('Created bio from book context');
          
          // Store as synthetic data source
          await supabaseClient
            .from('author_data_sources')
            .insert({
              author_id: author.id,
              source_type: 'synthetic_books',
              source_url: 'internal_database',
              data_retrieved: { books: authorBooks },
              confidence_score: 20
            });
        }


        // Update author if we have enriched data
        if (Object.keys(enrichedData).length > 0) {
          console.log('Updating author with enriched data:', Object.keys(enrichedData));
          
          const newQualityScore = Math.min(100, 
            (enrichedData.bio || author.bio ? 40 : 0) + 
            (enrichedData.birth_year || author.birth_year ? 20 : 0) + 
            (enrichedData.notable_works?.length > 0 || author.notable_works?.length > 0 ? 20 : 0) +
            (enrichedData.wikipedia_url || author.wikipedia_url ? 20 : 0)
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
