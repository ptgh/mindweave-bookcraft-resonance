
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message, timestamp }: ContactEmailRequest = await req.json();

    // Send notification to LEAFNODE team
    const notificationResponse = await resend.emails.send({
      from: "LEAFNODE Contact <noreply@leafnode.co.uk>",
      to: ["connect@leafnode.co.uk"],
      subject: `New Contact: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #334155;">New Contact Form Submission</h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
          </div>
          <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="color: #334155; margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      `,
    });

    // Send confirmation to user
    const confirmationResponse = await resend.emails.send({
      from: "LEAFNODE <connect@leafnode.co.uk>",
      to: [email],
      subject: "Signal Received - LEAFNODE",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #cbd5e1; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #22d3ee; margin: 0; font-weight: 300; letter-spacing: 2px;">LEAFNODE</h1>
            <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">for the future-literate</p>
          </div>
          
          <div style="background: rgba(30, 41, 59, 0.5); padding: 30px; border-radius: 8px; border: 1px solid #334155;">
            <h2 style="color: #e2e8f0; margin-top: 0;">Signal Received</h2>
            <p>Hello ${name},</p>
            <p>Your transmission has been received by our consciousness network. We'll process your signal and respond to your frequency soon.</p>
            
            <div style="background: rgba(15, 23, 42, 0.8); padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 3px solid #22d3ee;">
              <p style="margin: 0; font-size: 14px; color: #94a3b8;"><strong>Subject:</strong> ${subject}</p>
            </div>
            
            <p style="margin-bottom: 0;">Thank you for connecting with LEAFNODE.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 12px; color: #64748b;">
              LEAFNODE • Mindweave Bookcraft Resonance<br>
              <a href="https://www.leafnode.co.uk" style="color: #22d3ee;">www.leafnode.co.uk</a>
            </p>
          </div>
        </div>
      `,
    });

    console.log("Contact emails sent:", { notificationResponse, confirmationResponse });

    return new Response(JSON.stringify({ 
      success: true,
      notificationId: notificationResponse.data?.id,
      confirmationId: confirmationResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
