-- Fix broken event URLs
UPDATE scifi_events 
SET website_url = 'https://eastercon.org/'
WHERE name = 'Conversation - Eastercon 2025';

UPDATE scifi_events 
SET website_url = 'https://www.derbyquad.co.uk/whats-on'
WHERE name = 'Edge-Lit 11';