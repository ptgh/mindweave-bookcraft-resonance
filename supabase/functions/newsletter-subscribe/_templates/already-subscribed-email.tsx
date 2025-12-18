import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface BookRecommendation {
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  addUrl: string;
}

interface AlreadySubscribedEmailProps {
  email: string;
  recommendations: BookRecommendation[];
  unsubscribeUrl: string;
}

export const AlreadySubscribedEmail = ({
  email,
  recommendations,
  unsubscribeUrl,
}: AlreadySubscribedEmailProps) => (
  <Html>
    <Head />
    <Preview>Signal already active—here are fresh picks for your library</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <img
            src="https://leafnode.co.uk/leafnode-email-logo.png"
            alt="Leafnode"
            style={logo}
          />
        </Section>
        
        <Heading style={h1}>◉ Signal Already Active</Heading>
        
        <Text style={text}>
          Good news—you're already connected to the network! Your coordinates are locked in and transmissions are flowing.
        </Text>

        <Text style={text}>
          Since you're here, we've curated some fresh signals you might have missed:
        </Text>

        <Section style={booksSection}>
          <Text style={sectionTitle}>FRESH PICKS FOR YOUR LIBRARY</Text>
          
          {recommendations.map((book, index) => (
            <Section key={index} style={bookCard}>
              <table style={bookTable}>
                <tr>
                  <td style={coverCell}>
                    <Img
                      src={book.coverUrl}
                      alt={`${book.title} cover`}
                      style={bookCover}
                    />
                  </td>
                  <td style={infoCell}>
                    <Text style={bookTitle}>{book.title}</Text>
                    <Text style={bookAuthor}>by {book.author}</Text>
                    <Text style={bookDescription}>{book.description}</Text>
                    <Link href={book.addUrl} style={addButton}>
                      Add to Library →
                    </Link>
                  </td>
                </tr>
              </table>
            </Section>
          ))}
        </Section>

        <Section style={ctaSection}>
          <Text style={ctaText}>
            Explore new features and discover patterns in your reading journey
          </Text>
          <Link href="https://leafnode.co.uk/thread-map" style={button}>
            View Your Thread Map
          </Link>
        </Section>

        <Text style={footer}>
          Keep your signal strong. Stay future-literate.
        </Text>
        
        <Text style={contactText}>
          Questions? Reach us at{' '}
          <Link href="mailto:connect@leafnode.co.uk" style={contactLink}>
            connect@leafnode.co.uk
          </Link>
        </Text>

        <table style={socialTable}>
          <tr>
            <td style={socialTd}>
              <Link href="https://leafnode.co.uk" target="_blank" style={socialLink}>
                leafnode.co.uk
              </Link>
            </td>
            <td style={socialTd}>
              <Link href="https://www.instagram.com/leafnode.scifi" target="_blank" style={socialLink}>
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/174/174855.png" 
                  alt="Instagram" 
                  style={instagramIcon}
                />
                <span style={instagramText}>@leafnode.scifi</span>
              </Link>
            </td>
          </tr>
        </table>

        <Text style={footerLinks}>
          <Link href={unsubscribeUrl} target="_blank" style={footerLink}>
            Disconnect Signal
          </Link>
          {' · '}
          <Link href="https://leafnode.co.uk" target="_blank" style={footerLink}>
            Leafnode
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default AlreadySubscribedEmail;

const main = {
  backgroundColor: '#0f172a',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
};

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const logo = {
  width: '80px',
  height: 'auto',
  borderRadius: '12px',
};

const h1 = {
  color: '#06b6d4',
  fontSize: '28px',
  fontWeight: '300',
  margin: '0 0 30px',
  letterSpacing: '0.5px',
};

const text = {
  color: '#cbd5e1',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 24px',
};

const booksSection = {
  margin: '32px 0',
};

const sectionTitle = {
  color: '#22d3ee',
  fontSize: '12px',
  fontWeight: '400',
  textTransform: 'uppercase' as const,
  letterSpacing: '1.5px',
  margin: '0 0 20px',
};

const bookCard = {
  backgroundColor: 'rgba(15, 23, 42, 0.5)',
  borderRadius: '12px',
  padding: '20px',
  margin: '16px 0',
  border: '1px solid rgba(100, 116, 139, 0.2)',
};

const bookTable = {
  width: '100%',
};

const coverCell = {
  width: '90px',
  verticalAlign: 'top' as const,
  paddingRight: '16px',
};

const infoCell = {
  verticalAlign: 'top' as const,
};

const bookCover = {
  width: '80px',
  height: 'auto',
  borderRadius: '4px',
  border: '1px solid rgba(51, 65, 85, 0.5)',
};

const bookTitle = {
  color: '#f1f5f9',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 4px',
  lineHeight: '1.3',
};

const bookAuthor = {
  color: '#94a3b8',
  fontSize: '13px',
  fontWeight: '400',
  margin: '0 0 10px',
};

const bookDescription = {
  color: '#94a3b8',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 12px',
};

const addButton = {
  backgroundColor: 'rgba(6, 182, 212, 0.15)',
  borderRadius: '6px',
  color: '#22d3ee',
  fontSize: '12px',
  fontWeight: '500',
  textDecoration: 'none',
  display: 'inline-block',
  padding: '8px 16px',
  border: '1px solid rgba(6, 182, 212, 0.25)',
  letterSpacing: '0.3px',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
  padding: '24px',
  backgroundColor: 'rgba(6, 182, 212, 0.05)',
  borderRadius: '8px',
  border: '1px solid rgba(6, 182, 212, 0.15)',
};

const ctaText = {
  color: '#cbd5e1',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const button = {
  backgroundColor: 'rgba(6, 182, 212, 0.15)',
  borderRadius: '6px',
  color: '#22d3ee',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  border: '1px solid rgba(6, 182, 212, 0.25)',
  letterSpacing: '0.3px',
};

const footer = {
  color: '#64748b',
  fontSize: '13px',
  lineHeight: '22px',
  marginTop: '32px',
  fontStyle: 'italic' as const,
  textAlign: 'center' as const,
};

const contactText = {
  color: '#94a3b8',
  fontSize: '13px',
  lineHeight: '22px',
  marginTop: '16px',
  textAlign: 'center' as const,
};

const contactLink = {
  color: '#22d3ee',
  textDecoration: 'none',
};

const socialTable = {
  width: '100%',
  maxWidth: '400px',
  margin: '24px auto 16px',
};

const socialTd = {
  textAlign: 'center' as const,
  padding: '0 40px',
  width: '50%',
};

const socialLink = {
  color: '#22d3ee',
  fontSize: '13px',
  textDecoration: 'none',
  whiteSpace: 'nowrap' as const,
  display: 'inline-block',
};

const instagramIcon = {
  width: '14px',
  height: '14px',
  verticalAlign: 'middle',
  marginRight: '6px',
  display: 'inline-block',
};

const instagramText = {
  verticalAlign: 'middle',
  display: 'inline',
};

const footerLinks = {
  color: '#475569',
  fontSize: '12px',
  lineHeight: '20px',
  marginTop: '24px',
  paddingTop: '24px',
  borderTop: '1px solid rgba(51, 65, 85, 0.3)',
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#64748b',
  textDecoration: 'underline',
};
