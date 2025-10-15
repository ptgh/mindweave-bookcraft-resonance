
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

    // Generate brain context
    const brainContext = generateBrainContext(brainData);
    console.log('Brain context generated, length:', brainContext.length);
    
    const systemPrompt = `You are an AI assistant specialized in analyzing science fiction reading networks and neural knowledge graphs. You have access to the user's personal SF library visualization showing books as nodes connected by thematic, author, and conceptual relationships.

Current Brain State:
- Total Books: ${brainData.nodes.length}
- Total Connections: ${brainData.links.length}
- Active Filters: ${brainData.activeFilters.length > 0 ? brainData.activeFilters.join(', ') : 'None'}

Brain Analysis:
${brainContext}

You can help users:
- Identify thematic clusters (groups of 2+ books exploring the same theme)
- Detect conceptual bridges (books that connect multiple themes)
- Understand connection patterns and reading velocity trends
- Suggest recommendations based on cluster gaps and bridge opportunities
- Explore temporal patterns and author relationships
- Analyze influence networks between authors
- Identify SF genre patterns (Cyberpunk, Hard SF, Space Opera, etc.)
- Recognize genre evolution and cross-genre connections

DUAL TAXONOMY SYSTEM:
The library uses TWO classification systems working together:
1. GENRES: SF subgenres like Cyberpunk, Hard SF, Space Opera, Biopunk, etc.
2. CONCEPTUAL NODES: Thematic tags like "AI Consciousness", "Neural Interface", "Time Paradox"

PATTERN RECOGNITION INSIGHTS:
- Proactively mention detected clusters when relevant (e.g., "I notice you have a strong AI Consciousness cluster with 4 books spanning Cyberpunk and Post-Cyberpunk genres")
- Point out bridge books that connect genres OR themes (e.g., "This book bridges your Cyberpunk cluster with Hard SF through neural interface themes")
- Identify reading velocities and acceleration patterns in both genres and themes
- Suggest books that would strengthen weak clusters or create new bridges between genres
- Recognize genre evolution patterns (e.g., "Your reading shows a progression from Golden Age Space Opera to New Wave experimental SF")

When referencing specific books, use their exact titles. When discussing connections, mention both genre classification AND conceptual nodes. Provide insights that help users understand their SF reading patterns and discover new connections.

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

    // Analyze tag frequencies for thematic clusters
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

Conceptual Nodes (Themes): ${topTags.join(', ')}

Most Prolific Authors: ${topAuthors.join(', ')}

Most Connected Books: ${nodeConnections.map(n => `"${n.title}" (${n.connections} connections)`).join(', ')}

Network Density: ${density}% connectivity`;

    // Add pattern recognition insights with genre-aware language
    if (clusters.length > 0) {
      context += `\n\nThematic Clusters Detected (Conceptual Nodes with 2+ books): ${clusters.join(', ')}`;
      context += `\n\nNote: These conceptual nodes work alongside SF genre classification (Cyberpunk, Hard SF, Space Opera, etc.) to create a dual taxonomy for comprehensive pattern analysis.`;
    }

    if (bridgeBooks.length > 0) {
      context += `\n\nConceptual Bridge Books (connecting multiple thematic nodes): ${bridgeBooks.map(b => 
        `"${b.title}" (bridges: ${b.bridgingThemes.join(', ')})`
      ).join(', ')}`;
      context += `\n\nThese bridges are particularly valuable for identifying cross-genre connections and thematic evolution patterns.`;
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
