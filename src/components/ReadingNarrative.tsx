import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { Transmission } from '@/services/transmissionsService';

interface ReadingNarrativeProps {
  narrative: string;
  transmissions: Transmission[];
}

export const ReadingNarrative = ({ narrative, transmissions }: ReadingNarrativeProps) => {
  const bookTitles = transmissions.map(t => t.title);
  const authorNames = transmissions.map(t => t.author);
  const allNames = [...bookTitles, ...authorNames];

  // Custom text renderer to add hover effects to book/author names
  const components: Components = {
    p: ({ children }) => {
      const processText = (text: any): any => {
        if (typeof text !== 'string') return text;
        
        // Find any matching book/author names
        for (const name of allNames) {
          if (text.includes(name)) {
            const parts = text.split(name);
            return parts.reduce((acc: any[], part: string, i: number) => {
              acc.push(part);
              if (i < parts.length - 1) {
                acc.push(
                  <span 
                    key={`${name}-${i}`}
                    className="hover-link"
                  >
                    {name}
                  </span>
                );
              }
              return acc;
            }, []);
          }
        }
        return text;
      };

      return (
        <p className="text-slate-300 leading-relaxed mb-4 text-base">
          {Array.isArray(children) 
            ? children.map((child, i) => <span key={i}>{processText(child)}</span>)
            : processText(children)
          }
        </p>
      );
    },
    h1: ({ children }) => (
      <h1 className="text-3xl font-semibold text-slate-100 mb-6 mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-semibold text-blue-300 mt-8 mb-4">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold text-blue-200 mt-6 mb-3">
        {children}
      </h3>
    ),
    strong: ({ children }) => (
      <strong className="text-slate-100 font-semibold">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="text-blue-200 italic">{children}</em>
    ),
    ul: ({ children }) => (
      <ul className="my-4 list-disc list-inside">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="my-4 list-decimal list-inside">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="text-slate-300 mb-2">{children}</li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-400 pl-4 text-slate-300 italic my-4">
        {children}
      </blockquote>
    ),
  };

  return (
    <article className="prose prose-invert max-w-none">
      <ReactMarkdown components={components}>
        {narrative}
      </ReactMarkdown>
      
      <style>{`
        .hover-link {
          cursor: pointer;
          color: inherit;
          transition: all 0.2s ease;
          display: inline;
          position: relative;
        }
        .hover-link::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 1px;
          bottom: -1px;
          left: 0;
          background-color: #60a5fa;
          transform: scaleX(0);
          transform-origin: bottom right;
          transition: transform 0.2s ease;
        }
        .hover-link:hover {
          color: #60a5fa;
        }
        .hover-link:hover::after {
          transform: scaleX(1);
          transform-origin: bottom left;
        }
      `}</style>
    </article>
  );
};
