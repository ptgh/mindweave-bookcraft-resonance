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
            {book.coverUrl && (
              <Img
                src={book.coverUrl}
                alt={`${book.title} cover`}
                style={bookCover}
              />
            )}
            <Heading style={bookTitle}>{book.title}</Heading>
            <Text style={bookAuthor}>by {book.author}</Text>
            <Text style={bookDescription}>{book.description}</Text>
            <Link href={book.addUrl} style={button}>
              Add Signal →
            </Link>
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
  padding: '32px',
  margin: '24px 0',
  border: '1px solid rgba(51, 65, 85, 0.3)',
};

const bookCover = {
  width: '120px',
  height: 'auto',
  borderRadius: '4px',
  marginBottom: '16px',
  border: '1px solid rgba(51, 65, 85, 0.5)',
};

const bookTitle = {
  color: '#f1f5f9',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 8px',
  lineHeight: '1.4',
};

const bookAuthor = {
  color: '#22d3ee',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 16px',
  letterSpacing: '0.3px',
};

const bookDescription = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 20px',
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
