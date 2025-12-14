
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

// Validation function
const validateContactForm = (data: ContactFormRequest): { valid: boolean; error?: string } => {
  if (!data.name || typeof data.name !== 'string') {
    return { valid: false, error: "Name is required" };
  }
  if (data.name.trim().length === 0) {
    return { valid: false, error: "Name cannot be empty" };
  }
  if (data.name.length > 100) {
    return { valid: false, error: "Name must be less than 100 characters" };
  }
  
  if (!data.email || typeof data.email !== 'string') {
    return { valid: false, error: "Email is required" };
  }
  if (data.email.trim().length === 0) {
    return { valid: false, error: "Email cannot be empty" };
  }
  if (data.email.length > 255) {
    return { valid: false, error: "Email must be less than 255 characters" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { valid: false, error: "Invalid email address" };
  }
  
  if (!data.message || typeof data.message !== 'string') {
    return { valid: false, error: "Message is required" };
  }
  if (data.message.trim().length === 0) {
    return { valid: false, error: "Message cannot be empty" };
  }
  if (data.message.length > 2000) {
    return { valid: false, error: "Message must be less than 2000 characters" };
  }
  
  return { valid: true };
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData: ContactFormRequest = await req.json();

    // Validate form data
    const validation = validateContactForm(formData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json", 
            ...corsHeaders 
          },
        }
      );
    }

    // Sanitize inputs
    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const message = formData.message.trim();

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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://leafnode.co.uk/leafnode-email-logo.png" alt="Leafnode" style="width: 80px; height: auto; border-radius: 12px;" />
          </div>
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 12px; color: white; margin-bottom: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">
                <span style="color: #22d3ee;">LEAFNODE</span>
              </h1>
              <p style="margin: 5px 0 0; font-size: 12px; color: #94a3b8;">Signal Detected</p>
            </div>
          </div>
          
          <div style="background: #1e293b; padding: 25px; border-radius: 8px; border-left: 4px solid #22d3ee;">
            <h2 style="margin: 0 0 20px; color: #e2e8f0; font-size: 20px;">New Contact Transmission</h2>
            
            <div style="margin-bottom: 15px; color: #cbd5e1;">
              <strong style="color: #94a3b8;">Name:</strong> ${name}
            </div>
            
            <div style="margin-bottom: 15px; color: #cbd5e1;">
              <strong style="color: #94a3b8;">Email:</strong> 
              <a href="mailto:${email}" style="color: #22d3ee; text-decoration: none;">${email}</a>
            </div>
            
            <div style="margin-bottom: 15px; color: #cbd5e1;">
              <strong style="color: #94a3b8;">Message:</strong>
              <div style="background: #0f172a; padding: 15px; border-radius: 6px; margin-top: 8px; border: 1px solid rgba(34, 211, 238, 0.2); color: #cbd5e1;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(100, 116, 139, 0.3); font-size: 12px; color: #64748b;">
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
          
          <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 13px;">
            <a href="https://leafnode.co.uk" style="color: #22d3ee; text-decoration: none;">leafnode.co.uk</a>
            <span style="margin: 0 8px;">·</span>
            <a href="https://www.instagram.com/leafnode.scifi" style="color: #22d3ee; text-decoration: none;">
              <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;" />
              @leafnode.scifi
            </a>
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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://leafnode.co.uk/leafnode-email-logo.png" alt="Leafnode" style="width: 80px; height: auto; border-radius: 12px;" />
          </div>
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 12px; color: white; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">
              <span style="color: #22d3ee;">LEAFNODE</span>
            </h1>
            <p style="margin: 5px 0 0; font-size: 12px; color: #94a3b8;">for the future-literate</p>
          </div>
          
          <div style="background: #1e293b; padding: 25px; border-radius: 8px;">
            <h2 style="margin: 0 0 15px; color: #e2e8f0; font-size: 20px;">Signal Acknowledged</h2>
            
            <p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 15px;">
              Hello ${name},
            </p>
            
            <p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 15px;">
              Your transmission has been received and logged in our consciousness network. 
              We appreciate you reaching out and will respond to your signal soon.
            </p>
            
            <div style="background: #0f172a; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #22d3ee;">
              <p style="margin: 0; color: #cbd5e1; font-size: 14px;">
                <strong style="color: #94a3b8;">Your Message:</strong><br>
                ${message.replace(/\n/g, '<br>')}
              </p>
            </div>
            
            <p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 20px;">
              While you wait, feel free to explore the narrative threads of consciousness at 
              <a href="https://leafnode.co.uk" style="color: #22d3ee; text-decoration: none;">leafnode.co.uk</a>
            </p>
            
            <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(100, 116, 139, 0.3);">
              <div style="font-size: 12px; color: #64748b;">
                <span style="display: inline-block; width: 8px; height: 8px; background: #22d3ee; border-radius: 50%; vertical-align: middle; margin-right: 6px;"></span>
                <span>Neural pathways: Active</span>
                <span style="margin: 0 8px;">·</span>
                <span>Frequency: 432 Hz</span>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 13px;">
            <a href="https://leafnode.co.uk" style="color: #22d3ee; text-decoration: none;">leafnode.co.uk</a>
            <span style="margin: 0 8px;">·</span>
            <a href="https://www.instagram.com/leafnode.scifi" style="color: #22d3ee; text-decoration: none;">
              <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;" />
              @leafnode.scifi
            </a>
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
