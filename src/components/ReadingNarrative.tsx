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
                    className="story-link text-slate-200 hover:text-blue-300"
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
    h1: () => null, // Hide h1 since we have the modal header
    h2: ({ children }) => (
      <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold text-slate-200 mt-6 mb-3">
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
    </article>
  );
};
