
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
      from: "Leafnode Contact <connect@leafnode.co.uk>",
      to: ["connect@leafnode.co.uk"],
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <!DOCTYPE html>
        <html style="height: 100%; background-color: #0f172a;">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; height: 100%; min-height: 100%; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table role="presentation" width="100%" height="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; min-height: 100%;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                  
                  <!-- Logo -->
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <img src="https://leafnode.co.uk/leafnode-email-logo.png" alt="Leafnode" width="80" style="width: 80px; height: auto; border-radius: 12px;" />
                    </td>
                  </tr>
                  
                  <!-- Heading -->
                  <tr>
                    <td style="padding-bottom: 24px;">
                      <h1 style="color: #22d3ee; font-size: 28px; font-weight: 700; line-height: 1.3; margin: 0; letter-spacing: -0.5px;">New Contact Transmission</h1>
                    </td>
                  </tr>
                  
                  <!-- Intro text -->
                  <tr>
                    <td style="padding-bottom: 24px;">
                      <p style="color: #cbd5e1; font-size: 16px; line-height: 26px; margin: 0;">A new signal has been detected from the network.</p>
                    </td>
                  </tr>
                  
                  <!-- Contact details box -->
                  <tr>
                    <td style="padding: 24px; background-color: rgba(15, 23, 42, 0.5); border-radius: 12px; border: 1px solid rgba(100, 116, 139, 0.2);">
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
                      <p style="color: #cbd5e1; font-size: 14px; line-height: 20px; margin: 0; padding: 12px; background-color: rgba(6, 182, 212, 0.05); border-radius: 6px; border: 1px solid rgba(6, 182, 212, 0.15);">
                        ${message.replace(/\n/g, '<br>')}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Timestamp -->
                  <tr>
                    <td align="center" style="padding-top: 32px;">
                      <p style="color: #64748b; font-size: 13px; line-height: 22px; margin: 0; font-style: italic;">
                        Received: ${new Date().toLocaleString('en-GB', { 
                          timeZone: 'Europe/London',
                          day: '2-digit',
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} GMT
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Social links -->
                  <tr>
                    <td style="padding-top: 24px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 400px; margin: 0 auto;">
                        <tr>
                          <td align="center" width="50%" style="padding: 0 40px;">
                            <a href="https://leafnode.co.uk" style="color: #22d3ee; font-size: 13px; text-decoration: none;">leafnode.co.uk</a>
                          </td>
                          <td align="center" width="50%" style="padding: 0 40px;">
                            <a href="https://www.instagram.com/leafnode.scifi" style="color: #22d3ee; font-size: 13px; text-decoration: none;">
                              <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" width="14" height="14" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 6px;" />@leafnode.scifi
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
            <!-- Bottom spacer to fill email client viewport -->
            <tr>
              <td style="height: 300px; background-color: #0f172a;">&nbsp;</td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    // Send confirmation email to the user
    const confirmationEmail = await resend.emails.send({
      from: "Leafnode <connect@leafnode.co.uk>",
      to: [email],
      subject: "Signal Received - Leafnode Contact Confirmation",
      html: `
        <!DOCTYPE html>
        <html style="height: 100%; background-color: #0f172a;">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; height: 100%; min-height: 100%; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table role="presentation" width="100%" height="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; min-height: 100%;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                  
                  <!-- Logo -->
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <img src="https://leafnode.co.uk/leafnode-email-logo.png" alt="Leafnode" width="80" style="width: 80px; height: auto; border-radius: 12px;" />
                    </td>
                  </tr>
                  
                  <!-- Heading -->
                  <tr>
                    <td style="padding-bottom: 24px;">
                      <h1 style="color: #22d3ee; font-size: 28px; font-weight: 700; line-height: 1.3; margin: 0; letter-spacing: -0.5px;">Signal Acknowledged</h1>
                    </td>
                  </tr>
                  
                  <!-- Intro text -->
                  <tr>
                    <td style="padding-bottom: 24px;">
                      <p style="color: #cbd5e1; font-size: 16px; line-height: 26px; margin: 0;">
                        Hello ${name}, your transmission has been received and logged in our consciousness network. 
                        We appreciate you reaching out and will respond to your signal soon.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Message box -->
                  <tr>
                    <td style="padding: 24px; background-color: rgba(15, 23, 42, 0.5); border-radius: 12px; border: 1px solid rgba(100, 116, 139, 0.2);">
                      <p style="color: #94a3b8; font-size: 14px; margin: 0 0 12px;">
                        <strong style="color: #f1f5f9;">Your Message:</strong>
                      </p>
                      <p style="color: #cbd5e1; font-size: 14px; line-height: 20px; margin: 0;">
                        ${message.replace(/\n/g, '<br>')}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- CTA section -->
                  <tr>
                    <td align="center" style="padding: 32px 24px; margin-top: 20px; background-color: rgba(6, 182, 212, 0.05); border-radius: 8px; border: 1px solid rgba(6, 182, 212, 0.15);">
                      <p style="color: #cbd5e1; font-size: 15px; line-height: 24px; margin: 0 0 16px;">
                        While you wait, explore the narrative threads of consciousness
                      </p>
                      <a href="https://leafnode.co.uk" style="background-color: rgba(6, 182, 212, 0.15); border-radius: 6px; color: #22d3ee; font-size: 14px; font-weight: 500; text-decoration: none; display: inline-block; padding: 10px 28px; border: 1px solid rgba(6, 182, 212, 0.3); letter-spacing: 0.3px;">
                        Explore Leafnode
                      </a>
                    </td>
                  </tr>
                  
                  <!-- Footer text -->
                  <tr>
                    <td align="center" style="padding-top: 32px;">
                      <p style="color: #64748b; font-size: 13px; line-height: 22px; margin: 0; font-style: italic;">
                        Keep your signal strong. Stay future-literate.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Contact -->
                  <tr>
                    <td align="center" style="padding-top: 16px;">
                      <p style="color: #94a3b8; font-size: 13px; line-height: 22px; margin: 0;">
                        Questions? Reach us at 
                        <a href="mailto:connect@leafnode.co.uk" style="color: #22d3ee; text-decoration: none;">connect@leafnode.co.uk</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Social links -->
                  <tr>
                    <td style="padding-top: 24px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 400px; margin: 0 auto;">
                        <tr>
                          <td align="center" width="50%" style="padding: 0 40px;">
                            <a href="https://leafnode.co.uk" style="color: #22d3ee; font-size: 13px; text-decoration: none;">leafnode.co.uk</a>
                          </td>
                          <td align="center" width="50%" style="padding: 0 40px;">
                            <a href="https://www.instagram.com/leafnode.scifi" style="color: #22d3ee; font-size: 13px; text-decoration: none;">
                              <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" width="14" height="14" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 6px;" />@leafnode.scifi
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
            <!-- Bottom spacer to fill email client viewport -->
            <tr>
              <td style="height: 200px; background-color: #0f172a;">&nbsp;</td>
            </tr>
          </table>
        </body>
        </html>
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
