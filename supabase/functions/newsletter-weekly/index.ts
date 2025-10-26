import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { WeeklyNewsletterEmail } from "./_templates/weekly-newsletter.tsx";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Curated weekly book recommendations
const WEEKLY_RECOMMENDATIONS = [
  {
    title: "Neuromancer",
    author: "William Gibson",
    coverUrl: "https://covers.openlibrary.org/b/isbn/0441569595-M.jpg",
    description: "The book that defined cyberpunk. Follow Case, a washed-up hacker, through the neon-soaked matrix in this genre-defining masterpiece of digital consciousness.",
  },
  {
    title: "The Left Hand of Darkness",
    author: "Ursula K. Le Guin",
    coverUrl: "https://covers.openlibrary.org/b/isbn/0441478123-M.jpg",
    description: "A groundbreaking exploration of gender and society on the frozen planet of Gethen. Le Guin's masterwork of social science fiction.",
  },
  {
    title: "Hyperion",
    author: "Dan Simmons",
    coverUrl: "https://covers.openlibrary.org/b/isbn/0553283685-M.jpg",
    description: "Seven pilgrims journey to the Time Tombs on Hyperion, each sharing their tale in this Canterbury Tales-inspired space opera epic.",
  },
  {
    title: "The Three-Body Problem",
    author: "Liu Cixin",
    coverUrl: "https://covers.openlibrary.org/b/isbn/0765382032-M.jpg",
    description: "China's Cultural Revolution meets alien contact in this hard sci-fi masterpiece that redefined first contact narratives.",
  },
  {
    title: "A Memory Called Empire",
    author: "Arkady Martine",
    coverUrl: "https://covers.openlibrary.org/b/isbn/1250186447-M.jpg",
    description: "Political intrigue and cultural identity collide in this space opera about an ambassador navigating a vast galactic empire.",
  },
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Rotate recommendations based on week number
    const startIndex = (weekNumber - 1) % WEEKLY_RECOMMENDATIONS.length;
    const selectedBooks = [
      WEEKLY_RECOMMENDATIONS[startIndex],
      WEEKLY_RECOMMENDATIONS[(startIndex + 1) % WEEKLY_RECOMMENDATIONS.length],
      WEEKLY_RECOMMENDATIONS[(startIndex + 2) % WEEKLY_RECOMMENDATIONS.length],
    ];

    // Add Leafnode URLs for each book
    const recommendations = selectedBooks.map(book => ({
      ...book,
      addUrl: `https://leafnode.co.uk/?add=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}`,
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

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
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
