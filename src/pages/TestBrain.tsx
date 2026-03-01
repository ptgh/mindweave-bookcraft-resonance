import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { getTransmissions, Transmission } from '@/services/transmissionsService';
import { supabase } from '@/integrations/supabase/client';
import BrainChatInterface from '@/components/BrainChatInterface';
import Header from '@/components/Header';
import NeuralMapBottomSheet from '@/components/NeuralMapBottomSheet';
import NeuralMapEmptyState from '@/components/NeuralMapEmptyState';
import EntityCard from '@/components/neural-map/EntityCard';
import ERFilterSidebar from '@/components/neural-map/ERFilterSidebar';
import ERConnectionLines from '@/components/neural-map/ERConnectionLines';
import { usePatternRecognition } from '@/hooks/usePatternRecognition';
import { useNeuralMapConnections } from '@/hooks/useNeuralMapConnections';
import { filterConceptualTags, AUTHOR_GENRE_MAP } from '@/constants/conceptualTags';
import { Filter, HelpCircle, Search, X } from 'lucide-react';
import { createPortal } from 'react-dom';

export type NodeType = 'book' | 'author' | 'protagonist';

export interface BrainNode {
  id: string;
  title: string;
  author: string;
  tags: string[];
  contextTags: string[];
  x: number;
  y: number;
  coverUrl?: string;
  description?: string;
  element?: HTMLElement;
  transmissionId: number;
  nodeType: NodeType;
  authorId?: string;
  bookTitle?: string;
}

export interface BookLink {
  fromId: string;
  toId: string;
  type: 'tag_shared' | 'author_shared' | 'title_similarity' | 'manual';
  strength: number;
  sharedTags: string[];
  connectionReason: string;
}

const TestBrain = () => {
  const [nodes, setNodes] = useState<BrainNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<BrainNode | null>(null);
  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [selectedAuthors, setSelectedAuthors] = useState<Set<string>>(new Set());
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());
  const [showAuthors, setShowAuthors] = useState(true);
  const [showProtagonists, setShowProtagonists] = useState(true);

  const columnsRef = useRef<HTMLDivElement>(null);

  // Chat state
  const [chatHighlights, setChatHighlights] = useState<{
    nodeIds: string[];
    linkIds: string[];
    tags: string[];
  }>({ nodeIds: [], linkIds: [], tags: [] });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { clusters, bridges, getBookClusters } = usePatternRecognition(transmissions);

  // Initialize brain data
  useEffect(() => {
    const initBrain = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedTransmissions = await getTransmissions();
        setTransmissions(fetchedTransmissions);
        if (!fetchedTransmissions || fetchedTransmissions.length === 0) { setLoading(false); return; }

        const uniqueAuthors = [...new Set(fetchedTransmissions.map(t => t.author).filter(Boolean))];
        const { data: authorRows } = await supabase
          .from('scifi_authors')
          .select('id, name, portrait_url, bio, nationality, birth_year, death_year')
          .in('name', uniqueAuthors);
        const authorMap = new Map<string, { id: string; portrait_url: string | null; bio: string | null }>();
        (authorRows || []).forEach(a => authorMap.set(a.name, { id: a.id, portrait_url: a.portrait_url, bio: a.bio }));

        const protagonistMap = new Map<string, { name: string; portrait_url: string | null; bookTitle: string; author: string; intro: string | null }>();
        fetchedTransmissions.forEach(t => {
          if (t.protagonist && t.protagonist.trim() !== '' && t.protagonist !== t.author) {
            if (!protagonistMap.has(t.protagonist)) {
              protagonistMap.set(t.protagonist, { name: t.protagonist, portrait_url: t.protagonist_portrait_url || null, bookTitle: t.title, author: t.author, intro: t.protagonist_intro || null });
            }
          }
        });

        const bookNodes: BrainNode[] = fetchedTransmissions.map((t) => ({
          id: `transmission-${t.id}`,
          title: t.title || 'Unknown Title',
          author: t.author || 'Unknown Author',
          tags: filterConceptualTags(Array.isArray(t.tags) ? t.tags : []),
          contextTags: Array.isArray(t.historical_context_tags) ? t.historical_context_tags : [],
          x: 0, y: 0,
          coverUrl: t.cover_url,
          description: t.notes,
          transmissionId: t.id,
          nodeType: 'book' as NodeType,
        }));

        const authorNodes: BrainNode[] = [];
        const addedAuthors = new Set<string>();
        bookNodes.forEach(b => {
          if (addedAuthors.has(b.author) || b.author === 'Unknown Author') return;
          addedAuthors.add(b.author);
          const authorData = authorMap.get(b.author);
          const authorBooks = bookNodes.filter(bn => bn.author === b.author);
          authorNodes.push({
            id: `author-${b.author}`,
            title: b.author,
            author: b.author,
            tags: [...new Set(authorBooks.flatMap(bn => bn.tags))].slice(0, 3),
            contextTags: [],
            x: 0, y: 0,
            coverUrl: authorData?.portrait_url || undefined,
            description: authorData?.bio || undefined,
            transmissionId: 0,
            nodeType: 'author' as NodeType,
            authorId: authorData?.id,
          });
        });

        const protagonistNodes: BrainNode[] = [];
        protagonistMap.forEach((pData, name) => {
          protagonistNodes.push({
            id: `protagonist-${name}`,
            title: name,
            author: pData.author,
            tags: [],
            contextTags: [],
            x: 0, y: 0,
            coverUrl: pData.portrait_url || undefined,
            description: pData.intro || `Protagonist of "${pData.bookTitle}"`,
            transmissionId: 0,
            nodeType: 'protagonist' as NodeType,
            bookTitle: pData.bookTitle,
          });
        });

        setNodes([...bookNodes, ...authorNodes, ...protagonistNodes]);
        setLoading(false);
      } catch (err) {
        console.error('Error initializing brain:', err);
        setError(err instanceof Error ? err.message : 'Failed to load transmissions');
        setLoading(false);
      }
    };
    initBrain();
  }, []);

  // Derived data
  const bookNodes = useMemo(() => nodes.filter(n => n.nodeType === 'book'), [nodes]);
  const authorNodes = useMemo(() => nodes.filter(n => n.nodeType === 'author'), [nodes]);
  const protagonistNodes = useMemo(() => nodes.filter(n => n.nodeType === 'protagonist'), [nodes]);

  // Authors list for filter
  const authorsList = useMemo(() =>
    authorNodes.map(a => ({
      id: a.id,
      name: a.title,
      bookCount: bookNodes.filter(b => b.author === a.title).length,
    })).sort((a, b) => b.bookCount - a.bookCount),
    [authorNodes, bookNodes]
  );

  // Themes list for filter
  const themesList = useMemo(() => {
    const counts = new Map<string, number>();
    bookNodes.forEach(b => b.tags.forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [bookNodes]);

  // Filtering logic
  const filteredBookNodes = useMemo(() => {
    let books = bookNodes;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      books = books.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
    }
    if (selectedAuthors.size > 0) {
      const authorNames = new Set(authorNodes.filter(a => selectedAuthors.has(a.id)).map(a => a.title));
      books = books.filter(b => authorNames.has(b.author));
    }
    if (selectedThemes.size > 0) {
      books = books.filter(b => b.tags.some(t => selectedThemes.has(t)));
    }
    return books;
  }, [bookNodes, selectedAuthors, selectedThemes, authorNodes, searchQuery]);

  const filteredAuthorNodes = useMemo(() => {
    if (!showAuthors) return [];
    let authors = authorNodes;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      authors = authors.filter(a => a.title.toLowerCase().includes(q));
    }
    const relevantAuthors = new Set(filteredBookNodes.map(b => b.author));
    return authors.filter(a => relevantAuthors.has(a.title) || (searchQuery.trim() && a.title.toLowerCase().includes(searchQuery.toLowerCase())));
  }, [authorNodes, filteredBookNodes, showAuthors, searchQuery]);

  const filteredProtagonistNodes = useMemo(() => {
    if (!showProtagonists) return [];
    let prots = protagonistNodes;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      prots = prots.filter(p => p.title.toLowerCase().includes(q) || p.author.toLowerCase().includes(q));
    }
    const relevantBooks = new Set(filteredBookNodes.map(b => b.title));
    return prots.filter(p => (p.bookTitle && relevantBooks.has(p.bookTitle)) || (searchQuery.trim() && p.title.toLowerCase().includes(searchQuery.toLowerCase())));
  }, [protagonistNodes, filteredBookNodes, showProtagonists, searchQuery]);

  // Group books by primary tag
  const booksByTheme = useMemo(() => {
    const groups = new Map<string, BrainNode[]>();
    filteredBookNodes.forEach(b => {
      const primaryTag = b.tags[0] || AUTHOR_GENRE_MAP[b.author] || 'Unclassified Signals';
      if (!groups.has(primaryTag)) groups.set(primaryTag, []);
      groups.get(primaryTag)!.push(b);
    });
    // Sort groups by size
    return Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filteredBookNodes]);

  // Group protagonists by author
  const protagonistsByAuthor = useMemo(() => {
    const groups = new Map<string, BrainNode[]>();
    filteredProtagonistNodes.forEach(p => {
      const key = p.author || 'Unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    });
    return Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filteredProtagonistNodes]);

  // All visible nodes for connections hook
  const allVisibleNodes = useMemo(() => [
    ...filteredBookNodes,
    ...filteredAuthorNodes,
    ...filteredProtagonistNodes,
  ], [filteredBookNodes, filteredAuthorNodes, filteredProtagonistNodes]);

  const {
    edges: computedEdges,
    getDirectNeighbors,
    getTopRelated,
    getConnectionBreakdown,
    getEdgeData,
  } = useNeuralMapConnections(allVisibleNodes, null);

  const links = useMemo(() => computedEdges as unknown as BookLink[], [computedEdges]);

  // SVG connection definitions for ER lines
  const erConnections = useMemo(() => {
    const conns: { fromCardId: string; toCardId: string; label: string; color: string; dashed?: boolean }[] = [];

    // Author → theme group (via books)
    filteredAuthorNodes.forEach(author => {
      const authorBooks = filteredBookNodes.filter(b => b.author === author.title);
      const themes = new Set(authorBooks.flatMap(b => b.tags));
      themes.forEach(theme => {
        conns.push({
          fromCardId: `card-author-${author.title}`,
          toCardId: `card-theme-${theme}`,
          label: 'Wrote',
          color: '#fbbf24',
        });
      });
    });

    // Theme group → protagonist group (via books)
    protagonistsByAuthor.forEach(([authorName]) => {
      const authorBooks = filteredBookNodes.filter(b => b.author === authorName);
      const themes = new Set(authorBooks.flatMap(b => b.tags));
      themes.forEach(theme => {
        conns.push({
          fromCardId: `card-theme-${theme}`,
          toCardId: `card-prot-${authorName}`,
          label: 'Appears In',
          color: '#c084fc',
          dashed: true,
        });
      });
    });

    return conns;
  }, [filteredAuthorNodes, filteredBookNodes, protagonistsByAuthor]);

  // Filter handlers
  const handleToggleAuthor = useCallback((id: string) => {
    setSelectedAuthors(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleToggleTheme = useCallback((tag: string) => {
    setSelectedThemes(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedAuthors(new Set());
    setSelectedThemes(new Set());
    setShowAuthors(true);
    setShowProtagonists(true);
  }, []);

  const handleChatHighlight = useCallback((highlights: { nodeIds: string[]; linkIds: string[]; tags: string[] }) => {
    setChatHighlights(highlights);
    setTimeout(() => setChatHighlights({ nodeIds: [], linkIds: [], tags: [] }), 10000);
  }, []);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-cyan-400/50 animate-pulse" />
            <p className="text-slate-300 text-lg font-medium mb-2">Initializing Neural Consciousness</p>
            <p className="text-slate-400 text-sm">Mapping your literary connections...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <p className="text-slate-300 text-lg font-medium mb-2">Signal Interrupted</p>
            <p className="text-slate-400 text-sm mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg hover:border-cyan-400/50 transition-all">
              Reconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Header />
        <NeuralMapEmptyState nodeCount={0} edgeCount={0} isFiltered={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Shared header row — one continuous line */}
        <div className="flex-shrink-0 flex border-b border-cyan-400/10 bg-slate-900 z-10">
          {/* Sidebar header */}
          {!isMobile && (
            <div className="w-64 flex-shrink-0 flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-cyan-400/70" />
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Filter Key</span>
              </div>
              <div className="flex items-center gap-2">
                {(selectedAuthors.size > 0 || selectedThemes.size > 0 || !showAuthors || !showProtagonists) && (
                  <button onClick={handleClearAll} className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors px-2 py-0.5 bg-cyan-400/10 rounded-full">
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
          {/* Main stats bar */}
          <div className="flex-1 flex items-center gap-3 px-3 py-2">
            {isMobile && (
              <button onClick={() => setShowMobileFilter(true)} className="p-1.5 rounded-lg border border-slate-700/50 hover:border-cyan-400/30 text-slate-400 hover:text-cyan-400 transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            )}
            {/* Search */}
            <div className="relative flex-shrink-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search authors, books, characters..."
                className="w-48 sm:w-56 pl-8 pr-7 py-1.5 text-xs bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:border-cyan-400/40 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-[11px] text-slate-400 hidden sm:inline">Consciousness Network</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 ml-auto">
              <span><strong className="text-slate-300">{filteredBookNodes.length}</strong> books</span>
              <span><strong className="text-slate-300">{filteredAuthorNodes.length}</strong> authors</span>
              <span><strong className="text-slate-300">{filteredProtagonistNodes.length}</strong> chars</span>
              <span className="hidden sm:inline"><strong className="text-slate-300">{computedEdges.length}</strong> links</span>
            </div>
          </div>
        </div>

        {/* Content row — sidebar + main scroll independently */}
        <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar - scrollable content only */}
        {!isMobile && (
          <aside className="w-64 flex-shrink-0 border-r border-cyan-400/10 bg-slate-900/50 backdrop-blur-sm overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <ERFilterSidebar
              authors={authorsList}
              themes={themesList}
              selectedAuthors={selectedAuthors}
              selectedThemes={selectedThemes}
              showAuthors={showAuthors}
              showProtagonists={showProtagonists}
              onToggleAuthor={handleToggleAuthor}
              onToggleTheme={handleToggleTheme}
              onToggleShowAuthors={setShowAuthors}
              onToggleShowProtagonists={setShowProtagonists}
              onClearAll={handleClearAll}
              hideHeader
            />
          </aside>
        )}

        {/* Main content — three-column ER diagram */}
        <main ref={columnsRef} className="flex-1 relative overflow-x-auto overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

          {/* SVG connection lines (desktop only) */}
          {!isMobile && <ERConnectionLines connections={erConnections} containerRef={columnsRef} />}

          {/* Three-column grid */}
          <div className={`relative z-[2] p-4 ${isMobile ? 'space-y-6' : 'grid grid-cols-3 gap-6'}`}>
            {/* LEFT: Authors */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <h2 className="text-xs font-semibold text-amber-300/80 uppercase tracking-wider">Authors</h2>
              </div>
              {filteredAuthorNodes.length === 0 && (
                <p className="text-xs text-slate-600 italic px-2">No authors visible</p>
              )}
              {filteredAuthorNodes.map((author, i) => {
                const authorBooks = filteredBookNodes.filter(b => b.author === author.title);
                return (
                  <EntityCard
                    key={author.id}
                    id={`card-author-${author.title}`}
                    title={author.title}
                    type="author"
                    items={[author, ...authorBooks]}
                    onItemClick={(node) => setSelectedNode(node)}
                    animationDelay={i * 0.08}
                  />
                );
              })}
            </div>

            {/* CENTER: Books by theme */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <h2 className="text-xs font-semibold text-cyan-300/80 uppercase tracking-wider">Books by Theme</h2>
              </div>
              {booksByTheme.length === 0 && (
                <p className="text-xs text-slate-600 italic px-2">No books match filters</p>
              )}
              {booksByTheme.map(([theme, books], i) => (
                <EntityCard
                  key={theme}
                  id={`card-theme-${theme}`}
                  title={theme}
                  type="book"
                  items={books}
                  onItemClick={(node) => setSelectedNode(node)}
                  animationDelay={0.1 + i * 0.08}
                />
              ))}
            </div>

            {/* RIGHT: Protagonists */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <h2 className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider">Protagonists</h2>
              </div>
              {protagonistsByAuthor.length === 0 && (
                <p className="text-xs text-slate-600 italic px-2">No protagonists visible</p>
              )}
              {protagonistsByAuthor.map(([authorName, prots], i) => (
                <EntityCard
                  key={authorName}
                  id={`card-prot-${authorName}`}
                  title={`${authorName}'s Characters`}
                  type="protagonist"
                  items={prots}
                  onItemClick={(node) => setSelectedNode(node)}
                  animationDelay={0.2 + i * 0.08}
                />
              ))}
            </div>
          </div>
        </main>
        </div>
      </div>

      {/* Mobile filter bottom sheet */}
      {isMobile && showMobileFilter && createPortal(
        <div className="fixed inset-0 z-[90]" onClick={(e) => { if (e.target === e.currentTarget) setShowMobileFilter(false); }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileFilter(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-slate-900/95 border-t border-cyan-400/20 rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-600/60 rounded-full" />
            </div>
            <ERFilterSidebar
              authors={authorsList}
              themes={themesList}
              selectedAuthors={selectedAuthors}
              selectedThemes={selectedThemes}
              showAuthors={showAuthors}
              showProtagonists={showProtagonists}
              onToggleAuthor={handleToggleAuthor}
              onToggleTheme={handleToggleTheme}
              onToggleShowAuthors={setShowAuthors}
              onToggleShowProtagonists={setShowProtagonists}
              onClearAll={handleClearAll}
              onClose={() => setShowMobileFilter(false)}
              isMobile
            />
          </div>
        </div>,
        document.body
      )}

      {/* Neural Assistant */}
      <BrainChatInterface
        nodes={allVisibleNodes}
        links={links}
        activeFilters={[...selectedAuthors, ...selectedThemes]}
        onHighlight={handleChatHighlight}
      />

      {/* Bottom Sheet */}
      {selectedNode && (
        <NeuralMapBottomSheet
          node={selectedNode}
          allNodes={nodes}
          connectionBreakdown={getConnectionBreakdown(selectedNode.id)}
          topRelated={getTopRelated(selectedNode.id, 4)}
          typedConnections={(() => {
            const neighbors = getTopRelated(selectedNode.id, 10);
            return neighbors.map(({ nodeId }) => {
              const edgeData = getEdgeData(selectedNode.id, nodeId);
              const neighbor = nodes.find(n => n.id === nodeId);
              if (!edgeData || !neighbor) return null;
              const reason = edgeData.reasons[0];
              let label = '';
              if (reason === 'same_author') label = 'Same author as';
              else if (reason === 'shared_theme') label = `Shares ${edgeData.sharedTags[0] || 'theme'} with`;
              else if (reason === 'shared_subgenre') label = `Shares ${edgeData.sharedTags[0] || 'subgenre'} with`;
              else if (reason === 'shared_era') label = 'Same era as';
              else label = 'Connected to';
              return { nodeId, label, nodeTitle: neighbor.title };
            }).filter(Boolean) as Array<{ nodeId: string; label: string; nodeTitle: string }>;
          })()}
          onClose={() => setSelectedNode(null)}
          onFocusNetwork={() => setSelectedNode(null)}
          onSelectRelated={(nodeId) => {
            const relatedNode = nodes.find(n => n.id === nodeId);
            if (relatedNode) setSelectedNode(relatedNode);
          }}
          onSelectBook={(bookTitle) => {
            const bookNode = nodes.find(n => n.nodeType === 'book' && n.title === bookTitle);
            if (bookNode) setSelectedNode(bookNode);
          }}
        />
      )}
    </div>
  );
};

export default TestBrain;
