
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrainNode {
  id: string;
  title: string;
  author: string;
  tags: string[];
  contextTags: string[];
  transmissionId: number;
}

interface BookLink {
  fromId: string;
  toId: string;
  type: 'tag_shared' | 'author_shared' | 'title_similarity' | 'manual';
  strength: number;
  sharedTags: string[];
  connectionReason: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UserTransmission {
  id: number;
  title: string;
  author: string;
  tags: string;
  notes?: string;
  publication_year?: number;
  narrative_time_period?: string;
  historical_context_tags?: string[];
}

interface ChatRequest {
  message: string;
  conversationId?: string;
  messages?: ChatMessage[];
  brainData: {
    nodes: BrainNode[];
    links: BookLink[];
    activeFilters: string[];
  };
  userTransmissions?: UserTransmission[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if Lovable API key is configured
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    console.log('Checking Lovable API key...', lovableApiKey ? 'Key found' : 'Key missing');
    
    if (!lovableApiKey) {
      console.error('Lovable API key not found in environment variables');
      return new Response(JSON.stringify({ 
        error: 'Lovable AI is not configured. Please contact support.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client for conversation storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request received successfully');
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid request format' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, conversationId, messages = [], brainData, userTransmissions = [] }: ChatRequest = requestBody;

    // Validate required fields
    if (!message) {
      console.error('Missing message in request');
      return new Response(JSON.stringify({ 
        error: 'Message is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Request validation passed:', {
      messageLength: message.length,
      nodeCount: brainData?.nodes?.length || 0,
      linkCount: brainData?.links?.length || 0,
      activeFilters: brainData?.activeFilters?.length || 0,
      transmissionsCount: userTransmissions.length
    });

    // Generate brain context
    const brainContext = brainData ? generateBrainContext(brainData) : '';
    const transmissionsContext = generateTransmissionsContext(userTransmissions);
    console.log('Context generated - brain:', brainContext.length, 'transmissions:', transmissionsContext.length);
    
    // Detect book-adding intent
    const bookAddingPhrases = [
      'i just finished', 'i read', "i'm reading", 'i want to read', 
      'add this book', 'just completed', 'finished reading',
      'currently reading', 'add to my library', 'just started'
    ];
    const lowerMessage = message.toLowerCase();
    const isAddingBook = bookAddingPhrases.some(phrase => lowerMessage.includes(phrase));

    // Define book extraction tool
    const bookExtractionTool = {
      type: "function",
      function: {
        name: "extract_book_data",
        description: "Extract book information from natural language when user wants to add a book to their library",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Book title" },
            author: { type: "string", description: "Author name" },
            status: { 
              type: "string", 
              enum: ["reading", "read", "want-to-read"],
              description: "Reading status inferred from context"
            },
            sentiment: {
              type: "string",
              enum: ["positive", "neutral", "negative", "mixed"],
              description: "Overall sentiment about the book"
            },
            suggestedTags: {
              type: "array",
              items: { type: "string" },
              description: "Conceptual SF tags from taxonomy: Cyberpunk, Post-Cyberpunk, Space Opera, Hard Science Fiction, Biopunk, Golden Age, Block Universe Compatible, Time Dilation, Chrono Loops, Technological Shamanism, Utopian Collapse, Mega-Corporate Systems, Off-Earth Civilisations, Dystopian Systems, Nonlinear Structure, Dream Logic, Archive-Based, Memory Distortion, Cybernetic Enhancement, Quantum Consciousness, Neural Interface, Posthuman Evolution"
            },
            needsClarification: {
              type: "boolean",
              description: "Whether to ask clarifying questions"
            },
            clarificationQuestions: {
              type: "array",
              items: { type: "string" },
              description: "Questions to ask for better tagging"
            }
          },
          required: ["title", "author", "status", "sentiment"]
        }
      }
    };

    const systemPrompt = `You are the Neural Assistant for leafnode—a personal science fiction library and knowledge graph application.

ABOUT LEAFNODE:
Leafnode helps readers build and explore their personal SF reading network. It's not just a book tracker—it's a tool for discovering thematic connections, conceptual patterns, and intellectual threads across your science fiction collection. Think of it as your "second brain" for sci-fi reading, visualizing how books, themes, and ideas connect in your literary journey.

USER'S COLLECTION:
${transmissionsContext}

${brainContext ? `NEURAL MAP STATE:
- Total Books: ${brainData.nodes.length}
- Total Connections: ${brainData.links.length}
- Active Filters: ${brainData.activeFilters.length > 0 ? brainData.activeFilters.join(', ') : 'None'}

Brain Analysis:
${brainContext}` : ''}

You can help users:
- Identify thematic clusters (groups of 2+ books exploring the same theme)
- Detect conceptual bridges (books that connect multiple themes)
- Understand connection patterns and reading velocity trends
- Suggest recommendations based on cluster gaps and bridge opportunities
- Explore temporal patterns and author relationships
- Analyze influence networks between authors
- Identify SF genre patterns (Cyberpunk, Hard SF, Space Opera, etc.)
- Recognize genre evolution and cross-genre connections
- Help users ADD BOOKS naturally through conversation

BOOK ADDING:
When users mention reading a book or wanting to add a book, use the extract_book_data tool to:
- Extract title and author accurately
- Infer reading status from context (just finished = read, currently = reading, want to = want-to-read)
- Detect sentiment (positive, neutral, negative, mixed) from their description
- Suggest 3-5 relevant Conceptual Tags from the official taxonomy based on book context
- Determine if clarification would improve tagging (e.g., "What aspects resonated most?", "Which themes stood out?")

TRIPLE TAXONOMY SYSTEM:
The library uses THREE classification systems working together:
1. GENRES: SF subgenres like Cyberpunk, Hard SF, Space Opera, Biopunk, etc.
2. CONCEPTUAL NODES: Thematic sci-fi tags like "Cyberpunk", "Neural Interface", "Time Dilation" (use ONLY from official list)
3. CONTEXT TAGS: Broader intellectual themes like "Mathematics", "Philosophy", "Social hierarchy", "Ethics"

These three taxonomies create a rich multi-dimensional framework for understanding books. Use all three when analyzing patterns.

PATTERN RECOGNITION INSIGHTS:
- Proactively mention detected clusters when relevant (e.g., "I notice you have a strong AI Consciousness cluster with 4 books spanning Cyberpunk and Post-Cyberpunk genres, many exploring Philosophy and Ethics")
- Point out bridge books that connect genres, themes, OR contexts (e.g., "This book bridges your Cyberpunk cluster with Hard SF through neural interface themes, while also exploring Mathematics")
- Identify reading velocities and acceleration patterns across all three taxonomies
- Suggest books that would strengthen weak clusters or create new bridges between taxonomies
- Recognize cross-taxonomy patterns (e.g., "Your Cyberpunk books strongly correlate with Philosophy and Social hierarchy themes")
- Detect multi-dimensional connections (e.g., "Hard SF + Mathematics + AI Consciousness forms a powerful cluster")

When referencing specific books, use their exact titles. When discussing connections, mention all relevant taxonomies (genre, conceptual nodes, context tags). Provide insights that help users understand their SF reading patterns across multiple dimensions and discover new connections.

IMPORTANT: Write your responses in clear, flowing paragraphs. Do NOT use bold markdown (**text**) or asterisks for emphasis. Write naturally as if speaking to someone. Use proper paragraph breaks for readability. Keep your tone conversational, insightful, and focused on the neural network aspects of their SF library.`;

    console.log('Making Lovable AI request...');
    console.log('Using model: google/gemini-2.5-flash (FREE until Oct 6, 2025)');
    
    // Build message history for context
    const conversationMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages, // Previous conversation
      { role: 'user', content: message } // Current message
    ];

    console.log(`Message history: ${conversationMessages.length} messages`);
    
    // Build request body - add tool if book-adding detected
    const requestBody: any = {
      model: 'google/gemini-2.5-flash',
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: 1000,
    };

    if (isAddingBook) {
      console.log('Book-adding intent detected, enabling extraction tool');
      requestBody.tools = [bookExtractionTool];
      requestBody.tool_choice = { type: "function", function: { name: "extract_book_data" } };
    }
    
    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Lovable AI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error details:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.',
          errorCode: 'RATE_LIMIT'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits depleted. Please add credits in Settings > Workspace > Usage.',
          errorCode: 'NO_CREDITS'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ 
          error: `AI service error (${response.status}): ${errorText}`,
          errorCode: 'AI_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    let data;
    try {
      data = await response.json();
      console.log('Lovable AI response parsed successfully');
    } catch (jsonError) {
      console.error('Failed to parse Lovable AI response:', jsonError);
      return new Response(JSON.stringify({ 
        error: 'Invalid response from AI service' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for tool calls (book extraction)
    if (data.choices[0]?.message?.tool_calls && data.choices[0].message.tool_calls.length > 0) {
      const toolCall = data.choices[0].message.tool_calls[0];
      console.log('Tool call detected:', toolCall.function.name);
      
      try {
        const bookData = JSON.parse(toolCall.function.arguments);
        console.log('Extracted book data:', bookData);
        
        // Generate a friendly confirmation message
        const confirmationMessage = `I detected you want to add "${bookData.title}" by ${bookData.author} to your library. I've suggested some tags based on the book's themes. Please review and confirm!`;
        
        // Return book extraction response
        return new Response(JSON.stringify({ 
          type: 'book_extraction',
          bookData: bookData,
          message: confirmationMessage
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (parseError) {
        console.error('Failed to parse book data:', parseError);
        // Fall through to normal response
      }
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid AI response structure:', data);
      return new Response(JSON.stringify({ 
        error: 'Invalid response structure from AI service' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = data.choices[0].message.content;
    console.log('AI response received, length:', aiResponse.length);

    // Format the response for better readability
    const formattedResponse = formatAIResponse(aiResponse);

    // Analyze response for actionable highlights
    const highlights = extractHighlights(aiResponse, brainData);
    console.log('Extracted highlights:', highlights);

    // Store conversation if conversationId provided
    if (conversationId) {
      try {
        // Store user message
        await supabase.from('chat_messages').insert({
          conversation_id: conversationId,
          role: 'user',
          content: message
        });

        // Store assistant response
        await supabase.from('chat_messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: formattedResponse,
          highlights: highlights
        });

        console.log('Conversation saved successfully');
      } catch (dbError) {
        console.error('Failed to save conversation:', dbError);
        // Don't fail the request if conversation storage fails
      }
    }

    return new Response(JSON.stringify({ 
      response: formattedResponse,
      highlights: highlights 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in brain-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(JSON.stringify({ 
      error: `Failed to process chat request: ${errorMessage}` 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateBrainContext(brainData: { nodes: BrainNode[], links: BookLink[], activeFilters: string[] }): string {
  const { nodes, links } = brainData;
  
  if (!nodes || nodes.length === 0) {
    return "No books in the library yet.";
  }
  
  try {
    // Analyze connection patterns
    const connectionStats = links.reduce((acc, link) => {
      acc[link.type] = (acc[link.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Analyze conceptual tag frequencies
    const conceptualTagFrequency = nodes.reduce((acc, node) => {
      if (node.tags && Array.isArray(node.tags)) {
        node.tags.forEach(tag => {
          if (tag && tag.trim() !== '') {
            acc[tag] = (acc[tag] || 0) + 1;
          }
        });
      }
      return acc;
    }, {} as Record<string, number>);

    const topConceptualTags = Object.entries(conceptualTagFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => `${tag} (${count})`);

    // Analyze context tag frequencies
    const contextTagFrequency = nodes.reduce((acc, node) => {
      if (node.contextTags && Array.isArray(node.contextTags)) {
        node.contextTags.forEach(tag => {
          if (tag && tag.trim() !== '') {
            acc[tag] = (acc[tag] || 0) + 1;
          }
        });
      }
      return acc;
    }, {} as Record<string, number>);

    const topContextTags = Object.entries(contextTagFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([tag, count]) => `${tag} (${count})`);

    // Detect thematic clusters (2+ books with same tag)
    const clusters = Object.entries(tagFrequency)
      .filter(([, count]) => count >= 2)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => `"${tag}" cluster (${count} books)`);

    // Detect conceptual bridges (books connecting multiple themes)
    const bridgeBooks = nodes.map(node => {
      if (!node.tags || node.tags.length < 2) return null;
      
      // Count how many other books share each tag
      const tagConnections = node.tags.map(tag => {
        const othersWithTag = nodes.filter(n => 
          n.id !== node.id && n.tags?.includes(tag)
        ).length;
        return { tag, connections: othersWithTag };
      }).filter(t => t.connections > 0);
      
      if (tagConnections.length >= 2) {
        return {
          title: node.title,
          bridgingThemes: tagConnections.map(t => t.tag).slice(0, 3)
        };
      }
      return null;
    }).filter(Boolean).slice(0, 3);

    // Analyze author networks
    const authorBooks = nodes.reduce((acc, node) => {
      if (node.author && node.author !== 'Unknown Author') {
        acc[node.author] = (acc[node.author] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topAuthors = Object.entries(authorBooks)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([author, count]) => `${author} (${count} books)`);

    // Find highly connected nodes
    const nodeConnections = nodes.map(node => {
      const connections = links.filter(link => 
        link.fromId === node.id || link.toId === node.id
      ).length;
      return { title: node.title, connections };
    }).sort((a, b) => b.connections - a.connections).slice(0, 5);

    const maxPossibleConnections = nodes.length * (nodes.length - 1) / 2;
    const density = maxPossibleConnections > 0 ? ((links.length / maxPossibleConnections) * 100).toFixed(2) : '0';

    let context = `
Connection Types: ${Object.entries(connectionStats).map(([type, count]) => `${type}: ${count}`).join(', ')}

Conceptual Nodes (SF Themes): ${topConceptualTags.join(', ')}

Context Tags (Broader Themes): ${topContextTags.length > 0 ? topContextTags.join(', ') : 'None yet'}

Most Prolific Authors: ${topAuthors.join(', ')}

Most Connected Books: ${nodeConnections.map(n => `"${n.title}" (${n.connections} connections)`).join(', ')}

Network Density: ${density}% connectivity`;

    // Add pattern recognition insights with triple-taxonomy awareness
    if (clusters.length > 0) {
      context += `\n\nThematic Clusters Detected (2+ books): ${clusters.join(', ')}`;
      context += `\n\nNote: These clusters combine Conceptual Nodes (SF themes), Context Tags (broader intellectual themes), and SF genre classification (Cyberpunk, Hard SF, Space Opera, etc.) to create a triple taxonomy for comprehensive multi-dimensional pattern analysis.`;
    }

    if (bridgeBooks.length > 0) {
      context += `\n\nBridge Books (connecting multiple themes across taxonomies): ${bridgeBooks.map(b => 
        `"${b.title}" (bridges: ${b.bridgingThemes.join(', ')})`
      ).join(', ')}`;
      context += `\n\nThese bridges are particularly valuable for identifying cross-taxonomy connections, genre evolution, and thematic intersections across multiple conceptual dimensions.`;
    }

    // Add cross-taxonomy pattern insights
    const crossPatterns = detectCrossTaxonomyPatterns(nodes);
    if (crossPatterns.length > 0) {
      context += `\n\nCross-Taxonomy Patterns: ${crossPatterns.join(', ')}`;
    }

    return context.trim();

  } catch (error) {
    console.error('Error generating brain context:', error);
    return `Library contains ${nodes.length} books with ${links.length} connections.`;
  }
}

function formatAIResponse(response: string): string {
  try {
    // Remove markdown bold formatting
    let formatted = response.replace(/\*\*([^*]+)\*\*/g, '$1');
    
    // Remove single asterisks used for emphasis
    formatted = formatted.replace(/\*([^*]+)\*/g, '$1');
    
    // Ensure proper paragraph spacing by normalizing line breaks
    // Replace multiple line breaks with double line breaks for paragraphs
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    
    // Clean up any remaining markdown artifacts
    formatted = formatted.replace(/#{1,6}\s/g, '');
    
    return formatted.trim();
  } catch (error) {
    console.error('Error formatting AI response:', error);
    return response;
  }
}

function generateTransmissionsContext(transmissions: UserTransmission[]): string {
  if (!transmissions || transmissions.length === 0) {
    return "The user hasn't added any books to their collection yet. Encourage them to add their favorite sci-fi books to start building their neural reading network!";
  }

  try {
    const totalBooks = transmissions.length;
    
    // Extract all tags
    const allTags = transmissions
      .flatMap(t => t.tags ? t.tags.split(',').map(tag => tag.trim()) : [])
      .filter(tag => tag !== '');
    
    const tagFrequency = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topTags = Object.entries(tagFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 12)
      .map(([tag, count]) => `${tag} (${count})`);

    // Author analysis
    const authors = transmissions
      .map(t => t.author)
      .filter(a => a && a !== 'Unknown Author');
    
    const authorFrequency = authors.reduce((acc, author) => {
      acc[author] = (acc[author] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topAuthors = Object.entries(authorFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([author, count]) => `${author} (${count} books)`);

    // Extract historical context tags
    const historicalTags = transmissions
      .flatMap(t => t.historical_context_tags || [])
      .filter(tag => tag);
    
    const historicalFreq = historicalTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topHistorical = Object.entries(historicalFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([tag, count]) => `${tag} (${count})`);

    // Recent additions
    const recentBooks = transmissions
      .slice(0, 5)
      .map(t => `"${t.title}" by ${t.author}`);

    // Books with notes
    const booksWithNotes = transmissions.filter(t => t.notes && t.notes.trim() !== '');
    
    let context = `Total Books in Collection: ${totalBooks}

Most Common Themes: ${topTags.join(', ')}

Top Authors: ${topAuthors.join(', ')}`;

    if (topHistorical.length > 0) {
      context += `\n\nHistorical Context Tags: ${topHistorical.join(', ')}`;
    }

    context += `\n\nRecently Added: ${recentBooks.join(', ')}`;

    if (booksWithNotes.length > 0) {
      context += `\n\n${booksWithNotes.length} books have personal notes/reflections.`;
    }

    // Sample a few books with their full details
    const sampleBooks = transmissions.slice(0, 3).map(t => {
      let bookDetail = `"${t.title}" by ${t.author}`;
      if (t.tags) bookDetail += ` [Tags: ${t.tags}]`;
      if (t.notes) bookDetail += ` (Note: ${t.notes.substring(0, 100)}${t.notes.length > 100 ? '...' : ''})`;
      return bookDetail;
    });

    if (sampleBooks.length > 0) {
      context += `\n\nSample Books:\n${sampleBooks.join('\n')}`;
    }

    return context;
  } catch (error) {
    console.error('Error generating transmissions context:', error);
    return `User has ${transmissions.length} books in their collection.`;
  }
}

function detectCrossTaxonomyPatterns(nodes: BrainNode[]): string[] {
  const patterns: string[] = [];
  const conceptualTags = new Set(nodes.flatMap(n => n.tags || []));
  const contextTags = new Set(nodes.flatMap(n => n.contextTags || []));
  
  // Find books with both strong conceptual and context tag presence
  conceptualTags.forEach(conceptualTag => {
    contextTags.forEach(contextTag => {
      const matchingBooks = nodes.filter(node => 
        (node.tags || []).includes(conceptualTag) && 
        (node.contextTags || []).includes(contextTag)
      );
      
      if (matchingBooks.length >= 2) {
        patterns.push(`${conceptualTag} + ${contextTag} (${matchingBooks.length} books)`);
      }
    });
  });
  
  return patterns.slice(0, 5);
}

function extractHighlights(response: string, brainData: { nodes: BrainNode[], links: BookLink[] }): { nodeIds: string[], linkIds: string[], tags: string[] } {
  const highlights = {
    nodeIds: [] as string[],
    linkIds: [] as string[],
    tags: [] as string[]
  };

  try {
    // Extract book titles mentioned in response
    brainData.nodes.forEach(node => {
      if (response.toLowerCase().includes(node.title.toLowerCase())) {
        highlights.nodeIds.push(node.id);
      }
    });

    // Extract conceptual tags mentioned in response
    const allConceptualTags = Array.from(new Set(brainData.nodes.flatMap(node => node.tags || [])));
    allConceptualTags.forEach(tag => {
      if (tag && response.toLowerCase().includes(tag.toLowerCase())) {
        highlights.tags.push(tag);
      }
    });

    // Extract context tags mentioned in response
    const allContextTags = Array.from(new Set(brainData.nodes.flatMap(node => node.contextTags || [])));
    allContextTags.forEach(tag => {
      if (tag && response.toLowerCase().includes(tag.toLowerCase())) {
        highlights.tags.push(tag);
      }
    });

    console.log('Highlights extracted:', highlights);
  } catch (error) {
    console.error('Error extracting highlights:', error);
  }

  return highlights;
}
