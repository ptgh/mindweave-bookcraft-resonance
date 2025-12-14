import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { WelcomeNewsletterEmail } from "./_templates/welcome-newsletter.tsx";

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
      .select('id, status')
      .eq('email', normalizedEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let subscriberId: string;
    let isResubscribe = false;

    if (existing) {
      if (existing.status === 'active' && !forceResend) {
        return new Response(
          JSON.stringify({ message: 'Already subscribed' }),
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
