import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { BookOpen, Pen, User } from 'lucide-react';
import { NodeType, BrainNode } from '@/pages/TestBrain';

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

  return (
    <div
      ref={cardRef}
      id={id}
      className={`opacity-0 bg-slate-900/70 backdrop-blur-md border ${config.borderClass} rounded-xl overflow-hidden shadow-lg`}
      data-entity-type={type}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2 ${config.headerBg} border-b ${config.borderClass}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${config.accentDot}`} />
        <Icon className={`w-3.5 h-3.5 ${config.headerText}`} />
        <span className={`text-xs font-semibold ${config.headerText} truncate`}>{title}</span>
        <span className="text-[9px] text-slate-500 ml-auto">{items.length}</span>
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
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm font-bold bg-gradient-to-br from-slate-800 to-slate-900">
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
