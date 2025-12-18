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
import * as React from 'npm:react@18.3.1'

interface WelcomeEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  userName: string
  handPickedBooks: Array<{
    id: string
    title: string
    author: string
    cover_url: string
    preview_link?: string
    info_link?: string
  }>
}

export const WelcomeEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  userName,
  handPickedBooks,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Leafnode - Confirm your account and discover your curated sci-fi collection</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src="https://leafnode.co.uk/leafnode-email-logo.png"
            width="80"
            alt="Leafnode"
            style={logo}
          />
        </Section>
        
        <Heading style={h1}>Welcome to Leafnode, {userName}!</Heading>
        
        <Text style={text}>
          Thank you for joining our community of sci-fi explorers. We're excited to have you on this journey through the vast universe of science fiction literature.
        </Text>

        <Section style={confirmSection}>
          <Text style={text}>
            First, let's confirm your account:
          </Text>
          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            target="_blank"
            style={confirmButton}
          >
            Confirm Your Account
          </Link>
        </Section>

        <Section style={booksSection}>
          <Heading style={h2}>Your Curated Starter Collection</Heading>
          <Text style={text}>
            We've handpicked these exceptional sci-fi titles to get you started. They've been added to your personal library and are ready for you to explore:
          </Text>
          
          <Section style={booksGrid}>
            {handPickedBooks.map((book, index) => (
              <Section key={book.id} style={bookCard}>
                <Link
                  href={book.preview_link || book.info_link || '#'}
                  target="_blank"
                  style={bookLink}
                >
                  <Img
                    src={book.cover_url}
                    width="80"
                    height="120"
                    alt={book.title}
                    style={bookCover}
                  />
                  <Section style={bookInfo}>
                    <Text style={bookTitle}>{book.title}</Text>
                    <Text style={bookAuthor}>by {book.author}</Text>
                  </Section>
                </Link>
              </Section>
            ))}
          </Section>
        </Section>

        <Text style={text}>
          Once you've confirmed your account, you can dive into your collection, discover new transmissions, and connect with the vast network of sci-fi literature.
        </Text>

        <Text style={footer}>
          Welcome aboard,<br />
          The Leafnode Team
        </Text>

        <Section style={socialSection}>
          <Link href="https://leafnode.co.uk" target="_blank" style={socialLink}>
            leafnode.co.uk
          </Link>
          <Text style={socialDivider}> · </Text>
          <Link href="https://www.instagram.com/leafnode.scifi" target="_blank" style={socialLink}>
            <Img 
              src="https://cdn-icons-png.flaticon.com/512/174/174855.png" 
              alt="Instagram" 
              width="14"
              height="14"
              style={instagramIcon}
            />
            @leafnode.scifi
          </Link>
        </Section>
        
        <Text style={disclaimer}>
          If you didn't create an account with Leafnode, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

const main = {
  backgroundColor: '#0f172a',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
}

const header = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const logo = {
  margin: '0 auto',
  borderRadius: '12px',
}

const h1 = {
  color: '#22d3ee',
  fontSize: '28px',
  fontWeight: '300',
  margin: '0 0 24px',
  textAlign: 'center' as const,
  letterSpacing: '0.5px',
}

const h2 = {
  color: '#22d3ee',
  fontSize: '22px',
  fontWeight: '400',
  margin: '32px 0 16px',
  textAlign: 'center' as const,
  letterSpacing: '0.3px',
}

const text = {
  color: '#cbd5e1',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const confirmSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const confirmButton = {
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
}

const booksSection = {
  margin: '32px 0',
}

const booksGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '16px',
  margin: '24px 0',
}

const bookCard = {
  backgroundColor: 'rgba(15, 23, 42, 0.5)',
  border: '1px solid rgba(34, 211, 238, 0.1)',
  borderRadius: '8px',
  overflow: 'hidden',
  transition: 'all 0.2s ease',
}

const bookLink = {
  display: 'flex',
  padding: '12px',
  textDecoration: 'none',
  color: 'inherit',
}

const bookCover = {
  borderRadius: '4px',
  flexShrink: 0,
  marginRight: '12px',
}

const bookInfo = {
  flex: '1',
}

const bookTitle = {
  color: '#e2e8f0',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '20px',
  margin: '0 0 4px',
}

const bookAuthor = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0',
}

const footer = {
  color: '#64748b',
  fontSize: '13px',
  lineHeight: '22px',
  margin: '32px 0 16px',
  textAlign: 'center' as const,
  fontStyle: 'italic' as const,
}

const disclaimer = {
  color: '#475569',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '24px 0 0',
  textAlign: 'center' as const,
}

const socialSection = {
  textAlign: 'center' as const,
  marginTop: '24px',
  marginBottom: '16px',
}

const socialLink = {
  color: '#22d3ee',
  fontSize: '13px',
  textDecoration: 'none',
  whiteSpace: 'nowrap' as const,
  display: 'inline-block',
}

const socialDivider = {
  color: '#475569',
  display: 'inline',
  margin: '0 4px',
}

const instagramIcon = {
  verticalAlign: 'middle',
  marginRight: '4px',
  display: 'inline-block',
}