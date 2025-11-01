/**
 * Structured Temporal Context Tags for Science Fiction Literature
 * Frontend mirror of backend vocabulary
 * Total: 95 controlled vocabulary tags across 3 dimensions
 */

export const TEMPORAL_CONTEXT_TAGS = {
  // Literary Era (20 tags)
  literaryEra: [
    "Proto-SF (Pre-1926)",
    "Pulp Era (1926-1938)",
    "Golden Age (1938-1960)",
    "New Wave (1960-1975)",
    "Cyberpunk Era (1980-1995)",
    "Post-Cyberpunk (1995-2010)",
    "Contemporary SF (2010-2020)",
    "Emerging SF (2020+)",
    "Feminist SF Wave (1970s-1980s)",
    "New Space Opera (1990s-2000s)",
    "Hard SF Renaissance (1990s)",
    "Afrofuturism",
    "Biopunk Era (1990s-2000s)",
    "Climate Fiction Era (2010+)",
    "Solarpunk",
    "Weird Fiction Revival (2000s)",
    "New Weird (2000s)",
    "Mundane SF (2000s)",
    "Hopepunk (2010s)",
    "Post-Apocalyptic Wave (2000s)",
  ],
  
  // Historical Forces (35 tags)
  historicalForces: [
    "World War I Trauma",
    "Interwar Anxiety (1920s-1930s)",
    "World War II Impact",
    "Post-War Optimism (1945-1950s)",
    "Nuclear Age Anxiety",
    "Cold War Tensions",
    "Space Race Optimism",
    "McCarthyism Era",
    "Civil Rights Movement",
    "Counterculture Movement (1960s)",
    "Vietnam War Era",
    "Sexual Revolution (1960s-1970s)",
    "Oil Crisis (1970s)",
    "Reagan Era (1980s)",
    "Fall of Berlin Wall (1989)",
    "Dot-com Bubble (1995-2001)",
    "Post-9/11 Security State",
    "Iraq War Era (2003-2011)",
    "Financial Crisis (2008)",
    "Arab Spring (2011)",
    "Occupy Movement (2011)",
    "Climate Awareness (2010s)",
    "Trump Era (2016-2020)",
    "AI Emergence (2010s-2020s)",
    "Social Media Age",
    "Surveillance Capitalism",
    "Gig Economy Era",
    "COVID-19 Pandemic",
    "Black Lives Matter",
    "MeToo Movement",
    "Climate Crisis Acceleration",
    "New Space Race (2020s)",
    "Ukraine War (2022+)",
    "AI Safety Concerns (2023+)",
    "Polycrisis (2020s)",
  ],
  
  // Technological Context (40 tags)
  technologicalContext: [
    "Steam Power Era",
    "Electrical Age",
    "Radio Age (1920s-1940s)",
    "Atomic Technology",
    "Early Computers (1940s-1950s)",
    "Television Age (1950s-1960s)",
    "Early Robotics (1950s-1960s)",
    "Cybernetics (1950s-1960s)",
    "Transistor Era (1960s)",
    "Integrated Circuits (1960s-1970s)",
    "Mainframe Era (1960s-1970s)",
    "Genetic Engineering Dawn (1970s)",
    "Microprocessor Age (1970s)",
    "PC Revolution (1980s)",
    "Video Game Era (1980s-1990s)",
    "Biotechnology Era (1980s-1990s)",
    "Neural Networks (1980s-1990s)",
    "Internet Dawn (1990s)",
    "Virtual Reality (1990s)",
    "Cloning Era (1996+)",
    "Human Genome Project (1990-2003)",
    "Nanotechnology (1990s-2000s)",
    "Mobile Computing (2000s)",
    "Social Networks (2000s)",
    "Cloud Era (2010s)",
    "Big Data (2010s)",
    "Autonomous Vehicles (2010s)",
    "Drone Technology (2010s)",
    "CRISPR Era (2012+)",
    "Deep Learning (2012+)",
    "Blockchain Era (2014+)",
    "Quantum Computing (2010s-2020s)",
    "5G Networks (2019+)",
    "mRNA Vaccines (2020+)",
    "Brain-Computer Interfaces (2020s)",
    "Generative AI (2022+)",
    "Large Language Models (2023+)",
    "Autonomous Systems (2020s)",
    "Synthetic Biology (2020s)",
    "AGI Speculation (2020s)",
  ]
} as const;

// Type exports for TypeScript
export type LiteraryEra = typeof TEMPORAL_CONTEXT_TAGS.literaryEra[number];
export type HistoricalForce = typeof TEMPORAL_CONTEXT_TAGS.historicalForces[number];
export type TechnologicalContext = typeof TEMPORAL_CONTEXT_TAGS.technologicalContext[number];
export type TemporalTag = LiteraryEra | HistoricalForce | TechnologicalContext;

// Helper to get all tags as flat array
export const getAllTemporalTags = (): string[] => [
  ...TEMPORAL_CONTEXT_TAGS.literaryEra,
  ...TEMPORAL_CONTEXT_TAGS.historicalForces,
  ...TEMPORAL_CONTEXT_TAGS.technologicalContext,
];

// Helper to categorize a tag
export const getTagCategory = (tag: string): 'literaryEra' | 'historicalForces' | 'technologicalContext' | null => {
  if (TEMPORAL_CONTEXT_TAGS.literaryEra.includes(tag as LiteraryEra)) return 'literaryEra';
  if (TEMPORAL_CONTEXT_TAGS.historicalForces.includes(tag as HistoricalForce)) return 'historicalForces';
  if (TEMPORAL_CONTEXT_TAGS.technologicalContext.includes(tag as TechnologicalContext)) return 'technologicalContext';
  return null;
};

// Helper to filter temporal tags from mixed array
export const filterTemporalTags = (tags: string[]): string[] => {
  const allTemporalTags = getAllTemporalTags();
  return tags.filter(tag => allTemporalTags.includes(tag));
};
