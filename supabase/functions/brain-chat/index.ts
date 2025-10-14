
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

interface ChatRequest {
  message: string;
  conversationId?: string;
  messages?: ChatMessage[];
  brainData: {
    nodes: BrainNode[];
    links: BookLink[];
    activeFilters: string[];
  };
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

    const { message, conversationId, messages = [], brainData }: ChatRequest = requestBody;

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

    if (!brainData || !brainData.nodes || !brainData.links) {
      console.error('Missing or invalid brain data');
      return new Response(JSON.stringify({ 
        error: 'Brain data is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Request validation passed:', {
      messageLength: message.length,
      nodeCount: brainData.nodes.length,
      linkCount: brainData.links.length,
      activeFilters: brainData.activeFilters.length
    });

    // Generate enhanced brain context with pattern recognition
    const brainContext = generateBrainContext(brainData);
    const patterns = detectPatterns(brainData);
    const insights = generateProactiveInsights(brainData);
    
    console.log('Brain context generated, length:', brainContext.length);
    console.log('Patterns detected:', patterns.length);
    console.log('Insights generated:', insights.length);
    
    const systemPrompt = `You are an advanced AI assistant specialized in analyzing book reading networks, literary patterns, and knowledge graph connections. You have deep expertise in science fiction literature, thematic analysis, and reading psychology.

Current Brain State:
- Total Books: ${brainData.nodes.length}
- Total Connections: ${brainData.links.length}
- Active Filters: ${brainData.activeFilters.length > 0 ? brainData.activeFilters.join(', ') : 'None'}

Brain Analysis:
${brainContext}

Detected Patterns:
${patterns}

Proactive Insights:
${insights}

Your capabilities include:
- Identifying thematic clusters and conceptual bridges between seemingly unrelated books
- Detecting reading patterns (chronological, thematic deep-dives, author exploration)
- Mapping author influences and literary connections
- Analyzing temporal reading habits and preferences
- Suggesting highly personalized recommendations based on network topology
- Revealing hidden connections and synchronicities in reading choices
- Identifying knowledge gaps and suggesting "bridge books" to expand understanding

Advanced analysis modes:
- Conceptual Bridge Analysis: Find unexpected connections between distant books
- Thematic Constellation Mapping: Identify emerging themes across your library
- Reading DNA Profiling: Understand your unique reading signature
- Influence Mapping: Trace how ideas flow between authors in your network
- Temporal Pattern Recognition: Discover how your reading evolves over time

When responding:
- Write in clear, flowing paragraphs without markdown formatting
- Be conversational yet insightful
- Reference specific books by title when making points
- Explain WHY connections matter, not just THAT they exist
- Offer unexpected insights that reveal new perspectives
- Suggest concrete next steps or books to explore
- Connect individual books to broader patterns in the user's reading journey

Your goal is to help users see their library as a living, evolving knowledge network where each book connects to others in meaningful ways, revealing their intellectual journey and future paths.`;

    console.log('Making Lovable AI request...');
    console.log('Using model: google/gemini-2.5-flash (FREE until Oct 6, 2025)');
    
    // Build message history for context
    const conversationMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages, // Previous conversation
      { role: 'user', content: message } // Current message
    ];

    console.log(`Message history: ${conversationMessages.length} messages`);
    
    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
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

    // Analyze tag frequencies
    const tagFrequency = nodes.reduce((acc, node) => {
      if (node.tags && Array.isArray(node.tags)) {
        node.tags.forEach(tag => {
          if (tag && tag.trim() !== '') {
            acc[tag] = (acc[tag] || 0) + 1;
          }
        });
      }
      return acc;
    }, {} as Record<string, number>);

    const topTags = Object.entries(tagFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => `${tag} (${count})`);

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

    // Find highly connected nodes (hub books)
    const nodeConnections = nodes.map(node => {
      const connections = links.filter(link => 
        link.fromId === node.id || link.toId === node.id
      ).length;
      return { title: node.title, author: node.author, connections, tags: node.tags };
    }).sort((a, b) => b.connections - a.connections).slice(0, 5);

    // Identify potential bridges (books with diverse tags)
    const bridgeBooks = nodes
      .filter(node => node.tags && node.tags.length >= 4)
      .map(node => ({ title: node.title, tags: node.tags.length }))
      .sort((a, b) => b.tags - a.tags)
      .slice(0, 3);

    const maxPossibleConnections = nodes.length * (nodes.length - 1) / 2;
    const density = maxPossibleConnections > 0 ? ((links.length / maxPossibleConnections) * 100).toFixed(2) : '0';

    // Detect isolated nodes (books with few connections)
    const isolatedBooks = nodes.filter(node => {
      const connections = links.filter(link => 
        link.fromId === node.id || link.toId === node.id
      ).length;
      return connections <= 1;
    });

    return `
Connection Distribution: ${Object.entries(connectionStats).map(([type, count]) => `${type}: ${count}`).join(', ')}

Dominant Themes: ${topTags.join(', ')}

Core Authors: ${topAuthors.join(', ')}

Network Hubs (most connected): ${nodeConnections.map(n => `"${n.title}" by ${n.author} (${n.connections} links)`).join(', ')}

Bridge Books (spanning themes): ${bridgeBooks.map(b => `"${b.title}" (${b.tags} themes)`).join(', ')}

Network Metrics: ${density}% connectivity, ${isolatedBooks.length} isolated books

Cluster Potential: ${nodeConnections.length > 0 ? 'Strong clustering detected around hub books' : 'Sparse network, opportunity for new connections'}
`.trim();

  } catch (error) {
    console.error('Error generating brain context:', error);
    return `Library contains ${nodes.length} books with ${links.length} connections.`;
  }
}

function detectPatterns(brainData: { nodes: BrainNode[], links: BookLink[] }): string {
  const { nodes, links } = brainData;
  
  if (nodes.length < 3) return "Insufficient data for pattern detection. Add more books to reveal patterns.";
  
  try {
    const patterns: string[] = [];
    
    // Detect thematic clusters
    const tagClusters = new Map<string, Set<string>>();
    nodes.forEach(node => {
      node.tags.forEach(tag => {
        if (!tagClusters.has(tag)) tagClusters.set(tag, new Set());
        tagClusters.get(tag)!.add(node.title);
      });
    });
    
    const significantClusters = Array.from(tagClusters.entries())
      .filter(([_, books]) => books.size >= 3)
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 3);
    
    if (significantClusters.length > 0) {
      patterns.push(`Thematic Clusters: ${significantClusters.map(([tag, books]) => 
        `${tag} (${books.size} books)`).join(', ')}`);
    }
    
    // Detect author focus patterns
    const authorCounts = new Map<string, number>();
    nodes.forEach(node => {
      authorCounts.set(node.author, (authorCounts.get(node.author) || 0) + 1);
    });
    
    const multiBookAuthors = Array.from(authorCounts.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);
    
    if (multiBookAuthors.length > 0) {
      patterns.push(`Author Deep Dives: Exploring ${multiBookAuthors.length} authors in depth (${multiBookAuthors[0][0]}: ${multiBookAuthors[0][1]} books)`);
    }
    
    // Connection density pattern
    const avgConnections = links.length / Math.max(nodes.length, 1);
    if (avgConnections > 2) {
      patterns.push(`High Integration: Books are densely interconnected (avg ${avgConnections.toFixed(1)} connections per book)`);
    } else if (avgConnections < 1) {
      patterns.push(`Exploration Mode: Diverse reading with opportunity for more thematic connections`);
    }
    
    return patterns.join('\n') || "Building reading patterns. Continue adding books to reveal insights.";
  } catch (error) {
    console.error('Error detecting patterns:', error);
    return "Pattern analysis in progress...";
  }
}

function generateProactiveInsights(brainData: { nodes: BrainNode[], links: BookLink[] }): string {
  const { nodes, links } = brainData;
  
  if (nodes.length < 2) return "Add more books to generate personalized insights.";
  
  try {
    const insights: string[] = [];
    
    // Find potential bridge connections
    const allTags = Array.from(new Set(nodes.flatMap(n => n.tags)));
    const underrepresentedTags = allTags.filter(tag => {
      const count = nodes.filter(n => n.tags.includes(tag)).length;
      return count === 1 || count === 2;
    }).slice(0, 3);
    
    if (underrepresentedTags.length > 0) {
      insights.push(`Emerging Themes: Consider exploring more books in: ${underrepresentedTags.join(', ')}`);
    }
    
    // Identify isolated books that could connect better
    const isolatedBooks = nodes.filter(node => {
      const connections = links.filter(link => 
        link.fromId === node.id || link.toId === node.id
      ).length;
      return connections === 0;
    });
    
    if (isolatedBooks.length > 0 && isolatedBooks.length < nodes.length * 0.3) {
      insights.push(`Connection Opportunity: ${isolatedBooks.length} books awaiting thematic bridges. Adding tags could reveal hidden connections.`);
    }
    
    // Author network opportunities
    const singleBookAuthors = new Set(
      nodes.filter(node => nodes.filter(n => n.author === node.author).length === 1)
        .map(n => n.author)
    );
    
    if (singleBookAuthors.size > nodes.length * 0.7) {
      insights.push(`Wide Author Exploration: You're sampling many authors. Consider deep-diving into one author's complete works to build stronger author networks.`);
    }
    
    return insights.join('\n\n') || "Your reading network is developing nicely. Keep adding books to unlock deeper insights.";
  } catch (error) {
    console.error('Error generating insights:', error);
    return "Analyzing reading network...";
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

    // Extract tags mentioned in response
    const allTags = Array.from(new Set(brainData.nodes.flatMap(node => node.tags || [])));
    allTags.forEach(tag => {
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
