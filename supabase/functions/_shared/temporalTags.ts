/**
 * Structured Temporal Context Tags for Science Fiction Literature
 * Total: 95 controlled vocabulary tags across 3 dimensions
 */

export const TEMPORAL_CONTEXT_TAGS = {
  // Literary Era (20 tags)
  literaryEra: [
    "Proto-SF (Pre-1926)",           // Wells, Verne, early scientific romance
    "Pulp Era (1926-1938)",          // Amazing Stories, Wonder Stories
    "Golden Age (1938-1960)",        // Asimov, Heinlein, Clarke
    "New Wave (1960-1975)",          // Ballard, Delany, Le Guin
    "Cyberpunk Era (1980-1995)",     // Gibson, Sterling, Cadigan
    "Post-Cyberpunk (1995-2010)",    // Stephenson, Stross, Doctorow
    "Contemporary SF (2010-2020)",   // Leckie, Jemisin, Liu
    "Emerging SF (2020+)",           // Current and future works
    "Feminist SF Wave (1970s-1980s)", // Russ, Tiptree Jr., Butler
    "New Space Opera (1990s-2000s)", // Banks, Reynolds, Hamilton
    "Hard SF Renaissance (1990s)",   // Egan, Baxter, Forward
    "Afrofuturism",                  // Butler, Okorafor, Jemisin
    "Biopunk Era (1990s-2000s)",     // Bacigalupi, Atwood
    "Climate Fiction Era (2010+)",   // Robinson, VanderMeer
    "Solarpunk",                     // Optimistic ecological futures
    "Weird Fiction Revival (2000s)", // VanderMeer, Miéville
    "New Weird (2000s)",             // Miéville, Morgan, Stross
    "Mundane SF (2000s)",            // No FTL, realistic futures
    "Hopepunk (2010s)",              // Optimistic resistance
    "Post-Apocalyptic Wave (2000s)", // McCarthy, Bacigalupi, Atwood
  ],
  
  // Historical Forces (35 tags)
  historicalForces: [
    "World War I Trauma",            // Lost generation, mechanized warfare
    "Interwar Anxiety (1920s-1930s)", // Economic collapse, fascism rise
    "World War II Impact",           // Total war, Holocaust
    "Post-War Optimism (1945-1950s)", // New world order hopes
    "Nuclear Age Anxiety",           // Atomic weapons, MAD doctrine
    "Cold War Tensions",             // US-Soviet rivalry, proxy wars
    "Space Race Optimism",           // Moon landing, cosmic expansion
    "McCarthyism Era",               // Red Scare, paranoia
    "Civil Rights Movement",         // Social justice, equality struggles
    "Counterculture Movement (1960s)", // Anti-establishment, new consciousness
    "Vietnam War Era",               // Anti-war sentiment, disillusionment
    "Sexual Revolution (1960s-1970s)", // Liberation, gender fluidity
    "Oil Crisis (1970s)",            // Resource scarcity fears
    "Reagan Era (1980s)",            // Conservative shift, Star Wars
    "Fall of Berlin Wall (1989)",    // End of Cold War, unipolar moment
    "Dot-com Bubble (1995-2001)",    // Internet mania, tech optimism
    "Post-9/11 Security State",      // Surveillance, war on terror
    "Iraq War Era (2003-2011)",      // Occupation, asymmetric warfare
    "Financial Crisis (2008)",       // Economic collapse, inequality
    "Arab Spring (2011)",            // Social media revolutions
    "Occupy Movement (2011)",        // Anti-capitalism, wealth gap
    "Climate Awareness (2010s)",     // Extinction Rebellion, youth activism
    "Trump Era (2016-2020)",         // Populism, post-truth
    "AI Emergence (2010s-2020s)",    // Machine learning breakthroughs
    "Social Media Age",              // Filter bubbles, polarization
    "Surveillance Capitalism",       // Data extraction, privacy erosion
    "Gig Economy Era",               // Precarity, platform labor
    "COVID-19 Pandemic",             // Lockdowns, social disruption
    "Black Lives Matter",            // Racial justice, systemic reform
    "MeToo Movement",                // Gender justice, accountability
    "Climate Crisis Acceleration",   // Tipping points, existential threat
    "New Space Race (2020s)",        // Private spaceflight, Mars ambitions
    "Ukraine War (2022+)",           // Return of conventional war
    "AI Safety Concerns (2023+)",    // Existential risk, alignment problem
    "Polycrisis (2020s)",            // Multiple overlapping crises
  ],
  
  // Technological Context (40 tags)
  technologicalContext: [
    "Steam Power Era",               // Industrial revolution tech
    "Electrical Age",                // Early 20th century electrification
    "Radio Age (1920s-1940s)",       // Mass communication dawn
    "Atomic Technology",             // Nuclear fission/fusion
    "Early Computers (1940s-1950s)", // ENIAC, mainframes
    "Television Age (1950s-1960s)",  // Mass visual media
    "Early Robotics (1950s-1960s)",  // Industrial automation
    "Cybernetics (1950s-1960s)",     // Feedback systems, control theory
    "Transistor Era (1960s)",        // Solid-state revolution
    "Integrated Circuits (1960s-1970s)", // Chip miniaturization
    "Mainframe Era (1960s-1970s)",   // Corporate computing
    "Genetic Engineering Dawn (1970s)", // Recombinant DNA
    "Microprocessor Age (1970s)",    // Personal computing begins
    "PC Revolution (1980s)",         // Desktop computers, Apple/IBM
    "Video Game Era (1980s-1990s)",  // Digital entertainment
    "Biotechnology Era (1980s-1990s)", // Genetic modification
    "Neural Networks (1980s-1990s)", // AI winter and revival
    "Internet Dawn (1990s)",         // Web 1.0, email, BBS
    "Virtual Reality (1990s)",       // Early VR experiments
    "Cloning Era (1996+)",           // Dolly the sheep
    "Human Genome Project (1990-2003)", // DNA sequencing
    "Nanotechnology (1990s-2000s)",  // Molecular engineering
    "Mobile Computing (2000s)",      // Smartphones, tablets
    "Social Networks (2000s)",       // Web 2.0, user-generated content
    "Cloud Era (2010s)",             // SaaS, distributed computing
    "Big Data (2010s)",              // Analytics, data science
    "Autonomous Vehicles (2010s)",   // Self-driving cars
    "Drone Technology (2010s)",      // Unmanned aerial systems
    "CRISPR Era (2012+)",            // Gene editing revolution
    "Deep Learning (2012+)",         // Neural network renaissance
    "Blockchain Era (2014+)",        // Distributed ledgers, crypto
    "Quantum Computing (2010s-2020s)", // Quantum supremacy
    "5G Networks (2019+)",           // High-speed connectivity
    "mRNA Vaccines (2020+)",         // Programmable medicine
    "Brain-Computer Interfaces (2020s)", // Neuralink, neural prosthetics
    "Generative AI (2022+)",         // GPT, DALL-E, Stable Diffusion
    "Large Language Models (2023+)", // ChatGPT era
    "Autonomous Systems (2020s)",    // Robots, drones, self-organizing tech
    "Synthetic Biology (2020s)",     // Engineered organisms
    "AGI Speculation (2020s)",       // Artificial general intelligence
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
