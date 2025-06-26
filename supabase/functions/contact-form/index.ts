
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormRequest {
  name: string;
  email: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, message }: ContactFormRequest = await req.json();

    // Validate required fields
    if (!name || !email || !message) {
      throw new Error("All fields are required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store the contact form submission in the database
    const { error: dbError } = await supabase
      .from("contacts")
      .insert({
        name,
        email,
        message,
        status: "new"
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to store contact submission");
    }

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Send notification email to you
    const notificationEmail = await resend.emails.send({
      from: "LEAFNODE Contact <connect@leafnode.co.uk>",
      to: ["connect@leafnode.co.uk"],
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 12px; color: white; margin-bottom: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="width: 60px; height: 60px; margin: 0 auto 15px; border: 2px dashed #60a5fa; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <div style="width: 24px; height: 24px; background: #60a5fa; border-radius: 50%; animation: pulse 2s infinite;"></div>
              </div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">
                <span style="color: #60a5fa;">LEAFNODE</span>
              </h1>
              <p style="margin: 5px 0 0; font-size: 12px; color: #94a3b8;">Signal Detected</p>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #60a5fa;">
            <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px;">New Contact Transmission</h2>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #475569;">Name:</strong> ${name}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #475569;">Email:</strong> 
              <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #475569;">Message:</strong>
              <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 8px; border: 1px solid #e2e8f0;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              Received: ${new Date().toLocaleString('en-GB', { 
                timeZone: 'Europe/London',
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} GMT
            </div>
          </div>
        </div>
      `,
    });

    // Send confirmation email to the user
    const confirmationEmail = await resend.emails.send({
      from: "LEAFNODE <connect@leafnode.co.uk>",
      to: [email],
      subject: "Signal Received - LEAFNODE Contact Confirmation",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 12px; color: white; text-align: center; margin-bottom: 20px;">
            <div style="width: 60px; height: 60px; margin: 0 auto 15px; border: 2px dashed #60a5fa; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <div style="width: 24px; height: 24px; background: #60a5fa; border-radius: 50%;"></div>
            </div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">
              <span style="color: #60a5fa;">LEAFNODE</span>
            </h1>
            <p style="margin: 5px 0 0; font-size: 12px; color: #94a3b8;">for the future-literate</p>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 8px;">
            <h2 style="margin: 0 0 15px; color: #1e293b; font-size: 20px;">Signal Acknowledged</h2>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 15px;">
              Hello ${name},
            </p>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 15px;">
              Your transmission has been received and logged in our consciousness network. 
              We appreciate you reaching out and will respond to your signal soon.
            </p>
            
            <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #60a5fa;">
              <p style="margin: 0; color: #475569; font-size: 14px;">
                <strong>Your Message:</strong><br>
                ${message.replace(/\n/g, '<br>')}
              </p>
            </div>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
              While you wait, feel free to explore the narrative threads of consciousness at 
              <a href="https://leafnode.co.uk" style="color: #2563eb; text-decoration: none;">leafnode.co.uk</a>
            </p>
            
            <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 12px; color: #64748b;">
                <div style="width: 8px; height: 8px; background: #60a5fa; border-radius: 50%;"></div>
                <span>Neural pathways: Active</span>
                <div style="width: 4px; height: 4px; background: #94a3b8; border-radius: 50%;"></div>
                <span>Frequency: 432 Hz</span>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Emails sent successfully:", { notificationEmail, confirmationEmail });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Contact form submitted successfully" 
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in contact-form function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unexpected error occurred" 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
