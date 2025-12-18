import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { WelcomeNewsletterEmail } from "./_templates/welcome-newsletter.tsx";
import { AlreadySubscribedEmail } from "./_templates/already-subscribed-email.tsx";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SubscribeRequest {
  email: string;
  userId?: string;
  forceResend?: boolean;
}

// Full pool of curated book recommendations - 3 random picks sent each time
// Using Open Library covers (more reliable) with ISBN-based URLs
const ALL_ENGAGEMENT_BOOKS = [
  {
    title: "Neuromancer",
    author: "William Gibson",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780441007462-M.jpg",
    description: "The seminal cyberpunk novel that defined a genre and predicted our digital future.",
    addUrl: "https://leafnode.co.uk/?add=neuromancer"
  },
  {
    title: "The Left Hand of Darkness",
    author: "Ursula K. Le Guin",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780441478125-M.jpg",
    description: "A groundbreaking exploration of gender and society on an alien world.",
    addUrl: "https://leafnode.co.uk/?add=left-hand-darkness"
  },
  {
    title: "Hyperion",
    author: "Dan Simmons",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780553283686-M.jpg",
    description: "An epic space opera told through interwoven pilgrim tales in Canterbury style.",
    addUrl: "https://leafnode.co.uk/?add=hyperion"
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780441172719-M.jpg",
    description: "The definitive ecological epic—politics, religion, and desert survival on Arrakis.",
    addUrl: "https://leafnode.co.uk/?add=dune"
  },
  {
    title: "Snow Crash",
    author: "Neal Stephenson",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780553380958-M.jpg",
    description: "A razor-sharp satire of corporate America meets virtual reality thriller.",
    addUrl: "https://leafnode.co.uk/?add=snow-crash"
  },
  {
    title: "Foundation",
    author: "Isaac Asimov",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780553293357-M.jpg",
    description: "The collapse and rebirth of galactic civilization through the lens of psychohistory.",
    addUrl: "https://leafnode.co.uk/?add=foundation"
  },
  {
    title: "The Dispossessed",
    author: "Ursula K. Le Guin",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780061054884-M.jpg",
    description: "An ambiguous utopia exploring anarchism, capitalism, and the nature of freedom.",
    addUrl: "https://leafnode.co.uk/?add=dispossessed"
  },
  {
    title: "Blindsight",
    author: "Peter Watts",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780765319647-M.jpg",
    description: "Hard SF first contact that questions consciousness and what it means to be human.",
    addUrl: "https://leafnode.co.uk/?add=blindsight"
  },
  {
    title: "A Fire Upon the Deep",
    author: "Vernor Vinge",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780812515282-M.jpg",
    description: "A galaxy where physics changes with distance from the core, and ancient evils awaken.",
    addUrl: "https://leafnode.co.uk/?add=fire-upon-deep"
  },
  {
    title: "Rendezvous with Rama",
    author: "Arthur C. Clarke",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780553287899-M.jpg",
    description: "Humanity explores a vast alien spacecraft—pure sense of wonder distilled.",
    addUrl: "https://leafnode.co.uk/?add=rendezvous-rama"
  },
  {
    title: "The Stars My Destination",
    author: "Alfred Bester",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780679767800-M.jpg",
    description: "A revenge epic that pioneered teleportation and the anti-hero in science fiction.",
    addUrl: "https://leafnode.co.uk/?add=stars-my-destination"
  },
  {
    title: "Solaris",
    author: "Stanisław Lem",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780156027601-M.jpg",
    description: "An ocean planet probes the limits of human understanding and communication.",
    addUrl: "https://leafnode.co.uk/?add=solaris"
  }
];

// Fisher-Yates shuffle and pick n items
function getRandomBooks(count: number) {
  const shuffled = [...ALL_ENGAGEMENT_BOOKS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { email, userId, forceResend }: SubscribeRequest = await req.json();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already subscribed
    const { data: existing, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('id, status, unsubscribe_token')
      .eq('email', normalizedEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let subscriberId: string;
    let isResubscribe = false;

    if (existing) {
      // Already active subscriber - send engagement email with fresh picks
      if (existing.status === 'active' && !forceResend) {
        console.log(`Sending engagement email to existing subscriber: ${normalizedEmail}`);
        
        const unsubscribeUrl = `https://leafnode.co.uk/unsubscribe/${existing.unsubscribe_token}`;
        
        const selectedBooks = getRandomBooks(3);
        
        const html = await renderAsync(
          React.createElement(AlreadySubscribedEmail, {
            email: normalizedEmail,
            recommendations: selectedBooks,
            unsubscribeUrl
          })
        );

        const { error: emailError } = await resend.emails.send({
          from: 'Leafnode <signals@leafnode.co.uk>',
          to: [normalizedEmail],
          subject: 'Signal Active — Fresh Picks Inside',
          html,
        });

        if (emailError) {
          console.error('Engagement email send error:', emailError);
        } else {
          console.log(`Engagement email sent to: ${normalizedEmail}`);
        }

        return new Response(
          JSON.stringify({ 
            message: 'Already subscribed',
            emailSent: true 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // For forceResend on active subscribers, just get the ID and send email
      if (existing.status === 'active' && forceResend) {
        subscriberId = existing.id;
        isResubscribe = false; // Treat as fresh welcome for testing
      } else {
        // Reactivate subscription
        const { data: updated, error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({ 
            status: 'active', 
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null,
            user_id: userId || null
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) throw updateError;
        subscriberId = updated.id;
        isResubscribe = true;
      }
    } else {
      // Create new subscription
      const { data: newSub, error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: normalizedEmail,
          user_id: userId || null,
          status: 'active'
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          return new Response(
            JSON.stringify({ error: 'Email already exists' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw insertError;
      }
      subscriberId = newSub.id;
    }

    // Get unsubscribe token
    const { data: subData } = await supabase
      .from('newsletter_subscribers')
      .select('unsubscribe_token')
      .eq('id', subscriberId)
      .single();

    // Send welcome email
    const unsubscribeUrl = `https://leafnode.co.uk/unsubscribe/${subData?.unsubscribe_token}`;
    
    const html = await renderAsync(
      React.createElement(WelcomeNewsletterEmail, {
        email: normalizedEmail,
        unsubscribeUrl,
        isResubscribe
      })
    );

    const { error: emailError } = await resend.emails.send({
      from: 'Leafnode <signals@leafnode.co.uk>',
      to: [normalizedEmail],
      subject: isResubscribe ? 'Signal Restored' : 'Sync Confirmed',
      html,
    });

    if (emailError) {
      console.error('Email send error:', emailError);
      // Don't fail the whole request if email fails
    }

    console.log(`Newsletter subscription successful: ${normalizedEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: isResubscribe ? 'Resubscribed successfully' : 'Subscribed successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Newsletter subscription error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Subscription failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
