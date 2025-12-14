
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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0f172a;">
          <div style="text-align: center; margin-bottom: 32px;">
            <img src="https://leafnode.co.uk/leafnode-email-logo.png" alt="Leafnode" style="width: 80px; height: auto; border-radius: 12px;" />
          </div>
          
          <h1 style="color: #22d3ee; font-size: 28px; font-weight: 700; line-height: 1.3; margin: 0 0 24px; letter-spacing: -0.5px;">
            New Contact Transmission
          </h1>
          
          <p style="color: #cbd5e1; font-size: 16px; line-height: 26px; margin: 0 0 24px;">
            A new signal has been detected from the network.
          </p>
          
          <div style="background: rgba(15, 23, 42, 0.5); border-radius: 12px; padding: 24px; margin: 20px 0; border: 1px solid rgba(100, 116, 139, 0.2);">
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 12px;">
              <strong style="color: #f1f5f9;">Name:</strong> ${name}
            </p>
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 12px;">
              <strong style="color: #f1f5f9;">Email:</strong> 
              <a href="mailto:${email}" style="color: #22d3ee; text-decoration: none;">${email}</a>
            </p>
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 12px;">
              <strong style="color: #f1f5f9;">Message:</strong>
            </p>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 20px; margin: 0; padding: 12px; background: rgba(6, 182, 212, 0.05); border-radius: 6px; border: 1px solid rgba(6, 182, 212, 0.15);">
              ${message.replace(/\n/g, '<br>')}
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 13px; line-height: 22px; margin-top: 32px; font-style: italic; text-align: center;">
            Received: ${new Date().toLocaleString('en-GB', { 
              timeZone: 'Europe/London',
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })} GMT
          </p>
          
          <table style="width: 100%; max-width: 400px; margin: 24px auto 16px;">
            <tr>
              <td style="text-align: center; padding: 0 40px; width: 50%;">
                <a href="https://leafnode.co.uk" style="color: #22d3ee; font-size: 13px; text-decoration: none;">leafnode.co.uk</a>
              </td>
              <td style="text-align: center; padding: 0 40px; width: 50%;">
                <a href="https://www.instagram.com/leafnode.scifi" style="color: #22d3ee; font-size: 13px; text-decoration: none;">
                  <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 6px;" />@leafnode.scifi
                </a>
              </td>
            </tr>
          </table>
        </div>
      `,
    });

    // Send confirmation email to the user
    const confirmationEmail = await resend.emails.send({
      from: "LEAFNODE <connect@leafnode.co.uk>",
      to: [email],
      subject: "Signal Received - LEAFNODE Contact Confirmation",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0f172a;">
          <div style="text-align: center; margin-bottom: 32px;">
            <img src="https://leafnode.co.uk/leafnode-email-logo.png" alt="Leafnode" style="width: 80px; height: auto; border-radius: 12px;" />
          </div>
          
          <h1 style="color: #22d3ee; font-size: 28px; font-weight: 700; line-height: 1.3; margin: 0 0 24px; letter-spacing: -0.5px;">
            Signal Acknowledged
          </h1>
          
          <p style="color: #cbd5e1; font-size: 16px; line-height: 26px; margin: 0 0 24px;">
            Hello ${name}, your transmission has been received and logged in our consciousness network. 
            We appreciate you reaching out and will respond to your signal soon.
          </p>
          
          <div style="background: rgba(15, 23, 42, 0.5); border-radius: 12px; padding: 24px; margin: 20px 0; border: 1px solid rgba(100, 116, 139, 0.2);">
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 12px;">
              <strong style="color: #f1f5f9;">Your Message:</strong>
            </p>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 20px; margin: 0;">
              ${message.replace(/\n/g, '<br>')}
            </p>
          </div>
          
          <div style="background: rgba(6, 182, 212, 0.05); border-radius: 8px; padding: 24px; margin: 32px 0; border: 1px solid rgba(6, 182, 212, 0.15); text-align: center;">
            <p style="color: #cbd5e1; font-size: 15px; line-height: 24px; margin: 0 0 16px;">
              While you wait, explore the narrative threads of consciousness
            </p>
            <a href="https://leafnode.co.uk" style="background: rgba(6, 182, 212, 0.15); border-radius: 6px; color: #22d3ee; font-size: 14px; font-weight: 500; text-decoration: none; text-align: center; display: inline-block; padding: 10px 28px; border: 1px solid rgba(6, 182, 212, 0.3); letter-spacing: 0.3px;">
              Explore Leafnode
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 13px; line-height: 22px; margin-top: 32px; font-style: italic; text-align: center;">
            Keep your signal strong. Stay future-literate.
          </p>
          
          <p style="color: #94a3b8; font-size: 13px; line-height: 22px; margin-top: 16px; text-align: center;">
            Questions? Reach us at 
            <a href="mailto:connect@leafnode.co.uk" style="color: #22d3ee; text-decoration: none;">connect@leafnode.co.uk</a>
          </p>
          
          <table style="width: 100%; max-width: 400px; margin: 24px auto 16px;">
            <tr>
              <td style="text-align: center; padding: 0 40px; width: 50%;">
                <a href="https://leafnode.co.uk" style="color: #22d3ee; font-size: 13px; text-decoration: none;">leafnode.co.uk</a>
              </td>
              <td style="text-align: center; padding: 0 40px; width: 50%;">
                <a href="https://www.instagram.com/leafnode.scifi" style="color: #22d3ee; font-size: 13px; text-decoration: none;">
                  <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 6px;" />@leafnode.scifi
                </a>
              </td>
            </tr>
          </table>
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
