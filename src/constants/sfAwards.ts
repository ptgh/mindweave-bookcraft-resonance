/**
 * Science Fiction Literary Awards Database
 * Hugo, Nebula, Philip K. Dick Award winners and nominees
 */

export type AwardType = 'hugo' | 'nebula' | 'pkd';

export interface SFAward {
  type: AwardType;
  year: number;
  category: string;
  isWinner: boolean;
}

export interface AwardBook {
  title: string;
  author: string;
  awards: SFAward[];
}

// Award display configuration
export const AWARD_CONFIG: Record<AwardType, { name: string; emoji: string; icon: string; color: string; bgColor: string }> = {
  hugo: { 
    name: 'Hugo Award', 
    emoji: '🚀',
    icon: 'rocket',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/30'
  },
  nebula: { 
    name: 'Nebula Award', 
    emoji: '🌌',
    icon: 'sparkles',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/30'
  },
  pkd: { 
    name: 'Philip K. Dick Award', 
    emoji: '👁️',
    icon: 'eye',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 border-cyan-500/30'
  }
};

// Database of award-winning books (normalized titles for matching)
export const AWARD_WINNING_BOOKS: AwardBook[] = [
  // Hugo & Nebula Double Winners
  { 
    title: 'Dune', 
    author: 'Frank Herbert',
    awards: [
      { type: 'hugo', year: 1966, category: 'Best Novel', isWinner: true },
      { type: 'nebula', year: 1966, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'The Left Hand of Darkness', 
    author: 'Ursula K. Le Guin',
    awards: [
      { type: 'hugo', year: 1970, category: 'Best Novel', isWinner: true },
      { type: 'nebula', year: 1969, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Ringworld', 
    author: 'Larry Niven',
    awards: [
      { type: 'hugo', year: 1971, category: 'Best Novel', isWinner: true },
      { type: 'nebula', year: 1970, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'The Gods Themselves', 
    author: 'Isaac Asimov',
    awards: [
      { type: 'hugo', year: 1973, category: 'Best Novel', isWinner: true },
      { type: 'nebula', year: 1972, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Rendezvous with Rama', 
    author: 'Arthur C. Clarke',
    awards: [
      { type: 'hugo', year: 1974, category: 'Best Novel', isWinner: true },
      { type: 'nebula', year: 1973, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'The Dispossessed', 
    author: 'Ursula K. Le Guin',
    awards: [
      { type: 'hugo', year: 1975, category: 'Best Novel', isWinner: true },
      { type: 'nebula', year: 1974, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'The Forever War', 
    author: 'Joe Haldeman',
    awards: [
      { type: 'hugo', year: 1976, category: 'Best Novel', isWinner: true },
      { type: 'nebula', year: 1975, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Gateway', 
    author: 'Frederik Pohl',
    awards: [
      { type: 'hugo', year: 1978, category: 'Best Novel', isWinner: true },
      { type: 'nebula', year: 1977, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Dreamsnake', 
    author: 'Vonda N. McIntyre',
    awards: [
      { type: 'hugo', year: 1979, category: 'Best Novel', isWinner: true },
      { type: 'nebula', year: 1978, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'The Fountains of Paradise', 
    author: 'Arthur C. Clarke',
    awards: [
      { type: 'hugo', year: 1980, category: 'Best Novel', isWinner: true },
      { type: 'nebula', year: 1979, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: "Ender's Game", 
    author: 'Orson Scott Card',
    awards: [
      { type: 'hugo', year: 1986, category: 'Best Novel', isWinner: true },
      { type: 'nebula', year: 1985, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Speaker for the Dead', 
    author: 'Orson Scott Card',
    awards: [
      { type: 'hugo', year: 1987, category: 'Best Novel', isWinner: true },
      { type: 'nebula', year: 1986, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Neuromancer', 
    author: 'William Gibson',
    awards: [
      { type: 'hugo', year: 1985, category: 'Best Novel', isWinner: true },
      { type: 'nebula', year: 1984, category: 'Best Novel', isWinner: true },
      { type: 'pkd', year: 1985, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Hyperion', 
    author: 'Dan Simmons',
    awards: [
      { type: 'hugo', year: 1990, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'American Gods', 
    author: 'Neil Gaiman',
    awards: [
      { type: 'hugo', year: 2002, category: 'Best Novel', isWinner: true },
      { type: 'nebula', year: 2002, category: 'Best Novel', isWinner: true }
    ]
  },
  
  // Hugo Winners
  { 
    title: 'Foundation', 
    author: 'Isaac Asimov',
    awards: [
      { type: 'hugo', year: 1966, category: 'Best All-Time Series', isWinner: true }
    ]
  },
  { 
    title: 'Starship Troopers', 
    author: 'Robert A. Heinlein',
    awards: [
      { type: 'hugo', year: 1960, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Stranger in a Strange Land', 
    author: 'Robert A. Heinlein',
    awards: [
      { type: 'hugo', year: 1962, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'The Moon is a Harsh Mistress', 
    author: 'Robert A. Heinlein',
    awards: [
      { type: 'hugo', year: 1967, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: "A Wizard of Earthsea", 
    author: 'Ursula K. Le Guin',
    awards: [
      { type: 'hugo', year: 1969, category: 'Best Novel', isWinner: false }
    ]
  },
  { 
    title: '2001: A Space Odyssey', 
    author: 'Arthur C. Clarke',
    awards: [
      { type: 'hugo', year: 1969, category: 'Best Novel', isWinner: false }
    ]
  },
  { 
    title: 'The Snow Queen', 
    author: 'Joan D. Vinge',
    awards: [
      { type: 'hugo', year: 1981, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Downbelow Station', 
    author: 'C. J. Cherryh',
    awards: [
      { type: 'hugo', year: 1982, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Startide Rising', 
    author: 'David Brin',
    awards: [
      { type: 'hugo', year: 1984, category: 'Best Novel', isWinner: true },
      { type: 'nebula', year: 1983, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'The Uplift War', 
    author: 'David Brin',
    awards: [
      { type: 'hugo', year: 1988, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'A Fire Upon the Deep', 
    author: 'Vernor Vinge',
    awards: [
      { type: 'hugo', year: 1993, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Green Mars', 
    author: 'Kim Stanley Robinson',
    awards: [
      { type: 'hugo', year: 1994, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Blue Mars', 
    author: 'Kim Stanley Robinson',
    awards: [
      { type: 'hugo', year: 1997, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Red Mars', 
    author: 'Kim Stanley Robinson',
    awards: [
      { type: 'nebula', year: 1993, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'The Diamond Age', 
    author: 'Neal Stephenson',
    awards: [
      { type: 'hugo', year: 1996, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Snow Crash', 
    author: 'Neal Stephenson',
    awards: [
      { type: 'hugo', year: 1993, category: 'Best Novel', isWinner: false }
    ]
  },

  // Nebula Winners
  { 
    title: 'Babel-17', 
    author: 'Samuel R. Delany',
    awards: [
      { type: 'nebula', year: 1966, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'The Einstein Intersection', 
    author: 'Samuel R. Delany',
    awards: [
      { type: 'nebula', year: 1967, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Rite of Passage', 
    author: 'Alexei Panshin',
    awards: [
      { type: 'nebula', year: 1968, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Flowers for Algernon', 
    author: 'Daniel Keyes',
    awards: [
      { type: 'nebula', year: 1966, category: 'Best Novel', isWinner: true },
      { type: 'hugo', year: 1966, category: 'Best Short Story', isWinner: true }
    ]
  },
  { 
    title: 'The Falling Woman', 
    author: 'Pat Murphy',
    awards: [
      { type: 'nebula', year: 1987, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Tehanu', 
    author: 'Ursula K. Le Guin',
    awards: [
      { type: 'nebula', year: 1990, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Parable of the Sower', 
    author: 'Octavia E. Butler',
    awards: [
      { type: 'nebula', year: 1995, category: 'Best Novel', isWinner: false }
    ]
  },
  { 
    title: 'Kindred', 
    author: 'Octavia E. Butler',
    awards: [
      { type: 'hugo', year: 1980, category: 'Best Novel', isWinner: false }
    ]
  },

  // Philip K. Dick Award Winners
  { 
    title: 'Do Androids Dream of Electric Sheep?', 
    author: 'Philip K. Dick',
    awards: [
      { type: 'pkd', year: 1968, category: 'Inspiration', isWinner: true }
    ]
  },
  { 
    title: 'Rudy Rucker', 
    author: 'Software',
    awards: [
      { type: 'pkd', year: 1983, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'The Wild Shore', 
    author: 'Kim Stanley Robinson',
    awards: [
      { type: 'pkd', year: 1984, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Homunculus', 
    author: 'James P. Blaylock',
    awards: [
      { type: 'pkd', year: 1986, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'In the Drift', 
    author: 'Michael Swanwick',
    awards: [
      { type: 'pkd', year: 1985, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Wetware', 
    author: 'Rudy Rucker',
    awards: [
      { type: 'pkd', year: 1988, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'The Steerswoman', 
    author: 'Rosemary Kirstein',
    awards: [
      { type: 'pkd', year: 1990, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Points of Departure', 
    author: 'Pat Murphy',
    awards: [
      { type: 'pkd', year: 1991, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Through the Arc of the Rain Forest', 
    author: 'Karen Tei Yamashita',
    awards: [
      { type: 'pkd', year: 1991, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Stations of the Tide', 
    author: 'Michael Swanwick',
    awards: [
      { type: 'nebula', year: 1991, category: 'Best Novel', isWinner: true }
    ]
  },
  
  // More classic winners
  { 
    title: 'A Canticle for Leibowitz', 
    author: 'Walter M. Miller Jr.',
    awards: [
      { type: 'hugo', year: 1961, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'The Man in the High Castle', 
    author: 'Philip K. Dick',
    awards: [
      { type: 'hugo', year: 1963, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Way Station', 
    author: 'Clifford D. Simak',
    awards: [
      { type: 'hugo', year: 1964, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Stand on Zanzibar', 
    author: 'John Brunner',
    awards: [
      { type: 'hugo', year: 1969, category: 'Best Novel', isWinner: true }
    ]
  },
  { 
    title: 'Slaughterhouse-Five', 
    author: 'Kurt Vonnegut',
    awards: [
      { type: 'hugo', year: 1970, category: 'Best Novel', isWinner: false }
    ]
  },
  { 
    title: "Cat's Cradle", 
    author: 'Kurt Vonnegut',
    awards: [
      { type: 'hugo', year: 1964, category: 'Best Novel', isWinner: false }
    ]
  },
  { 
    title: 'Fahrenheit 451', 
    author: 'Ray Bradbury',
    awards: [
      { type: 'hugo', year: 1954, category: 'Retro Hugo', isWinner: true }
    ]
  },
  { 
    title: 'The Martian Chronicles', 
    author: 'Ray Bradbury',
    awards: [
      { type: 'hugo', year: 1951, category: 'Retro Hugo', isWinner: false }
    ]
  },
  { 
    title: 'Brave New World', 
    author: 'Aldous Huxley',
    awards: [
      { type: 'hugo', year: 1933, category: 'Retro Hugo', isWinner: false }
    ]
  },
  { 
    title: '1984', 
    author: 'George Orwell',
    awards: [
      { type: 'hugo', year: 1949, category: 'Retro Hugo', isWinner: true }
    ]
  },
  { 
    title: 'Nineteen Eighty-Four', 
    author: 'George Orwell',
    awards: [
      { type: 'hugo', year: 1949, category: 'Retro Hugo', isWinner: true }
    ]
  }
];

/**
 * Normalize a title for matching (lowercase, remove punctuation, etc.)
 */
const normalizeTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[^a-z0-9\s']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Check if a book has won any major SF awards
 */
export const getBookAwards = (title: string, author?: string): SFAward[] => {
  const normalizedTitle = normalizeTitle(title);
  
  for (const book of AWARD_WINNING_BOOKS) {
    const normalizedBookTitle = normalizeTitle(book.title);
    
    // Exact title match
    if (normalizedBookTitle === normalizedTitle) {
      return book.awards;
    }
    
    // Partial match (for subtitles, series names, etc.)
    if (normalizedTitle.includes(normalizedBookTitle) || normalizedBookTitle.includes(normalizedTitle)) {
      // If author is provided, verify it matches
      if (author) {
        const normalizedAuthor = author.toLowerCase();
        const normalizedBookAuthor = book.author.toLowerCase();
        if (normalizedAuthor.includes(normalizedBookAuthor) || normalizedBookAuthor.includes(normalizedAuthor)) {
          return book.awards;
        }
      } else {
        return book.awards;
      }
    }
  }
  
  return [];
};

/**
 * Check if a book has any awards
 */
export const hasAwards = (title: string, author?: string): boolean => {
  return getBookAwards(title, author).length > 0;
};

/**
 * Get the most prestigious award for a book (for compact display)
 */
export const getPrimaryAward = (title: string, author?: string): SFAward | null => {
  const awards = getBookAwards(title, author);
  if (awards.length === 0) return null;
  
  // Prioritize: Winners > Nominees, then Hugo > Nebula > PKD
  const winners = awards.filter(a => a.isWinner);
  const pool = winners.length > 0 ? winners : awards;
  
  const priority: AwardType[] = ['hugo', 'nebula', 'pkd'];
  for (const type of priority) {
    const found = pool.find(a => a.type === type);
    if (found) return found;
  }
  
  return pool[0];
};
