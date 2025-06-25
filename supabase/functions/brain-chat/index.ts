
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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { message, brainData }: ChatRequest = await req.json();

    // Create intelligent brain context
    const brainContext = generateBrainContext(brainData);
    
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

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Analyze response for actionable highlights
    const highlights = extractHighlights(aiResponse, brainData);

    return new Response(JSON.stringify({ 
      response: aiResponse,
      highlights: highlights 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in brain-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to process chat request' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateBrainContext(brainData: { nodes: BrainNode[], links: BookLink[], activeFilters: string[] }): string {
  const { nodes, links } = brainData;
  
  // Analyze connection patterns
  const connectionStats = links.reduce((acc, link) => {
    acc[link.type] = (acc[link.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Analyze tag frequencies
  const tagFrequency = nodes.reduce((acc, node) => {
    node.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topTags = Object.entries(tagFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => `${tag} (${count})`);

  // Analyze author networks
  const authorBooks = nodes.reduce((acc, node) => {
    acc[node.author] = (acc[node.author] || 0) + 1;
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

  return `
Connection Types: ${Object.entries(connectionStats).map(([type, count]) => `${type}: ${count}`).join(', ')}

Top Themes: ${topTags.join(', ')}

Most Prolific Authors: ${topAuthors.join(', ')}

Most Connected Books: ${nodeConnections.map(n => `"${n.title}" (${n.connections} connections)`).join(', ')}

Network Density: ${((links.length / (nodes.length * (nodes.length - 1))) * 100).toFixed(2)}% connectivity
`.trim();
}

function extractHighlights(response: string, brainData: { nodes: BrainNode[], links: BookLink[] }): { nodeIds: string[], linkIds: string[], tags: string[] } {
  const highlights = {
    nodeIds: [] as string[],
    linkIds: [] as string[],
    tags: [] as string[]
  };

  // Extract book titles mentioned in response
  brainData.nodes.forEach(node => {
    if (response.toLowerCase().includes(node.title.toLowerCase())) {
      highlights.nodeIds.push(node.id);
    }
  });

  // Extract tags mentioned in response
  const allTags = Array.from(new Set(brainData.nodes.flatMap(node => node.tags)));
  allTags.forEach(tag => {
    if (response.toLowerCase().includes(tag.toLowerCase())) {
      highlights.tags.push(tag);
    }
  });

  return highlights;
}
