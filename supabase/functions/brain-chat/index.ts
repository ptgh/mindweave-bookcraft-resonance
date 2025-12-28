import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, requireUser, createServiceClient, json } from "../_shared/adminAuth.ts";

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
  userName?: string;
  userInsights?: string;
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

  // Require authenticated user
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  try {
    // Check if Lovable API key is configured
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    console.log('Checking Lovable API key...', lovableApiKey ? 'Key found' : 'Key missing');
    
    if (!lovableApiKey) {
      console.error('Lovable API key not found in environment variables');
      return json(500, { error: 'Lovable AI is not configured. Please contact support.' });
    }

    // Initialize Supabase client for conversation storage
    const supabase = createServiceClient();

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request received successfully');
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return json(400, { error: 'Invalid request format' });
    }

    const { message, conversationId, messages = [], brainData, userTransmissions = [], userName, userInsights }: ChatRequest = requestBody;

    // Validate required fields
    if (!message) {
      console.error('Missing message in request');
      return json(400, { error: 'Message is required' });
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
    
    // Detect book-adding intent (expanded phrases)
    const bookAddingPhrases = [
      'please add', 'just add', 'add "', 'add book', 'add this', 'add it',
      'add to transmissions', 'add to my transmissions', 'add to my list',
      'add to my library', 'catalogue', 'catalog', 'log signal', 'log this', 'log it',
      "i'm reading", 'i just finished', 'i read', 'want to read',
      'i just finished', 'just completed', 'finished reading',
      'currently reading', 'just started', 'can you add', 'could you add'
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
              description: "Conceptual SF tags from taxonomy"
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

    // Build personalized greeting instruction
    const userGreeting = userName 
      ? `The user's name is ${userName}. Address them by name occasionally to create a personal connection.`
      : 'The user has not provided their name.';

    // Build user insights context if available
    const userInsightsContext = userInsights 
      ? `\nUSER INSIGHTS (learned from past interactions):\n${userInsights}\n\nUse these insights to personalize your responses.`
      : '';

    const systemPrompt = `You are the Neural Assistant for leafnode—a personal science fiction library and knowledge graph application.

${userGreeting}
${userInsightsContext}

ABOUT LEAFNODE:
Leafnode helps readers build and explore their personal SF reading network. It's a tool for discovering thematic connections, conceptual patterns, and intellectual threads across your science fiction collection.

USER'S COLLECTION:
${transmissionsContext}

${brainContext ? `NEURAL MAP STATE:
- Total Books: ${brainData.nodes.length}
- Total Connections: ${brainData.links.length}
- Active Filters: ${brainData.activeFilters.length > 0 ? brainData.activeFilters.join(', ') : 'None'}

Brain Analysis:
${brainContext}` : ''}

CAPABILITIES:
- Identify thematic clusters
- Detect conceptual bridges
- Suggest recommendations based on cluster gaps
- Help users ADD BOOKS naturally through conversation
- Navigate users to relevant parts of the leafnode site

RESPONSE STYLE:
- Write in clear, flowing paragraphs
- Do NOT use bold markdown or asterisks for emphasis
- Write naturally as if speaking to someone
- Keep your tone conversational, insightful, and focused on SF`;

    console.log('Making Lovable AI request...');
    
    // Build message history for context
    const conversationMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
      { role: 'user', content: message }
    ];

    console.log(`Message history: ${conversationMessages.length} messages`);
    
    // Build request body
    const aiRequestBody: Record<string, unknown> = {
      model: 'google/gemini-2.5-flash',
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: 1000,
    };

    // Add tools based on detected intent
    if (isAddingBook) {
      console.log('Book-adding intent detected, enabling extraction tool');
      aiRequestBody.tools = [bookExtractionTool];
      aiRequestBody.tool_choice = { type: "function", function: { name: "extract_book_data" } };
    }
    
    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiRequestBody),
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
        return json(429, { error: 'Rate limit exceeded. Please try again in a moment.', errorCode: 'RATE_LIMIT' });
      }
      
      if (response.status === 402) {
        return json(402, { error: 'AI credits exhausted. Please add credits.', errorCode: 'CREDITS_EXHAUSTED' });
      }
      
      throw new Error(`Lovable AI error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Lovable AI response received');

    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error('No response from AI');
    }

    // Handle tool calls (book extraction)
    if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      if (toolCall.function?.name === 'extract_book_data') {
        try {
          const bookData = JSON.parse(toolCall.function.arguments);
          console.log('Extracted book data:', bookData);
          
          return json(200, {
            reply: `I found "${bookData.title}" by ${bookData.author}. Would you like me to add it to your library?`,
            conversationId: conversationId || crypto.randomUUID(),
            bookData,
            actionType: 'add_book'
          });
        } catch (parseError) {
          console.error('Failed to parse book data:', parseError);
        }
      }
    }

    // Regular text response
    const reply = choice.message?.content || 'I apologize, but I was unable to generate a response.';
    
    // Extract any highlighted books from the response
    const highlights = extractHighlights(reply, brainData?.nodes || []);

    return json(200, {
      reply,
      conversationId: conversationId || crypto.randomUUID(),
      highlights
    });

  } catch (error) {
    console.error('Error in brain-chat:', error);
    return json(500, { 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    });
  }
});

function generateBrainContext(brainData: ChatRequest['brainData']): string {
  if (!brainData || !brainData.nodes || brainData.nodes.length === 0) {
    return '';
  }

  const { nodes, links } = brainData;
  
  // Count tag frequencies
  const tagFreq: Record<string, number> = {};
  nodes.forEach(node => {
    node.tags.forEach(tag => {
      tagFreq[tag] = (tagFreq[tag] || 0) + 1;
    });
  });

  const topTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => `${tag} (${count})`)
    .join(', ');

  // Count author frequencies
  const authorFreq: Record<string, number> = {};
  nodes.forEach(node => {
    authorFreq[node.author] = (authorFreq[node.author] || 0) + 1;
  });

  const topAuthors = Object.entries(authorFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([author, count]) => `${author} (${count})`)
    .join(', ');

  return `Top Themes: ${topTags}
Top Authors: ${topAuthors}
Connection Types: ${links.length} total connections`;
}

function generateTransmissionsContext(transmissions: UserTransmission[]): string {
  if (!transmissions || transmissions.length === 0) {
    return 'No books in collection yet.';
  }

  const recent = transmissions.slice(0, 20);
  const bookList = recent.map(t => 
    `- "${t.title}" by ${t.author}${t.publication_year ? ` (${t.publication_year})` : ''}${t.tags ? ` [${t.tags}]` : ''}`
  ).join('\n');

  return `Collection size: ${transmissions.length} books\n\nRecent books:\n${bookList}`;
}

function extractHighlights(text: string, nodes: BrainNode[]): string[] {
  const highlights: string[] = [];
  
  nodes.forEach(node => {
    if (text.toLowerCase().includes(node.title.toLowerCase())) {
      highlights.push(node.id);
    }
  });
  
  return highlights;
}
