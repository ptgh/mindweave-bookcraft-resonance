
-- Clean up the "Young Adult Cybernetic Enhancement" tag to just "Cybernetic Enhancement"
UPDATE transmissions 
SET tags = REPLACE(tags, 'Young Adult Cybernetic Enhancement', 'Cybernetic Enhancement')
WHERE tags IS NOT NULL 
AND tags LIKE '%Young Adult Cybernetic Enhancement%';

-- Also clean up resonance_labels if they contain this tag
UPDATE transmissions 
SET resonance_labels = REPLACE(resonance_labels, 'Young Adult Cybernetic Enhancement', 'Cybernetic Enhancement')
WHERE resonance_labels IS NOT NULL 
AND resonance_labels LIKE '%Young Adult Cybernetic Enhancement%';
