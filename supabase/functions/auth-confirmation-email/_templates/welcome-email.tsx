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
            src="https://your-domain.com/leafnode-logo.png"
            width="120"
            height="40"
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
        
        <Text style={disclaimer}>
          If you didn't create an account with Leafnode, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

const main = {
  backgroundColor: '#0a0a0a',
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
}

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#ffffff',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '32px 0 16px',
  textAlign: 'center' as const,
}

const text = {
  color: '#cccccc',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const confirmSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const confirmButton = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '16px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
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
  backgroundColor: '#1a1a1a',
  border: '1px solid #333',
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
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  lineHeight: '20px',
  margin: '0 0 4px',
}

const bookAuthor = {
  color: '#888888',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0',
}

const footer = {
  color: '#cccccc',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '32px 0 16px',
  textAlign: 'center' as const,
}

const disclaimer = {
  color: '#666666',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '24px 0 0',
  textAlign: 'center' as const,
}