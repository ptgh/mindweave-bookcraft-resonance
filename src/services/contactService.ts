
import { supabase } from "@/integrations/supabase/client";

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const sendContactMessage = async (data: ContactFormData) => {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-contact-email', {
      body: {
        ...data,
        timestamp: new Date().toISOString(),
      }
    });

    if (error) {
      throw error;
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error sending contact message:', error);
    return { success: false, error: error.message };
  }
};

export const subscribeToNewsletter = async (email: string) => {
  try {
    const { data: result, error } = await supabase.functions.invoke('newsletter-signup', {
      body: {
        email,
        timestamp: new Date().toISOString(),
      }
    });

    if (error) {
      throw error;
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error subscribing to newsletter:', error);
    return { success: false, error: error.message };
  }
};
