import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { BookOpen, Pen, User } from 'lucide-react';
import { NodeType, BrainNode } from '@/pages/TestBrain';
import { TAG_DESCRIPTIONS } from '@/constants/conceptualTags';

interface EntityCardProps {
  title: string;
  type: NodeType;
  items: BrainNode[];
  onItemClick: (node: BrainNode) => void;
  animationDelay?: number;
  id?: string;
}

const TYPE_CONFIG = {
  book: {
    borderClass: 'border-cyan-400/25',
    headerBg: 'bg-cyan-950/40',
    headerText: 'text-cyan-300',
    thumbBorder: 'border-cyan-400/40',
    icon: BookOpen,
    accentDot: 'bg-cyan-400',
  },
  author: {
    borderClass: 'border-amber-400/25',
    headerBg: 'bg-amber-950/30',
    headerText: 'text-amber-300',
    thumbBorder: 'border-amber-400/40',
    icon: Pen,
    accentDot: 'bg-amber-400',
  },
  protagonist: {
    borderClass: 'border-purple-400/25',
    headerBg: 'bg-purple-950/30',
    headerText: 'text-purple-300',
    thumbBorder: 'border-purple-400/40',
    icon: User,
    accentDot: 'bg-purple-400',
  },
};

const EntityCard = ({ title, type, items, onItemClick, animationDelay = 0, id }: EntityCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 20, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, delay: animationDelay, ease: 'power2.out' }
      );
    }
  }, [animationDelay]);

  const triggerRef = useRef<HTMLButtonElement>(null);

  // Dismiss tooltip on outside click (excluding the trigger button)
  useEffect(() => {
    if (!showTooltip) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return; // let toggle handle it
      if (tooltipRef.current && !tooltipRef.current.contains(target)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener('mousedown', handler);
    const timer = setTimeout(() => setShowTooltip(false), 8000);
    return () => { document.removeEventListener('mousedown', handler); clearTimeout(timer); };
  }, [showTooltip]);

  // Build tooltip content based on type
  const getTooltipContent = () => {
    if (type === 'book') {
      const desc = TAG_DESCRIPTIONS[title];
      if (desc) return { label: title, detail: desc };
      return { label: title, detail: `${items.length} book${items.length !== 1 ? 's' : ''} in this category` };
    }
    if (type === 'author') {
      // First item is the author node itself
      const authorNode = items.find(n => n.nodeType === 'author');
      const bookCount = items.filter(n => n.nodeType === 'book').length;
      const bio = authorNode?.description;
      const snippet = bio ? (bio.length > 120 ? bio.slice(0, 120) + '…' : bio) : null;
      return { label: title, detail: snippet || `${bookCount} book${bookCount !== 1 ? 's' : ''} in your library` };
    }
    // protagonist
    const count = items.length;
    return { label: title, detail: `${count} character${count !== 1 ? 's' : ''}` };
  };

  const tooltip = getTooltipContent();

  return (
    <div
      ref={cardRef}
      id={id}
      className={`opacity-0 bg-slate-900/70 backdrop-blur-md border ${config.borderClass} rounded-xl overflow-hidden shadow-lg`}
      data-entity-type={type}
    >
      {/* Header */}
      <div className={`relative flex items-center gap-2 px-3 py-2 ${config.headerBg} border-b ${config.borderClass}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${config.accentDot}`} />
        <Icon className={`w-3.5 h-3.5 ${config.headerText}`} />
        <button
          ref={triggerRef}
          onClick={() => setShowTooltip(prev => !prev)}
          className="story-link cursor-pointer"
        >
          <span className={`text-xs font-semibold ${config.headerText} truncate`}>{title}</span>
        </button>
        <span className="text-[9px] text-slate-500 ml-auto">{items.length}</span>

        {/* Header tooltip - centered overlay */}
        {showTooltip && (
          <div
            ref={tooltipRef}
            className="absolute left-0 right-0 top-full z-[60] bg-slate-900 border border-cyan-400/20 rounded-lg p-3 shadow-[0_0_30px_rgba(0,0,0,0.7),0_0_15px_rgba(34,211,238,0.08)] animate-fade-in"
            style={{ marginTop: '-2px' }}
          >
            <p className={`text-xs font-semibold ${config.headerText} mb-1`}>{tooltip.label}</p>
            <p className="text-[11px] text-slate-400/90 leading-relaxed">{tooltip.detail}</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="divide-y divide-slate-800/50">
        {items.map((item) => (
          <EntityRow key={item.id} node={item} type={type} config={config} onClick={() => onItemClick(item)} />
        ))}
      </div>
    </div>
  );
};

interface EntityRowProps {
  node: BrainNode;
  type: NodeType;
  config: typeof TYPE_CONFIG.book;
  onClick: () => void;
}

const EntityRow = ({ node, type, config, onClick }: EntityRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleMouseEnter = () => {
    setShowTooltip(true);
    if (rowRef.current) {
      gsap.to(rowRef.current, { x: 4, duration: 0.2, ease: 'power2.out' });
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
    if (rowRef.current) {
      gsap.to(rowRef.current, { x: 0, duration: 0.2, ease: 'power2.out' });
    }
  };

  const subtitle = type === 'book' ? node.author : type === 'protagonist' ? `in "${node.bookTitle || ''}"` : '';

  return (
    <div className="relative">
      <div
        ref={rowRef}
        className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-slate-800/40 transition-colors group"
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Circular thumbnail */}
        <div className={`w-9 h-9 rounded-full border-2 ${config.thumbBorder} overflow-hidden flex-shrink-0 bg-slate-800`}>
          {node.coverUrl && !imgError ? (
            <img src={node.coverUrl} alt={node.title} className="w-full h-full object-cover" loading="lazy" onError={() => setImgError(true)} />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-sm font-bold ${
              type === 'author' ? 'bg-gradient-to-br from-amber-900/60 to-amber-950/80 text-amber-300' :
              type === 'protagonist' ? 'bg-gradient-to-br from-purple-900/60 to-purple-950/80 text-purple-300' :
              'bg-gradient-to-br from-slate-700 to-slate-900 text-cyan-300'
            }`}>
              {node.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="story-link">
            <span className="text-xs text-slate-200 font-medium truncate block group-hover:text-cyan-200 transition-colors">{node.title}</span>
          </div>
          {subtitle && (
            <span className="text-[10px] text-slate-500 truncate block">{subtitle}</span>
          )}
        </div>
      </div>

      {/* Hover tooltip - full image */}
      {showTooltip && node.coverUrl && !imgError && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 pointer-events-none">
          <div className="w-20 h-20 rounded-full border-2 border-slate-700/80 overflow-hidden shadow-2xl shadow-black/50 bg-slate-900">
            <img src={node.coverUrl} alt={node.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityCard;
