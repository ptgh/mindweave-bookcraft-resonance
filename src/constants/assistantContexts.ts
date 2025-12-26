// Page-specific AI assistant contexts for the global floating Neural Assistant

export interface PageContext {
  pageId: string;
  pageName: string;
  description: string;
  systemContextAddition: string;
  quickActions: {
    label: string;
    prompt: string;
  }[];
}

export const PAGE_CONTEXTS: Record<string, PageContext> = {
  '/': {
    pageId: 'discovery',
    pageName: 'Discovery',
    description: 'Main discovery hub with featured content and recommendations',
    systemContextAddition: `The user is on the DISCOVERY page, the main hub of leafnode. This page shows featured content, trending books, and personalized recommendations. Help them discover new SF books, explore trends, and navigate to other features.`,
    quickActions: [
      { label: 'What should I read next?', prompt: 'Based on my reading patterns, what SF book should I read next?' },
      { label: 'Trending themes', prompt: 'What SF themes are trending in my collection?' },
      { label: 'Hidden gems', prompt: 'Are there any underappreciated classics I might enjoy?' },
    ]
  },
  '/library': {
    pageId: 'library',
    pageName: 'Library',
    description: 'Personal book collection overview',
    systemContextAddition: `The user is viewing their LIBRARY page which shows their entire book collection. Help them explore, organize, and understand their collection.`,
    quickActions: [
      { label: 'Collection overview', prompt: 'Give me an overview of my SF collection.' },
      { label: 'Add a book', prompt: 'I want to add a book to my library.' },
      { label: 'Reading stats', prompt: 'What are my reading statistics?' },
    ]
  },
  '/book-browser': {
    pageId: 'book-browser',
    pageName: 'Signal Browser',
    description: 'Browse and search transmissions',
    systemContextAddition: `The user is on the SIGNAL BROWSER page where they can browse, search, and filter their book transmissions. Help them find specific books, suggest filters, and manage their collection.`,
    quickActions: [
      { label: 'Search for a book', prompt: 'Help me find a specific book in my collection.' },
      { label: 'Filter suggestions', prompt: 'What filters would help me explore my collection better?' },
      { label: 'Add new book', prompt: 'I want to add a new book to my transmissions.' },
    ]
  },
  '/test-brain': {
    pageId: 'neural-map',
    pageName: 'Neural Map',
    description: '3D visualization of reading network',
    systemContextAddition: `The user is on the NEURAL MAP page, the interactive 3D visualization of their reading network. Books appear as nodes, connections show thematic relationships. Help them understand patterns, clusters, and bridges in their reading network.`,
    quickActions: [
      { label: 'What patterns do you see?', prompt: 'What patterns do you see in my neural map?' },
      { label: 'Find strongest clusters', prompt: 'What are the strongest thematic clusters in my reading network?' },
      { label: 'Identify bridge books', prompt: 'Which books act as bridges between different themes?' },
    ]
  },
  '/author-matrix': {
    pageId: 'author-matrix',
    pageName: 'Author Matrix',
    description: 'Explore SF authors and influences',
    systemContextAddition: `The user is on the AUTHOR MATRIX page, exploring science fiction authors, their works, influences, and connections. Help them discover authors, understand literary influences, and explore the SF author network.`,
    quickActions: [
      { label: 'Author connections', prompt: 'Which authors in my collection have influenced each other?' },
      { label: 'Discover new authors', prompt: 'Based on my reading, which SF authors should I explore?' },
      { label: 'Author deep dive', prompt: 'Tell me about a notable SF author and their impact.' },
    ]
  },
  '/publisher-resonance': {
    pageId: 'publisher-resonance',
    pageName: 'Publisher Resonance',
    description: 'Curated publisher series like Penguin SF',
    systemContextAddition: `The user is on the PUBLISHER RESONANCE page, exploring curated publisher series like Penguin Science Fiction. Help them discover classic SF through publisher curation, understand series themes, and find notable editions.`,
    quickActions: [
      { label: 'Penguin classics', prompt: 'What are the must-read books from the Penguin SF Masterworks series?' },
      { label: 'Publisher collections', prompt: 'What publisher series would complement my collection?' },
      { label: 'Classic editions', prompt: 'Which classic SF editions are worth seeking out?' },
    ]
  },
  '/insights': {
    pageId: 'insights',
    pageName: 'Reading Insights',
    description: 'AI-generated reading analysis',
    systemContextAddition: `The user is on the READING INSIGHTS page, viewing AI-generated analysis of their reading habits and patterns. Help them understand their reading behavior, trends, and provide personalized insights.`,
    quickActions: [
      { label: 'Reading patterns', prompt: 'What does my reading pattern reveal about my preferences?' },
      { label: 'Genre evolution', prompt: 'How have my genre preferences evolved over time?' },
      { label: 'Theme analysis', prompt: 'What themes am I consistently drawn to?' },
    ]
  },
  '/community': {
    pageId: 'community',
    pageName: 'Community',
    description: 'Connect with other SF readers',
    systemContextAddition: `The user is on the COMMUNITY page, connecting with other science fiction readers, sharing recommendations, and participating in discussions. Help them engage with the community and find like-minded readers.`,
    quickActions: [
      { label: 'Find readers', prompt: 'Help me find readers with similar tastes.' },
      { label: 'Discussion topics', prompt: 'What SF topics are being discussed in the community?' },
      { label: 'Share a book', prompt: 'I want to share a book recommendation with the community.' },
    ]
  },
  '/search': {
    pageId: 'search',
    pageName: 'Search',
    description: 'Natural language book search',
    systemContextAddition: `The user is on the SEARCH page, using natural language to find books. Help them formulate search queries, understand results, and discover books that match their interests.`,
    quickActions: [
      { label: 'Search help', prompt: 'How can I search for books effectively?' },
      { label: 'Similar books', prompt: 'Find books similar to my favorites.' },
      { label: 'Theme search', prompt: 'Help me search for books with specific themes.' },
    ]
  }
};

export function getPageContext(pathname: string): PageContext {
  // Check for exact match first
  if (PAGE_CONTEXTS[pathname]) {
    return PAGE_CONTEXTS[pathname];
  }
  
  // Default context for unknown pages
  return {
    pageId: 'general',
    pageName: 'Leafnode',
    description: 'Science fiction library and knowledge graph',
    systemContextAddition: `The user is exploring leafnode. Help them navigate the application, discover SF books, and manage their reading collection.`,
    quickActions: [
      { label: 'What can you do?', prompt: 'What can you help me with as the Neural Assistant?' },
      { label: 'Explore features', prompt: 'What features does leafnode offer?' },
      { label: 'Add a book', prompt: 'I want to add a book to my library.' },
    ]
  };
}
