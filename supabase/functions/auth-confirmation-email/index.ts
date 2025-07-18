import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { WelcomeEmail } from './_templates/welcome-email.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('AUTH_HOOK_SECRET') as string

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Hand-picked starter books for new users
const handPickedBooks = [
  {
    id: 'dune-herbert',
    title: 'Dune',
    author: 'Frank Herbert',
    cover_url: 'https://books.google.com/books/content?id=B1hSG45JCX4C&printsec=frontcover&img=1&zoom=0&source=gbs_api',
    preview_link: 'https://books.google.com/books?id=B1hSG45JCX4C&printsec=frontcover&dq=dune+frank+herbert&hl=en&sa=X&ved=0ahUKEwi...',
    isbn: '9780441013593',
    publication_year: 1965,
    tags: 'classic, space opera, politics',
    notes: 'A cornerstone of science fiction literature'
  },
  {
    id: 'neuromancer-gibson',
    title: 'Neuromancer',
    author: 'William Gibson',
    cover_url: 'https://books.google.com/books/content?id=NL0dswEACAAJ&printsec=frontcover&img=1&zoom=0&source=gbs_api',
    preview_link: 'https://books.google.com/books?id=NL0dswEACAAJ&dq=neuromancer+william+gibson&hl=en&sa=X&ved=0ahUKEwi...',
    isbn: '9780441569595',
    publication_year: 1984,
    tags: 'cyberpunk, ai, virtual reality',
    notes: 'The birth of cyberpunk'
  },
  {
    id: 'foundation-asimov',
    title: 'Foundation',
    author: 'Isaac Asimov',
    cover_url: 'https://books.google.com/books/content?id=WwtGDwAAQBAJ&printsec=frontcover&img=1&zoom=0&source=gbs_api',
    preview_link: 'https://books.google.com/books?id=WwtGDwAAQBAJ&printsec=frontcover&dq=foundation+isaac+asimov&hl=en&sa=X&ved=0ahUKEwi...',
    isbn: '9780553293357',
    publication_year: 1951,
    tags: 'space empire, psychohistory, classic',
    notes: 'The galactic empire series'
  },
  {
    id: 'left-hand-darkness',
    title: 'The Left Hand of Darkness',
    author: 'Ursula K. Le Guin',
    cover_url: 'https://books.google.com/books/content?id=yPNhDwAAQBAJ&printsec=frontcover&img=1&zoom=0&source=gbs_api',
    preview_link: 'https://books.google.com/books?id=yPNhDwAAQBAJ&printsec=frontcover&dq=left+hand+darkness+ursula&hl=en&sa=X&ved=0ahUKEwi...',
    isbn: '9780441478125',
    publication_year: 1969,
    tags: 'gender, society, alien worlds',
    notes: 'A masterpiece of social science fiction'
  },
  {
    id: 'hyperion-simmons',
    title: 'Hyperion',
    author: 'Dan Simmons',
    cover_url: 'https://books.google.com/books/content?id=WYNZDwAAQBAJ&printsec=frontcover&img=1&zoom=0&source=gbs_api',
    preview_link: 'https://books.google.com/books?id=WYNZDwAAQBAJ&printsec=frontcover&dq=hyperion+dan+simmons&hl=en&sa=X&ved=0ahUKEwi...',
    isbn: '9780553283686',
    publication_year: 1989,
    tags: 'space opera, pilgrimage, ai',
    notes: 'Canterbury Tales in space'
  }
]

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  
  console.log('Received auth webhook payload')

  try {
    const wh = new Webhook(hookSecret)
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        id: string
        email: string
        user_metadata?: {
          full_name?: string
          first_name?: string
        }
      }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
      }
    }

    console.log('Webhook verified for user:', user.email)

    // Only process signup confirmations
    if (email_action_type !== 'signup') {
      return new Response('Not a signup confirmation', { status: 200 })
    }

    // Get user name for personalization
    const userName = user.user_metadata?.full_name || 
                     user.user_metadata?.first_name || 
                     user.email.split('@')[0]

    // Add hand-picked books to user's transmissions
    console.log('Adding starter books to user library...')
    
    const booksToAdd = handPickedBooks.map(book => ({
      user_id: user.id,
      title: book.title,
      author: book.author,
      cover_url: book.cover_url,
      isbn: book.isbn,
      publication_year: book.publication_year,
      tags: book.tags,
      notes: book.notes,
      resonance_labels: 'starter collection'
    }))

    const { error: insertError } = await supabase
      .from('transmissions')
      .insert(booksToAdd)

    if (insertError) {
      console.error('Error adding books to user library:', insertError)
      // Continue with email even if book insertion fails
    } else {
      console.log('Successfully added starter books to user library')
    }

    // Render the custom email template
    const html = await renderAsync(
      React.createElement(WelcomeEmail, {
        supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
        token,
        token_hash,
        redirect_to,
        email_action_type,
        userName,
        handPickedBooks: handPickedBooks.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          cover_url: book.cover_url,
          preview_link: book.preview_link,
          info_link: book.preview_link
        }))
      })
    )

    // Send the custom email
    const { error: emailError } = await resend.emails.send({
      from: 'Leafnode <connect@leafnode.co.uk>',
      to: [user.email],
      subject: 'Welcome to Leafnode - Confirm your account & discover your curated collection',
      html,
    })

    if (emailError) {
      console.error('Error sending email:', emailError)
      throw emailError
    }

    console.log('Custom welcome email sent successfully to:', user.email)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in auth-confirmation-email function:', error)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})