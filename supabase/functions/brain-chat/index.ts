
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

interface ChatRequest {
  message: string;
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
    // Check if OpenAI API key is configured
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('Checking OpenAI API key...', openAIApiKey ? 'Key found' : 'Key missing');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment variables');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key is not configured. Please add your OpenAI API key in the Supabase Edge Function secrets.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    const { message, brainData }: ChatRequest = requestBody;

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
    
    const systemPrompt = `You are an AI assistant specialized in analyzing book reading networks and neural knowledge graphs. You have access to the user's personal library visualization showing books as nodes connected by thematic, author, and conceptual relationships.

Current Brain State:
- Total Books: ${brainData.nodes.length}
- Total Connections: ${brainData.links.length}
- Active Filters: ${brainData.activeFilters.length > 0 ? brainData.activeFilters.join(', ') : 'None'}

Brain Analysis:
${brainContext}

You can help users:
- Understand connection patterns in their reading network
- Identify thematic clusters and bridges
- Suggest reading recommendations based on network analysis
- Explore temporal patterns and author relationships
- Analyze tag frequencies and conceptual themes

When referencing specific books, use their exact titles. When discussing connections, mention the connection types and strengths. Provide insights that help users understand their reading patterns and discover new connections.

Keep responses conversational, insightful, and focused on the neural network aspects of their library.`;

    console.log('Making OpenAI API request...');
    console.log('Using model: gpt-4o-mini');
    
    // Test OpenAI API connection
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    console.log('OpenAI API response status:', response.status);
    console.log('OpenAI API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error details:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      if (response.status === 401) {
        return new Response(JSON.stringify({ 
          error: 'Invalid OpenAI API key. Please check your API key in the Supabase Edge Function secrets.' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'OpenAI API rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ 
          error: `OpenAI API error (${response.status}): ${errorText}` 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    let data;
    try {
      data = await response.json();
      console.log('OpenAI response parsed successfully');
    } catch (jsonError) {
      console.error('Failed to parse OpenAI response:', jsonError);
      return new Response(JSON.stringify({ 
        error: 'Invalid response from OpenAI API' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid OpenAI response structure:', data);
      return new Response(JSON.stringify({ 
        error: 'Invalid response structure from OpenAI API' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = data.choices[0].message.content;
    console.log('AI response received, length:', aiResponse.length);

    // Analyze response for actionable highlights
    const highlights = extractHighlights(aiResponse, brainData);
    console.log('Extracted highlights:', highlights);

    return new Response(JSON.stringify({ 
      response: aiResponse,
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

    // Find highly connected nodes
    const nodeConnections = nodes.map(node => {
      const connections = links.filter(link => 
        link.fromId === node.id || link.toId === node.id
      ).length;
      return { title: node.title, connections };
    }).sort((a, b) => b.connections - a.connections).slice(0, 5);

    const maxPossibleConnections = nodes.length * (nodes.length - 1) / 2;
    const density = maxPossibleConnections > 0 ? ((links.length / maxPossibleConnections) * 100).toFixed(2) : '0';

    return `
Connection Types: ${Object.entries(connectionStats).map(([type, count]) => `${type}: ${count}`).join(', ')}

Top Themes: ${topTags.join(', ')}

Most Prolific Authors: ${topAuthors.join(', ')}

Most Connected Books: ${nodeConnections.map(n => `"${n.title}" (${n.connections} connections)`).join(', ')}

Network Density: ${density}% connectivity
`.trim();

  } catch (error) {
    console.error('Error generating brain context:', error);
    return `Library contains ${nodes.length} books with ${links.length} connections.`;
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
