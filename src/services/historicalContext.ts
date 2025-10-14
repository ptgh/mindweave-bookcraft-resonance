export interface LiteraryMovement {
  name: string;
  period: [number, number]; // [start year, end year]
  description: string;
  characteristics: string[];
  color: string;
}

export interface WorldEvent {
  year: number;
  event: string;
  impact: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface DecadeZeitgeist {
  decade: number;
  culturalThemes: string[];
  technologicalContext: string[];
  literaryTrends: string[];
  emoji: string;
}

export class HistoricalContextService {
  private static literaryMovements: LiteraryMovement[] = [
    {
      name: 'Golden Age SF',
      period: [1938, 1946],
      description: 'Hard science fiction focused on engineering and scientific accuracy',
      characteristics: ['Space exploration', 'Technological optimism', 'Scientific accuracy'],
      color: 'hsl(45, 80%, 60%)'
    },
    {
      name: 'New Wave SF',
      period: [1960, 1975],
      description: 'Experimental, literary science fiction exploring social and psychological themes',
      characteristics: ['Stylistic experimentation', 'Soft science', 'Social commentary'],
      color: 'hsl(280, 70%, 65%)'
    },
    {
      name: 'Cyberpunk',
      period: [1980, 1995],
      description: 'High tech and low life, dystopian near-futures',
      characteristics: ['Digital consciousness', 'Corporate dystopia', 'Body modification'],
      color: 'hsl(180, 75%, 50%)'
    },
    {
      name: 'Post-Cyberpunk',
      period: [1990, 2010],
      description: 'More optimistic takes on technology and human enhancement',
      characteristics: ['Transhumanism', 'Nanotechnology', 'Social networks'],
      color: 'hsl(200, 65%, 55%)'
    },
    {
      name: 'Contemporary SF',
      period: [2000, 2030],
      description: 'Modern science fiction addressing current technological and social issues',
      characteristics: ['AI ethics', 'Climate fiction', 'Post-singularity'],
      color: 'hsl(220, 70%, 60%)'
    }
  ];

  private static worldEvents: WorldEvent[] = [
    { year: 1945, event: 'Atomic bombs dropped on Japan', impact: 'Nuclear anxiety in SF', relevance: 'high' },
    { year: 1957, event: 'Sputnik launched', impact: 'Space race begins', relevance: 'high' },
    { year: 1969, event: 'Moon landing', impact: 'Peak of space optimism', relevance: 'high' },
    { year: 1984, event: 'Neuromancer published', impact: 'Cyberpunk genre established', relevance: 'high' },
    { year: 1997, event: 'Deep Blue defeats Kasparov', impact: 'AI becomes real threat/promise', relevance: 'high' },
    { year: 2001, event: '9/11 attacks', impact: 'Shift to security and surveillance themes', relevance: 'medium' },
    { year: 2007, event: 'iPhone released', impact: 'Mobile computing becomes ubiquitous', relevance: 'high' },
    { year: 2012, event: 'Deep learning breakthrough', impact: 'Modern AI revolution begins', relevance: 'high' },
    { year: 2022, event: 'ChatGPT released', impact: 'AI becomes mainstream concern', relevance: 'high' }
  ];

  private static decadeZeitgeists: DecadeZeitgeist[] = [
    {
      decade: 1950,
      culturalThemes: ['Cold War paranoia', 'Nuclear anxiety', 'Suburban expansion'],
      technologicalContext: ['Early computers', 'Jet age', 'Television'],
      literaryTrends: ['Classic space opera', 'Alien invasion', 'Robot stories'],
      emoji: '🚀'
    },
    {
      decade: 1960,
      culturalThemes: ['Social revolution', 'Space race', 'Counterculture'],
      technologicalContext: ['Moon missions', 'Mainframe computers', 'Color TV'],
      literaryTrends: ['New Wave experimentation', 'Soft SF', 'Psychedelic themes'],
      emoji: '🌈'
    },
    {
      decade: 1970,
      culturalThemes: ['Environmental awareness', 'Economic crisis', 'Post-Vietnam'],
      technologicalContext: ['Personal computers emerge', 'Video games', 'Cable TV'],
      literaryTrends: ['Eco-SF', 'Feminist SF', 'Hard SF returns'],
      emoji: '🌍'
    },
    {
      decade: 1980,
      culturalThemes: ['Digital revolution', 'Punk culture', 'Corporate culture'],
      technologicalContext: ['Home computers', 'Early internet', 'MTV'],
      literaryTrends: ['Cyberpunk explosion', 'Virtual reality', 'Corporate dystopia'],
      emoji: '💾'
    },
    {
      decade: 1990,
      culturalThemes: ['Internet arrives', 'End of Cold War', 'Globalization'],
      technologicalContext: ['World Wide Web', 'Mobile phones', 'CD-ROMs'],
      literaryTrends: ['Post-cyberpunk', 'Nanotechnology', 'Biotech'],
      emoji: '🌐'
    },
    {
      decade: 2000,
      culturalThemes: ['9/11 impact', 'Social media', 'Climate awareness'],
      technologicalContext: ['Smartphones', 'Cloud computing', 'Social networks'],
      literaryTrends: ['Near-future SF', 'Climate fiction', 'Transhumanism'],
      emoji: '📱'
    },
    {
      decade: 2010,
      culturalThemes: ['AI emergence', 'Polarization', 'Climate crisis'],
      technologicalContext: ['Deep learning', 'Cryptocurrencies', 'VR/AR'],
      literaryTrends: ['AI fiction', 'Solarpunk', 'Post-apocalyptic'],
      emoji: '🤖'
    },
    {
      decade: 2020,
      culturalThemes: ['Pandemic', 'AI revolution', 'Existential risk'],
      technologicalContext: ['ChatGPT', 'Quantum computing', 'Generative AI'],
      literaryTrends: ['AI consciousness', 'Post-singularity', 'Hopepunk'],
      emoji: '✨'
    }
  ];

  /**
   * Get the literary movement for a given year
   */
  static getLiteraryMovement(year: number): LiteraryMovement | null {
    return this.literaryMovements.find(
      movement => year >= movement.period[0] && year <= movement.period[1]
    ) || null;
  }

  /**
   * Get relevant world events for a given year (±5 years)
   */
  static getRelevantEvents(year: number, range: number = 5): WorldEvent[] {
    return this.worldEvents.filter(
      event => Math.abs(event.year - year) <= range
    );
  }

  /**
   * Get the decade zeitgeist for a given year
   */
  static getDecadeZeitgeist(year: number): DecadeZeitgeist | null {
    const decade = Math.floor(year / 10) * 10;
    return this.decadeZeitgeists.find(z => z.decade === decade) || null;
  }

  /**
   * Get a summary of the historical context for a book
   */
  static getBookContext(publicationYear: number): {
    movement: LiteraryMovement | null;
    events: WorldEvent[];
    zeitgeist: DecadeZeitgeist | null;
  } {
    return {
      movement: this.getLiteraryMovement(publicationYear),
      events: this.getRelevantEvents(publicationYear),
      zeitgeist: this.getDecadeZeitgeist(publicationYear)
    };
  }

  /**
   * Get all movements for a range of years
   */
  static getMovementsInRange(startYear: number, endYear: number): LiteraryMovement[] {
    return this.literaryMovements.filter(
      movement => 
        (movement.period[0] >= startYear && movement.period[0] <= endYear) ||
        (movement.period[1] >= startYear && movement.period[1] <= endYear) ||
        (movement.period[0] <= startYear && movement.period[1] >= endYear)
    );
  }

  /**
   * Get the movement badge label
   */
  static getMovementBadge(year: number): string {
    const movement = this.getLiteraryMovement(year);
    if (!movement) return '';
    
    const shortNames: Record<string, string> = {
      'Golden Age SF': 'Golden Age',
      'New Wave SF': 'New Wave',
      'Cyberpunk': 'Cyberpunk',
      'Post-Cyberpunk': 'Post-CP',
      'Contemporary SF': 'Contemporary'
    };
    
    return shortNames[movement.name] || movement.name;
  }
}
