import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, requireUser, createUserClient, json } from "../_shared/adminAuth.ts";

interface AnalysisRequest {
  userId: string;
  forceRefresh?: boolean;
}

interface TemporalAnalysis {
  eraNarratives: Record<string, { description: string; books: Array<{ title: string; author: string; year: number }> }>;
  temporalBridges: Array<{ eras: string[]; connection: string; bookTitles: string[] }>;
  historicalForces: Array<{ force: string; books: Array<{ title: string; author: string }>; impact: string }>;
  authorInsights: Array<{ author: string; contribution: string; bookCount: number }>;
  readingPattern: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authenticated user
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  try {
    const supabase = createUserClient(auth.token);

    const { forceRefresh = false }: AnalysisRequest = await req.json();

    // Use authenticated user's ID
    const userId = auth.userId;

    // Fetch user's books
    const { data: transmissions, error: transmissionsError } = await supabase
      .from('transmissions')
      .select('title, author, publication_year, temporal_context_tags')
      .eq('user_id', userId);

    if (transmissionsError) {
      console.error('Error fetching transmissions:', transmissionsError);
      throw transmissionsError;
    }

    if (!transmissions || transmissions.length === 0) {
      return json(404, { error: 'No books found' });
    }

    // Helper to derive era from publication year
    const getEra = (year: number): string => {
      if (year < 1900) return 'Victorian Era';
      if (year < 1920) return 'Edwardian Era';
      if (year < 1950) return 'Early Modern';
      if (year < 1980) return 'Mid-Century';
      if (year < 2000) return 'Late 20th Century';
      return '21st Century';
    };

    // Calculate temporal signature (hash of all tags)
    const allTags = transmissions
      .flatMap(t => t.temporal_context_tags || [])
      .sort()
      .join(',');
    const temporalSignature = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(allTags)
    ).then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(''));

    // Check cache unless force refresh
    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from('temporal_analysis_cache')
        .select('analysis, generated_at, temporal_signature')
        .eq('user_id', userId)
        .single();

      if (cached && cached.temporal_signature === temporalSignature) {
        const cacheAge = Date.now() - new Date(cached.generated_at).getTime();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        
        if (cacheAge < sevenDays) {
          console.log('Returning cached analysis');
          return json(200, cached.analysis);
        }
      }
    }

    // Generate new analysis with Gemini
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Organize books by temporal tags and derived eras
    const tagToBooks = new Map<string, Array<{ title: string; author: string; year: number }>>();
    transmissions.forEach(t => {
      const tags = t.temporal_context_tags || [];
      const year = t.publication_year;
      
      // Get eras from tags or derive from publication year
      const eras = tags.length > 0 ? tags : (year ? [getEra(year)] : []);
      
      eras.forEach((tag: string) => {
        if (!tagToBooks.has(tag)) {
          tagToBooks.set(tag, []);
        }
        tagToBooks.get(tag)!.push({
          title: t.title,
          author: t.author,
          year: year || 0
        });
      });
    });

    const tagSummary = Array.from(tagToBooks.entries())
      .map(([tag, books]) => `${tag}: ${books.map(b => `${b.title} (${b.author} ${b.year})`).join(', ')}`)
      .join('\n');

    const prompt = `Analyze this user's science fiction library temporal distribution:

${tagSummary}

Total books: ${transmissions.length}
Publication range: ${Math.min(...transmissions.map(t => t.publication_year || 9999))} - ${Math.max(...transmissions.map(t => t.publication_year || 0))}

Provide a detailed analysis with these sections:

1. ERA NARRATIVES: For each literary era present (Golden Age, New Wave, Cyberpunk Era, etc.), write 2-3 sentences explaining what defined that period and how these specific books embody it. Include the book titles.

2. TEMPORAL BRIDGES: Identify 4-6 significant thematic connections between books from DIFFERENT eras. For each bridge, specify the exact book titles being connected and explain the shared themes, ideas, or predictions that link them across time. Focus on meaningful conceptual bridges like: similar technological predictions made decades apart, recurring philosophical questions, evolving treatments of the same theme, or contrasting approaches to similar ideas.

3. HISTORICAL FORCES: For each major historical force tag (Cold War, Digital Revolution, etc.), explain in 2-3 sentences how it shaped these specific books. List the book titles.

4. AUTHOR INSIGHTS: Highlight 3-4 key authors and their specific contributions based on the books in this collection. Do not use asterisks or markdown formatting.

5. READING PATTERN: In 3-4 sentences, describe what this collection reveals about the reader's interests and how they've explored SF across time.

Keep responses specific to these books. Be concise but insightful. Do not use asterisks or markdown bold formatting in your response.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a science fiction literary analyst. Provide specific, book-focused analysis.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return json(429, { error: 'Rate limit exceeded. Please try again in a moment.' });
      }
      
      if (aiResponse.status === 402) {
        return json(402, { error: 'AI usage limit reached. Please add credits to your workspace.' });
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;

    // Parse the AI response into structured data
    const analysis: TemporalAnalysis = parseAnalysis(analysisText, tagToBooks);

    // Cache the result
    const { error: cacheError } = await supabase
      .from('temporal_analysis_cache')
      .upsert(
        {
          user_id: userId,
          analysis,
          temporal_signature: temporalSignature,
          generated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id'
        }
      );

    if (cacheError) {
      console.error('Error caching analysis:', cacheError);
    }

    return json(200, analysis);

  } catch (error) {
    console.error('Error in analyze-temporal-context:', error);
    return json(500, { error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

function parseAnalysis(
  text: string,
  tagToBooks: Map<string, Array<{ title: string; author: string; year: number }>>
): TemporalAnalysis {
  // Extract sections using markers
  const sections = {
    eraNarratives: extractSection(text, 'ERA NARRATIVES', 'TEMPORAL BRIDGES'),
    temporalBridges: extractSection(text, 'TEMPORAL BRIDGES', 'HISTORICAL FORCES'),
    historicalForces: extractSection(text, 'HISTORICAL FORCES', 'AUTHOR INSIGHTS'),
    authorInsights: extractSection(text, 'AUTHOR INSIGHTS', 'READING PATTERN'),
    readingPattern: extractSection(text, 'READING PATTERN', null),
  };

  // Parse era narratives
  const eraNarratives: Record<string, { description: string; books: Array<{ title: string; author: string; year: number }> }> = {};
  const eraMatches = sections.eraNarratives.match(/([A-Z][a-zA-Z\s]+(?:Era|Age|SF|Wave|punk)):\s*([^\n]+(?:\n(?![A-Z][a-zA-Z\s]+:)[^\n]+)*)/g);
  
  if (eraMatches) {
    eraMatches.forEach(match => {
      const [era, ...descParts] = match.split(':');
      const description = descParts.join(':').trim();
      const eraTag = era.trim();
      eraNarratives[eraTag] = {
        description,
        books: tagToBooks.get(eraTag) || []
      };
    });
  }

  // Parse temporal bridges - look for patterns indicating connections between books
  const temporalBridges: Array<{ eras: string[]; connection: string; bookTitles: string[] }> = [];
  const bridgeLines = sections.temporalBridges.split('\n').filter(line => line.trim());
  
  bridgeLines.forEach(line => {
    // Skip numbered/bulleted prefixes
    const cleanLine = line.replace(/^(\d+\.|-|\*|•)\s*/, '').trim();
    if (!cleanLine || cleanLine.length < 20) return; // Skip too-short lines
    
    const bookTitles: string[] = [];
    const allBooks = Array.from(tagToBooks.values()).flat();
    
    // Find all book titles mentioned in this bridge
    allBooks.forEach(book => {
      if (cleanLine.includes(book.title)) {
        bookTitles.push(book.title);
      }
    });
    
    // Only add bridges that mention at least 2 books
    if (bookTitles.length >= 2) {
      temporalBridges.push({ 
        eras: [], 
        connection: cleanLine, 
        bookTitles 
      });
    }
  });

  // Parse historical forces
  const historicalForces: Array<{ force: string; books: Array<{ title: string; author: string }>; impact: string }> = [];
  const forceMatches = sections.historicalForces.match(/([A-Z][a-zA-Z\s]+(?:War|Revolution|Age|Era|Tensions)):\s*([^\n]+(?:\n(?![A-Z][a-zA-Z\s]+:)[^\n]+)*)/g);
  
  if (forceMatches) {
    forceMatches.forEach(match => {
      const [force, ...impactParts] = match.split(':');
      const impact = impactParts.join(':').trim();
      const forceTag = force.trim();
      const books = (tagToBooks.get(forceTag) || []).map(b => ({ title: b.title, author: b.author }));
      historicalForces.push({ force: forceTag, books, impact });
    });
  }

  // Parse author insights
  const authorInsights: Array<{ author: string; contribution: string; bookCount: number }> = [];
  const authorMatches = sections.authorInsights.match(/([A-Z][a-zA-Z.\s]+):\s*([^\n]+)/g);
  
  if (authorMatches) {
    authorMatches.forEach(match => {
      const [author, contribution] = match.split(':').map(s => s.trim());
      const bookCount = Array.from(tagToBooks.values())
        .flat()
        .filter(b => b.author === author).length;
      authorInsights.push({ author, contribution, bookCount });
    });
  }

  return {
    eraNarratives,
    temporalBridges,
    historicalForces,
    authorInsights,
    readingPattern: sections.readingPattern.trim()
  };
}

function extractSection(text: string, startMarker: string, endMarker: string | null): string {
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) return '';
  
  const contentStart = startIndex + startMarker.length;
  const endIndex = endMarker ? text.indexOf(endMarker, contentStart) : text.length;
  
  return text.substring(contentStart, endIndex === -1 ? text.length : endIndex).trim();
}
