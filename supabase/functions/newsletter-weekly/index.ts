import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { WeeklyNewsletterEmail } from "./_templates/weekly-newsletter.tsx";
import { requireAdminOrInternal, corsHeaders, createServiceClient } from "../_shared/adminAuth.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Expanded curated weekly book recommendations (20+ books to avoid repeats across 8 weeks)
const WEEKLY_RECOMMENDATIONS = [
  {
    title: "Neuromancer",
    author: "William Gibson",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780441007462-M.jpg",
    description: "The book that defined cyberpunk. Follow Case through the neon-soaked matrix in this genre-defining masterpiece.",
  },
  {
    title: "The Left Hand of Darkness",
    author: "Ursula K. Le Guin",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780441478125-M.jpg",
    description: "A groundbreaking exploration of gender and society on the frozen planet of Gethen.",
  },
  {
    title: "Hyperion",
    author: "Dan Simmons",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780553283686-M.jpg",
    description: "Seven pilgrims journey to the Time Tombs in this Canterbury Tales-inspired space opera epic.",
  },
  {
    title: "The Three-Body Problem",
    author: "Liu Cixin",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780765382030-M.jpg",
    description: "China's Cultural Revolution meets alien contact in this hard sci-fi masterpiece.",
  },
  {
    title: "A Memory Called Empire",
    author: "Arkady Martine",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781250186430-M.jpg",
    description: "Political intrigue and cultural identity collide in this space opera about an ambassador.",
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780441172719-M.jpg",
    description: "The epic tale of politics, religion, and ecology on the desert planet Arrakis.",
  },
  {
    title: "Foundation",
    author: "Isaac Asimov",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780553293357-M.jpg",
    description: "A mathematician develops a science to preserve knowledge as the Galactic Empire falls.",
  },
  {
    title: "Snow Crash",
    author: "Neal Stephenson",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780553380958-M.jpg",
    description: "Hiro Protagonist navigates a virtual metaverse and a dangerous conspiracy in near-future America.",
  },
  {
    title: "The Dispossessed",
    author: "Ursula K. Le Guin",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780060512750-M.jpg",
    description: "An ambiguous utopia explores anarchism and capitalism through twin worlds.",
  },
  {
    title: "Blindsight",
    author: "Peter Watts",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780765312181-M.jpg",
    description: "A first contact story that questions the nature of consciousness itself.",
  },
  {
    title: "Childhood's End",
    author: "Arthur C. Clarke",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780345347954-M.jpg",
    description: "Benevolent alien Overlords bring peace to Earth, but at what cost to humanity's future?",
  },
  {
    title: "The Forever War",
    author: "Joe Haldeman",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780312536633-M.jpg",
    description: "A soldier fights across centuries due to relativistic time dilation in an interstellar conflict.",
  },
  {
    title: "Rendezvous with Rama",
    author: "Arthur C. Clarke",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780553287899-M.jpg",
    description: "An enormous alien spacecraft enters the solar system, inviting exploration of its mysteries.",
  },
  {
    title: "The Stars My Destination",
    author: "Alfred Bester",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780679767800-M.jpg",
    description: "Gully Foyle's burning quest for revenge in a future where teleportation is common.",
  },
  {
    title: "Solaris",
    author: "Stanisław Lem",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780156027601-M.jpg",
    description: "A psychologist confronts an alien ocean intelligence that creates physical manifestations.",
  },
  {
    title: "A Fire Upon the Deep",
    author: "Vernor Vinge",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780812515282-M.jpg",
    description: "A transcendent Powers awakens as children crash-land on a medieval alien world.",
  },
  {
    title: "The Book of the New Sun",
    author: "Gene Wolfe",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780312890179-M.jpg",
    description: "A torturer's journey through a far-future dying Earth filled with mysteries.",
  },
  {
    title: "Speaker for the Dead",
    author: "Orson Scott Card",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780812550757-M.jpg",
    description: "Ender Wiggin seeks redemption by speaking the truth of the dead among an alien species.",
  },
  {
    title: "The Windup Girl",
    author: "Paolo Bacigalupi",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781597801584-M.jpg",
    description: "Biopunk noir in a future Thailand where genetic engineering shapes society.",
  },
  {
    title: "Ancillary Justice",
    author: "Ann Leckie",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780316246620-M.jpg",
    description: "A starship AI seeks revenge in a body that was once one of its thousands of soldiers.",
  },
  {
    title: "Do Androids Dream of Electric Sheep?",
    author: "Philip K. Dick",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780345404473-M.jpg",
    description: "A bounty hunter questions humanity while retiring rogue androids in post-apocalyptic Earth.",
  },
  {
    title: "The Martian",
    author: "Andy Weir",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780553418026-M.jpg",
    description: "An astronaut stranded on Mars must science his way to survival.",
  },
  {
    title: "Ender's Game",
    author: "Orson Scott Card",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780812550702-M.jpg",
    description: "A child genius is trained in Battle School to fight an alien threat.",
  },
  {
    title: "The Road",
    author: "Cormac McCarthy",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780307387899-M.jpg",
    description: "A father and son traverse a post-apocalyptic landscape, clinging to hope and humanity.",
  },
  {
    title: "Accelerando",
    author: "Charles Stross",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780441014156-M.jpg",
    description: "Three generations navigate the technological singularity and post-human economics.",
  },
  {
    title: "Ringworld",
    author: "Larry Niven",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780345333926-M.jpg",
    description: "Explorers discover an artificial world encircling a distant star.",
  },
  {
    title: "Red Mars",
    author: "Kim Stanley Robinson",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780553560732-M.jpg",
    description: "The colonization and terraforming of Mars through scientific and political struggles.",
  },
  {
    title: "Ubik",
    author: "Philip K. Dick",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780547572291-M.jpg",
    description: "Reality breaks down in this mind-bending tale of corporate telepaths and half-life.",
  },
  {
    title: "Consider Phlebas",
    author: "Iain M. Banks",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780316005388-M.jpg",
    description: "A mercenary battles across a galaxy-spanning war between civilizations in the Culture universe.",
  },
  {
    title: "Old Man's War",
    author: "John Scalzi",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780765348272-M.jpg",
    description: "Elderly recruits receive young bodies to fight in humanity's interstellar wars.",
  },
  {
    title: "Parable of the Sower",
    author: "Octavia E. Butler",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781538732182-M.jpg",
    description: "A young woman with hyperempathy creates a new religion as California collapses.",
  },
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780593135204-M.jpg",
    description: "A lone astronaut must save Earth from extinction with only fragmented memories.",
  },
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Allow cron calls (anon key) or admin/internal calls
  // The cron job sends the anon key as Bearer token. We detect this by decoding
  // the JWT and checking for role=anon (anon key JWTs have role "anon", not "authenticated").
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  
  let isCronCall = false;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role === 'anon') {
        isCronCall = true;
      }
    } catch (_) {
      // Not a valid JWT, proceed with normal auth
    }
  }

  if (!isCronCall) {
    const internalHeader = req.headers.get("x-internal-secret");
    const internalSecret = Deno.env.get("INTERNAL_EDGE_SECRET");
    if (internalSecret && internalHeader === internalSecret) {
      console.log("✅ [Newsletter] Internal call authorized");
    } else {
      const auth = await requireAdminOrInternal(req);
      if (auth instanceof Response) return auth;
    }
  } else {
    console.log("✅ [Newsletter] Cron call authorized via anon key (role=anon)");
  }

  try {
    const supabase = createServiceClient();

    // Get all active newsletter subscribers
    const { data: subscribers, error: subsError } = await supabase
      .from('newsletter_subscribers')
      .select('email, unsubscribe_token')
      .eq('status', 'active');

    if (subsError) {
      throw subsError;
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('No active subscribers found');
      return new Response(
        JSON.stringify({ message: 'No active subscribers' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get week number (simple calculation from start of year)
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);

    // Select 4 books per week, cycling through the pool to avoid repeats for ~8 weeks
    // With 32 books and 4 per week, no repeats for 8 weeks
    const totalBooks = WEEKLY_RECOMMENDATIONS.length;
    const booksPerWeek = 4;
    const startIndex = ((weekNumber - 1) * booksPerWeek) % totalBooks;
    
    const selectedBooks: typeof WEEKLY_RECOMMENDATIONS = [];
    for (let i = 0; i < booksPerWeek; i++) {
      const index = (startIndex + i) % totalBooks;
      selectedBooks.push(WEEKLY_RECOMMENDATIONS[index]);
    }

    // Add Leafnode URLs for each book - now linking to Signal Archive
    const recommendations = selectedBooks.map(book => ({
      ...book,
      addUrl: `https://leafnode.co.uk/book-browser?add=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}`,
    }));

    let successCount = 0;
    let errorCount = 0;

    // Send emails to all subscribers
    for (const subscriber of subscribers) {
      try {
        const unsubscribeUrl = `https://leafnode.co.uk/unsubscribe/${subscriber.unsubscribe_token}`;
        
        const html = await renderAsync(
          React.createElement(WeeklyNewsletterEmail, {
            email: subscriber.email,
            recommendations,
            unsubscribeUrl,
            weekNumber,
          })
        );

        const { error: emailError } = await resend.emails.send({
          from: 'Leafnode <signals@leafnode.co.uk>',
          to: [subscriber.email],
          subject: `Weekly Transmission #${weekNumber} — New Signals Detected`,
          html,
        });

        if (emailError) {
          console.error(`Failed to send to ${subscriber.email}:`, emailError);
          errorCount++;
        } else {
          successCount++;
        }

        // Delay to avoid Resend rate limits (2 req/sec)
        await new Promise(resolve => setTimeout(resolve, 600));
      } catch (emailErr) {
        console.error(`Error processing ${subscriber.email}:`, emailErr);
        errorCount++;
      }
    }

    console.log(`Weekly newsletter sent: ${successCount} succeeded, ${errorCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        sent: successCount,
        failed: errorCount,
        weekNumber,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Weekly newsletter error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send weekly newsletter' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);