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
  coverUrl?: string;
  description: string;
  tags?: string[];
  addUrl: string;
}

interface WeeklyNewsletterEmailProps {
  email: string;
  recommendations: BookRecommendation[];
  unsubscribeUrl: string;
  weekNumber: number;
}

export const WeeklyNewsletterEmail = ({
  email,
  recommendations,
  unsubscribeUrl,
  weekNumber,
}: WeeklyNewsletterEmailProps) => (
  <Html>
    <Head />
    <Preview>This week's signals from Leafnode—{recommendations.length} books curated for you</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <img
            src="https://mmnfjeukxandnhdaovzx.supabase.co/storage/v1/object/public/book-covers/leafnode-logo.png"
            alt="Leafnode"
            style={logo}
          />
        </Section>
        
        <Heading style={h1}>Weekly Transmission #{weekNumber}</Heading>
        <Text style={text}>
          New signals detected in the network. Here are this week's curated science fiction 
          recommendations—each one a potential node in your reading constellation.
        </Text>

        <Section style={statsSection}>
          <Text style={statText}>
            📡 {recommendations.length} signals this week
          </Text>
        </Section>

        {recommendations.map((book, index) => (
          <Section key={index} style={bookSection}>
            <table style={{ width: '100%' }}>
              <tr>
                <td style={{ width: '100px', verticalAlign: 'top', paddingRight: '16px' }}>
                  {book.coverUrl && (
                    <Img
                      src={book.coverUrl}
                      alt={`${book.title} cover`}
                      style={bookCover}
                    />
                  )}
                </td>
                <td style={{ verticalAlign: 'top' }}>
                  <Heading style={bookTitle}>{book.title}</Heading>
                  <Text style={bookAuthor}>{book.author}</Text>
                  {book.tags && book.tags.length > 0 && (
                    <div style={tagsContainer}>
                      {book.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} style={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <Text style={bookDescription}>{book.description}</Text>
                  <Link href={book.addUrl} style={button}>
                    Add Signal →
                  </Link>
                </td>
              </tr>
            </table>
          </Section>
        ))}

        <Section style={ctaSection}>
          <Text style={ctaText}>
            🧠 Explore your full reading network and discover patterns in your collection
          </Text>
          <Link href="https://leafnode.co.uk/thread-map" style={secondaryButton}>
            View Thread Map
          </Link>
        </Section>

        <Section style={featuresSection}>
          <Text style={sectionTitle}>EXPLORE LEAFNODE</Text>
          <Text style={featureText}>
            • <Link href="https://leafnode.co.uk/publisher-resonance" style={inlineLink}>Publisher Resonance</Link> — Discover curated collections
          </Text>
          <Text style={featureText}>
            • <Link href="https://leafnode.co.uk/author-matrix" style={inlineLink}>Author Matrix</Link> — Explore author relationships
          </Text>
          <Text style={featureText}>
            • <Link href="https://leafnode.co.uk/insights" style={inlineLink}>Reading Insights</Link> — Get AI-powered analysis
          </Text>
        </Section>

        <Text style={footer}>
          This transmission was compiled for {email}
        </Text>
        
        <Text style={contactText}>
          Questions? Reach us at{' '}
          <Link href="mailto:connect@leafnode.co.uk" style={contactLink}>
            connect@leafnode.co.uk
          </Link>
        </Text>
        
        <Section style={footerLinks}>
          <Link href={unsubscribeUrl} style={unsubscribeLink}>
            Unsubscribe
          </Link>
          {' · '}
          <Link href="https://leafnode.co.uk" style={footerLink}>
            Visit Leafnode
          </Link>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default WeeklyNewsletterEmail;

const main = {
  backgroundColor: '#020617',
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
  width: '64px',
  height: '64px',
  borderRadius: '12px',
};

const h1 = {
  color: '#22d3ee',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 24px',
  letterSpacing: '-0.5px',
};

const text = {
  color: '#cbd5e1',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 24px',
};

const statsSection = {
  backgroundColor: '#0f172a',
  borderRadius: '8px',
  padding: '16px 24px',
  margin: '24px 0',
  border: '1px solid rgba(51, 65, 85, 0.3)',
  textAlign: 'center' as const,
};

const statText = {
  color: '#22d3ee',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
  letterSpacing: '0.5px',
};

const bookSection = {
  backgroundColor: '#0f172a',
  borderRadius: '12px',
  padding: '24px',
  margin: '20px 0',
  border: '1px solid rgba(51, 65, 85, 0.3)',
};

const bookCover = {
  width: '100px',
  height: 'auto',
  borderRadius: '4px',
  border: '1px solid rgba(51, 65, 85, 0.5)',
};

const bookTitle = {
  color: '#f1f5f9',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 6px',
  lineHeight: '1.3',
};

const bookAuthor = {
  color: '#94a3b8',
  fontSize: '14px',
  fontWeight: '400',
  margin: '0 0 12px',
};

const tagsContainer = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '8px',
  marginBottom: '12px',
};

const tagStyle = {
  backgroundColor: 'rgba(6, 182, 212, 0.1)',
  color: '#22d3ee',
  fontSize: '12px',
  padding: '4px 12px',
  borderRadius: '4px',
  border: '1px solid rgba(6, 182, 212, 0.2)',
  display: 'inline-block',
  marginRight: '6px',
  marginBottom: '6px',
};

const bookDescription = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 16px',
};

const button = {
  backgroundColor: 'rgba(6, 182, 212, 0.15)',
  borderRadius: '6px',
  color: '#22d3ee',
  fontSize: '13px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 24px',
  border: '1px solid rgba(6, 182, 212, 0.25)',
  letterSpacing: '0.3px',
};

const ctaSection = {
  backgroundColor: 'rgba(6, 182, 212, 0.05)',
  borderRadius: '8px',
  padding: '24px',
  margin: '32px 0',
  border: '1px solid rgba(6, 182, 212, 0.15)',
  textAlign: 'center' as const,
};

const ctaText = {
  color: '#cbd5e1',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const secondaryButton = {
  backgroundColor: 'transparent',
  borderRadius: '6px',
  color: '#22d3ee',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 28px',
  border: '1px solid rgba(6, 182, 212, 0.3)',
  letterSpacing: '0.3px',
};

const featuresSection = {
  margin: '32px 0',
  padding: '24px 0',
  borderTop: '1px solid rgba(51, 65, 85, 0.3)',
};

const sectionTitle = {
  color: '#22d3ee',
  fontSize: '12px',
  fontWeight: '400',
  textTransform: 'uppercase' as const,
  letterSpacing: '1.5px',
  margin: '0 0 16px',
};

const featureText = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 12px',
};

const inlineLink = {
  color: '#22d3ee',
  textDecoration: 'none',
};

const footer = {
  color: '#64748b',
  fontSize: '13px',
  lineHeight: '22px',
  marginTop: '32px',
  fontStyle: 'italic' as const,
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

const footerLinks = {
  color: '#475569',
  fontSize: '12px',
  lineHeight: '20px',
  marginTop: '24px',
  paddingTop: '24px',
  borderTop: '1px solid rgba(51, 65, 85, 0.3)',
  textAlign: 'center' as const,
};

const unsubscribeLink = {
  color: '#64748b',
  textDecoration: 'underline',
};

const footerLink = {
  color: '#475569',
  textDecoration: 'none',
};
