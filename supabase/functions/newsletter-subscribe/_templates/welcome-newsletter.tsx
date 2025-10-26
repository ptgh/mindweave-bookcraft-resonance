import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface WelcomeNewsletterEmailProps {
  email: string;
  unsubscribeUrl: string;
  isResubscribe?: boolean;
}

export const WelcomeNewsletterEmail = ({
  email,
  unsubscribeUrl,
  isResubscribe = false,
}: WelcomeNewsletterEmailProps) => (
  <Html>
    <Head />
    <Preview>{isResubscribe ? 'Signal restored. Welcome back.' : 'Sync confirmed. Welcome to the network.'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <img
            src="https://mmnfjeukxandnhdaovzx.supabase.co/storage/v1/object/public/book-covers/leafnode-logo.png"
            alt="Leafnode"
            style={logo}
          />
        </Section>
        
        <Heading style={h1}>
          {isResubscribe ? '◉ Signal Restored' : '◉ Sync Confirmed'}
        </Heading>
        
        <Text style={text}>
          {isResubscribe 
            ? 'Your neural pathway has been restored. Welcome back to the network.'
            : 'Your transmission coordinates have been locked in. You\'re now part of the neural network.'}
        </Text>

        <Section style={section}>
          <Text style={sectionTitle}>What to Expect</Text>
          <Text style={listText}>
            <strong style={strong}>Weekly Consciousness Updates:</strong> Curated sci-fi insights delivered to your coordinates
          </Text>
          <Text style={listText}>
            <strong style={strong}>Curated Transmissions:</strong> Hand-picked reading lists from across the temporal spectrum
          </Text>
          <Text style={listText}>
            <strong style={strong}>New Features:</strong> First to know when new pathways open
          </Text>
        </Section>

        <Section style={ctaSection}>
          <Link
            href="https://leafnode.co.uk"
            target="_blank"
            style={button}
          >
            Explore the Network
          </Link>
        </Section>

        <Text style={footer}>
          Keep your signal strong. Stay future-literate.
        </Text>

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

export default WelcomeNewsletterEmail;

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

const section = {
  backgroundColor: '#0f172a',
  borderRadius: '8px',
  padding: '24px',
  margin: '32px 0',
  border: '1px solid rgba(51, 65, 85, 0.3)',
};

const sectionTitle = {
  color: '#22d3ee',
  fontSize: '12px',
  fontWeight: '400',
  textTransform: 'uppercase' as const,
  letterSpacing: '1.5px',
  margin: '0 0 16px',
};

const listText = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 12px',
};

const strong = {
  color: '#e2e8f0',
  fontWeight: '600',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
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
