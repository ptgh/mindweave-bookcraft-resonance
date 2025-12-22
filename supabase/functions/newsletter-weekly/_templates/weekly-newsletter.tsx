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
            src="https://leafnode.co.uk/leafnode-email-logo.png"
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

        {/* Compact 2x2 grid for 4 books */}
        <table style={booksGrid}>
          <tbody>
            {[0, 2].map((rowStart) => (
              <tr key={rowStart}>
                {recommendations.slice(rowStart, rowStart + 2).map((book, index) => (
                  <td key={index} style={bookCell}>
                    <div style={bookCard}>
                      {book.coverUrl && (
                        <Img
                          src={book.coverUrl}
                          alt={`${book.title} cover`}
                          style={bookCover}
                        />
                      )}
                      <Heading style={bookTitle}>{book.title}</Heading>
                      <Text style={bookAuthor}>{book.author}</Text>
                      <Text style={bookDescription}>{book.description}</Text>
                      <Link href={book.addUrl} style={button}>
                        Add Signal →
                      </Link>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <Section style={ctaSection}>
          <Text style={ctaText}>
            🧠 Explore your full reading network and discover patterns in your collection
          </Text>
          <Link href="https://leafnode.co.uk/book-browser" style={secondaryButton}>
            View Signal Archive
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
        
        <table style={socialTable}>
          <tbody>
            <tr>
              <td style={socialTd}>
                <Link href="https://leafnode.co.uk" target="_blank" style={socialLinkStyle}>
                  leafnode.co.uk
                </Link>
              </td>
              <td style={socialTd}>
                <Link href="https://www.instagram.com/leafnode.scifi" target="_blank" style={socialLinkStyle}>
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/174/174855.png" 
                    alt="Instagram" 
                    style={instagramIconStyle}
                  />
                  @leafnode.scifi
                </Link>
              </td>
            </tr>
          </tbody>
        </table>

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
  marginBottom: '24px',
};

const logo = {
  width: '60px',
  height: 'auto',
  borderRadius: '10px',
};

const h1 = {
  color: '#22d3ee',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 16px',
  letterSpacing: '-0.5px',
};

const text = {
  color: '#cbd5e1',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 16px',
};

const statsSection = {
  backgroundColor: 'rgba(15, 23, 42, 0.5)',
  borderRadius: '6px',
  padding: '12px 16px',
  margin: '16px 0',
  border: '1px solid rgba(100, 116, 139, 0.2)',
  textAlign: 'center' as const,
};

const statText = {
  color: '#22d3ee',
  fontSize: '13px',
  fontWeight: '500',
  margin: '0',
  letterSpacing: '0.5px',
};

const booksGrid = {
  width: '100%',
  borderCollapse: 'separate' as const,
  borderSpacing: '8px',
  margin: '16px 0',
};

const bookCell = {
  width: '50%',
  verticalAlign: 'top',
  padding: '0',
};

const bookCard = {
  backgroundColor: 'rgba(15, 23, 42, 0.5)',
  borderRadius: '8px',
  padding: '12px',
  border: '1px solid rgba(100, 116, 139, 0.2)',
  textAlign: 'center' as const,
};

const bookCover = {
  width: '70px',
  height: 'auto',
  borderRadius: '4px',
  border: '1px solid rgba(51, 65, 85, 0.5)',
  margin: '0 auto 8px',
  display: 'block',
};

const bookTitle = {
  color: '#f1f5f9',
  fontSize: '13px',
  fontWeight: '600',
  margin: '0 0 4px',
  lineHeight: '1.2',
};

const bookAuthor = {
  color: '#94a3b8',
  fontSize: '11px',
  fontWeight: '400',
  margin: '0 0 6px',
};

const bookDescription = {
  color: '#94a3b8',
  fontSize: '10px',
  lineHeight: '14px',
  margin: '0 0 8px',
};

const button = {
  backgroundColor: 'rgba(6, 182, 212, 0.15)',
  borderRadius: '4px',
  color: '#22d3ee',
  fontSize: '11px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '6px 12px',
  border: '1px solid rgba(6, 182, 212, 0.25)',
  letterSpacing: '0.3px',
};

const ctaSection = {
  backgroundColor: 'rgba(6, 182, 212, 0.05)',
  borderRadius: '6px',
  padding: '16px',
  margin: '20px 0',
  border: '1px solid rgba(6, 182, 212, 0.15)',
  textAlign: 'center' as const,
};

const ctaText = {
  color: '#cbd5e1',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 12px',
};

const secondaryButton = {
  backgroundColor: 'transparent',
  borderRadius: '4px',
  color: '#22d3ee',
  fontSize: '12px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '8px 20px',
  border: '1px solid rgba(6, 182, 212, 0.3)',
  letterSpacing: '0.3px',
};

const featuresSection = {
  margin: '24px 0',
  padding: '16px 0',
  borderTop: '1px solid rgba(100, 116, 139, 0.2)',
};

const sectionTitle = {
  color: '#22d3ee',
  fontSize: '11px',
  fontWeight: '400',
  textTransform: 'uppercase' as const,
  letterSpacing: '1.5px',
  margin: '0 0 12px',
};

const featureText = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 0 8px',
};

const inlineLink = {
  color: '#22d3ee',
  textDecoration: 'none',
};

const footer = {
  color: '#64748b',
  fontSize: '12px',
  lineHeight: '20px',
  marginTop: '24px',
  fontStyle: 'italic' as const,
};

const contactText = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '20px',
  marginTop: '12px',
  textAlign: 'center' as const,
};

const contactLink = {
  color: '#22d3ee',
  textDecoration: 'none',
};

const socialTable = {
  width: '100%',
  maxWidth: '400px',
  margin: '16px auto 12px',
};

const socialTd = {
  textAlign: 'center' as const,
  padding: '0 30px',
  width: '50%',
};

const socialLinkStyle = {
  color: '#22d3ee',
  fontSize: '12px',
  textDecoration: 'none',
  whiteSpace: 'nowrap' as const,
  display: 'inline-block',
};

const instagramIconStyle = {
  width: '12px',
  height: '12px',
  verticalAlign: 'middle',
  marginRight: '5px',
  display: 'inline-block',
};

const footerLinks = {
  color: '#475569',
  fontSize: '11px',
  lineHeight: '18px',
  marginTop: '16px',
  paddingTop: '16px',
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