
-- Update existing tags in the transmissions table to use proper sci-fi conceptual tags
UPDATE transmissions 
SET tags = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    COALESCE(tags, ''),
    'Fiction', 'Cybernetic Enhancement'),
    'Literary Criticism', 'Quantum Consciousness'),
    'Young Adult Fiction', 'Neural Interface'),
    'Fantasy', 'Posthuman Evolution'),
    'Adventure', 'Technological Shamanism'),
    'Off-Earthascs', 'Off-Earth Civilisations')
WHERE tags IS NOT NULL 
AND (tags LIKE '%Fiction%' OR tags LIKE '%Literary Criticism%' OR tags LIKE '%Young Adult Fiction%' OR tags LIKE '%Fantasy%' OR tags LIKE '%Adventure%' OR tags LIKE '%Off-Earthascs%');

-- Update resonance_labels to use proper sci-fi conceptual tags
UPDATE transmissions 
SET resonance_labels = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    COALESCE(resonance_labels, ''),
    'Fiction', 'Cybernetic Enhancement'),
    'Literary Criticism', 'Quantum Consciousness'),
    'Young Adult Fiction', 'Neural Interface'),
    'Fantasy', 'Posthuman Evolution'),
    'Adventure', 'Technological Shamanism'),
    'Off-Earthascs', 'Off-Earth Civilisations')
WHERE resonance_labels IS NOT NULL 
AND (resonance_labels LIKE '%Fiction%' OR resonance_labels LIKE '%Literary Criticism%' OR resonance_labels LIKE '%Young Adult Fiction%' OR resonance_labels LIKE '%Fantasy%' OR resonance_labels LIKE '%Adventure%' OR resonance_labels LIKE '%Off-Earthascs%');
