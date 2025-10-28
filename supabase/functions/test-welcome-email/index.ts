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

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Test books for the email
const handPickedBooks = [
  {
    id: 'dune-herbert',
    title: 'Dune',
    author: 'Frank Herbert',
    cover_url: 'https://books.google.com/books/content?id=B1hSG45JCX4C&printsec=frontcover&img=1&zoom=0&source=gbs_api',
    preview_link: 'https://leafnode.co.uk',
  },
  {
    id: 'neuromancer-gibson',
    title: 'Neuromancer',
    author: 'William Gibson',
    cover_url: 'https://books.google.com/books/content?id=NL0dswEACAAJ&printsec=frontcover&img=1&zoom=0&source=gbs_api',
    preview_link: 'https://leafnode.co.uk',
  },
  {
    id: 'foundation-asimov',
    title: 'Foundation',
    author: 'Isaac Asimov',
    cover_url: 'https://books.google.com/books/content?id=WwtGDwAAQBAJ&printsec=frontcover&img=1&zoom=0&source=gbs_api',
    preview_link: 'https://leafnode.co.uk',
  },
  {
    id: 'left-hand-darkness',
    title: 'The Left Hand of Darkness',
    author: 'Ursula K. Le Guin',
    cover_url: 'https://books.google.com/books/content?id=yPNhDwAAQBAJ&printsec=frontcover&img=1&zoom=0&source=gbs_api',
    preview_link: 'https://leafnode.co.uk',
  },
  {
    id: 'hyperion-simmons',
    title: 'Hyperion',
    author: 'Dan Simmons',
    cover_url: 'https://books.google.com/books/content?id=WYNZDwAAQBAJ&printsec=frontcover&img=1&zoom=0&source=gbs_api',
    preview_link: 'https://leafnode.co.uk',
  }
]

// Inline email template styles
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
    color: '#06b6d4',
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
  confirmSection: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  confirmButton: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderRadius: '6px',
    border: '1px solid rgba(6, 182, 212, 0.25)',
    color: '#22d3ee',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '500',
    padding: '12px 32px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    letterSpacing: '0.3px',
  },
  booksSection: {
    margin: '32px 0',
  },
  bookCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid rgba(100, 116, 139, 0.2)',
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
    margin: '0',
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      )
    }

    console.log('Sending test welcome email to:', email)

    // Create the email component
    const emailComponent = React.createElement(Html, {},
      React.createElement(Head),
      React.createElement(Preview, {}, 'Welcome to Leafnode - Your curated sci-fi collection awaits'),
      React.createElement(Body, { style: emailStyles.main },
        React.createElement(Container, { style: emailStyles.container },
          React.createElement(Section, { style: emailStyles.header },
            React.createElement(Img, {
              src: 'https://mmnfjeukxandnhdaovzx.supabase.co/storage/v1/object/public/book-covers/leafnode-logo.png',
              width: '64',
              height: '64',
              alt: 'Leafnode',
              style: emailStyles.logo,
            })
          ),
          React.createElement(Heading, { style: emailStyles.h1 }, `◉ Welcome to Leafnode`),
          React.createElement(Text, { style: emailStyles.text }, 
            'Your transmission coordinates have been locked in. You\'re now part of the neural network.'
          ),
          React.createElement(Section, { style: emailStyles.confirmSection },
            React.createElement(Text, { style: emailStyles.text }, 'Confirm your account to access your curated collection:'),
            React.createElement(Link, {
              href: 'https://leafnode.co.uk',
              target: '_blank',
              style: emailStyles.confirmButton,
            }, 'Activate Your Account')
          ),
          React.createElement(Section, { style: emailStyles.booksSection },
            React.createElement(Heading, { style: emailStyles.h2 }, 'Your Curated Starter Collection'),
            React.createElement(Text, { style: emailStyles.text },
              'We\'ve handpicked these essential sci-fi titles to start your journey. They\'ve been added to your personal library:'
            ),
            ...handPickedBooks.map(book =>
              React.createElement(Section, { key: book.id, style: emailStyles.bookCard },
                React.createElement(Text, { style: emailStyles.bookTitle }, book.title),
                React.createElement(Text, { style: emailStyles.bookAuthor }, `by ${book.author}`)
              )
            )
          ),
          React.createElement(Text, { style: emailStyles.footer },
            'Keep your signal strong. Stay future-literate.'
          ),
          React.createElement(Text, { style: emailStyles.text },
            React.createElement(Link, { href: 'mailto:connect@leafnode.co.uk', style: { color: '#22d3ee' } }, 'connect@leafnode.co.uk')
          )
        )
      )
    )

    // Render the email
    const html = await renderAsync(emailComponent)

    // Send the email
    const { error: emailError } = await resend.emails.send({
      from: 'Leafnode <connect@leafnode.co.uk>',
      to: [email],
      subject: 'TEST: Welcome to Leafnode - Your curated collection',
      html,
    })

    if (emailError) {
      console.error('Error sending email:', emailError)
      throw emailError
    }

    console.log('Test email sent successfully to:', email)

    return new Response(
      JSON.stringify({ success: true, message: `Test email sent to ${email}` }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    )

  } catch (error) {
    console.error('Error in test-welcome-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    )
  }
})
