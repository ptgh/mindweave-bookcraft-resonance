import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Img,
} from 'npm:@react-email/components@0.0.22'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Curated book recommendations for engagement
const FEATURED_BOOKS = [
  {
    id: 'dune-herbert',
    title: 'Dune',
    author: 'Frank Herbert',
    description: 'The cornerstone of modern science fiction - a tale of politics, religion, and ecology on the desert planet Arrakis.',
    addUrl: 'https://leafnode.co.uk',
  },
  {
    id: 'neuromancer-gibson',
    title: 'Neuromancer',
    author: 'William Gibson',
    description: 'The cyberpunk classic that defined a genre - hack into the matrix with console cowboy Case.',
    addUrl: 'https://leafnode.co.uk',
  },
  {
    id: 'left-hand-darkness',
    title: 'The Left Hand of Darkness',
    author: 'Ursula K. Le Guin',
    description: 'A groundbreaking exploration of gender and society on the frozen world of Gethen.',
    addUrl: 'https://leafnode.co.uk',
  },
  {
    id: 'hyperion-simmons',
    title: 'Hyperion',
    author: 'Dan Simmons',
    description: 'Seven pilgrims journey to meet the Shrike in this Canterbury Tales-inspired space opera.',
    addUrl: 'https://leafnode.co.uk',
  },
]

// Email styles matching Leafnode design
const emailStyles = {
  main: {
    backgroundColor: '#0f172a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  },
  container: {
    margin: '0 auto',
    padding: '20px 0 48px',
    width: '580px',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  logo: {
    margin: '0 auto',
    borderRadius: '12px',
  },
  h1: {
    color: '#22d3ee',
    fontSize: '28px',
    fontWeight: '300',
    margin: '0 0 24px',
    textAlign: 'center' as const,
    letterSpacing: '0.5px',
  },
  h2: {
    color: '#22d3ee',
    fontSize: '22px',
    fontWeight: '400',
    margin: '32px 0 16px',
    textAlign: 'center' as const,
    letterSpacing: '0.3px',
  },
  text: {
    color: '#cbd5e1',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '16px 0',
  },
  bookCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid rgba(34, 211, 238, 0.1)',
    borderRadius: '8px',
    padding: '16px',
    margin: '12px 0',
  },
  bookTitle: {
    color: '#e2e8f0',
    fontSize: '16px',
    fontWeight: '600',
    margin: '8px 0 4px',
  },
  bookAuthor: {
    color: '#94a3b8',
    fontSize: '14px',
    margin: '0 0 8px',
  },
  bookDescription: {
    color: '#cbd5e1',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0',
  },
  button: {
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderRadius: '6px',
    border: '1px solid rgba(34, 211, 238, 0.25)',
    color: '#22d3ee',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '500',
    padding: '12px 32px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    letterSpacing: '0.3px',
    marginTop: '24px',
  },
  footer: {
    color: '#64748b',
    fontSize: '13px',
    lineHeight: '22px',
    margin: '32px 0 16px',
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting engagement email send...')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all confirmed users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      throw usersError
    }

    // Filter to confirmed emails only
    const confirmedEmails = users.users
      .filter(user => user.email_confirmed_at)
      .map(user => user.email)

    console.log(`Sending to ${confirmedEmails.length} confirmed users:`, confirmedEmails)

    let successCount = 0
    let errorCount = 0

    // Send engagement email to each user
    for (const email of confirmedEmails) {
      try {
        const emailComponent = React.createElement(Html, {},
          React.createElement(Head),
          React.createElement(Preview, {}, 'New sci-fi discoveries await on Leafnode'),
          React.createElement(Body, { style: emailStyles.main },
            React.createElement(Container, { style: emailStyles.container },
              React.createElement(Section, { style: emailStyles.header },
                React.createElement(Img, {
                  src: 'https://leafnode.co.uk/leafnode-email-logo.png',
                  width: '80',
                  alt: 'Leafnode',
                  style: emailStyles.logo,
                })
              ),
              React.createElement(Heading, { style: emailStyles.h1 }, '◉ Your Reading Transmission'),
              React.createElement(Text, { style: emailStyles.text }, 
                'We\'ve curated fresh sci-fi recommendations just for you. Expand your neural network with these essential reads:'
              ),
              React.createElement(Section, {},
                React.createElement(Heading, { style: emailStyles.h2 }, 'Featured This Week'),
                ...FEATURED_BOOKS.map(book =>
                  React.createElement(Section, { key: book.id, style: emailStyles.bookCard },
                    React.createElement(Text, { style: emailStyles.bookTitle }, book.title),
                    React.createElement(Text, { style: emailStyles.bookAuthor }, `by ${book.author}`),
                    React.createElement(Text, { style: emailStyles.bookDescription }, book.description)
                  )
                )
              ),
              React.createElement(Section, { style: { textAlign: 'center' as const } },
                React.createElement(Link, {
                  href: 'https://leafnode.co.uk',
                  style: emailStyles.button,
                }, 'Explore Your Library')
              ),
              React.createElement(Text, { style: emailStyles.footer },
                'Keep your signal strong. Stay future-literate.'
              ),
              React.createElement(Section, { style: { textAlign: 'center' as const, marginTop: '24px' } },
                React.createElement(Link, { 
                  href: 'https://leafnode.co.uk', 
                  style: { color: '#22d3ee', textDecoration: 'none', fontSize: '13px' } 
                }, 'leafnode.co.uk'),
                React.createElement(Text, { style: { display: 'inline', color: '#475569', margin: '0 8px' } }, ' · '),
                React.createElement(Link, { 
                  href: 'https://www.instagram.com/leafnode.scifi', 
                  style: { color: '#22d3ee', textDecoration: 'none', fontSize: '13px' } 
                }, 
                  React.createElement(Img, {
                    src: 'https://cdn-icons-png.flaticon.com/512/174/174855.png',
                    width: '14',
                    height: '14',
                    alt: 'Instagram',
                    style: { verticalAlign: 'middle', marginRight: '4px' }
                  }),
                  '@leafnode.scifi'
                )
              ),
              React.createElement(Text, { style: { ...emailStyles.text, textAlign: 'center' as const, marginTop: '16px' } },
                React.createElement(Link, { 
                  href: 'mailto:connect@leafnode.co.uk', 
                  style: { color: '#22d3ee', textDecoration: 'none' } 
                }, 'connect@leafnode.co.uk')
              )
            )
          )
        )

        const html = await renderAsync(emailComponent)

        const { error: emailError } = await resend.emails.send({
          from: 'Leafnode <connect@leafnode.co.uk>',
          to: [email],
          subject: 'New sci-fi discoveries on Leafnode',
          html,
        })

        if (emailError) {
          console.error(`Error sending to ${email}:`, emailError)
          errorCount++
        } else {
          console.log(`✓ Sent to ${email}`)
          successCount++
        }

        // Small delay between emails
        await new Promise(resolve => setTimeout(resolve, 300))

      } catch (error) {
        console.error(`Error processing ${email}:`, error)
        errorCount++
      }
    }

    console.log(`Engagement email send complete: ${successCount} sent, ${errorCount} failed`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount,
        failed: errorCount,
        recipients: confirmedEmails
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    )

  } catch (error) {
    console.error('Error in send-engagement-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    )
  }
})
