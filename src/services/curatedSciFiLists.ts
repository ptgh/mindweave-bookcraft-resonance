// Curated sci-fi book lists with classic, contemporary, and outlier non-fiction titles

export interface CuratedBook {
  title: string;
  author: string;
  isbn?: string;
  category: string;
  reason?: string;
}

export const curatedSciFiBooks: CuratedBook[] = [
  // Classic Essential Sci-Fi
  { title: "Dune", author: "Frank Herbert", category: "Space Opera", reason: "Epic space opera masterpiece" },
  { title: "Foundation", author: "Isaac Asimov", category: "Space Opera", reason: "Classic foundation of sci-fi" },
  { title: "Neuromancer", author: "William Gibson", category: "Cyberpunk", reason: "Cyberpunk genre-defining" },
  { title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", category: "Social Science Fiction", reason: "Groundbreaking gender exploration" },
  { title: "Hyperion", author: "Dan Simmons", category: "Space Opera", reason: "Canterbury Tales in space" },
  { title: "Ender's Game", author: "Orson Scott Card", category: "Military Science Fiction", reason: "Strategic genius narrative" },
  { title: "The Forever War", author: "Joe Haldeman", category: "Military Science Fiction", reason: "Time dilation war story" },
  { title: "Snow Crash", author: "Neal Stephenson", category: "Cyberpunk", reason: "Metaverse origins" },
  { title: "The Handmaid's Tale", author: "Margaret Atwood", category: "Dystopian", reason: "Dystopian social commentary" },
  { title: "Fahrenheit 451", author: "Ray Bradbury", category: "Dystopian", reason: "Censorship and literature" },
  
  // Wikipedia 100 Best Additions
  { title: "The Stars My Destination", author: "Alfred Bester", category: "Space Opera", reason: "Teleportation revenge saga" },
  { title: "A Canticle for Leibowitz", author: "Walter M. Miller Jr.", category: "Post-Apocalyptic", reason: "Cyclical civilization" },
  { title: "Flowers for Algernon", author: "Daniel Keyes", category: "Social Science Fiction", reason: "Intelligence and humanity" },
  { title: "Do Androids Dream of Electric Sheep?", author: "Philip K. Dick", category: "Dystopian", reason: "What makes us human" },
  { title: "The Dispossessed", author: "Ursula K. Le Guin", category: "Anarchist Science Fiction", reason: "Anarchist utopia exploration" },
  { title: "Stand on Zanzibar", author: "John Brunner", category: "Dystopian", reason: "Overpopulation masterpiece" },
  { title: "A Clockwork Orange", author: "Anthony Burgess", category: "Dystopian", reason: "Free will and violence" },
  { title: "The Man in the High Castle", author: "Philip K. Dick", category: "Alternate History", reason: "Axis victory alternate history" },
  { title: "Cat's Cradle", author: "Kurt Vonnegut", category: "Satire", reason: "Science and religion satire" },
  { title: "The Female Man", author: "Joanna Russ", category: "Feminist Science Fiction", reason: "Parallel worlds feminism" },
  { title: "Tau Zero", author: "Poul Anderson", category: "Hard Science Fiction", reason: "Relativistic space travel" },
  { title: "Riddley Walker", author: "Russell Hoban", category: "Post-Apocalyptic", reason: "Linguistic post-apocalypse" },
  { title: "The Shadow of the Torturer", author: "Gene Wolfe", category: "Dying Earth", reason: "Literary dying earth" },
  { title: "Wild Seed", author: "Octavia E. Butler", category: "Science Fantasy", reason: "Immortality and power" },
  { title: "Timescape", author: "Gregory Benford", category: "Hard Science Fiction", reason: "Time communication physics" },
  { title: "The End of Eternity", author: "Isaac Asimov", category: "Time Travel", reason: "Time manipulation paradox" },
  { title: "The Sirens of Titan", author: "Kurt Vonnegut", category: "Space Opera", reason: "Cosmic purposelessness" },
  { title: "Way Station", author: "Clifford D. Simak", category: "First Contact", reason: "Rural alien waystation" },
  { title: "The Drowned World", author: "J. G. Ballard", category: "Climate Fiction", reason: "Climate catastrophe vision" },
  { title: "Crash", author: "J. G. Ballard", category: "New Wave", reason: "Technology and sexuality" },
  { title: "High Rise", author: "J. G. Ballard", category: "Social Science Fiction", reason: "Class warfare architecture" },
  { title: "The Crystal World", author: "J. G. Ballard", category: "New Wave", reason: "Crystallization apocalypse" },
  { title: "The Wanderer", author: "Fritz Leiber", category: "Space Opera", reason: "Rogue planet disaster" },
  { title: "Nova", author: "Samuel R. Delany", category: "Space Opera", reason: "Quest in far future" },
  { title: "Engine Summer", author: "John Crowley", category: "Post-Apocalyptic", reason: "Pastoral post-collapse" },
  
  // Contemporary Excellence
  { title: "The Three-Body Problem", author: "Liu Cixin", category: "Hard Science Fiction", reason: "Chinese sci-fi breakthrough" },
  { title: "Ancillary Justice", author: "Ann Leckie", category: "Space Opera", reason: "AI consciousness exploration" },
  { title: "The Expanse: Leviathan Wakes", author: "James S.A. Corey", category: "Space Opera", reason: "Modern space opera excellence" },
  { title: "Children of Time", author: "Adrian Tchaikovsky", category: "Evolutionary Science Fiction", reason: "Spider evolution narrative" },
  { title: "Project Hail Mary", author: "Andy Weir", category: "Hard Science Fiction", reason: "Problem-solving adventure" },
  { title: "A Memory Called Empire", author: "Arkady Martine", category: "Space Opera", reason: "Linguistic imperialism" },
  { title: "The Fifth Season", author: "N.K. Jemisin", category: "Apocalyptic", reason: "Seismic world-building" },
  { title: "Blindsight", author: "Peter Watts", category: "Hard Science Fiction", reason: "Consciousness examination" },
  { title: "Station Eleven", author: "Emily St. John Mandel", category: "Post-Apocalyptic", reason: "Art after collapse" },
  { title: "The Power", author: "Naomi Alderman", category: "Social Science Fiction", reason: "Gender power dynamics" },
  
  // Mind-Bending & Philosophical
  { title: "Solaris", author: "Stanisław Lem", category: "Philosophical Science Fiction", reason: "Alien consciousness mystery" },
  { title: "Permutation City", author: "Greg Egan", category: "Hard Science Fiction", reason: "Digital consciousness" },
  { title: "Diaspora", author: "Greg Egan", category: "Hard Science Fiction", reason: "Post-human civilization" },
  { title: "The Book of the New Sun", author: "Gene Wolfe", category: "Dying Earth", reason: "Literary dying earth" },
  { title: "Embassytown", author: "China Miéville", category: "Linguistic Science Fiction", reason: "Language and reality" },
  
  // Near Future & Speculative
  { title: "Klara and the Sun", author: "Kazuo Ishiguro", category: "AI Fiction", reason: "AI perspective narrative" },
  { title: "The Ministry for the Future", author: "Kim Stanley Robinson", category: "Climate Fiction", reason: "Climate action speculation" },
  { title: "Parable of the Sower", author: "Octavia Butler", category: "Dystopian", reason: "Societal collapse foresight" },
  { title: "Annihilation", author: "Jeff VanderMeer", category: "New Weird", reason: "Ecological horror" },
  { title: "The Windup Girl", author: "Paolo Bacigalupi", category: "Biopunk", reason: "Biotech dystopia" },
  
  // Outlier Non-Fiction (Science & Futurism)
  { title: "The Demon-Haunted World", author: "Carl Sagan", category: "Science", reason: "Scientific thinking defense" },
  { title: "Life 3.0", author: "Max Tegmark", category: "AI Philosophy", reason: "AI future scenarios" },
  { title: "The Sixth Extinction", author: "Elizabeth Kolbert", category: "Environmental Science", reason: "Mass extinction analysis" },
  { title: "Sapiens", author: "Yuval Noah Harari", category: "Human History", reason: "Human species overview" },
  { title: "The Gene", author: "Siddhartha Mukherjee", category: "Genetics", reason: "Genetic history narrative" },
  { title: "Superintelligence", author: "Nick Bostrom", category: "AI Philosophy", reason: "AI risk examination" },
  { title: "The Innovators", author: "Walter Isaacson", category: "Technology History", reason: "Digital age pioneers" },
  { title: "Weapons of Math Destruction", author: "Cathy O'Neil", category: "Data Science", reason: "Algorithm ethics" },
  { title: "The Signal and the Noise", author: "Nate Silver", category: "Statistics", reason: "Prediction science" },
  { title: "Behave", author: "Robert Sapolsky", category: "Neuroscience", reason: "Human behavior biology" }
];

// Get random curated books
export const getRandomCuratedBooks = (count: number = 12): CuratedBook[] => {
  const shuffled = [...curatedSciFiBooks].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Get books by category
export const getCuratedBooksByCategory = (category: string, count: number = 8): CuratedBook[] => {
  const filtered = curatedSciFiBooks.filter(book => 
    book.category.toLowerCase().includes(category.toLowerCase())
  );
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Mix curated with search results
export const getMixedBookSelection = (curatedCount: number = 6): CuratedBook[] => {
  return getRandomCuratedBooks(curatedCount);
};
