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
            🛸 {recommendations.length} signals this week
          </Text>
        </Section>

        {/* Row 1: Books 0-1 */}
        <table style={booksGrid}>
          <tbody>
            <tr>
              {recommendations.slice(0, 2).map((book, index) => (
                <td key={index} style={bookCell} valign="top">
                  <table style={bookCardTable}>
                    <tbody>
                      {/* Fixed-height cover row */}
                      <tr>
                        <td style={coverCell}>
                          {book.coverUrl ? (
                            <Img
                              src={book.coverUrl}
                              alt={`${book.title} cover`}
                              style={bookCover}
                            />
                          ) : (
                            <div style={coverPlaceholder}>
                              <Text style={placeholderText}>{book.title.charAt(0)}</Text>
                            </div>
                          )}
                        </td>
                      </tr>
                      {/* Fixed-height title row */}
                      <tr>
                        <td style={titleCell}>
                          <Heading style={bookTitle}>{book.title}</Heading>
                        </td>
                      </tr>
                      {/* Author row */}
                      <tr>
                        <td style={authorCell}>
                          <Text style={bookAuthor}>{book.author}</Text>
                        </td>
                      </tr>
                      {/* Fixed-height description row */}
                      <tr>
                        <td style={descriptionCell}>
                          <Text style={bookDescription}>{book.description}</Text>
                        </td>
                      </tr>
                      {/* Button row */}
                      <tr>
                        <td style={buttonCell}>
                          <Link href={book.addUrl} style={button}>
                            Add Signal →
                          </Link>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Row 2: Books 2-3 */}
        {recommendations.length > 2 && (
          <table style={booksGrid}>
            <tbody>
              <tr>
                {recommendations.slice(2, 4).map((book, index) => (
                  <td key={index} style={bookCell} valign="top">
                    <table style={bookCardTable}>
                      <tbody>
                        <tr>
                          <td style={coverCell}>
                            {book.coverUrl ? (
                              <Img
                                src={book.coverUrl}
                                alt={`${book.title} cover`}
                                style={bookCover}
                              />
                            ) : (
                              <div style={coverPlaceholder}>
                                <Text style={placeholderText}>{book.title.charAt(0)}</Text>
                              </div>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td style={titleCell}>
                            <Heading style={bookTitle}>{book.title}</Heading>
                          </td>
                        </tr>
                        <tr>
                          <td style={authorCell}>
                            <Text style={bookAuthor}>{book.author}</Text>
                          </td>
                        </tr>
                        <tr>
                          <td style={descriptionCell}>
                            <Text style={bookDescription}>{book.description}</Text>
                          </td>
                        </tr>
                        <tr>
                          <td style={buttonCell}>
                            <Link href={book.addUrl} style={button}>
                              Add Signal →
                            </Link>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        )}

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
          This transmission was compiled for{' '}
          <Link href={`mailto:${email}`} style={footerEmailLink}>
            {email}
          </Link>
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
  margin: '8px 0',
};

const bookCell = {
  width: '50%',
  verticalAlign: 'top' as const,
  padding: '0',
};

const bookCardTable = {
  width: '100%',
  backgroundColor: 'rgba(15, 23, 42, 0.5)',
  borderRadius: '8px',
  border: '1px solid rgba(100, 116, 139, 0.2)',
};

const coverCell = {
  textAlign: 'center' as const,
  padding: '16px 12px 8px',
  height: '140px',
  verticalAlign: 'bottom' as const,
};

const bookCover = {
  width: '90px',
  height: '120px',
  objectFit: 'cover' as const,
  borderRadius: '4px',
  border: '1px solid rgba(51, 65, 85, 0.5)',
  margin: '0 auto',
  display: 'block',
};

const coverPlaceholder = {
  width: '90px',
  height: '120px',
  borderRadius: '4px',
  border: '1px solid rgba(51, 65, 85, 0.5)',
  margin: '0 auto',
  backgroundColor: 'rgba(30, 41, 59, 0.8)',
  display: 'table',
};

const placeholderText = {
  color: '#64748b',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
  display: 'table-cell',
  verticalAlign: 'middle',
  textAlign: 'center' as const,
};

const titleCell = {
  textAlign: 'center' as const,
  padding: '8px 10px 2px',
  height: '44px',
  verticalAlign: 'top' as const,
};

const bookTitle = {
  color: '#f1f5f9',
  fontSize: '13px',
  fontWeight: '600',
  margin: '0',
  lineHeight: '1.3',
};

const authorCell = {
  textAlign: 'center' as const,
  padding: '0 10px 6px',
};

const bookAuthor = {
  color: '#94a3b8',
  fontSize: '11px',
  fontWeight: '400',
  margin: '0',
};

const descriptionCell = {
  textAlign: 'center' as const,
  padding: '0 10px 8px',
  height: '60px',
  verticalAlign: 'top' as const,
};

const bookDescription = {
  color: '#94a3b8',
  fontSize: '10px',
  lineHeight: '14px',
  margin: '0',
};

const buttonCell = {
  textAlign: 'center' as const,
  padding: '0 10px 14px',
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
  padding: '6px 14px',
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

const footerEmailLink = {
  color: '#22d3ee',
  textDecoration: 'none',
};

const unsubscribeLink = {
  color: '#64748b',
  textDecoration: 'underline',
};

const footerLink = {
  color: '#475569',
  textDecoration: 'none',
};
