import { z } from 'zod';

// Transmission validation schema
export const transmissionSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(500, 'Title too long'),
  author: z.string().trim().min(1, 'Author is required').max(200, 'Author name too long'),
  isbn: z.string().trim().max(20, 'ISBN too long').optional().nullable(),
  publication_year: z.number().int().min(1000).max(new Date().getFullYear() + 5).optional().nullable(),
  tags: z.string().max(1000, 'Tags too long').optional().nullable(),
  notes: z.string().max(5000, 'Notes too long').optional().nullable(),
  resonance_labels: z.string().max(500, 'Resonance labels too long').optional().nullable(),
  cover_url: z.string().url('Invalid cover URL').max(2048, 'URL too long').optional().nullable(),
  apple_link: z.string().url('Invalid Apple link').max(2048, 'URL too long').optional().nullable(),
  thematic_constellation: z.string().max(100, 'Thematic constellation too long').optional().nullable(),
  historical_context_tags: z.array(z.string().max(100)).max(20, 'Too many tags').optional().nullable(),
  narrative_time_period: z.string().max(100, 'Time period too long').optional().nullable(),
});

export type TransmissionInput = z.infer<typeof transmissionSchema>;

// Contact form validation schema
export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email too long'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000, 'Message too long'),
});

export type ContactInput = z.infer<typeof contactSchema>;

// Profile validation schema
export const profileSchema = z.object({
  display_name: z.string().trim().max(100, 'Display name too long').optional().nullable(),
  first_name: z.string().trim().max(100, 'First name too long').optional().nullable(),
  last_name: z.string().trim().max(100, 'Last name too long').optional().nullable(),
  bio: z.string().trim().max(1000, 'Bio too long').optional().nullable(),
  avatar_url: z.string().url('Invalid avatar URL').max(2048, 'URL too long').optional().nullable(),
  theme_preference: z.enum(['light', 'dark', 'system']).optional().nullable(),
  language: z.string().length(2, 'Invalid language code').optional().nullable(),
  timezone: z.string().max(50, 'Timezone too long').optional().nullable(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

// Reading session validation schema
export const readingSessionSchema = z.object({
  book_title: z.string().trim().min(1, 'Book title is required').max(500, 'Title too long'),
  book_author: z.string().trim().min(1, 'Author is required').max(200, 'Author name too long'),
  session_start: z.date().optional(),
  session_end: z.date().optional(),
  pages_read: z.number().int().min(0, 'Pages must be positive').max(10000, 'Pages too high').optional().nullable(),
  mood_rating: z.number().int().min(1, 'Rating must be 1-5').max(5, 'Rating must be 1-5').optional().nullable(),
  notes: z.string().max(2000, 'Notes too long').optional().nullable(),
});

export type ReadingSessionInput = z.infer<typeof readingSessionSchema>;

// Collection validation schema
export const collectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().trim().max(500, 'Description too long').optional().nullable(),
  is_public: z.boolean().default(false),
  cover_image_url: z.string().url('Invalid image URL').max(2048, 'URL too long').optional().nullable(),
});

export type CollectionInput = z.infer<typeof collectionSchema>;

// Sanitization utilities
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL');
  }
}

// Rate limiting utility (client-side)
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();
