// Historical and literary context enrichment for books

export interface LiteraryMovement {
  name: string;
  period: [number, number];
  characteristics: string[];
  keyAuthors: string[];
  themes: string[];
}

export interface WorldEvent {
  year: number;
  event: string;
  impact: string;
  category: 'war' | 'technology' | 'social' | 'scientific' | 'political';
}

export interface HistoricalContext {
  publicationYear: number;
  era: string;
  literaryMovement: LiteraryMovement | null;
  contemporaryEvents: WorldEvent[];
  culturalContext: string;
  technologicalState: string;
}

class HistoricalContextService {
  private literaryMovements: LiteraryMovement[] = [
    {
      name: 'Golden Age of Science Fiction',
      period: [1938, 1946],
      characteristics: ['Hard science focus', 'Optimistic futurism', 'Adventure stories', 'Engineering solutions'],
      keyAuthors: ['Isaac Asimov', 'Robert Heinlein', 'Arthur C. Clarke'],
      themes: ['Space exploration', 'Technological progress', 'Scientific method', 'Future societies']
    },
    {
      name: 'New Wave Science Fiction',
      period: [1960, 1975],
      characteristics: ['Experimental style', 'Soft sciences', 'Literary techniques', 'Social commentary'],
      keyAuthors: ['Ursula K. Le Guin', 'Philip K. Dick', 'J.G. Ballard', 'Samuel R. Delany'],
      themes: ['Inner space', 'Consciousness', 'Social structures', 'Dystopian visions']
    },
    {
      name: 'Cyberpunk',
      period: [1980, 1995],
      characteristics: ['High tech, low life', 'Corporate dystopia', 'Virtual reality', 'Counter-culture'],
      keyAuthors: ['William Gibson', 'Bruce Sterling', 'Neal Stephenson', 'Pat Cadigan'],
      themes: ['Artificial intelligence', 'Cyberspace', 'Body modification', 'Corporate power']
    },
    {
      name: 'Post-Cyberpunk',
      period: [1995, 2010],
      characteristics: ['Optimistic tech', 'Posthumanism', 'Biotech focus', 'Distributed networks'],
      keyAuthors: ['Charles Stross', 'Cory Doctorow', 'Bruce Sterling', 'Vernor Vinge'],
      themes: ['Singularity', 'Transhumanism', 'Open source', 'Network society']
    },
    {
      name: 'Contemporary SF',
      period: [2010, 2025],
      characteristics: ['Climate focus', 'Diverse voices', 'Near-future', 'Social justice'],
      keyAuthors: ['N.K. Jemisin', 'Ted Chiang', 'Becky Chambers', 'Ann Leckie'],
      themes: ['Climate change', 'Identity', 'First contact', 'Post-scarcity']
    }
  ];

  private worldEvents: WorldEvent[] = [
    { year: 1945, event: 'Atomic bombs end WWII', impact: 'Nuclear anxiety in SF', category: 'war' },
    { year: 1957, event: 'Sputnik launches', impact: 'Space race begins', category: 'technology' },
    { year: 1969, event: 'Moon landing', impact: 'Space exploration becomes real', category: 'technology' },
    { year: 1984, event: 'Neuromancer published', impact: 'Cyberpunk movement launches', category: 'social' },
    { year: 1991, event: 'World Wide Web goes public', impact: 'Internet changes SF landscape', category: 'technology' },
    { year: 1997, event: 'Deep Blue defeats Kasparov', impact: 'AI becomes reality', category: 'technology' },
    { year: 2001, event: '9/11 attacks', impact: 'Dystopian themes intensify', category: 'political' },
    { year: 2007, event: 'iPhone released', impact: 'Mobile revolution', category: 'technology' },
    { year: 2016, event: 'AlphaGo defeats world champion', impact: 'AI dominance in games', category: 'technology' },
    { year: 2020, event: 'COVID-19 pandemic', impact: 'Pandemic fiction surge', category: 'social' },
    { year: 2022, event: 'ChatGPT released', impact: 'AI becomes mainstream', category: 'technology' }
  ];

  getHistoricalContext(publicationYear: number): HistoricalContext {
    const era = this.getEra(publicationYear);
    const literaryMovement = this.getLiteraryMovement(publicationYear);
    const contemporaryEvents = this.getContemporaryEvents(publicationYear);
    const culturalContext = this.getCulturalContext(publicationYear);
    const technologicalState = this.getTechnologicalState(publicationYear);

    return {
      publicationYear,
      era,
      literaryMovement,
      contemporaryEvents,
      culturalContext,
      technologicalState
    };
  }

  private getEra(year: number): string {
    if (year < 1920) return 'Pre-Modern Era';
    if (year < 1946) return 'Early Pulp Era';
    if (year < 1960) return 'Golden Age';
    if (year < 1975) return 'New Wave Era';
    if (year < 1985) return 'Post-New Wave';
    if (year < 2000) return 'Cyberpunk Era';
    if (year < 2010) return 'Millennial SF';
    return 'Contemporary SF';
  }

  private getLiteraryMovement(year: number): LiteraryMovement | null {
    return this.literaryMovements.find(
      movement => year >= movement.period[0] && year <= movement.period[1]
    ) || null;
  }

  private getContemporaryEvents(year: number, window = 5): WorldEvent[] {
    return this.worldEvents.filter(
      event => Math.abs(event.year - year) <= window
    );
  }

  private getCulturalContext(year: number): string {
    if (year < 1945) return 'Pre-atomic age, pulp magazines dominant, scientific romance traditions';
    if (year < 1960) return 'Post-war optimism, space race beginning, atomic anxiety';
    if (year < 1975) return 'Counterculture movement, Vietnam War impact, environmental awareness growing';
    if (year < 1990) return 'Cold War tensions, personal computing emerging, postmodern literature';
    if (year < 2000) return 'Internet revolution, end of Cold War, globalization accelerating';
    if (year < 2010) return '9/11 aftermath, social media rise, climate awareness increasing';
    return 'AI revolution, climate crisis, pandemic impact, social justice movements';
  }

  private getTechnologicalState(year: number): string {
    if (year < 1945) return 'Mechanical age, radio dominant, early computing concepts';
    if (year < 1970) return 'Atomic age, television, early computers, space race';
    if (year < 1990) return 'Microprocessor revolution, personal computers emerging, video games';
    if (year < 2000) return 'Internet age beginning, mobile phones, digital revolution';
    if (year < 2010) return 'Web 2.0, smartphones, social networks, cloud computing';
    return 'AI/ML revolution, ubiquitous mobile, IoT, quantum computing emerging';
  }

  // Get decade zeitgeist
  getDecadeZeitgeist(decade: number): {
    themes: string[];
    anxieties: string[];
    hopes: string[];
    keyWorks: string[];
  } {
    const decadeData: Record<number, any> = {
      1940: {
        themes: ['Atomic power', 'World War', 'Rockets', 'Future war'],
        anxieties: ['Nuclear destruction', 'Totalitarianism', 'Dehumanization'],
        hopes: ['Space travel', 'Atomic energy', 'Scientific progress'],
        keyWorks: ['Foundation', '1984', 'Brave New World']
      },
      1950: {
        themes: ['Space exploration', 'Aliens', 'Robots', 'Time travel'],
        anxieties: ['Cold War', 'Conformity', 'Nuclear war'],
        hopes: ['Space colonies', 'Flying cars', 'World peace'],
        keyWorks: ['Fahrenheit 451', 'The Stars My Destination', 'Childhood\'s End']
      },
      1960: {
        themes: ['Inner space', 'Psychedelia', 'Social change', 'Experimental'],
        anxieties: ['Overpopulation', 'Vietnam War', 'Environmental collapse'],
        hopes: ['Human potential', 'Social transformation', 'Consciousness expansion'],
        keyWorks: ['Dune', 'Do Androids Dream', 'Stranger in a Strange Land']
      },
      1970: {
        themes: ['Ecology', 'Gender', 'Dystopia', 'Feminism'],
        anxieties: ['Environmental crisis', 'Corporate control', 'Surveillance'],
        hopes: ['Alternative societies', 'Liberation', 'Sustainability'],
        keyWorks: ['The Left Hand of Darkness', 'Ringworld', 'Gateway']
      },
      1980: {
        themes: ['Cyberspace', 'Punk aesthetic', 'Corporate power', 'Virtual reality'],
        anxieties: ['Technology addiction', 'Class divide', 'Loss of humanity'],
        hopes: ['Digital freedom', 'Hacker culture', 'Body transcendence'],
        keyWorks: ['Neuromancer', 'Ender\'s Game', 'The Handmaid\'s Tale']
      },
      1990: {
        themes: ['Internet', 'Biotech', 'Post-human', 'Virtual worlds'],
        anxieties: ['AI takeover', 'Genetic engineering', 'Identity loss'],
        hopes: ['Information freedom', 'Singularity', 'Mind uploading'],
        keyWorks: ['Snow Crash', 'The Diamond Age', 'The Sparrow']
      },
      2000: {
        themes: ['Terrorism', 'Climate', 'Posthuman', 'Surveillance'],
        anxieties: ['Security state', 'Climate catastrophe', 'Privacy loss'],
        hopes: ['Renewable energy', 'Space expansion', 'AI assistance'],
        keyWorks: ['Altered Carbon', 'Old Man\'s War', 'Blindsight']
      },
      2010: {
        themes: ['Climate crisis', 'AI', 'Diversity', 'Near future'],
        anxieties: ['Ecological collapse', 'AI alignment', 'Inequality'],
        hopes: ['Solar punk', 'First contact', 'Social justice'],
        keyWorks: ['The Three-Body Problem', 'Ancillary Justice', 'The Fifth Season']
      },
      2020: {
        themes: ['Pandemic', 'AI advancement', 'Climate action', 'Multiverse'],
        anxieties: ['Societal collapse', 'AGI risk', 'Misinformation'],
        hopes: ['Climate solutions', 'Beneficial AI', 'Space exploration'],
        keyWorks: ['Project Hail Mary', 'Klara and the Sun', 'Network Effect']
      }
    };

    const roundedDecade = Math.floor(decade / 10) * 10;
    return decadeData[roundedDecade] || {
      themes: ['Unknown era'],
      anxieties: ['Unknown'],
      hopes: ['Unknown'],
      keyWorks: []
    };
  }

  // Narrative vs publication time analysis
  analyzeTemporalDissonance(publicationYear: number, narrativeTimePeriod?: string): {
    dissonance: 'past' | 'present' | 'near_future' | 'far_future' | 'unknown';
    explanation: string;
    significance: string;
  } {
    if (!narrativeTimePeriod) {
      return {
        dissonance: 'unknown',
        explanation: 'Narrative timeframe not specified',
        significance: 'Unable to analyze temporal relationship'
      };
    }

    const narrativeYear = this.extractYearFromPeriod(narrativeTimePeriod);
    
    if (!narrativeYear) {
      return {
        dissonance: 'unknown',
        explanation: narrativeTimePeriod,
        significance: 'Non-numeric temporal reference'
      };
    }

    const yearDiff = narrativeYear - publicationYear;

    if (yearDiff < -50) {
      return {
        dissonance: 'past',
        explanation: `Set ${Math.abs(yearDiff)} years before publication`,
        significance: 'Historical or alternate history perspective on future past'
      };
    } else if (yearDiff < 20) {
      return {
        dissonance: 'present',
        explanation: 'Contemporary setting',
        significance: 'Reflects immediate concerns and technologies'
      };
    } else if (yearDiff < 100) {
      return {
        dissonance: 'near_future',
        explanation: `Set ${yearDiff} years ahead`,
        significance: 'Extrapolation from current trends'
      };
    } else {
      return {
        dissonance: 'far_future',
        explanation: `Set ${yearDiff}+ years ahead`,
        significance: 'Speculative long-term futures'
      };
    }
  }

  private extractYearFromPeriod(period: string): number | null {
    // Try to extract year from strings like "2157", "22nd Century", "Far Future"
    const yearMatch = period.match(/\d{4}/);
    if (yearMatch) {
      return parseInt(yearMatch[0]);
    }

    const centuryMatch = period.match(/(\d{1,2})(st|nd|rd|th)\s+Century/i);
    if (centuryMatch) {
      return parseInt(centuryMatch[1]) * 100;
    }

    // Approximate for vague terms
    if (period.toLowerCase().includes('far future')) return 2500;
    if (period.toLowerCase().includes('near future')) return 2050;
    if (period.toLowerCase().includes('present')) return new Date().getFullYear();

    return null;
  }
}

export const historicalContextService = new HistoricalContextService();
