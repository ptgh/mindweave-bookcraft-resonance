import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, requireUser, createUserClient, json } from "../_shared/adminAuth.ts";

interface Transmission {
  id: string;
  title: string;
  author: string;
  tags?: string;
  publication_year?: number;
  created_at: string;
  reading_velocity_score?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authenticated user
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  try {
    const supabase = createUserClient(auth.token);

    const { forceRegenerate } = await req.json();

    // Check for existing active challenges unless forcing regeneration
    if (!forceRegenerate) {
      const { data: existingChallenges } = await supabase
        .from('reading_challenges')
        .select('*')
        .eq('user_id', auth.userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingChallenges && existingChallenges.length > 0) {
        const challenge = existingChallenges[0];
        return json(200, {
          challenges: [challenge],
          cached: true,
          generatedAt: challenge.created_at
        });
      }
    }

    // Fetch user's transmissions
    const { data: transmissions, error: transmissionsError } = await supabase
      .from('transmissions')
      .select('id, title, author, tags, publication_year, created_at, reading_velocity_score')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false });

    if (transmissionsError) throw transmissionsError;

    if (!transmissions || transmissions.length < 3) {
      return json(400, {
        error: 'Need at least 3 books to generate challenges',
        message: 'Add more books to your library to unlock personalized reading challenges.'
      });
    }

    // Analyze transmissions
    const analysis = analyzeTransmissions(transmissions as Transmission[]);

    // Generate challenges using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const prompt = buildChallengePrompt(transmissions as Transmission[], analysis);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a sci-fi reading coach specializing in personalized reading challenges. Create achievable, exciting challenges based on reading patterns.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error('Failed to generate challenges');
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices[0].message.content;
    
    // Clean JSON parsing - remove markdown code blocks
    content = content.trim();
    if (content.startsWith('```json')) content = content.slice(7);
    if (content.startsWith('```')) content = content.slice(3);
    if (content.endsWith('```')) content = content.slice(0, -3);
    content = content.trim();
    
    let challengeData;
    try {
      challengeData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse challenge JSON:', content.substring(0, 200));
      throw new Error('Failed to parse AI response as valid JSON');
    }

    // Save challenge to database
    const { data: savedChallenge, error: saveError } = await supabase
      .from('reading_challenges')
      .insert({
        user_id: auth.userId,
        challenge_type: challengeData.type,
        title: challengeData.title,
        description: challengeData.description,
        goal_count: challengeData.goalCount,
        current_progress: 0,
        difficulty: challengeData.difficulty,
        target_books: challengeData.targetBooks || null,
        ai_encouragement: challengeData.encouragement,
        expires_at: challengeData.expiresAt || null,
        metadata: challengeData.metadata || {}
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return json(200, {
      challenges: [savedChallenge],
      cached: false,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in ai-challenge-generator:', error);
    return json(500, { error: (error as Error).message });
  }
});

function analyzeTransmissions(transmissions: Transmission[]) {
  const authors = new Map<string, number>();
  const decades = new Map<number, number>();
  const tags = new Map<string, number>();
  
  transmissions.forEach(t => {
    // Count authors
    if (t.author) {
      authors.set(t.author, (authors.get(t.author) || 0) + 1);
    }
    
    // Count decades
    if (t.publication_year) {
      const decade = Math.floor(t.publication_year / 10) * 10;
      decades.set(decade, (decades.get(decade) || 0) + 1);
    }
    
    // Count tags
    if (t.tags) {
      const bookTags = t.tags.split(',').map(tag => tag.trim());
      bookTags.forEach(tag => {
        if (tag) tags.set(tag, (tags.get(tag) || 0) + 1);
      });
    }
  });

  const avgVelocity = transmissions
    .filter(t => t.reading_velocity_score)
    .reduce((sum, t) => sum + (t.reading_velocity_score || 0), 0) / transmissions.length;

  return {
    totalBooks: transmissions.length,
    topAuthors: Array.from(authors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
    decadeCoverage: Array.from(decades.entries())
      .sort((a, b) => a[0] - b[0]),
    topTags: Array.from(tags.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    avgReadingVelocity: avgVelocity
  };
}

function buildChallengePrompt(transmissions: Transmission[], analysis: ReturnType<typeof analyzeTransmissions>): string {
  return `Analyze this sci-fi reader's collection and create ONE personalized reading challenge.

COLLECTION STATS:
- Total books: ${analysis.totalBooks}
- Top authors: ${analysis.topAuthors.map(([name, count]) => `${name} (${count})`).join(', ')}
- Decade coverage: ${analysis.decadeCoverage.map(([decade, count]) => `${decade}s (${count})`).join(', ')}
- Top themes: ${analysis.topTags.map(([tag]) => tag).join(', ')}
- Reading velocity: ${analysis.avgReadingVelocity.toFixed(2)}

CHALLENGE TYPES TO CONSIDER:
1. **Cluster Completion**: "You have 2 space opera books - read 1 more to form a thematic cluster"
2. **Decade Challenge**: "Fill gaps in timeline - read one book from each missing decade"
3. **Author Deep Dive**: "Explore [most-read author]'s universe - read 3 more works"
4. **Theme Bridge**: "Connect your [theme A] and [theme B] interests with 2 bridge books"
5. **Velocity Challenge**: Adaptive to reading speed

Create ONE challenge that:
- Is achievable within 1-3 months based on velocity
- Fills a meaningful gap or strengthens an emerging pattern
- Includes specific, actionable goals
- Has encouraging, personalized messaging

Return ONLY valid JSON (no markdown):
{
  "type": "cluster_completion|decade_challenge|author_dive|theme_bridge|velocity",
  "title": "Challenge title (under 60 chars)",
  "description": "Detailed description with specific goals",
  "goalCount": number (how many books to read),
  "difficulty": "easy|medium|hard",
  "targetBooks": ["suggested book 1", "suggested book 2"],
  "encouragement": "Personalized encouragement message",
  "expiresAt": "ISO date 1-3 months from now",
  "metadata": {
    "reasoning": "Why this challenge fits",
    "milestones": ["milestone 1", "milestone 2"]
  }
}`;
}
